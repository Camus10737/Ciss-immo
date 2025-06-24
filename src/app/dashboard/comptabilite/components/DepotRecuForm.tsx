"use client";
import { useState } from "react";
import { recuService } from "@/app/services/recusService";
import { Button } from "@/components/ui/button";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";

interface Locataire {
  id: string;
  nom: string;
  prenom: string;
  appartementId: string;
  immeubleId: string;
}

interface Immeuble {
  id: string;
  nom: string;
}

export function DepotRecuForm({
  locataires = [],
  immeubles = [],
}: {
  locataires: Locataire[];
  immeubles: Immeuble[];
}) {
  const [selectedImmeuble, setSelectedImmeuble] = useState<string>("");
  const [selectedLocataire, setSelectedLocataire] = useState<string>("");
  const [moisPayes, setMoisPayes] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { canWriteComptabilite } = useAuthWithRole();

  // Filtre les locataires selon l'immeuble sélectionné
  const filteredLocataires = selectedImmeuble
    ? locataires.filter((l) => l.immeubleId === selectedImmeuble)
    : [];

  const selectedLocataireObj = filteredLocataires.find(
    (l) => l.id === selectedLocataire
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWriteComptabilite(selectedImmeuble)) {
      setMessage("Vous n'avez pas la permission d'envoyer un reçu pour cet immeuble.");
      return;
    }
    if (!selectedLocataireObj) {
      setMessage("Veuillez sélectionner un locataire.");
      return;
    }
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

      if (!res.ok) {
        throw new Error("Erreur lors de l'upload Cloudinary");
      }

      const data = await res.json();
      const fichierUrl = data.url;

      await recuService.creerRecu(
        selectedLocataireObj.id,
        selectedLocataireObj.appartementId,
        moisPayes,
        fichierUrl,
        selectedImmeuble
      );

      setMessage("Reçu envoyé avec succès !");
      setFile(null);
      setMoisPayes(1);
      setSelectedLocataire("");
      setSelectedImmeuble("");
    } catch (err) {
      setMessage("Erreur lors de l'envoi du reçu.");
    }
    setLoading(false);
  };

  if (immeubles.length === 0) {
    return <div className="text-gray-500">Aucun immeuble disponible.</div>;
  }

  // Si pas la permission, affiche un message et rien d'autre
  if (selectedImmeuble && !canWriteComptabilite(selectedImmeuble)) {
    return (
      <div className="text-red-600 text-center font-semibold p-4">
        Vous n'avez pas la permission d'envoyer un reçu pour cet immeuble.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">Immeuble</label>
      <select
        value={selectedImmeuble}
        onChange={(e) => {
          setSelectedImmeuble(e.target.value);
          setSelectedLocataire(""); // reset locataire quand immeuble change
        }}
        className="border rounded px-2 py-1 w-full"
        required
      >
        <option value="" disabled>
          Sélectionner un immeuble
        </option>
        {immeubles.map((im) => (
          <option key={im.id} value={im.id}>
            {im.nom}
          </option>
        ))}
      </select>

      <label className="block">Locataire ayant payé</label>
      <select
        value={selectedLocataire}
        onChange={(e) => setSelectedLocataire(e.target.value)}
        className="border rounded px-2 py-1 w-full"
        required
        disabled={!selectedImmeuble}
      >
        <option value="" disabled>
          Sélectionner un locataire
        </option>
        {filteredLocataires.map((l) => (
          <option key={l.id} value={l.id}>
            {l.prenom} {l.nom}
          </option>
        ))}
      </select>

      <label className="block">Nombre de mois payés</label>
      <input
        type="number"
        min={1}
        max={12}
        value={moisPayes}
        onChange={(e) => setMoisPayes(Number(e.target.value))}
        className="border rounded px-2 py-1"
      />

      <label className="block">Reçu (PDF ou image)</label>
      <div className="flex items-center gap-3">
        <input
          id="file-upload"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <Button
          type="button"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium"
          onClick={() => document.getElementById("file-upload")?.click()}
          disabled={loading}
        >
          {file ? "Modifier le fichier" : "Sélectionner un fichier"}
        </Button>
        {file && (
          <span className="text-sm text-gray-600 truncate max-w-xs">
            {file.name}
          </span>
        )}
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Enregistrement...
          </>
        ) : (
          "Envoyer le reçu"
        )}
      </Button>
      {message && <div className="text-sm mt-2">{message}</div>}
    </form>
  );
}