"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthSMS } from "@/hooks/useAuthSMS";
import { recuService } from "@/app/services/recusService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function DepotRecuLocataire() {
  const { locataire, locataireUser, isLoading, isInitialized, deconnexion, isAuthenticated } = useAuthSMS();
  const router = useRouter();
  const [moisPayes, setMoisPayes] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [immeubleNom, setImmeubleNom] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchImmeubleNom = async () => {
      if (locataire?.immeubleId) {
        try {
          const docRef = doc(db, "immeubles", locataire.immeubleId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setImmeubleNom(docSnap.data().nom || "");
          } else {
            setImmeubleNom("");
          }
        } catch {
          setImmeubleNom("");
        }
      }
    };
    fetchImmeubleNom();
  }, [locataire?.immeubleId]);

  // Redirection après déconnexion
  useEffect(() => {
    if (isInitialized && !isAuthenticated()) {
      router.replace("/locataires/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) return <div className="p-8 text-center">Chargement...</div>;
  if (!locataire) return <div className="p-8 text-center text-red-600">Non authentifié.</div>;

  const nomLocataire = `${locataire.prenom} ${locataire.nom}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage("Veuillez sélectionner un fichier.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-recu", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Erreur lors de l'upload du fichier");
      const { url: fichierUrl } = await res.json();

      await recuService.creerRecu(
        locataire.id,
        locataire.appartementId,
        moisPayes,
        fichierUrl,
        locataire.immeubleId
      );
      setMessage("✅ Reçu envoyé avec succès !");
      setFile(null);
      setMoisPayes(1);
    } catch (err: any) {
      setMessage(err.message || "Erreur lors de l'envoi du reçu.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Bouton de déconnexion bien placé au-dessus, à droite */}
      <div className="flex justify-end mb-2">
        <Button
          type="button"
          variant="outline"
          className="border-red-500 text-red-600 hover:bg-red-50"
          onClick={deconnexion}
        >
          Déconnexion
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">Soumettre un reçu de paiement</h2>
        <div>
          <label className="block mb-1 font-medium">Immeuble</label>
          <input
            type="text"
            value={immeubleNom}
            disabled
            className="w-full border rounded px-2 py-1 bg-gray-100 text-gray-700"
            placeholder="Nom de l'immeuble"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Locataire ayant payé</label>
          <input
            type="text"
            value={nomLocataire}
            disabled
            className="w-full border rounded px-2 py-1 bg-gray-100 text-gray-700"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Nombre de mois payés</label>
          <input
            type="number"
            min={1}
            max={12}
            value={moisPayes}
            onChange={e => setMoisPayes(Number(e.target.value))}
            className="w-full border rounded px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Reçu (PDF ou image)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            required
          />
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={handleFileButtonClick}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white border border-blue-600 transition-colors w-auto"
              style={{ minWidth: "140px" }}
            >
              {file ? "Changer de fichier" : "Choisir un fichier"}
            </Button>
            {file && <span className="text-sm text-gray-600">{file.name}</span>}
          </div>
        </div>
        <Button type="submit" disabled={loading || !file} className="w-full bg-blue-600 text-white mt-4 text-lg font-bold py-3">
          {loading ? "Envoi en cours..." : "Envoyer le reçu"}
        </Button>
        {message && <div className="text-center text-sm mt-2">{message}</div>}
      </form>
    </div>
  );
}