import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Resend } from "resend";
import { Timestamp } from "firebase/firestore";

export class InvitationService {
  static async createInvitation(data: {
    email: string;
    role: string;
    targetData?: any;
    invitedBy: string;
  }): Promise<{ success: boolean; invitation?: any; error?: string }> {
    try {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

      const invitationData = {
        email: data.email,
        role: data.role,
        targetData: data.targetData || {},
        invitedBy: data.invitedBy,
        invitedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        status: "pending",
        token,
      };

      const docRef = await addDoc(collection(db, "invitations"), invitationData);

      // Envoi de l'email d'invitation
    //   await InvitationService.sendInvitationEmail(data.email, token, data.role);

      return { success: true, invitation: { id: docRef.id, ...invitationData } };
    } catch (error) {
      console.error("Erreur création invitation:", error);
      return { success: false, error: "Erreur lors de la création de l'invitation" };
    }
  }

 static async sendInvitationEmail(email: string, token: string, role: string) {
    console.log("RESEND_API_KEY dans Next.js :", process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const invitationUrl = `${appUrl}/invitation?token=${token}`;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY non défini dans l'environnement");
    }

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Invitation à rejoindre la plateforme",
      html: `
        <p>Bonjour,</p>
        <p>Votre compte <b>${role}</b> a été créé sur la plateforme.</p>
        <p>Pour définir votre mot de passe, cliquez sur ce lien : <a href="${invitationUrl}">${invitationUrl}</a></p>
        <p>Ce lien est valable 7 jours.</p>
      `,
    });
  }
}