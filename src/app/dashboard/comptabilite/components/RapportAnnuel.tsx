"use client";
import { useEffect, useState } from "react";
import { recuService } from "@/app/services/recusService";
import { depensesService } from "@/app/services/depensesService";
import { useLocataires } from "@/hooks/useLocataires";
import { Button } from "@/components/ui/button";
import { saveRapportAnnuel } from "@/app/services/rapportService";

function getMonthName(month: number) {
  return [
    "Janv",
    "Fév",
    "Mars",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sept",
    "Oct",
    "Nov",
    "Déc",
  ][month];
}

const TABS = [
  { key: "synthese", label: "Synthèse" },
  { key: "retards", label: "Retards de paiement" },
];

export function RapportAnnuel({
  open,
  onClose,
  rapport,
  readOnly = false,
  immeubleId, // <-- Ajout de la prop
}: {
  open: boolean;
  onClose: () => void;
  rapport?: any;
  readOnly?: boolean;
  immeubleId?: string; // <-- Ajout de la prop
}) {
  // Si on est en lecture seule, on utilise les données du rapport passé en props
  const [annee, setAnnee] = useState<number>(
    rapport?.annee ?? new Date().getFullYear()
  );
  const [tab, setTab] = useState<"synthese" | "retards">("synthese");
  const [loading, setLoading] = useState(false);
  const [recus, setRecus] = useState<any[]>([]);
  const [depenses, setDepenses] = useState<any[]>([]);
  const { locataires } = useLocataires();
  const [saving, setSaving] = useState(false);

  // Pour retrouver le nom du locataire à partir de l'id
  const getLocataireNom = (id: string) => {
    const loc = (locataires || []).find((l) => l.id === id);
    return loc ? `${loc.prenom} ${loc.nom}` : id;
  };

  const fetchData = async () => {
    setLoading(true);
    const recusValides = await recuService.getRecusValides();
    const depensesFirestore = await depensesService.getDepenses();

    // Filtrage par immeuble
    const recusFiltres = immeubleId
      ? recusValides.filter(r => r.immeubleId === immeubleId)
      : recusValides;
    const depensesFiltres = immeubleId
      ? depensesFirestore.filter(d => d.immeubleId === immeubleId)
      : depensesFirestore;

    setRecus(recusFiltres);
    setDepenses(depensesFiltres);
    setLoading(false);
  };

  useEffect(() => {
    if (open && !rapport) {
      fetchData();
      setTab("synthese");
    }
    // eslint-disable-next-line
  }, [open, rapport, immeubleId]); // <-- Ajoute immeubleId dans les dépendances

  // Données à afficher : si rapport fourni, on l'utilise, sinon on calcule
  const ressources = rapport?.ressources
    ? rapport.ressources.map((r) => ({
        ...r,
        date: r.date ? new Date(r.date) : null,
      }))
    : (recus || [])
        .filter((r) => {
          const d = r.updatedAt ? new Date(r.updatedAt) : null;
          return d && d.getFullYear() === annee;
        })
        .map((r) => ({
          date: r.updatedAt ? new Date(r.updatedAt) : null,
          client: r.locataireNom || getLocataireNom(r.locataireId),
          montant: r.montant ?? 0,
          description: r.description || "",
        }));

  const depensesList =
    rapport?.depenses ??
    (depenses || [])
      .filter((d) => {
        const date = d.date ? new Date(d.date) : null;
        return date && date.getFullYear() === annee;
      })
      .map((d) => ({
        date: d.date ? new Date(d.date) : null,
        client: d.client,
        montant: d.montant ?? 0,
        description: d.description || "",
      }));

  const totalRessources =
    rapport?.totalRessources ?? ressources.reduce((a, b) => a + b.montant, 0);
  const totalDepenses =
    rapport?.totalDepenses ?? depensesList.reduce((a, b) => a + b.montant, 0);
  const bilan = rapport?.bilan ?? totalRessources - totalDepenses;

  // Retards de paiement (locataires actuels uniquement)
  const locatairesActuels = (locataires || []).filter((l) => !l.dateSortie);
  const moisCourant = new Date().getMonth();
  const clientsRetard =
    rapport?.clientsRetard ??
    locatairesActuels.map((loc) => {
      // Si filtrage immeuble, ne garder que les locataires de l'immeuble
      if (immeubleId && loc.immeubleId !== immeubleId) return null;
      const dateEntree = new Date(loc.dateEntree);
      const anneeEntree = dateEntree.getFullYear();
      const moisEntree = dateEntree.getMonth();

      // Si le locataire est entré cette année, on commence à son mois d'entrée
      // Sinon, on commence à janvier
      const moisDebut = anneeEntree === annee ? moisEntree : 0;
      const moisFin = annee === new Date().getFullYear() ? moisCourant : 11;

      const recusLocataire = recus.filter(
        (r) =>
          r.locataireId === loc.id &&
          new Date(r.updatedAt).getFullYear() === annee
      );
      const moisPayes = new Set<number>();
      recusLocataire.forEach((r) => {
        const mois = new Date(r.updatedAt).getMonth();
        moisPayes.add(mois);
      });
      const moisNonPayes = [];
      for (let m = moisDebut; m <= moisFin; m++) {
        if (!moisPayes.has(m)) moisNonPayes.push(m);
      }
      return {
        nom: `${loc.prenom} ${loc.nom}`,
        moisNonPayes,
        aJour: moisNonPayes.length === 0,
      };
    }).filter(Boolean); // <-- enlève les null

  if (!open) return null;

  // Nombre de lignes = le plus grand des deux tableaux
  const maxRows = Math.max(ressources.length, depensesList.length);

  // Fonction pour sauvegarder le rapport
  const handleSaveRapport = async () => {
    setSaving(true);
    try {
      // ... ici tu dois mettre la logique de conversion des dates ...
      const ressourcesToSave = ressources.map((r) => ({
        ...r,
        date: r.date ? r.date.toISOString() : null,
      }));
      const depensesToSave = depensesList.map((d) => ({
        ...d,
        date: d.date ? d.date.toISOString() : null,
      }));
      const clientsRetardToSave = clientsRetard; // Pas besoin de conversion spéciale

      const rapportToSave = {
        annee,
        ressources: ressourcesToSave,
        depenses: depensesToSave,
        totalRessources,
        totalDepenses,
        bilan,
        clientsRetard: clientsRetardToSave,
        date: new Date().toISOString(),
        immeubleId: immeubleId || null, // <-- Ajoute l'immeubleId au rapport sauvegardé
      };
      await saveRapportAnnuel(rapportToSave);
      onClose();
    } catch (e) {
      alert("Erreur lors de la sauvegarde du rapport.");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl h-[90vh] p-0 flex flex-col relative overflow-hidden">
        <button
          className="absolute top-4 right-6 text-gray-500 hover:text-gray-700 z-10"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="flex flex-col h-full">
          <div className="flex flex-col md:flex-row md:items-end gap-4 px-8 pt-8 pb-4">
            <h2 className="text-2xl font-bold text-blue-700 flex-1">
              Rapport annuel {annee}
            </h2>
            {!readOnly && (
              <div className="flex gap-2 items-end">
                <label className="block text-sm font-medium mb-1">Année</label>
                <input
                  type="number"
                  value={annee}
                  min={2020}
                  max={new Date().getFullYear()}
                  onChange={(e) => setAnnee(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-28"
                  disabled={readOnly}
                />
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={fetchData}
                  disabled={loading || readOnly}
                >
                  Rafraîchir
                </Button>
              </div>
            )}
          </div>
          {/* Onglets */}
          <div className="flex gap-2 border-b px-8">
            <button
              className={`py-2 px-4 font-semibold border-b-2 transition
                ${
                  tab === "synthese"
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-blue-600"
                }
              `}
              onClick={() => setTab("synthese")}
            >
              Synthèse
            </button>
            <button
              className={`py-2 px-4 font-semibold border-b-2 transition
                ${
                  tab === "retards"
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-blue-600"
                }
              `}
              onClick={() => setTab("retards")}
            >
              Retards de paiement
            </button>
          </div>
          {/* Contenu onglet */}
          <div className="flex-1 overflow-auto px-8 py-4">
            {loading ? (
              <div className="text-blue-600">Chargement...</div>
            ) : tab === "synthese" ? (
              <div className="overflow-auto max-h-[60vh]">
                <table className="min-w-full text-sm border table-fixed">
                  <colgroup>
                    <col style={{ width: "50%" }} />
                    <col style={{ width: "50%" }} />
                  </colgroup>
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-2 py-1 text-left">Ressources</th>
                      <th className="border px-2 py-1 text-left">Dépenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(maxRows)].map((_, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-1 align-top max-w-xs break-words">
                          {ressources[idx] ? (
                            <div>
                              <div className="font-medium text-green-700">
                                {ressources[idx].client}
                              </div>
                              <div className="text-xs text-gray-500">
                                {ressources[idx].date
                                  ? new Date(
                                      ressources[idx].date
                                    ).toLocaleDateString()
                                  : ""}
                              </div>
                              <div className="text-xs">
                                {ressources[idx].description}
                              </div>
                              <div className="font-bold text-green-800">
                                {ressources[idx].montant.toLocaleString()} GNF
                              </div>
                            </div>
                          ) : null}
                        </td>
                        <td className="border px-2 py-1 align-top max-w-xs break-words">
                          {depensesList[idx] ? (
                            <div>
                              <div className="font-medium text-red-700">
                                {depensesList[idx].client}
                              </div>
                              <div className="text-xs text-gray-500">
                                {depensesList[idx].date
                                  ? new Date(
                                      depensesList[idx].date
                                    ).toLocaleDateString()
                                  : ""}
                              </div>
                              <div className="text-xs">
                                {depensesList[idx].description}
                              </div>
                              <div className="font-bold text-red-800">
                                {depensesList[idx].montant.toLocaleString()} GNF
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t bg-gray-50">
                      <td className="border px-2 py-2">
                        Total ressources :{" "}
                        <span className="text-green-700">
                          {totalRessources.toLocaleString()} GNF
                        </span>
                      </td>
                      <td className="border px-2 py-2">
                        Total dépenses :{" "}
                        <span className="text-red-700">
                          {totalDepenses.toLocaleString()} GNF
                        </span>
                      </td>
                    </tr>
                    <tr className="font-bold border-t bg-blue-50">
                      <td colSpan={2} className="border px-2 py-2 text-center">
                        Bilan :{" "}
                        <span
                          className={
                            bilan >= 0 ? "text-green-700" : "text-red-700"
                          }
                        >
                          {bilan.toLocaleString()} GNF
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-1">Client</th>
                      <th className="text-left py-1">Statut</th>
                      <th className="text-left py-1">Mois non payés</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientsRetard.map((client, idx) => (
                      <tr
                        key={idx}
                        className={client.aJour ? "bg-green-50" : "bg-red-50"}
                      >
                        <td className="py-1 font-medium">{client.nom}</td>
                        <td
                          className={`py-1 font-semibold ${
                            client.aJour ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {client.aJour ? "À jour" : "En retard"}
                        </td>
                        <td className="py-1">
                          {client.aJour
                            ? "0"
                            : client.moisNonPayes
                                .map(
                                  (m) =>
                                    [
                                      "Janv",
                                      "Fév",
                                      "Mars",
                                      "Avr",
                                      "Mai",
                                      "Juin",
                                      "Juil",
                                      "Août",
                                      "Sept",
                                      "Oct",
                                      "Nov",
                                      "Déc",
                                    ][m]
                                )
                                .join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Bouton OK toujours visible en bas */}
          <div className="w-full px-8 py-4 border-t bg-white flex justify-end sticky bottom-0 z-20">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
              onClick={readOnly ? onClose : handleSaveRapport}
              disabled={saving}
            >
              {saving ? "Enregistrement..." : "OK"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}