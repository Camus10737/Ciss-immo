// src/services/synchronisationService.ts
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Locataire } from '../types/locataires';

/**
 * Service de synchronisation entre locataires et immeubles
 * Maintient la cohérence des données entre les deux collections
 */
export const synchronisationService = {
  
  /**
   * Met à jour le statut d'un appartement quand un locataire arrive
   */
  async assignerLocataireAAppartement(
    immeubleId: string, 
    appartementId: string, 
    locataire: Locataire
  ): Promise<void> {
    try {
      const immeubleRef = doc(db, 'immeubles', immeubleId);
      const immeubleDoc = await getDoc(immeubleRef);
      
      if (!immeubleDoc.exists()) {
        throw new Error('Immeuble introuvable');
      }
      
      const immeubleData = immeubleDoc.data();
      const appartements = immeubleData.appartements || [];
      
      // Trouver l'appartement à mettre à jour
      const appartementIndex = appartements.findIndex((apt: any) => apt.id === appartementId);
      
      if (appartementIndex === -1) {
        throw new Error('Appartement introuvable');
      }
      
      // Préparer les données du locataire pour l'immeuble
      const locataireData = {
        id: locataire.id,
        nom: locataire.nom,
        prenom: locataire.prenom,
        email: locataire.email,
        telephone: locataire.telephone,
        dateEntree: locataire.dateEntree,
        dateSortie: locataire.dateSortie
      };
      
      // Si il y avait un locataire précédent, l'ajouter à l'historique
      if (appartements[appartementIndex].locataireActuel) {
        const ancienLocataire = {
          ...appartements[appartementIndex].locataireActuel,
          dateSortie: new Date() // Date de sortie = maintenant
        };
        
        appartements[appartementIndex].historiqueLocataires = 
          appartements[appartementIndex].historiqueLocataires || [];
        appartements[appartementIndex].historiqueLocataires.push(ancienLocataire);
      }
      
      // Mettre à jour l'appartement
      appartements[appartementIndex] = {
        ...appartements[appartementIndex],
        statut: 'occupe',
        locataireActuel: locataireData,
        updatedAt: new Date()
      };
      
      // Sauvegarder dans Firebase
      await updateDoc(immeubleRef, {
        appartements: appartements,
        updatedAt: Timestamp.now()
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'assignation du locataire:', error);
      throw error;
    }
  },

  /**
   * Met à jour les infos d'un locataire dans l'appartement correspondant
   */
  async mettreAJourLocataireDansAppartement(
    ancienAppartementId: string,
    nouveauAppartementId: string,
    locataire: Locataire
  ): Promise<void> {
    try {
      // Si l'appartement a changé
      if (ancienAppartementId !== nouveauAppartementId) {
        await this.deplacerLocataire(ancienAppartementId, nouveauAppartementId, locataire);
      } else {
        // Juste mettre à jour les infos du locataire dans le même appartement
        await this.mettreAJourInfosLocataire(nouveauAppartementId, locataire);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  },

  /**
   * Déplace un locataire d'un appartement à un autre
   */
  async deplacerLocataire(
    ancienAppartementId: string,
    nouveauAppartementId: string,
    locataire: Locataire
  ): Promise<void> {
    try {
      // 1. Libérer l'ancien appartement
      await this.libererAppartement(ancienAppartementId, locataire.id);
      
      // 2. Trouver le nouvel immeuble (on doit chercher dans tous les immeubles)
      const nouveauImmeubleId = await this.trouverImmeubleParAppartement(nouveauAppartementId);
      
      // 3. Assigner au nouvel appartement
      await this.assignerLocataireAAppartement(nouveauImmeubleId, nouveauAppartementId, locataire);
      
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      throw error;
    }
  },

  /**
   * Met à jour seulement les infos du locataire (même appartement)
   */
  async mettreAJourInfosLocataire(appartementId: string, locataire: Locataire): Promise<void> {
    try {
      const immeubleId = await this.trouverImmeubleParAppartement(appartementId);
      const immeubleRef = doc(db, 'immeubles', immeubleId);
      const immeubleDoc = await getDoc(immeubleRef);
      
      if (!immeubleDoc.exists()) return;
      
      const immeubleData = immeubleDoc.data();
      const appartements = immeubleData.appartements || [];
      
      const appartementIndex = appartements.findIndex((apt: any) => apt.id === appartementId);
      if (appartementIndex === -1) return;
      
      // Mettre à jour les infos du locataire actuel
      if (appartements[appartementIndex].locataireActuel?.id === locataire.id) {
        appartements[appartementIndex].locataireActuel = {
          id: locataire.id,
          nom: locataire.nom,
          prenom: locataire.prenom,
          email: locataire.email,
          telephone: locataire.telephone,
          dateEntree: locataire.dateEntree,
          dateSortie: locataire.dateSortie
        };
        
        await updateDoc(immeubleRef, {
          appartements: appartements,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des infos:', error);
      throw error;
    }
  },

  /**
   * Libère un appartement (locataire part)
   */
  async libererAppartement(appartementId: string, locataireId: string): Promise<void> {
    try {
      const immeubleId = await this.trouverImmeubleParAppartement(appartementId);
      const immeubleRef = doc(db, 'immeubles', immeubleId);
      const immeubleDoc = await getDoc(immeubleRef);
      
      if (!immeubleDoc.exists()) return;
      
      const immeubleData = immeubleDoc.data();
      const appartements = immeubleData.appartements || [];
      
      const appartementIndex = appartements.findIndex((apt: any) => apt.id === appartementId);
      if (appartementIndex === -1) return;
      
      // Déplacer le locataire actuel vers l'historique
      if (appartements[appartementIndex].locataireActuel?.id === locataireId) {
        const locataireSortant = {
          ...appartements[appartementIndex].locataireActuel,
          dateSortie: new Date()
        };
        
        appartements[appartementIndex].historiqueLocataires = 
          appartements[appartementIndex].historiqueLocataires || [];
        appartements[appartementIndex].historiqueLocataires.push(locataireSortant);
        
        // Libérer l'appartement
        appartements[appartementIndex] = {
          ...appartements[appartementIndex],
          statut: 'libre',
          locataireActuel: null,
          updatedAt: new Date()
        };
        
        await updateDoc(immeubleRef, {
          appartements: appartements,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Erreur lors de la libération:', error);
      throw error;
    }
  },

  /**
   * Trouve l'ID de l'immeuble qui contient un appartement donné
   */
  async trouverImmeubleParAppartement(appartementId: string): Promise<string> {
    try {
      // Recherche dans tous les immeubles (robuste)
      const { getDocs, collection } = await import('firebase/firestore');
      const immeublesSnapshot = await getDocs(collection(db, 'immeubles'));
      
      for (const doc of immeublesSnapshot.docs) {
        const data = doc.data();
        const appartements = data.appartements || [];
        
        if (appartements.some((apt: any) => apt.id === appartementId)) {
          return doc.id;
        }
      }
      
      throw new Error(`Immeuble introuvable pour l'appartement ${appartementId}`);
    } catch (error) {
      console.error('Erreur lors de la recherche d\'immeuble:', error);
      throw error;
    }
  }
};