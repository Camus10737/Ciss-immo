"use client";
import { useEffect, useState } from "react";
import { getRapportsAnnuels, deleteRapportAnnuel } from "@/app/services/rapportService";
import { RapportAnnuel } from "./RapportAnnuel";
import { Trash2 } from "lucide-react";

export function ListeRapportsFinanciers({ refresh }: { refresh: number }) {
  const [rapports, setRapports] = useState<any[]>([]);
  const [selectedRapport, setSelectedRapport] = useState<any | null>(null);

  const refreshList = () => getRapportsAnnuels().then(setRapports);

  useEffect(() => {
    refreshList();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer ce rapport ?")) {
      await deleteRapportAnnuel(id);
      refreshList();
    }
  };

  if (!rapports.length) {
    return <div className="text-gray-500">Aucun rapport disponible.</div>;
  }

  return (
    <div>
      <ul className="divide-y border rounded bg-white">
        {rapports.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition group"
          >
            <span
              className="font-semibold text-blue-700 cursor-pointer"
              onClick={() => setSelectedRapport(r)}
            >
              Rapport annuel {r.annee}
              <span className="ml-2 text-xs text-gray-400">
                {r.date ? new Date(r.date).toLocaleDateString() : ""}
              </span>
            </span>
            <button
              className="ml-4 text-red-600 opacity-0 group-hover:opacity-100 transition"
              title="Supprimer"
              onClick={() => handleDelete(r.id)}
            >
              <Trash2 size={18} />
            </button>
          </li>
        ))}
      </ul>
      {selectedRapport && (
        <RapportAnnuel
          open={true}
          onClose={() => setSelectedRapport(null)}
          rapport={selectedRapport}
          readOnly={true}
        />
      )}
    </div>
  );
}