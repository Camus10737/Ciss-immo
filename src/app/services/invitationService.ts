<<<<<<< HEAD
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
=======
// src/services/invitationService.ts

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp, 
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Invitation, UserRole } from '../types/user-management';


/**
  SERVICE INVITATIONS
 */
export class InvitationService {
  
  /**
   Créer une invitation
   */
  static async createInvitation(data: {
    email: string;
    role: UserRole;
    targetData: any;
    invitedBy: string;
  }): Promise<{ success: boolean; invitation?: Invitation; error?: string }> {
    try {
      //  Vérifier si une invitation existe déjà pour cet email
      const existingInvitation = await this.getInvitationByEmail(data.email);
      if (existingInvitation && existingInvitation.status === 'pending') {
        return { success: false, error: 'Une invitation est déjà en cours pour cet email' };
      }

      //  Générer un token sécurisé
      const token = this.generateSecureToken();
      
      const invitationData: Omit<Invitation, 'id'> = {
        email: data.email,
        role: data.role,
        targetData: data.targetData,
        invitedBy: data.invitedBy,
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        status: 'pending',
        token
      };

      const docRef = await addDoc(collection(db, 'invitations'), {
        ...invitationData,
        invitedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      //  Envoyer l'email d'invitation
      await this.sendInvitationEmail(data.email, token, data.role);

      const invitation: Invitation = {
        id: docRef.id,
        ...invitationData
      };

      return { success: true, invitation };

    } catch (error) {
      console.error('Erreur création invitation:', error);
      return { success: false, error: 'Erreur lors de la création de l\'invitation' };
    }
  }

  /**
    Récupérer toutes les invitations
   */
  static async getInvitations(filters?: {
    status?: 'pending' | 'accepted' | 'expired';
    role?: UserRole;
  }): Promise<Invitation[]> {
    try {
      let q = query(
        collection(db, 'invitations'),
        orderBy('invitedAt', 'desc')
      );

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.role) {
        q = query(q, where('role', '==', filters.role));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        invitedAt: doc.data().invitedAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || new Date()
      } as Invitation));

    } catch (error) {
      console.error('Erreur récupération invitations:', error);
      return [];
    }
  }

  /**
   Récupérer une invitation par token
   */
  static async getInvitationByToken(token: string): Promise<Invitation | null> {
    try {
      const q = query(
        collection(db, 'invitations'),
        where('token', '==', token)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        invitedAt: doc.data().invitedAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || new Date()
      } as Invitation;

    } catch (error) {
      console.error('Erreur récupération invitation par token:', error);
      return null;
    }
  }

  /**
   Récupérer une invitation par email
   */
  static async getInvitationByEmail(email: string): Promise<Invitation | null> {
    try {
      const q = query(
        collection(db, 'invitations'),
        where('email', '==', email),
        where('status', '==', 'pending'),
        orderBy('invitedAt', 'desc')
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        invitedAt: doc.data().invitedAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || new Date()
      } as Invitation;

    } catch (error) {
      console.error('Erreur récupération invitation par email:', error);
      return null;
    }
  }

  /**
   Accepter une invitation
   */
  static async acceptInvitation(
    invitationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'invitations', invitationId), {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy: userId
      });

      return { success: true };

    } catch (error) {
      console.error('Erreur acceptation invitation:', error);
      return { success: false, error: 'Erreur lors de l\'acceptation' };
    }
  }

  /**
   Renvoyer une invitation
   */
  static async resendInvitation(
    invitationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const invitation = await getDoc(doc(db, 'invitations', invitationId));
      if (!invitation.exists()) {
        return { success: false, error: 'Invitation introuvable' };
      }

      const data = invitation.data() as Invitation;
      
      // Générer un nouveau token
      const newToken = this.generateSecureToken();
      
      await updateDoc(doc(db, 'invitations', invitationId), {
        token: newToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        resentAt: serverTimestamp()
      });

      // Renvoyer l'email
      await this.sendInvitationEmail(data.email, newToken, data.role);

      return { success: true };

    } catch (error) {
      console.error('Erreur renvoi invitation:', error);
      return { success: false, error: 'Erreur lors du renvoi' };
    }
  }

  /**
    Supprimer une invitation
   */
  static async deleteInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'invitations', invitationId));
      return { success: true };

    } catch (error) {
      console.error('Erreur suppression invitation:', error);
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  }

  /**
   Marquer les invitations expirées
   */
  static async markExpiredInvitations(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'invitations'),
        where('status', '==', 'pending'),
        where('expiresAt', '<', now)
      );

      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'expired' });
      });

      await batch.commit();

    } catch (error) {
      console.error('Erreur marquage invitations expirées:', error);
    }
  }

  /**
   Générer un token sécurisé
   */
  private static generateSecureToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }

  /**
    Envoyer l'email d'invitation 
   */
  private static async sendInvitationEmail(
    email: string, 
    token: string, 
    role: UserRole
  ): Promise<void> {
    try {
      // POUTR MAIL
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitation?token=${token}`;
      
      console.log(`Invitation envoyée à ${email} pour le rôle ${role}`);
      console.log(`Lien: ${invitationUrl}`);
      
      // Je vais plus tard mon choi(discussion avec le maitre mansa)
    

    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw error;
    }
>>>>>>> 02ff611ab56871b546c1b98e12a61e36024d46be
  }
}