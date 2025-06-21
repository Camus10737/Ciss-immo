import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Locataire, LocataireFormData } from '../types/locataires';
import { synchronisationService } from './synchronisationService';

const COLLECTION_NAME = 'locataires';

// Fonction utilitaire pour convertir les dates Firestore
const convertFirestoreData = (data: any): Locataire => ({
  ...data,
  dateEntree: data.dateEntree?.toDate() || new Date(),
  dateSortie: data.dateSortie?.toDate() || null,
  finBailProbable: data.finBailProbable?.toDate() || null,
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
});

// Créer un locataire
export const createLocataire = async (
  locataireData: LocataireFormData,
  userId: string
): Promise<string> => {
  try {
    const docData: any = {
      ...locataireData,
      userId,
      dateEntree: Timestamp.fromDate(locataireData.dateEntree),
      finBailProbable: locataireData.finBailProbable 
        ? Timestamp.fromDate(locataireData.finBailProbable) 
        : null,
      dateSortie: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Nettoyer les valeurs undefined
    Object.keys(docData).forEach(key => {
      if (docData[key] === undefined) {
        delete docData[key];
      }
    });
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    
    // 🔥 NOUVEAU : Synchroniser avec l'immeuble
    const nouveauLocataire: Locataire = {
      ...convertFirestoreData(docData),
      id: docRef.id,
    };
    
    // Trouver l'immeuble et assigner le locataire
    const immeubleId = await synchronisationService.trouverImmeubleParAppartement(locataireData.appartementId);
    await synchronisationService.assignerLocataireAAppartement(
      immeubleId,
      locataireData.appartementId,
      nouveauLocataire
    );
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du locataire:', error);
    throw error;
  }
};

// Récupérer tous les locataires d'un utilisateur
export const getLocataires = async (userId: string): Promise<Locataire[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...convertFirestoreData(doc.data()),
      id: doc.id,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des locataires:', error);
    throw error;
  }
};

// Récupérer un locataire par ID
export const getLocataireById = async (id: string): Promise<Locataire | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        ...convertFirestoreData(docSnap.data()),
        id: docSnap.id,
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du locataire:', error);
    throw error;
  }
};

// 🔥 NOUVEAU : Récupérer les locataires d'un appartement spécifique
export const getLocatairesByAppartement = async (appartementId: string): Promise<Locataire[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('appartementId', '==', appartementId),
      orderBy('dateEntree', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...convertFirestoreData(doc.data()),
      id: doc.id,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des locataires par appartement:', error);
    throw error;
  }
};

// 🔥 NOUVEAU : Récupérer le locataire actuel d'un appartement
export const getLocataireActuelByAppartement = async (appartementId: string): Promise<Locataire | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('appartementId', '==', appartementId),
      where('dateSortie', '==', null)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]; // Il ne devrait y en avoir qu'un
      return {
        ...convertFirestoreData(doc.data()),
        id: doc.id,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du locataire actuel:', error);
    throw error;
  }
};

// Mettre à jour un locataire
export const updateLocataire = async (
  id: string,
  locataireData: Partial<LocataireFormData>,
  ancienAppartementId?: string
): Promise<void> => {
  try {
    // 1. Récupérer les données actuelles du locataire
    const locataireActuel = await getLocataireById(id);
    if (!locataireActuel) {
      throw new Error('Locataire introuvable');
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = {
      ...locataireData,
      updatedAt: Timestamp.now(),
    };
    
    // Convertir les dates en Timestamp
    if (locataireData.dateEntree) {
      updateData.dateEntree = Timestamp.fromDate(locataireData.dateEntree);
    }
    
    if (locataireData.finBailProbable !== undefined) {
      if (locataireData.finBailProbable) {
        updateData.finBailProbable = Timestamp.fromDate(locataireData.finBailProbable);
      } else {
        updateData.finBailProbable = null;
      }
    }
    
    // Nettoyer les valeurs undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    // 2. Mettre à jour le locataire
    await updateDoc(docRef, updateData);
    
    // 3. 🔥 SYNCHRONISER avec l'immeuble si l'appartement a changé
    if (locataireData.appartementId && locataireData.appartementId !== locataireActuel.appartementId) {
      const locataireMisAJour: Locataire = {
        ...locataireActuel,
        ...locataireData,
        updatedAt: new Date()
      } as Locataire;
      
      await synchronisationService.mettreAJourLocataireDansAppartement(
        locataireActuel.appartementId, // ancien appartement
        locataireData.appartementId,   // nouvel appartement
        locataireMisAJour
      );
    } else if (locataireData.nom || locataireData.prenom || locataireData.email || locataireData.telephone) {
      // Juste une mise à jour des infos sans changement d'appartement
      const locataireMisAJour: Locataire = {
        ...locataireActuel,
        ...locataireData,
        updatedAt: new Date()
      } as Locataire;
      
      await synchronisationService.mettreAJourInfosLocataire(
        locataireActuel.appartementId,
        locataireMisAJour
      );
    }
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du locataire:', error);
    throw error;
  }
};

// Marquer la sortie d'un locataire
export const marquerSortieLocataire = async (id: string): Promise<void> => {
  try {
    const locataire = await getLocataireById(id);
    if (!locataire) throw new Error('Locataire introuvable');

    // Met à jour la date de sortie du locataire
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      dateSortie: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Libère l'appartement immédiatement
    await synchronisationService.libererAppartement(locataire.appartementId, id);

  } catch (error) {
    console.error('Erreur lors du marquage de sortie:', error);
    throw error;
  }
};

// Supprimer un locataire
export const deleteLocataire = async (id: string): Promise<void> => {
  try {
    // Récupérer les infos du locataire avant suppression
    const locataire = await getLocataireById(id);
    if (locataire && !locataire.dateSortie) {
      // Si le locataire est encore actif, libérer l'appartement
      await synchronisationService.libererAppartement(locataire.appartementId, id);
    }
    
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Erreur lors de la suppression du locataire:', error);
    throw error;
  }
};