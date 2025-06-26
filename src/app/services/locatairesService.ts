// src/services/locatairesService.ts
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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Locataire, LocataireFormData, LocataireUser } from '../types/locataires';
import { synchronisationService } from './synchronisationService';

const COLLECTION_NAME = 'locataires';
const USERS_COLLECTION = 'users';

// 🧪 NUMÉROS DE TEST - Pour développement sans SMS
const TEST_NUMBERS = {
  '+224628407335': { // Numéro guinéen test
    code: '123456',
    locataire: {
      id: 'test_locataire_gn',
      nom: 'Diallo',
      prenom: 'Mamadou',
      telephone: '+224628407335',
      appartementId: 'apt_001',
      immeubleId: 'imm_001',
      accountStatus: 'active',
      hasAccount: true,
    }
  },
  '+16111111111': { // Ton numéro canadien test
    code: '654321',
    locataire: {
      id: 'test_locataire_ca',
      nom: 'Camara',
      prenom: 'Mohamed',
      telephone: '+16111111111',
      appartementId: 'apt_002',
      immeubleId: 'imm_002',
      accountStatus: 'active',
      hasAccount: true,
    }
  }
};

// Fonction utilitaire pour convertir les dates Firestore
const convertFirestoreData = (data: any): Locataire => ({
  ...data,
  dateEntree: data.dateEntree?.toDate() || new Date(),
  dateSortie: data.dateSortie?.toDate() || null,
  finBailProbable: data.finBailProbable?.toDate() || null,
  lastLogin: data.lastLogin?.toDate() || null,
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
});

// Valider le format du téléphone (Canada + Guinée)
const validatePhoneNumber = (phone: string): boolean => {
  const guineaRegex = /^\+224\d{9}$/;
  const canadaRegex = /^\+1\d{10}$/;
  return guineaRegex.test(phone) || canadaRegex.test(phone);
};

// Formater automatiquement les numéros
const formatPhoneNumber = (phone: string): string => {
  let formatted = phone.trim().replace(/\s+/g, '');
  
  // Détecter et formater le Canada
  if (formatted.match(/^(\+1|1)?([2-9]\d{2}[2-9]\d{6})$/)) {
    const digits = formatted.replace(/^\+?1?/, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
  }
  
  // Détecter et formater la Guinée
  if (formatted.match(/^(\+224|224|0)?(\d{8,9})$/)) {
    let digits = formatted.replace(/^(\+224|224|0)/, '');
    if (digits.length === 8) {
      digits = '0' + digits;
    }
    if (digits.length === 9) {
      return `+224${digits}`;
    }
  }
  
  if (formatted.startsWith('+224') || formatted.startsWith('+1')) {
    return formatted;
  }
  
  return phone;
};

// 🧪 Vérifier si c'est un numéro de test
export const isTestNumber = (phoneNumber: string): boolean => {
  return Object.keys(TEST_NUMBERS).includes(phoneNumber);
};

// 🧪 Récupérer les données de test
export const getTestData = (phoneNumber: string) => {
  return TEST_NUMBERS[phoneNumber as keyof typeof TEST_NUMBERS] || null;
};

// Créer un locataire (VERSION AMÉLIORÉE avec tests)
export const createLocataire = async (
  locataireData: LocataireFormData,
  userId: string
): Promise<string> => {
  try {
    // Validation du téléphone obligatoire
    if (!locataireData.telephone) {
      throw new Error("Le numéro de téléphone est obligatoire");
    }
    
    const formattedPhone = formatPhoneNumber(locataireData.telephone);
    if (!validatePhoneNumber(formattedPhone)) {
      throw new Error("Le numéro de téléphone doit être au format +224XXXXXXXXX ou +1XXXXXXXXXX");
    }

    // Vérifier que le numéro n'est pas déjà utilisé
    const existingLocataire = await verifierTelephoneExistant(formattedPhone);
    if (existingLocataire) {
      throw new Error("Ce numéro de téléphone est déjà utilisé par un autre locataire");
    }

    // Récupère l'immeubleId à partir de l'appartementId
    const immeubleId = await synchronisationService.trouverImmeubleParAppartement(locataireData.appartementId);

    const docData: any = {
      ...locataireData,
      telephone: formattedPhone, // Utiliser le numéro formaté
      userId,
      immeubleId,
      hasAccount: locataireData.createAccount || false,
      accountStatus: locataireData.createAccount ? 'pending' : undefined,
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
    
    // Synchroniser avec l'immeuble
    const nouveauLocataire: Locataire = {
      ...convertFirestoreData(docData),
      id: docRef.id,
    };
    
    await synchronisationService.assignerLocataireAAppartement(
      immeubleId,
      locataireData.appartementId,
      nouveauLocataire
    );

    // Créer le compte utilisateur si demandé
    if (locataireData.createAccount) {
      await creerCompteLocataire(docRef.id, locataireData, immeubleId);
      
      await updateDoc(doc(db, COLLECTION_NAME, docRef.id), {
        hasAccount: true,
        accountStatus: 'pending'
      });
    }

    // Envoyer SMS de bienvenue si demandé (pas pour les numéros de test)
    if (locataireData.sendWelcomeSMS && !isTestNumber(formattedPhone)) {
      await envoyerSMSBienvenue(
        formattedPhone, 
        locataireData.prenom, 
        locataireData.nom
      );
    }

    console.log("✅ Locataire créé avec succès:", docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du locataire:', error);
    throw error;
  }
};

// Créer le compte utilisateur Firebase pour le locataire
const creerCompteLocataire = async (
  locataireId: string, 
  data: LocataireFormData, 
  immeubleId: string
): Promise<string> => {
  try {
    const userRef = doc(collection(db, USERS_COLLECTION));
    const userData: Omit<LocataireUser, 'id'> = {
      email: data.email || `${data.telephone.replace('+', '')}@locataire.app`,
      role: 'LOCATAIRE',
      status: 'pending',
      name: `${data.prenom} ${data.nom}`,
      phone: data.telephone,
      appartementId: data.appartementId,
      immeubleId: immeubleId,
      locataireId: locataireId,
      canUploadRecus: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addDoc(collection(db, USERS_COLLECTION), {
      ...userData,
      createdAt: Timestamp.fromDate(userData.createdAt),
      updatedAt: Timestamp.fromDate(userData.updatedAt),
    });

    console.log("✅ Compte utilisateur créé pour le locataire:", locataireId);
    return userRef.id;
  } catch (error) {
    console.error("❌ Erreur création compte locataire:", error);
    throw error;
  }
};

// Envoyer SMS de bienvenue
const envoyerSMSBienvenue = async (telephone: string, prenom: string, nom: string) => {
  try {
    const message = `Bonjour ${prenom} ${nom}, votre compte locataire a été créé ! Connectez-vous avec ${telephone} pour accéder à votre espace.`;
    
    console.log(`📱 SMS envoyé à ${telephone}:`);
    console.log(message);
    
    // TODO: Implémenter l'envoi réel du SMS avec Firebase Cloud Functions
    
  } catch (error) {
    console.error("❌ Erreur envoi SMS:", error);
  }
};

// Vérifier si un téléphone existe déjà
const verifierTelephoneExistant = async (telephone: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('telephone', '==', telephone),
      where('dateSortie', '==', null)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Erreur vérification téléphone:', error);
    return false;
  }
};

// 🧪 Récupérer un locataire par téléphone (avec support test)
export const getLocataireByTelephone = async (telephone: string): Promise<Locataire | null> => {
  try {
    // Si c'est un numéro de test, retourner les données de test
    if (isTestNumber(telephone)) {
      const testData = getTestData(telephone);
      if (testData) {
        console.log('🧪 Utilisation des données de test pour:', telephone);
        return {
          ...testData.locataire,
          dateEntree: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'test_user_id',
        } as Locataire;
      }
    }

    // Sinon, chercher dans la base de données
    const q = query(
      collection(db, COLLECTION_NAME),
      where('telephone', '==', telephone),
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
    console.error('Erreur récupération locataire par téléphone:', error);
    return null;
  }
};

// Activer le compte d'un locataire après auth SMS réussie
export const activerCompteLocataire = async (locataireId: string): Promise<void> => {
  try {
    // Si c'est un ID de test, simuler l'activation
    if (locataireId.startsWith('test_')) {
      console.log('🧪 Simulation activation compte test:', locataireId);
      return;
    }

    const batch = writeBatch(db);

    const locataireRef = doc(db, COLLECTION_NAME, locataireId);
    batch.update(locataireRef, {
      accountStatus: 'active',
      lastLogin: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const usersQuery = query(
      collection(db, USERS_COLLECTION),
      where('locataireId', '==', locataireId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    usersSnapshot.forEach((userDoc) => {
      batch.update(userDoc.ref, {
        status: 'active',
        lastLogin: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
    console.log("✅ Compte locataire activé:", locataireId);
  } catch (error) {
    console.error("❌ Erreur activation compte:", error);
    throw error;
  }
};

// Toutes les autres fonctions restent identiques...
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

export const getLocataireById = async (id: string): Promise<Locataire | null> => {
  try {
    // Si c'est un ID de test, retourner les données de test
    if (id.startsWith('test_')) {
      const testPhone = Object.keys(TEST_NUMBERS).find(phone => 
        TEST_NUMBERS[phone as keyof typeof TEST_NUMBERS].locataire.id === id
      );
      if (testPhone) {
        return getLocataireByTelephone(testPhone);
      }
    }

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

// ... autres fonctions (updateLocataire, marquerSortieLocataire, deleteLocataire, etc.)
// Elles restent identiques à la version précédente