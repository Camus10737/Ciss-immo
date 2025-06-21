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
  const [validationModal, setValidationModal] = useState<RecuPaiement | null>(
    null
  );
  const [montant, setMontant] = useState<number>(0);
  const [mois, setMois] = useState<number>(1);
  const [description, setDescription] = useState<string>("");

  const fetchRecus = async () => {
    setLoading(true);
    const data = await recuService.getRecusEnAttente();
    setRecus(data);

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

  // Ouvre la modale de validation et pré-remplit les champs
  const openValidationModal = (recu: RecuPaiement) => {
    setValidationModal(recu);
    setMontant(0);
    setMois(recu.moisPayes);
    setDescription("");
  };

  // Validation avec contrôle du nombre de mois
  const handleValidation = async () => {
    if (!validationModal) return;
    setLoading(true);

    if (mois === validationModal.moisPayes) {
      // Nombre de mois inchangé, simple validation
      await recuService.validerRecu(
        validationModal.id,
        description,
        montant,
        mois
      );
    } else {
      // Nombre de mois modifié, on met à jour le reçu
      await recuService.updateRecuMois(
        validationModal.id,
        mois,
        description,
        montant
      );
      await recuService.validerRecu(
        validationModal.id,
        description,
        montant,
        mois
      );
    }

    setValidationModal(null);
    await fetchRecus();
    setLoading(false);
  };

  // Refus classique
  const handleRefus = async (id: string) => {
    setLoading(true);
    await recuService.refuserRecu(id, "Reçu refusé par l'administrateur.");
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
                  onClick={() => openValidationModal(recu)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  title="Valider"
                >
                  <CheckCircle2 size={16} className="mr-1" />
                  Valider
                </Button>
                <Button
                  onClick={() => handleRefus(recu.id)}
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

      {/* Modal de validation */}
      {validationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setValidationModal(null)}
            >
              ✕
            </button>
            <div className="mb-4 font-semibold text-lg">Validation du reçu</div>
            <div className="space-y-3">
              <div>
                <label className="block font-medium">Montant payé</label>
                <input
                  type="text"
                  value={montant}
                  onChange={(e) => {
                    // Autorise uniquement chiffres et éventuellement un point ou une virgule
                    const val = e.target.value.replace(/[^0-9.,]/g, "");
                    setMontant(val);
                  }}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Ex: 500"
                  required
                  inputMode="decimal"
                  pattern="^\d+([.,]\d{1,2})?$"
                />
              </div>
              <div>
                <label className="block font-medium">
                  Nombre de mois payés
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={mois}
                  onChange={(e) => setMois(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-full"
                  required
                />
              </div>
              <div>
                <label className="block font-medium">Description / Note</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  rows={2}
                  placeholder="Ajouter une note ou un détail (optionnel)"
                />
              </div>
              <Button
                onClick={handleValidation}
                className="bg-green-600 hover:bg-green-700 text-white w-full"
                disabled={loading}
              >
                Valider le reçu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
