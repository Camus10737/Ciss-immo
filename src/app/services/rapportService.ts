import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { doc, deleteDoc } from "firebase/firestore";

const COLLECTION = "rapports_annuels";

export async function saveRapportAnnuel(rapport: any) {
  return await addDoc(collection(db, COLLECTION), {
    ...rapport,
    createdAt: Timestamp.now(),
  });
}

export async function getRapportsAnnuels() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteRapportAnnuel(id: string) {
  return await deleteDoc(doc(db, "rapports_annuels", id));
}