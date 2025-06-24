import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ success: false, error: "Token ou mot de passe manquant." }, { status: 400 });
    }

    // Cherche l'invitation avec ce token
    const invitationsRef = collection(db, "invitations");
    const q = query(invitationsRef, where("token", "==", token), where("status", "==", "pending"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ success: false, error: "Invitation invalide ou déjà utilisée." }, { status: 400 });
    }

    const invitationDoc = snapshot.docs[0];
    const invitation = invitationDoc.data();

    // Crée le compte utilisateur dans Firebase Auth
    const auth = getAuth();
    try {
      await createUserWithEmailAndPassword(auth, invitation.email, password);
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }

    // Met à jour le statut de l'invitation
    await updateDoc(invitationDoc.ref, { status: "accepted" });

    // Met à jour le statut du gestionnaire dans la collection users
    // (optionnel, à adapter selon ta logique)
    // ...

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur accept-invitation :", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}