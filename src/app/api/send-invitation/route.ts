import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email, token, role } = await req.json();

  // Construit l'URL d'invitation ici :
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invitation?token=${token}`;

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "test@resend.dev", // Utilise l'email réel ici
      subject: "Invitation à rejoindre la plateforme",
      html: `
        <p>Bonjour,</p>
        <p>Votre compte <b>${role}</b> a été créé sur la plateforme.</p>
        <p>Pour définir votre mot de passe, cliquez sur ce lien : <a href="${url}">${url}</a></p>
        <p>Ce lien est valable 7 jours.</p>
      `,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 });
  }
}