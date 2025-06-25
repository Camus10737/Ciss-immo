"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { depensesService } from "@/app/services/depensesService";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";
import { immeublesService } from "@/app/services/immeublesService";

const comptesDefaut = ["Autres"];

export function AjoutDepenseForm({
  onSave,
  onClose,
  immeubleId: propImmeubleId,
}: {
  onSave: () => void;
  onClose: () => void;
  immeubleId?: string;
}) {
  const [comptes, setComptes] = useState<string[]>(comptesDefaut);
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState("");
  const [showAddCompte, setShowAddCompte] = useState(false);
  const [nouveauCompte, setNouveauCompte] = useState("");
  const [immeubles, setImmeubles] = useState<any[]>([]);
  const [selectedImmeuble, setSelectedImmeuble] = useState<string>(propImmeubleId || "");

  const { canWriteComptabilite, isSuperAdmin, user } = useAuthWithRole();

  // Charger la liste des immeubles accessibles (logique inspirée de buildingList)
  useEffect(() => {
    const fetchImmeubles = async () => {
      const res = await immeublesService.obtenirImmeubles();
      const allImmeubles = res.success && res.data ? res.data : [];
      let autorises: any[] = [];
      if (isSuperAdmin()) {
        autorises = allImmeubles;
      } else if (user?.immeubles_assignes && user.immeubles_assignes.length > 0) {
        autorises = allImmeubles.filter(im =>
          user.immeubles_assignes.some((item: any) => item.id === im.id)
        );
      } else {
        autorises = allImmeubles.filter(im => canWriteComptabilite(im.id));
      }
      setImmeubles(autorises);
      // Pré-sélectionne le premier immeuble si rien n'est sélectionné
      if (!selectedImmeuble && autorises.length > 0) {
        setSelectedImmeuble(autorises[0].id);
      }
    };
    fetchImmeubles();
    // eslint-disable-next-line
  }, [isSuperAdmin, user]);

  // Charger la liste des comptes depuis le localStorage au montage
  useEffect(() => {
    const comptesStockes = localStorage.getItem("comptesDepense");
    if (comptesStockes) {
      setComptes(JSON.parse(comptesStockes));
    }
  }, []);

  // Vérifie que l'utilisateur a bien accès à l'immeuble sélectionné
  const immeubleAutorise =
    isSuperAdmin() ||
    (immeubles.some((im) => String(im.id) === String(selectedImmeuble)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!immeubleAutorise || !canWriteComptabilite(selectedImmeuble)) {
      alert("Vous n'avez pas la permission d'ajouter une dépense sur cet immeuble.");
      return;
    }
    const compteFinal = showAddCompte ? nouveauCompte : client;
    if (!compteFinal || !montant || !selectedImmeuble) return;
    await depensesService.ajouterDepense({
      client: compteFinal,
      description,
      montant: Number(montant),
      date: new Date(),
      immeubleId: selectedImmeuble,
    });
    if (showAddCompte && nouveauCompte && !comptes.includes(nouveauCompte)) {
      const newComptes = [...comptes, nouveauCompte];
      setComptes(newComptes);
      localStorage.setItem("comptesDepense", JSON.stringify(newComptes));
    }
    setClient("");
    setDescription("");
    setMontant("");
    setShowAddCompte(false);
    setNouveauCompte("");
    onSave();
    onClose();
  };

  // Si pas la permission, affiche un message et rien d'autre
  if (immeubles.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full relative text-center">
          <button
            type="button"
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
          <div className="mb-4 font-semibold text-lg text-red-600">
            Aucun immeuble accessible pour enregistrer une dépense.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          type="button"
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="mb-4 font-semibold text-lg">Ajouter une dépense</div>
        <div className="space-y-3">
          <div>
            <label className="block font-medium">Immeuble concerné</label>
            <select
              value={selectedImmeuble}
              onChange={e => setSelectedImmeuble(e.target.value)}
              className="border rounded px-2 py-1 w-full"
              required
            >
              <option value="">Sélectionner un immeuble</option>
              {immeubles.map((im) => (
                <option key={im.id} value={im.id}>{im.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium">Nom du compte de dépense</label>
            {!showAddCompte ? (
              <div className="flex gap-2">
                <select
                  value={client}
                  onChange={e => setClient(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  required
                >
                  <option value="">Sélectionner un compte</option>
                  {comptes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  className="bg-gray-200 text-gray-700 px-2"
                  onClick={() => setShowAddCompte(true)}
                  title="Ajouter un nouveau compte"
                >
                  +
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nouveauCompte}
                  onChange={e => setNouveauCompte(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Nom du nouveau compte"
                  required
                />
                <Button
                  type="button"
                  className="bg-blue-600 text-white px-2"
                  onClick={() => {
                    if (
                      nouveauCompte &&
                      !comptes.includes(nouveauCompte)
                    ) {
                      const newComptes = [...comptes, nouveauCompte];
                      setComptes(newComptes);
                      setClient(nouveauCompte);
                      localStorage.setItem("comptesDepense", JSON.stringify(newComptes));
                    } else if (nouveauCompte) {
                      setClient(nouveauCompte);
                    }
                    setShowAddCompte(false);
                    setNouveauCompte("");
                  }}
                  title="Ajouter"
                >
                  ✓
                </Button>
                <Button
                  type="button"
                  className="bg-gray-200 text-gray-700 px-2"
                  onClick={() => {
                    setShowAddCompte(false);
                    setNouveauCompte("");
                  }}
                  title="Annuler"
                >
                  ✕
                </Button>
              </div>
            )}
          </div>
          <div>
            <label className="block font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block font-medium">Montant</label>
            <input
              type="text"
              value={montant}
              onChange={e => setMontant(e.target.value.replace(/[^0-9.,]/g, ""))}
              className="border rounded px-2 py-1 w-full"
              required
              inputMode="decimal"
              pattern="^\d+([.,]\d{1,2})?$"
              placeholder="Ex: 120"
            />
          </div>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            Ajouter la dépense
          </Button>
        </div>
      </form>
    </div>
  );
}