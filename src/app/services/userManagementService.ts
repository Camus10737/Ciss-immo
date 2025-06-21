// src/services/userManagementService.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  CreateGestionnaireFormData, 
  Gestionnaire, 
  ImmeublePermissions, 
  LocataireUser, 
  SuperAdmin, 
  UserFilters 
} from '@/app/types/user-management';

/**
 GESTION DES UTILISATEURS
 */
export class UserManagementService {

  /**
    Récupérer un utilisateur par ID
   */
  static async getUserById(userId: string): Promise<SuperAdmin | Gestionnaire | LocataireUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      if (!userData) return null;

      return {
        id: userDoc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        invitedAt: userData.invitedAt?.toDate(),
        lastLogin: userData.lastLogin?.toDate()
      } as SuperAdmin | Gestionnaire | LocataireUser;

    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      return null;
    }
  }

  /**
    Récupérer tous les gestionnaires
   */
  static async getGestionnaires(filters?: UserFilters): Promise<Gestionnaire[]> {
    try {
      // Requête simplifiée sans orderBy pour éviter l'erreur d'index
      let q = query(
        collection(db, 'users'),
        where('role', '==', 'GESTIONNAIRE')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const snapshot = await getDocs(q);
      const gestionnaires = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          invitedAt: data.invitedAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate()
        } as Gestionnaire;
      });

      // Trier côté client par date de création (décroissant)
      return gestionnaires.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    } catch (error) {
      console.error('Erreur récupération gestionnaires:', error);
      return [];
    }
  }

  /**
   Créer un gestionnaire
   */
  static async createGestionnaire(
    superAdminId: string, 
    formData: CreateGestionnaireFormData
  ): Promise<{ success: boolean; gestionnaire?: Gestionnaire; error?: string }> {
    try {
      //  Vérifier que l'email n'existe pas déjà
      const existingUser = await this.getUserByEmail(formData.email);
      if (existingUser) {
        return { success: false, error: 'Un utilisateur avec cet email existe déjà' };
      }

      //  Créer l'invitation en base
      const invitationData = {
        email: formData.email,
        role: 'GESTIONNAIRE' as const,
        status: 'pending' as const,
        targetData: {
          name: formData.name,
          phone: formData.phone,
          immeubles_assignes: formData.immeubles_assignes
        },
        invitedBy: superAdminId,
        invitedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        token: this.generateSecureToken()
      };

      await addDoc(collection(db, 'invitations'), invitationData);
      console.log('✅ Invitation créée en base pour:', formData.email);

      // Créer le gestionnaire (statut pending)
      const gestionnaireData: Omit<Gestionnaire, 'id'> = {
        email: formData.email,
        role: 'GESTIONNAIRE',
        status: 'pending',
        name: formData.name,
        phone: formData.phone,
        immeubles_assignes: formData.immeubles_assignes,
        permissions_supplementaires: this.buildCompletePermissions(formData.permissions_supplementaires),
        invitedBy: superAdminId,
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'users'), {
        ...gestionnaireData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        invitedAt: serverTimestamp()
      });

      //  Assigner les immeubles au gestionnaire
      await this.assignImmeubles(formData.immeubles_assignes, docRef.id);

      //  Créer le log d'activité
      const performer = await this.getUserById(superAdminId);
      const logData = {
        action: 'USER_CREATED' as const,
        performedBy: superAdminId,
        performedByName: performer?.name || 'Utilisateur inconnu',
        targetUserId: docRef.id,
        targetUserName: formData.name,
        details: {
          role: 'GESTIONNAIRE',
          immeubles: formData.immeubles_assignes,
          email: formData.email
        },
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'activity_logs'), logData);
      console.log('✅ Log créé pour:', docRef.id);

      const gestionnaire: Gestionnaire = {
        id: docRef.id,
        ...gestionnaireData
      };

      return { success: true, gestionnaire };

    } catch (error) {
      console.error('Erreur création gestionnaire:', error);
      return { success: false, error: 'Erreur lors de la création du gestionnaire' };
    }
  }

  /**
   Mettre à jour un gestionnaire
   */
  static async updateGestionnaire(
    gestionnaireId: string,
    updates: Partial<CreateGestionnaireFormData>,
    performedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const gestionnaireRef = doc(db, 'users', gestionnaireId);

      //  Préparer les données de mise à jour
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Si on met à jour les permissions, les traiter correctement
      if (updates.permissions_supplementaires) {
        updateData.permissions_supplementaires = this.buildCompletePermissions(updates.permissions_supplementaires);
      }

      await updateDoc(gestionnaireRef, updateData);

      // Si les immeubles ont changé, mettre à jour les assignations
      if (updates.immeubles_assignes) {
        // Récupérer l'ancien gestionnaire pour comparison
        const oldGestionnaire = await this.getUserById(gestionnaireId) as Gestionnaire;
        if (oldGestionnaire) {
          // Désassigner les anciens immeubles
          await this.unassignImmeubles(oldGestionnaire.immeubles_assignes, gestionnaireId);
          // Assigner les nouveaux
          await this.assignImmeubles(updates.immeubles_assignes, gestionnaireId);
        }
      }

      // 3. Logger l'action de mise à jour
      const performer = await this.getUserById(performedBy);
      const logData = {
        action: 'USER_UPDATED' as const,
        performedBy: performedBy,
        performedByName: performer?.name || 'Utilisateur inconnu',
        targetUserId: gestionnaireId,
        details: {
          updatedFields: Object.keys(updates)
        },
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'activity_logs'), logData);
      console.log('✅ Log update créé pour:', gestionnaireId);

      return { success: true };

    } catch (error) {
      console.error('Erreur mise à jour gestionnaire:', error);
      return { success: false, error: 'Erreur lors de la mise à jour' };
    }
  }

  /**
    Mettre à jour uniquement les permissions d'un gestionnaire
   */
  static async updateGestionnairePermissions(
    gestionnaireId: string,
    newPermissions: { [immeubleId: string]: any },
    performedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const gestionnaireRef = doc(db, 'users', gestionnaireId);

      //  Récupérer le gestionnaire actuel pour comparaison
      const currentGestionnaire = await this.getUserById(gestionnaireId) as Gestionnaire;
      if (!currentGestionnaire) {
        return { success: false, error: 'Gestionnaire introuvable' };
      }

      // Construire les permissions complètes avec les automatiques
      const completePermissions = this.buildCompletePermissions(newPermissions);

      //  Mettre à jour en base
      await updateDoc(gestionnaireRef, {
        permissions_supplementaires: completePermissions,
        updatedAt: serverTimestamp()
      });

      //  Logger l'action de mise à jour des permissions
      const performer = await this.getUserById(performedBy);
      const logData = {
        action: 'PERMISSIONS_UPDATED' as const,
        performedBy: performedBy,
        performedByName: performer?.name || 'Utilisateur inconnu',
        targetUserId: gestionnaireId,
        targetUserName: currentGestionnaire.name,
        details: {
          immeublesAffected: Object.keys(newPermissions),
          permissionsCount: Object.keys(newPermissions).length
        },
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'activity_logs'), logData);
      console.log('✅ Log permissions update créé pour:', gestionnaireId);

      return { success: true };

    } catch (error) {
      console.error('Erreur mise à jour permissions:', error);
      return { success: false, error: 'Erreur lors de la mise à jour des permissions' };
    }
  }

  /**
   Supprimer un gestionnaire
   */
  static async deleteGestionnaire(
    gestionnaireId: string,
    performedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      //Récupérer le gestionnaire
      const gestionnaire = await this.getUserById(gestionnaireId) as Gestionnaire;
      if (!gestionnaire) {
        return { success: false, error: 'Gestionnaire introuvable' };
      }

      //  Désassigner tous ses immeubles
      await this.unassignImmeubles(gestionnaire.immeubles_assignes, gestionnaireId);

      // Supprimer l'utilisateur
      await deleteDoc(doc(db, 'users', gestionnaireId));

      // Logger l'action de suppression
      const performer = await this.getUserById(performedBy);
      const logData = {
        action: 'USER_DELETED' as const,
        performedBy: performedBy,
        performedByName: performer?.name || 'Utilisateur inconnu',
        targetUserId: gestionnaireId,
        targetUserName: gestionnaire.name,
        details: {
          role: 'GESTIONNAIRE',
          immeubles: gestionnaire.immeubles_assignes,
          email: gestionnaire.email
        },
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'activity_logs'), logData);
      console.log('✅ Log delete créé pour:', gestionnaireId);

      return { success: true };

    } catch (error) {
      console.error('Erreur suppression gestionnaire:', error);
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  }

  /**
   Assigner des immeubles à un gestionnaire
   */
  private static async assignImmeubles(immeubleIds: string[], gestionnaireId: string): Promise<void> {
    const batch = writeBatch(db);

    for (const immeubleId of immeubleIds) {
      const immeubleRef = doc(db, 'immeubles', immeubleId);
      batch.update(immeubleRef, {
        gestionnaireId,
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
  }

  /**
   Désassigner des immeubles d'un gestionnaire
   */
  private static async unassignImmeubles(immeubleIds: string[], gestionnaireId: string): Promise<void> {
    const batch = writeBatch(db);

    for (const immeubleId of immeubleIds) {
      const immeubleRef = doc(db, 'immeubles', immeubleId);
      batch.update(immeubleRef, {
        gestionnaireId: null,
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
  }

  /**
    Récupérer utilisateur par email
   */
  private static async getUserByEmail(email: string): Promise<any | null> {
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };

    } catch (error) {
      console.error('Erreur recherche par email:', error);
      return null;
    }
  }

  /**
    Activer/Désactiver un gestionnaire
   */
  static async toggleGestionnaireStatus(
    gestionnaireId: string,
    status: 'active' | 'inactive',
    performedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'users', gestionnaireId), {
        status,
        updatedAt: serverTimestamp()
      });

      // Logger l'action de changement de statut
      const performer = await this.getUserById(performedBy);
      const logData = {
        action: status === 'active' ? 'USER_ACTIVATED' as const : 'USER_DEACTIVATED' as const,
        performedBy: performedBy,
        performedByName: performer?.name || 'Utilisateur inconnu',
        targetUserId: gestionnaireId,
        details: { 
          newStatus: status,
          oldStatus: status === 'active' ? 'inactive' : 'active'
        },
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'activity_logs'), logData);
      console.log('✅ Log status change créé pour:', gestionnaireId);

      return { success: true };

    } catch (error) {
      console.error('Erreur changement statut:', error);
      return { success: false, error: 'Erreur lors du changement de statut' };
    }
  }

  /**
    Construire les permissions complètes avec les permissions automatiques
   */
  private static buildCompletePermissions(
    formPermissions: CreateGestionnaireFormData['permissions_supplementaires']
  ): { [immeubleId: string]: ImmeublePermissions } {
    const completePermissions: { [immeubleId: string]: ImmeublePermissions } = {};

    for (const [immeubleId, permissions] of Object.entries(formPermissions)) {
      completePermissions[immeubleId] = {
        // Permissions automatiques 
        gestion_immeuble: { read: true, write: true },
        gestion_locataires: { read: true, write: true },
        
        // Permissions manuelles 
        comptabilite: permissions.comptabilite,
        statistiques: permissions.statistiques,
        delete_immeuble: permissions.delete_immeuble
      };
    }

    return completePermissions;
  }

  /**
    Générer un token sécurisé pour les invitations
   */
  private static generateSecureToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }
}