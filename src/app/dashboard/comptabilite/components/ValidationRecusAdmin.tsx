"use client";

import { useEffect, useState } from "react";
import { recuService } from "@/app/services/recusService";
import { depensesService } from "@/app/services/depensesService";
import { getLocataireById } from "@/app/services/locatairesService";
import { Button } from "@/components/ui/button";
import { RecuPaiement } from "@/app/types/recus";
import { Eye, CheckCircle2, XCircle } from "lucide-react";

// Utilitaire pour obtenir les mois déjà payés pour un client
function getPaidMonthsForClient(clientId: string, operations: any[]) {
  const paid: { [key: string]: boolean } = {};
  operations
    .filter((op) => op.client === clientId && op.type === "Ressource")
    .forEach((op) => {
      if (Array.isArray(op.moisArray)) {
        op.moisArray.forEach(
          (m: { year: number; month: number }) =>
            (paid[`${m.year}-${m.month}`] = true)
        );
      } else if (Array.isArray(op.mois)) {
        op.mois.forEach(
          (m: number) => (paid[`${op.date.getFullYear()}-${m}`] = true)
        );
      } else if (typeof op.mois === "number") {
        paid[`${op.date.getFullYear()}-${op.mois}`] = true;
      }
    });
  return paid;
}

// Trouve le dernier mois payé pour un client (retourne {year, month})
function getLastPaidMonth(clientId: string, operations: any[]) {
  let last = { year: 0, month: 0 };
  operations
    .filter((op) => op.client === clientId && op.type === "Ressource")
    .forEach((op) => {
      if (Array.isArray(op.moisArray)) {
        op.moisArray.forEach((m: { year: number; month: number }) => {
          if (m.year > last.year || (m.year === last.year && m.month > last.month)) {
            last = { year: m.year, month: m.month };
          }
        });
      } else if (Array.isArray(op.mois)) {
        op.mois.forEach((m: number) => {
          const y = op.date.getFullYear();
          if (y > last.year || (y === last.year && m > last.month)) {
            last = { year: y, month: m };
          }
        });
      } else if (typeof op.mois === "number") {
        const y = op.date.getFullYear();
        if (y > last.year || (y === last.year && op.mois > last.month)) {
          last = { year: y, month: op.mois };
        }
      }
    });
  return last;
}

export function ValidationRecusAdmin() {
  const [recus, setRecus] = useState<RecuPaiement[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [locataireNames, setLocataireNames] = useState<Record<string, string>>({});
  const [validationModal, setValidationModal] = useState<RecuPaiement | null>(null);
  const [montant, setMontant] = useState<string>("");
  const [mois, setMois] = useState<number>(1);
  const [description, setDescription] = useState<string>("");
  const [operations, setOperations] = useState<any[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateOperation, setDuplicateOperation] = useState<any | null>(null);

  // Pour la sélection des mois à valider
  const [selectedMonths, setSelectedMonths] = useState<{ year: number; month: number }[]>([]);

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

  const fetchOperations = async () => {
    const recusValides = await recuService.getRecusValides();
    const depenses = await depensesService.getDepenses?.();
    setOperations([
      ...recusValides.map((recu) => ({
        type: "Ressource",
        client: recu.locataireId,
        montant: recu.montant,
        mois: recu.moisPayes,
        moisArray: recu.moisArray || recu.moisPayesArray || [], // <-- doit contenir [{year, month}]
        date: recu.updatedAt ? new Date(recu.updatedAt) : new Date(),
        description: recu.description || "",
      })),
      ...(depenses || []).map((dep) => ({
        type: "Dépense",
        client: dep.client,
        montant: dep.montant,
        mois: dep.mois,
        date: dep.date ? new Date(dep.date) : new Date(),
        description: dep.description || "",
      })),
    ]);
  };

  useEffect(() => {
    fetchRecus();
    fetchOperations();
    // eslint-disable-next-line
  }, []);

  // Ouvre la modale de validation et pré-remplit les champs
  const openValidationModal = (recu: RecuPaiement) => {
    setValidationModal(recu);
    setMontant("");
    setMois(recu.moisPayes);
    setDescription("");
    setSelectedMonths([]);
  };

  // Met à jour la sélection des mois si le nombre de mois change
  useEffect(() => {
    setSelectedMonths([]);
  }, [mois, validationModal]);

  // Génère la liste des mois sélectionnables à partir du dernier mois payé
  function getSelectableMonths(clientId: string) {
    const now = new Date();
    const paidMonths = getPaidMonthsForClient(clientId, operations);
    const lastPaid = getLastPaidMonth(clientId, operations);

    // Commence à partir du mois suivant le dernier payé
    let year = lastPaid.year || now.getFullYear();
    let month = lastPaid.month || 0; // 0 = pas de mois payé, donc commence à janvier

    // Si aucun mois payé, commence à ce mois-ci
    if (!lastPaid.year && !lastPaid.month) {
      year = now.getFullYear();
      month = now.getMonth();
    }

    // Génère les 24 prochains mois (pour gérer les paiements en avance)
    const months: { year: number; month: number }[] = [];
    let count = 0;
    let y = year;
    let m = month;
    while (count < 24) {
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
      months.push({ year: y, month: m });
      count++;
    }
    return months;
  }

  // Validation avec contrôle du nombre de mois et doublon
  const handleValidation = async (force = false) => {
  if (!validationModal) return;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const montantNumber = Number(montant);

  if (!force) {
    const duplicate = operations.find(
      (op) =>
        op.client === validationModal.locataireId &&
        Number(op.montant) === montantNumber &&
        op.mois === mois &&
        op.date.getMonth() === currentMonth &&
        op.date.getFullYear() === currentYear
    );

    if (duplicate) {
      setDuplicateOperation(duplicate);
      setShowDuplicateModal(true);
      return;
    }
  }

  setLoading(true);

  // On passe les mois sélectionnés à la validation
  await recuService.validerRecu(
    validationModal.id,
    description,
    montantNumber,
    mois,
    selectedMonths
  );

  setValidationModal(null); // Ferme la modale AVANT de recharger

  await fetchRecus();
  await fetchOperations(); // Recharge les opérations après validation

  setShowDuplicateModal(false);
  setDuplicateOperation(null);
  setLoading(false);
};

  // Refus classique
  const handleRefus = async (id: string) => {
    setLoading(true);
    await recuService.refuserRecu(id, "Reçu refusé par l'administrateur.");
    await fetchRecus();
    setLoading(false);
  };

  // Prépare la nouvelle ligne proposée pour l'affichage dans la modale
  const montantNumber = Number(montant);
  const newOperation = validationModal && {
    type: "Ressource",
    client: validationModal.locataireId,
    montant: montantNumber,
    mois,
    date: new Date(),
    description,
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
                  className="border rounded px-2 py-1 w-full mb-2"
                  required
                />
                {/* Sélecteur de mois : n'affiche QUE les mois non payés */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {validationModal &&
                    getSelectableMonths(validationModal.locataireId)
                      .slice(0, 12)
                      .filter(({ year, month }) => {
                        const paidMonths = getPaidMonthsForClient(
                          validationModal.locataireId,
                          operations
                        );
                        return !paidMonths[`${year}-${month}`];
                      })
                      .map(({ year, month }) => {
                        const isSelected = selectedMonths.some(
                          (m) => m.year === year && m.month === month
                        );
                        const disabled = !isSelected && selectedMonths.length >= mois;
                        return (
                          <button
                            key={`${year}-${month}`}
                            type="button"
                            disabled={disabled}
                            className={`px-2 py-1 rounded border text-xs ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-white"
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedMonths(
                                  selectedMonths.filter(
                                    (m) =>
                                      !(m.year === year && m.month === month)
                                  )
                                );
                              } else if (selectedMonths.length < mois) {
                                setSelectedMonths([
                                  ...selectedMonths,
                                  { year, month },
                                ]);
                              }
                            }}
                          >
                            {`${new Date(year, month - 1, 1).toLocaleString(
                              "fr-FR",
                              {
                                month: "short",
                              }
                            )} ${year}`}
                          </button>
                        );
                      })}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Sélectionnez {mois} mois à valider.
                </div>
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
                onClick={async () => {
                  await handleValidation();
                }}
                className="bg-green-600 hover:bg-green-700 text-white w-full"
                disabled={loading || selectedMonths.length !== mois}
              >
                Valider le reçu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de doublon */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <div className="mb-4 font-semibold text-lg text-red-600">
              Attention : doublon détecté
            </div>
            <div className="mb-4">
              Une opération identique existe déjà dans les dépenses ce mois-ci.
              <br />
              <b>Ligne existante :</b>
              <div className="mb-4">
                <div className="border rounded p-2 my-2 text-xs bg-gray-50">
                  Client :{" "}
                  {locataireNames[duplicateOperation?.client] ||
                    duplicateOperation?.client}
                  <br />
                  Montant : {duplicateOperation?.montant}
                  <br />
                  Mois : {duplicateOperation?.mois}
                  <br />
                  Date :{" "}
                  {duplicateOperation?.date &&
                    new Date(duplicateOperation.date).toLocaleDateString()}
                  <br />
                  Description : {duplicateOperation?.description || "-"}
                </div>
                <b>Nouvelle ligne proposée :</b>
                <div className="border rounded p-2 my-2 text-xs bg-blue-50">
                  Client :{" "}
                  {locataireNames[newOperation?.client] || newOperation?.client}
                  <br />
                  Montant : {newOperation?.montant}
                  <br />
                  Mois : {newOperation?.mois}
                  <br />
                  Date :{" "}
                  {newOperation?.date && newOperation.date.toLocaleDateString()}
                  <br />
                  Description : {newOperation?.description || "-"}
                </div>
              </div>
              Voulez-vous vraiment continuer ?
            </div>
            <div className="flex gap-4">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                onClick={async () => {
                  setShowDuplicateModal(false);
                  setDuplicateOperation(null);
                  await handleValidation(true);
                }}
                disabled={loading}
              >
                Continuer quand même
              </Button>
              <Button
                className="bg-gray-400 hover:bg-gray-500 text-white flex-1"
                onClick={async () => {
                  setShowDuplicateModal(false);
                  setDuplicateOperation(null);
                  if (validationModal?.id) {
                    await handleRefus(validationModal.id);
                    setValidationModal(null);
                  }
                }}
                disabled={loading}
              >
                Annuler et refuser le reçu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>);
}