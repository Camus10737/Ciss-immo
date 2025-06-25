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
  UserFilters,
  ImmeubleAssignment
} from '@/app/types/user-management';
import { InvitationService } from "@/app/services/invitationService";

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

  // Ajoute immeuble si email existe, sinon invitation
  static async createGestionnaire(
    superAdminId: string, 
    formData: CreateGestionnaireFormData
  ): Promise<{ success: boolean; token?: string; alreadyExists?: boolean; error?: string }> {
    try {
      // Vérifie si un utilisateur existe déjà avec cet email
      const q = query(collection(db, "users"), where("email", "==", formData.email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // L'utilisateur existe déjà, on met à jour ses immeubles_assignes
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const currentImmeubles: ImmeubleAssignment[] = Array.isArray(userData.immeubles_assignes) ? userData.immeubles_assignes : [];
        // Ajoute le(s) nouvel(s) immeuble(s) sans doublon (fusion par id)
        const newImmeubles: ImmeubleAssignment[] = [
          ...currentImmeubles,
          ...formData.immeubles_assignes.filter(
            (newItem) => !currentImmeubles.some((item) => item.id === newItem.id)
          ),
        ];

        // Fusionne les permissions pour chaque immeuble
        const currentPermissions = userData.permissions_supplementaires || {};
        const newPermissions = { ...currentPermissions };
        for (const assignment of formData.immeubles_assignes) {
          newPermissions[assignment.id] = formData.permissions_supplementaires[assignment.id];
        }

        await updateDoc(doc(db, "users", userDoc.id), {
          immeubles_assignes: newImmeubles,
          permissions_supplementaires: newPermissions,
          updatedAt: serverTimestamp(),
        });

        return { success: true, alreadyExists: true };
      }

      // Sinon, on crée une invitation comme avant
      const token = this.generateSecureToken();

      const invitationData = {
        email: formData.email,
        role: 'GESTIONNAIRE' as const,
        status: 'pending' as const,
        targetData: {
          name: formData.name,
          phone: formData.phone,
          immeubles_assignes: formData.immeubles_assignes,
          permissions_supplementaires: this.buildCompletePermissions(formData.permissions_supplementaires),
        },
        invitedBy: superAdminId,
        invitedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        token
      };

      await addDoc(collection(db, 'invitations'), invitationData);

      return { success: true, token };

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
          await this.unassignImmeubles(
            oldGestionnaire.immeubles_assignes.map(a => a.id),
            gestionnaireId
          );
          await this.assignImmeubles(
            updates.immeubles_assignes.map(a => a.id),
            gestionnaireId
          );
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

  /**
   * Retire uniquement les immeubles spécifiés d'un gestionnaire
   * (et met à jour les permissions associées)
   */
  static async retirerImmeublesAuGestionnaire(
    gestionnaireId: string,
    immeublesARetirer: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const gestionnaireRef = doc(db, "users", gestionnaireId);
      const gestionnaireSnap = await getDoc(gestionnaireRef);
      if (!gestionnaireSnap.exists()) {
        return { success: false, error: "Gestionnaire introuvable" };
      }
      const gestionnaire = gestionnaireSnap.data();

      // 1. Retirer les immeubles (filtrer sur .id)
      const newImmeubles = (gestionnaire.immeubles_assignes || []).filter(
        (item: any) => !immeublesARetirer.includes(item.id)
      );
      // 2. Retirer les permissions associées
      const newPermissions: any = {};
      for (const item of newImmeubles) {
        if (gestionnaire.permissions_supplementaires?.[item.id]) {
          newPermissions[item.id] = gestionnaire.permissions_supplementaires[item.id];
        }
      }

      await updateDoc(gestionnaireRef, {
        immeubles_assignes: newImmeubles,
        permissions_supplementaires: newPermissions,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
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
        gestion_immeuble: permissions.gestion_immeuble ?? { read: false, write: false },
        gestion_locataires: permissions.gestion_locataires ?? { read: false, write: false },
        comptabilite: permissions.comptabilite ?? { read: false, write: false, export: false },
        statistiques: permissions.statistiques ?? { read: false, export: false },
        delete_immeuble: permissions.delete_immeuble ?? false
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