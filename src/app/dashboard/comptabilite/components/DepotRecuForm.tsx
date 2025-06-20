"use client";
import { useState } from "react";
import { recuService } from "@/app/services/recusService";
import { Button } from "@/components/ui/button";

interface Locataire {
  id: string;
  nom: string;
  prenom: string;
}

export function DepotRecuForm({
  locataires = [],
  appartementId,
}: {
  locataires: Locataire[];
  appartementId: string;
}) {
  const [selectedLocataire, setSelectedLocataire] = useState<string>("");
  const [moisPayes, setMoisPayes] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocataire) {
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
      await recuService.creerRecu(selectedLocataire, appartementId, moisPayes, file);
      setMessage("Reçu envoyé avec succès !");
      setFile(null);
      setMoisPayes(1);
      setSelectedLocataire("");
    } catch (err) {
      setMessage("Erreur lors de l'envoi du reçu.");
    }
    setLoading(false);
  };

  if (locataires.length === 0) {
    return <div className="text-gray-500">Aucun locataire actuel disponible.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">Locataire ayant payé</label>
      <select
        value={selectedLocataire}
        onChange={e => setSelectedLocataire(e.target.value)}
        className="border rounded px-2 py-1 w-full"
        required
      >
        <option value="" disabled>
          Sélectionner un locataire
        </option>
        {locataires.map(l => (
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
        onChange={e => setMoisPayes(Number(e.target.value))}
        className="border rounded px-2 py-1"
      />

      <label className="block">Reçu (PDF ou image)</label>
      <div className="flex items-center gap-3">
        <input
          id="file-upload"
          type="file"
          accept="image/*,application/pdf"
          onChange={e => setFile(e.target.files?.[0] || null)}
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