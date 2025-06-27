"use client";
import { useState, useEffect, useRef } from "react";
import { useAuthSMSContext } from "@/hooks/AuthSMSProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function LocataireLoginPage() {
  const {
    envoyerCodeSMS,
    verifierCodeSMS,
    isPhoneNumberSent,
    isCodeVerified,
    isLoading,
    error,
    isAuthenticated,
    isInitialized,
    locataire,
  } = useAuthSMSContext();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Redirection après connexion
  useEffect(() => {
    if (isInitialized && isAuthenticated()) {
      router.replace("/dashboard/espace-locataire");
    }
  }, [isInitialized, isAuthenticated, router, locataire, isCodeVerified]);

  // Focus sur le champ code après envoi du SMS
  useEffect(() => {
    if (isPhoneNumberSent && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [isPhoneNumberSent]);

  // Reset du code si on change de numéro
  useEffect(() => {
    setCode("");
    setMessage(null);
  }, [phone]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const res = await envoyerCodeSMS(phone);
    if (!res.success) setMessage(res.error);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const res = await verifierCodeSMS(code);
    if (!res.success) setMessage(res.error);
  };

  if (isInitialized && isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-700">Redirection vers le dépôt de reçu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 size={32} className="text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              Connexion locataire
            </CardTitle>
            <p className="text-gray-600">
              Accédez à votre espace pour soumettre vos reçus de paiement
            </p>
          </CardHeader>
          <CardContent>
            {/* Place le recaptcha-container ici pour qu'il soit toujours monté */}
            <div id="recaptcha-container" className="mb-4" />
            {!isPhoneNumberSent ? (
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full border rounded px-2 py-2"
                    placeholder="+224XXXXXXXXX"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
                >
                  {isLoading ? "Envoi..." : "Recevoir le code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Code reçu par SMS</label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full border rounded px-2 py-2"
                    placeholder="Code à 6 chiffres"
                    required
                    disabled={isLoading}
                    ref={codeInputRef}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
                >
                  {isLoading ? "Vérification..." : "Se connecter"}
                </Button>
              </form>
            )}
            {(error || message) && (
              <div className="text-red-600 text-sm text-center mt-2">{error || message}</div>
            )}
          </CardContent>
        </Card>
        <div className="text-center mt-6 text-gray-500 text-sm">
          Vous êtes gestionnaire ou admin ?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Connectez-vous ici
          </button>
        </div>
      </div>
    </div>
  );
}