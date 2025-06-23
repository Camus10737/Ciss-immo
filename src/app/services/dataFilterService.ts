// src/services/dataFilterService.ts

import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy,
  Query,
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { Gestionnaire, LocataireUser, SuperAdmin } from '../types/user-management';
import { Appartement, Immeuble, Locataire } from '../types';

/**
 *SERVICE DE FILTRAGE AUTOMATIQUE DES DONNÉES
 * Assure l'isolation des données selon les permissions utilisateur
 */
export class DataFilterService {

  /**
   * Récupérer un utilisateur par ID
   */
  private static async getUserById(userId: string): Promise<SuperAdmin | Gestionnaire | LocataireUser | null> {
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
    Récupérer les immeubles selon les permissions
   */
  static async getFilteredImmeubles(userId: string): Promise<Immeuble[]> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return [];

      let q: Query<DocumentData>;

      switch (user.role) {
        case 'SUPER_ADMIN':
          // SUPER_ADMIN voit tous les immeubles
          q = query(
            collection(db, 'immeubles'),
            orderBy('createdAt', 'desc')
          );
          break;

        case 'GESTIONNAIRE':
          const gestionnaire = user as Gestionnaire;
          // Gestionnaire voit seulement ses immeubles assignés
          if (gestionnaire.immeubles_assignes && gestionnaire.immeubles_assignes.length > 0) {
            q = query(
              collection(db, 'immeubles'),
              where('id', 'in', gestionnaire.immeubles_assignes.slice(0, 10)), 
              orderBy('createdAt', 'desc')
            );
          } else {
            return []; 
          }
          break;

        case 'LOCATAIRE':
          const locataire = user as LocataireUser;
          // Locataire voit seulement son immeuble 
          const appartement = await this.getAppartementById(locataire.appartementId);
          if (!appartement) return [];
          
          q = query(
            collection(db, 'immeubles'),
            where('id', '==', appartement.immeubleId)
          );
          break;

        default:
          return [];
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as Immeuble));

    } catch (error) {
      console.error('Erreur filtrage immeubles:', error);
      return [];
    }
  }

  /**
    Récupérer les locataires selon les permissions
   */
  static async getFilteredLocataires(userId: string): Promise<Locataire[]> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return [];

      let q: Query<DocumentData>;

      switch (user.role) {
        case 'SUPER_ADMIN':
          // SUPER_ADMIN voit tous les locataires
          q = query(
            collection(db, 'locataires'),
            orderBy('createdAt', 'desc')
          );
          break;

        case 'GESTIONNAIRE':
          // Gestionnaire voit seulement les locataires de SES immeubles
          const gestionnaire = user as Gestionnaire;
          const gestionnaireImmeubles = gestionnaire.immeubles_assignes || [];
          
          if (gestionnaireImmeubles.length === 0) return [];
          
          // Récupérer tous les appartements de ses immeubles
          const appartementIds = await this.getAppartementIdsByImmeubles(gestionnaireImmeubles);
          
          if (appartementIds.length === 0) return [];
          
          q = query(
            collection(db, 'locataires'),
            where('appartementId', 'in', appartementIds.slice(0, 10)), 
            orderBy('createdAt', 'desc')
          );
          break;

        case 'LOCATAIRE':
          // Locataire voit seulement ses propres données
          q = query(
            collection(db, 'locataires'),
            where('userId', '==', userId)
          );
          break;

        default:
          return [];
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateEntree: doc.data().dateEntree?.toDate() || new Date(),
        dateSortie: doc.data().dateSortie?.toDate(),
        finBailProbable: doc.data().finBailProbable?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as Locataire));

    } catch (error) {
      console.error('Erreur filtrage locataires:', error);
      return [];
    }
  }

  /**
    Récupérer les appartements selon les permissions
   */
  static async getFilteredAppartements(userId: string, immeubleId?: string): Promise<Appartement[]> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return [];

      // Vérifier si l'utilisateur a accès à cet immeuble
      if (immeubleId && !(await this.canAccessImmeuble(userId, immeubleId))) {
        return [];
      }

      let q: Query<DocumentData>;

      switch (user.role) {
        case 'SUPER_ADMIN':
          // SUPER_ADMIN voit tous les appartements
          q = immeubleId 
            ? query(
                collection(db, 'appartements'),
                where('immeubleId', '==', immeubleId),
                orderBy('numero')
              )
            : query(
                collection(db, 'appartements'),
                orderBy('createdAt', 'desc')
              );
          break;

        case 'GESTIONNAIRE':
          // Gestionnaire voit les appartements de SES immeubles
          const gestionnaire = user as Gestionnaire;
          const gestionnaireImmeubles = gestionnaire.immeubles_assignes || [];
          
          if (immeubleId) {
            // Vérifier que le gestionnaire a accès à cet immeuble
            if (!gestionnaireImmeubles.includes(immeubleId)) {
              return [];
            }
            q = query(
              collection(db, 'appartements'),
              where('immeubleId', '==', immeubleId),
              orderBy('numero')
            );
          } else {
            if (gestionnaireImmeubles.length === 0) return [];
            
            q = query(
              collection(db, 'appartements'),
              where('immeubleId', 'in', gestionnaireImmeubles.slice(0, 10)),
              orderBy('createdAt', 'desc')
            );
          }
          break;

        case 'LOCATAIRE':
          const locataire = user as LocataireUser;
          // Locataire voit seulement son appartement
          q = query(
            collection(db, 'appartements'),
            where('id', '==', locataire.appartementId)
          );
          break;

        default:
          return [];
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as Appartement));

    } catch (error) {
      console.error('Erreur filtrage appartements:', error);
      return [];
    }
  }

  /**
   Vérifier si un utilisateur peut accéder à un immeuble
   */
  static async canAccessImmeuble(userId: string, immeubleId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      switch (user.role) {
        case 'SUPER_ADMIN':
            // SUPER_ADMIN a accès à tout
          return true; 

        case 'GESTIONNAIRE':
          const gestionnaire = user as Gestionnaire;
          return gestionnaire.immeubles_assignes?.includes(immeubleId) || false;

        case 'LOCATAIRE':
          const locataire = user as LocataireUser;
          const appartement = await this.getAppartementById(locataire.appartementId);
          return appartement?.immeubleId === immeubleId;

        default:
          return false;
      }

    } catch (error) {
      console.error('Erreur vérification accès immeuble:', error);
      return false;
    }
  }

  /**
   Vérifier les permissions spécifiques
   */
  static async canAccessComptabilite(userId: string, immeubleId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      if (user.role === 'SUPER_ADMIN') return true;

      if (user.role === 'GESTIONNAIRE') {
        const gestionnaire = user as Gestionnaire;
        const permissions = gestionnaire.permissions_supplementaires?.[immeubleId];
        return permissions?.comptabilite?.read || false;
      }

      return false;

    } catch (error) {
      console.error('Erreur vérification accès comptabilité:', error);
      return false;
    }
  }

  static async canAccessStatistiques(userId: string, immeubleId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      if (user.role === 'SUPER_ADMIN') return true;

      if (user.role === 'GESTIONNAIRE') {
        const gestionnaire = user as Gestionnaire;
        const permissions = gestionnaire.permissions_supplementaires?.[immeubleId];
        return permissions?.statistiques?.read || false;
      }

      return false;

    } catch (error) {
      console.error('Erreur vérification accès statistiques:', error);
      return false;
    }
  }

  static async canDeleteImmeuble(userId: string, immeubleId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      if (user.role === 'SUPER_ADMIN') return true;

      if (user.role === 'GESTIONNAIRE') {
        const gestionnaire = user as Gestionnaire;
        const permissions = gestionnaire.permissions_supplementaires?.[immeubleId];
        return permissions?.delete_immeuble || false;
      }

      return false;

    } catch (error) {
      console.error('Erreur vérification suppression immeuble:', error);
      return false;
    }
  }

  /**
   MÉTHODES UTILITAIRES PRIVÉES
   */
  
  private static async getAppartementById(appartementId: string): Promise<Appartement | null> {
    try {
      const q = query(
        collection(db, 'appartements'),
        where('id', '==', appartementId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as Appartement;

    } catch (error) {
      console.error('Erreur récupération appartement:', error);
      return null;
    }
  }

  private static async getAppartementIdsByImmeubles(immeubleIds: string[]): Promise<string[]> {
    try {
      // Pour éviter la limite de 10 dans 'in', URILISATION DE  batch
      const allAppartementIds: string[] = [];
      
      for (let i = 0; i < immeubleIds.length; i += 10) {
        const batch = immeubleIds.slice(i, i + 10);
        const q = query(
          collection(db, 'appartements'),
          where('immeubleId', 'in', batch)
        );
        
        const snapshot = await getDocs(q);
        const batchIds = snapshot.docs.map(doc => doc.id);
        allAppartementIds.push(...batchIds);
      }
      
      return allAppartementIds;

    } catch (error) {
      console.error('Erreur récupération IDs appartements:', error);
      return [];
    }
  }
}