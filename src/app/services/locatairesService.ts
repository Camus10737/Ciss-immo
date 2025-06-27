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
    const immeubleId = await synchronisationService.trouverImmeubleParAppartement(locataireData.appartementId);

    const docData: any = {
      ...locataireData,
      userId,
      immeubleId,
      dateEntree: Timestamp.fromDate(locataireData.dateEntree),
      finBailProbable: locataireData.finBailProbable 
        ? Timestamp.fromDate(locataireData.finBailProbable) 
        : null,
      dateSortie: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    Object.keys(docData).forEach(key => {
      if (docData[key] === undefined) {
        delete docData[key];
      }
    });
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    const nouveauLocataire: Locataire = {
      ...convertFirestoreData(docData),
      id: docRef.id,
    };
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

// Récupérer tous les locataires d'une liste d'immeubles
export const getLocatairesByImmeubles = async (immeubleIds: string[]): Promise<Locataire[]> => {
  try {
    if (!immeubleIds.length) return [];
    const allLocataires: Locataire[] = [];
    const chunkSize = 10;
    for (let i = 0; i < immeubleIds.length; i += chunkSize) {
      const chunk = immeubleIds.slice(i, i + chunkSize);
      const q = query(
        collection(db, COLLECTION_NAME),
        where('immeubleId', 'in', chunk),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      allLocataires.push(
        ...querySnapshot.docs.map(doc => ({
          ...convertFirestoreData(doc.data()),
          id: doc.id,
        }))
      );
    }
    return allLocataires;
  } catch (error) {
    console.error('Erreur lors de la récupération des locataires par immeubles:', error);
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

// Récupérer les locataires d'un appartement spécifique
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

// Récupérer le locataire actuel d'un appartement
export const getLocataireActuelByAppartement = async (appartementId: string): Promise<Locataire | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('appartementId', '==', appartementId),
      where('dateSortie', '==', null)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
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
    const locataireActuel = await getLocataireById(id);
    if (!locataireActuel) {
      throw new Error('Locataire introuvable');
    }
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = {
      ...locataireData,
      updatedAt: Timestamp.now(),
    };
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
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    await updateDoc(docRef, updateData);
    if (locataireData.appartementId && locataireData.appartementId !== locataireActuel.appartementId) {
      const locataireMisAJour: Locataire = {
        ...locataireActuel,
        ...locataireData,
        updatedAt: new Date()
      } as Locataire;
      await synchronisationService.mettreAJourLocataireDansAppartement(
        locataireActuel.appartementId,
        locataireData.appartementId,
        locataireMisAJour
      );
    } else if (locataireData.nom || locataireData.prenom || locataireData.email || locataireData.telephone) {
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
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      dateSortie: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await synchronisationService.libererAppartement(locataire.appartementId, id);
  } catch (error) {
    console.error('Erreur lors du marquage de sortie:', error);
    throw error;
  }
};

// Supprimer un locataire
export const deleteLocataire = async (id: string): Promise<void> => {
  try {
    const locataire = await getLocataireById(id);
    if (locataire && !locataire.dateSortie) {
      await synchronisationService.libererAppartement(locataire.appartementId, id);
    }
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Erreur lors de la suppression du locataire:', error);
    throw error;
  }
};

// --- FONCTIONS POUR AUTH SMS ---

/**
 * Récupérer un locataire par téléphone (pour l'auth SMS)
 */
export async function getLocataireByTelephone(phoneNumber: string) {
  try {
    const q = query(
      collection(db, "locataires"),
      where("telephone", "==", phoneNumber)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      return {
        ...convertFirestoreData(data),
        id: data.userId || docSnap.id,
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du locataire par téléphone:', error);
    return null;
  }
}

/**
 * Activer le compte locataire (exemple : set un champ "compteActive" à true)
 */
export const activerCompteLocataire = async (locataireId: string): Promise<void> => {
  try {
    if (!locataireId) return;
    const docRef = doc(db, COLLECTION_NAME, locataireId);
    await updateDoc(docRef, {
      compteActive: true,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erreur lors de l’activation du compte locataire:', error);
    // Ne throw pas pour ne pas bloquer l'auth
  }
};

/**
 * Détecter un numéro de test (pour usage éventuel dans l'UI ou les tests)
 */
export const isTestNumber = (phone: string) => {
  const testNumbers = [
    "+224628407335",
    "+14383786656",
    // Ajoute ici tous tes numéros de test
  ];
  return testNumbers.includes(phone);
};

/**
 * Obtenir les données de test associées à un numéro de test
 */
export const getTestData = (phone: string) => {
  const testData: Record<string, { code: string; locataire: any }> = {
    "+14383786656": {
      code: "123456",
      locataire: {
        id: "yrElTiV0cmRIx68EPplPNQgtKSn1",
        nom: "bah",
        prenom: "madji",
        telephone: "+14383786656",
        immeubleId: "YqXWbWeOxw20GHLI65HX",
        appartementId: "apt_1750896754017_1",
      }
    },
    // ...autres numéros de test
  };
  return testData[phone];
};