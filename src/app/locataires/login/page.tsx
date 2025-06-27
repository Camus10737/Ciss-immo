"use client";
import { useState, useEffect } from "react";
import { useAuthSMSContext } from "@/hooks/AuthSMSProvider";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function LocataireLoginPage() {
  const { connecterLocataire, isLoading, error, isAuthenticated, locataire, isInitialized } = useAuthSMSContext();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    await connecterLocataire(phone);
    // La redirection se fait dans useEffect ci-dessous
  };

  useEffect(() => {
    // Redirige uniquement si l'état est initialisé, authentifié et pas déjà sur la page cible
    if (
      isInitialized &&
      isAuthenticated &&
      locataire &&
      pathname !== "/dashboard/espace-locataire"
    ) {
      router.replace("/dashboard/espace-locataire");
    }
  }, [isInitialized, isAuthenticated, locataire, router, pathname]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Chargement...</div>
      </div>
    );
  }

  // Affiche le formulaire tant qu'on n'est pas authentifié
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
              Entrez votre numéro de téléphone pour accéder à votre espace
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
            {(error || message) && (
              <div className="text-red-600 text-sm text-center mt-2">{error || message}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}