"use client";

import { useEffect, useState } from "react";
import { recuService } from "@/app/services/recusService";
import { getLocataireById } from "@/app/services/locatairesService";
import { Button } from "@/components/ui/button";
import { RecuPaiement } from "@/app/types/recus";
import { Eye, CheckCircle2, XCircle } from "lucide-react";

export function ValidationRecusAdmin() {
  const [recus, setRecus] = useState<RecuPaiement[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [locataireNames, setLocataireNames] = useState<Record<string, string>>(
    {}
  );

  // Récupère les reçus et les noms des locataires
  const fetchRecus = async () => {
    setLoading(true);
    const data = await recuService.getRecusEnAttente();
    setRecus(data);

    // Récupérer les noms des locataires pour tous les reçus
    const names: Record<string, string> = {};
    for (const recu of data) {
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

  useEffect(() => {
    fetchRecus();
    // eslint-disable-next-line
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
      <h3 className="text-lg font-semibold mb-4">
        Reçus en attente de validation
      </h3>
      {loading && <div>Chargement...</div>}
      {recus.length === 0 && !loading && <div>Aucun reçu en attente.</div>}
      <ul className="space-y-4">
        {recus.map((recu) => (
          <li key={recu.id} className="border rounded p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <b>Soumis par :</b>{" "}
                {locataireNames[recu.locataireId] || recu.locataireId} <br />
                <b>Appartement :</b> {recu.appartementId} <br />
                <b>Mois payés :</b> {recu.moisPayes}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setModalUrl(recu.fichierUrl)}
                  title="Voir le reçu"
                >
                  <Eye size={16} className="mr-1" />
                  Voir
                </Button>
                <Button
                  onClick={() => handleValidation(recu.id, true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  title="Valider"
                >
                  <CheckCircle2 size={16} className="mr-1" />
                  Valider
                </Button>
                <Button
                  onClick={() => handleValidation(recu.id, false)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  title="Refuser"
                >
                  <XCircle size={16} className="mr-1" />
                  Refuser
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Fenêtre contextuelle (modal) pour afficher le reçu */}
      {modalUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setModalUrl(null)}
            >
              ✕
            </button>
            <div className="mb-4 font-semibold">Aperçu du reçu</div>
            {modalUrl && (
              <iframe
                src={modalUrl}
                className="w-full h-96"
                title="Aperçu du reçu"
                allow="autoplay"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
