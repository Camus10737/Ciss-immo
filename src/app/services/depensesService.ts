import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";

const COLLECTION_NAME = "depenses";

export const depensesService = {
  async ajouterDepense(depense: { client: string; description?: string; montant: number; date: Date; immeubleId: string }) {
    await addDoc(collection(db, COLLECTION_NAME), {
      ...depense,
      date: Timestamp.fromDate(depense.date),
      createdAt: Timestamp.now(),
    });
  },
  async getDepenses(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || new Date(),
    }));
  },
};