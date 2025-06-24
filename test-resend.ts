// test-resend.ts
import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "test@resend.dev",
    subject: "Test Resend",
    html: "<p>Ceci est un test direct du SDK Resend.</p>",
  });
  console.log("Email envoyé !");
}

test();