import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token ou mot de passe manquant." },
        { status: 400 }
      );
    }

    // Cherche l'invitation avec ce token
    const invitationsRef = collection(db, "invitations");
    const q = query(
      invitationsRef,
      where("token", "==", token),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Invitation invalide ou déjà utilisée." },
        { status: 400 }
      );
    }

    const invitationDoc = snapshot.docs[0];
    const invitation = invitationDoc.data();

    // Crée le compte utilisateur dans Firebase Auth
    const auth = getAuth();
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        invitation.email,
        password
      );
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 400 }
      );
    }

    // Récupère l'UID du nouvel utilisateur
    const uid = userCredential.user.uid;

    // Prépare les données utilisateur selon le rôle
    let userData: any = {
      name: invitation.targetData.name,
      email: invitation.email,
      phone: invitation.targetData.phone || null,
      role: invitation.role,
      status: "active",
      createdAt: new Date(),
      invitedAt: invitation.invitedAt,
    };

    if (invitation.role === "GESTIONNAIRE") {
      userData.immeubles_assignes = invitation.targetData.immeubles_assignes || [];
      userData.permissions_supplementaires =
        invitation.targetData.permissions_supplementaires || {};
    } else if (invitation.role === "ADMIN") {
      userData.immeubles_assignes = [];
      userData.permissions_supplementaires = {};
    } else if (invitation.role === "SUPER_ADMIN") {
      userData.immeubles_assignes = [];
      userData.permissions_supplementaires = {};
    } else if (invitation.role === "LOCATAIRE") {
      userData.appartementId = invitation.targetData.appartementId || null;
      userData.canUploadRecus = invitation.targetData.canUploadRecus ?? false;
    }

    // Nettoie les champs undefined
    Object.keys(userData).forEach(
      (key) => userData[key] === undefined && delete userData[key]
    );

    // Crée le document Firestore dans 'users' avec l'UID comme ID
    await setDoc(doc(db, "users", uid), userData);

    // Met à jour le statut de l'invitation
    await updateDoc(invitationDoc.ref, { status: "accepted" });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur accept-invitation :", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}