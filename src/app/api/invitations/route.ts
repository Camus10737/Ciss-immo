import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, "invitations"));
    const invitations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Erreur API invitations :", error); // <-- Ajoute ce log
    return NextResponse.json({ invitations: [], error: error.message }, { status: 500 });
  }
}