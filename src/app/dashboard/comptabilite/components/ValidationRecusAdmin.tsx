"use client";
import { useEffect, useState } from "react";
import { recuService } from "@/app/services/recusService";
import { Button } from "@/components/ui/button";
import { RecuPaiement } from "@/app/types/recus";

export function ValidationRecusAdmin() {
  const [recus, setRecus] = useState<RecuPaiement[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecus = async () => {
    setLoading(true);
    const data = await recuService.getRecusEnAttente();
    setRecus(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecus();
  }, []);

  const handleValidation = async (id: string, valider: boolean) => {
    setLoading(true);
    if (valider) {
      await recuService.validerRecu(id);
    } else {
      await recuService.refuserRecu(id, "Reçu refusé par l'administrateur.");
    }
    await fetchRecus();
    setLoading(false);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Reçus en attente de validation</h3>
      {loading && <div>Chargement...</div>}
      {recus.length === 0 && !loading && <div>Aucun reçu en attente.</div>}
      <ul className="space-y-4">
        {recus.map(recu => (
          <li key={recu.id} className="border rounded p-4 flex flex-col gap-2">
            <div>
              <b>Locataire :</b> {recu.locataireId} <br />
              <b>Appartement :</b> {recu.appartementId} <br />
              <b>Mois payés :</b> {recu.moisPayes}
            </div>
            <a href={recu.fichierUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              Voir le reçu
            </a>
            <div className="flex gap-2">
              <Button onClick={() => handleValidation(recu.id, true)} className="bg-green-600 hover:bg-green-700">Valider</Button>
              <Button onClick={() => handleValidation(recu.id, false)} className="bg-red-600 hover:bg-red-700">Refuser</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}