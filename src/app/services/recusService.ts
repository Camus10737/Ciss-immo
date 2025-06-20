import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { RecuPaiement } from "@/app/types/recus";

const COLLECTION_NAME = "recus";

export const recuService = {
  async creerRecu(locataireId: string, appartementId: string, moisPayes: number, fichier: File): Promise<void> {
    // 1. Upload du fichier
    const storageRef = ref(storage, `recus/${locataireId}_${Date.now()}_${fichier.name}`);
    await uploadBytes(storageRef, fichier);
    const fichierUrl = await getDownloadURL(storageRef);

    // 2. Ajout du reçu dans Firestore
    await addDoc(collection(db, COLLECTION_NAME), {
      locataireId,
      appartementId,
      moisPayes,
      fichierUrl,
      statut: "en_attente",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async getRecusEnAttente(): Promise<RecuPaiement[]> {
    const q = query(collection(db, COLLECTION_NAME), where("statut", "==", "en_attente"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate(),
      updatedAt: docSnap.data().updatedAt?.toDate(),
    })) as RecuPaiement[];
  },

  async validerRecu(id: string, commentaire?: string) {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      statut: "valide",
      commentaire: commentaire || "",
      updatedAt: Timestamp.now(),
    });
  },

  async refuserRecu(id: string, commentaire?: string) {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      statut: "refuse",
      commentaire: commentaire || "",
      updatedAt: Timestamp.now(),
    });
  },
};