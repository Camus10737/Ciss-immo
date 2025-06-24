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
import { InvitationService } from "@/app/services/invitationService";

/**
 GESTION DES UTILISATEURS
 */
export class UserManagementService {

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
      return null;
    }
  }

  static async getGestionnaires(filters?: UserFilters): Promise<Gestionnaire[]> {
    try {
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

      return gestionnaires.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    } catch (error) {
      return [];
    }
  }

    static async createGestionnaire(
    superAdminId: string, 
    formData: CreateGestionnaireFormData
  ): Promise<{ success: boolean; gestionnaire?: Gestionnaire; error?: string }> {
    try {
      const existingUser = await this.getUserByEmail(formData.email);
      if (existingUser) {
        return { success: false, error: 'Un utilisateur avec cet email existe déjà' };
      }
  
      // Génère le token UNE SEULE FOIS
      const token = this.generateSecureToken();
  
      // Créer l'invitation en base avec ce token
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
        token // <-- même token partout
      };
  
      await addDoc(collection(db, 'invitations'), invitationData);
  
      // Créer le gestionnaire (statut pending) avec le même token
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
        updatedAt: new Date(),
        token // <-- ajoute le token ici aussi
      };
  
      const docRef = await addDoc(collection(db, 'users'), {
        ...gestionnaireData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        invitedAt: serverTimestamp()
      });
  
      await this.assignImmeubles(formData.immeubles_assignes, docRef.id);
  
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
  
      const gestionnaire: Gestionnaire = {
        id: docRef.id,
        ...gestionnaireData,
        // token déjà inclus dans gestionnaireData
      };
  
      return { success: true, gestionnaire };
  
    } catch (error) {
      console.error("Erreur réelle lors de la création du gestionnaire :", error);
      return { success: false, error: 'Erreur lors de la création du gestionnaire' };
    }
  }

  static async updateGestionnaire(
    gestionnaireId: string,
    updates: Partial<CreateGestionnaireFormData>,
    performedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const gestionnaireRef = doc(db, 'users', gestionnaireId);

      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      if (updates.permissions_supplementaires) {
        updateData.permissions_supplementaires = this.buildCompletePermissions(updates.permissions_supplementaires);
      }

      await updateDoc(gestionnaireRef, updateData);

      if (updates.immeubles_assignes) {
        const oldGestionnaire = await this.getUserById(gestionnaireId) as Gestionnaire;
        if (oldGestionnaire) {
          await this.unassignImmeubles(oldGestionnaire.immeubles_assignes, gestionnaireId);
          await this.assignImmeubles(updates.immeubles_assignes, gestionnaireId);
        }
      }

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

      return { success: true };

    } catch (error) {
      return { success: false, error: 'Erreur lors de la mise à jour' };
    }
  }

  static async updateGestionnairePermissions(
    gestionnaireId: string,
    newPermissions: { [immeubleId: string]: any },
    performedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const gestionnaireRef = doc(db, 'users', gestionnaireId);

      const currentGestionnaire = await this.getUserById(gestionnaireId) as Gestionnaire;
      if (!currentGestionnaire) {
        return { success: false, error: 'Gestionnaire introuvable' };
      }

      const completePermissions = this.buildCompletePermissions(newPermissions);

      await updateDoc(gestionnaireRef, {
        permissions_supplementaires: completePermissions,
        updatedAt: serverTimestamp()
      });

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

      return { success: true };

    } catch (error) {
      return { success: false, error: 'Erreur lors de la mise à jour des permissions' };
    }
  }

  static async deleteGestionnaire(
    gestionnaireId: string,
    performedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const gestionnaire = await this.getUserById(gestionnaireId) as Gestionnaire;
      if (!gestionnaire) {
        return { success: false, error: 'Gestionnaire introuvable' };
      }

      await this.unassignImmeubles(gestionnaire.immeubles_assignes, gestionnaireId);

      await deleteDoc(doc(db, 'users', gestionnaireId));

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

      return { success: true };

    } catch (error) {
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  }

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
      return null;
    }
  }

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

      return { success: true };

    } catch (error) {
      return { success: false, error: 'Erreur lors du changement de statut' };
    }
  }

  private static buildCompletePermissions(
    formPermissions: CreateGestionnaireFormData['permissions_supplementaires']
  ): { [immeubleId: string]: ImmeublePermissions } {
    const completePermissions: { [immeubleId: string]: ImmeublePermissions } = {};

    for (const [immeubleId, permissions] of Object.entries(formPermissions)) {
      completePermissions[immeubleId] = {
        gestion_immeuble: { read: true, write: true },
        gestion_locataires: { read: true, write: true },
        comptabilite: permissions.comptabilite,
        statistiques: permissions.statistiques,
        delete_immeuble: permissions.delete_immeuble
      };
    }

    return completePermissions;
  }

  private static generateSecureToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }
}