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
        : null, // ✅ null au lieu de undefined
      dateSortie: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // ✅ Nettoyer les valeurs undefined
    Object.keys(docData).forEach(key => {
      if (docData[key] === undefined) {
        delete docData[key];
      }
    });
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
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
      id: doc.id, // ✅ L'id en dernier pour éviter l'écrasement
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
        id: docSnap.id, // ✅ L'id en dernier
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du locataire:', error);
    throw error;
  }
};

// Mettre à jour un locataire
export const updateLocataire = async (
  id: string,
  locataireData: Partial<LocataireFormData>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = {
      ...locataireData,
      updatedAt: Timestamp.now(),
    };
    
    // Convertir les dates en Timestamp ET gérer les undefined
    if (locataireData.dateEntree) {
      updateData.dateEntree = Timestamp.fromDate(locataireData.dateEntree);
    }
    
    // ✅ Gérer finBailProbable qui peut être undefined
    if (locataireData.finBailProbable !== undefined) {
      if (locataireData.finBailProbable) {
        updateData.finBailProbable = Timestamp.fromDate(locataireData.finBailProbable);
      } else {
        updateData.finBailProbable = null; // Firebase accepte null mais pas undefined
      }
    }
    
    // ✅ Nettoyer les valeurs undefined avant l'envoi
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du locataire:', error);
    throw error;
  }
};

// Marquer la sortie d'un locataire
export const marquerSortieLocataire = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      dateSortie: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erreur lors du marquage de sortie:', error);
    throw error;
  }
};

// Supprimer un locataire
export const deleteLocataire = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Erreur lors de la suppression du locataire:', error);
    throw error;
  }
};