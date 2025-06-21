"use client";
import { useEffect, useState } from "react";
import { recuService } from "@/app/services/recusService";
import { getLocataireById } from "@/app/services/locatairesService";
import { RecuPaiement } from "@/app/types/recus";

interface DepenseManuelle {
  client: string;
  description?: string;
  montant: number;
  date: Date;
}

export function DepensesList({ depenses = [] }: { depenses?: DepenseManuelle[] }) {
  const [recus, setRecus] = useState<RecuPaiement[]>([]);
  const [locataireNames, setLocataireNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecus = async () => {
      setLoading(true);
      const allRecus = await recuService.getRecusValides();
      setRecus(allRecus);

      const names: Record<string, string> = {};
      for (const recu of allRecus) {
        if (!names[recu.locataireId]) {
          try {
            const locataire = await getLocataireById(recu.locataireId);
            names[recu.locataireId] = locataire
              ? `${locataire.prenom} ${locataire.nom}`
              : recu.locataireId;
          } catch {
            names[recu.locataireId] = recu.locataireId;
          }
        }
      }
      setLocataireNames(names);
      setLoading(false);
    };
    fetchRecus();
  }, []);

  // Fusionne reçus et dépenses manuelles
  const operations = [
    ...recus.map(recu => ({
      type: "Ressource",
      client: locataireNames[recu.locataireId] || recu.locataireId,
      montant: recu.montant ?? 0,
      description: recu.description,
      date: recu.updatedAt ? new Date(recu.updatedAt) : new Date(),
      url: recu.fichierUrl,
    })),
    ...depenses.map(dep => ({
      type: "Dépense",
      client: dep.client,
      montant: dep.montant,
      description: dep.description,
      date: dep.date,
      url: undefined,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4">Tableau des opérations</h3>
      {loading && <div>Chargement...</div>}
      {!loading && operations.length > 0 && (
        <table className="min-w-full border text-sm bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-left">Date</th>
              <th className="border px-2 py-1 text-left">Client / Compte</th>
              <th className="border px-2 py-1 text-left">Type</th>
              <th className="border px-2 py-1 text-left">Montant</th>
              <th className="border px-2 py-1 text-left">Description</th>
              <th className="border px-2 py-1 text-left">Reçu</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1">{op.date.toLocaleDateString()}</td>
                <td className="border px-2 py-1">{op.client}</td>
                <td className="border px-2 py-1">{op.type}</td>
                <td
                  className={`border px-2 py-1 font-medium ${
                    op.type === "Ressource" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {op.montant?.toLocaleString()} GNF
                </td>
                <td className="border px-2 py-1">{op.description || "-"}</td>
                <td className="border px-2 py-1">
                  {op.url ? (
                    <a href={op.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      Voir le fichier
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && operations.length === 0 && (
        <div className="text-gray-500 mt-4">Aucune opération enregistrée.</div>
      )}
    </div>
  );
}