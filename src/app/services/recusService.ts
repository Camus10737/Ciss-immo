import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, Timestamp } from "firebase/firestore";
import { RecuPaiement } from "@/app/types/recus";

const COLLECTION_NAME = "recus";

export const recuService = {
  async creerRecu(
    locataireId: string,
    appartementId: string,
    moisPayes: number,
    fichierUrl: string
  ): Promise<void> {
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

  // Nouvelle méthode pour mettre à jour le nombre de mois, montant et description AVANT validation
  async updateRecuMois(
    id: string,
    moisPayes: number,
    description?: string,
    montant?: number
  ) {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      moisPayes,
      montant: montant ?? null,
      description: description || "",
      updatedAt: Timestamp.now(),
    });
  },

  // Modifié : accepte montant, nombre de mois et commentaire lors de la validation
  async validerRecu(
    id: string,
    commentaire?: string,
    montant?: number,
    moisPayes?: number
  ) {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      statut: "valide",
      commentaire: commentaire || "",
      montant: montant ?? null,
      moisPayes: moisPayes ?? null,
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

  async getRecusValides(): Promise<RecuPaiement[]> {
  const q = query(collection(db, COLLECTION_NAME), where("statut", "==", "valide"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate(),
    updatedAt: docSnap.data().updatedAt?.toDate(),
  })) as RecuPaiement[];
},
};

