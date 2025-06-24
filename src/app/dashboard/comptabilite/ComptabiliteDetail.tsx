"use client";

import { useState, useEffect } from "react";
import { useLocataires } from "@/hooks/useLocataires";
import { immeublesService } from "@/app/services/immeublesService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  TrendingUp,
  Receipt,
  FileBarChart2,
  DollarSign,
} from "lucide-react";
import { DepotRecuForm } from "./components/DepotRecuForm";
import { ValidationRecusAdmin } from "./components/ValidationRecusAdmin";
import { DepensesList } from "./components/DepensesList";
import { AjoutDepenseForm } from "./components/AjoutDepenseForm";
import { RapportAnnuel } from "./components/RapportAnnuel";
import { ListeRapportsFinanciers } from "./components/ListeRapportsFinanciers";
import { useAuthWithRole } from "@/hooks/useAuthWithRole"; // Ajout

export function ComptabiliteDetail({}) {
  const [activeTab, setActiveTab] = useState("revenus");
  const { locataires, loading } = useLocataires();
  const [immeubles, setImmeubles] = useState<any[]>([]);
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [depenses, setDepenses] = useState<any[]>([]);
  const [refreshDepenses, setRefreshDepenses] = useState(0);
  const [showRapport, setShowRapport] = useState(false);
  const [refreshRapports, setRefreshRapports] = useState(0);

  // Pour filtrer les dépenses par immeuble
  const [selectedImmeuble, setSelectedImmeuble] = useState<string>("");

  // Pour filtrer les rapports par immeuble
  const [selectedImmeubleRapport, setSelectedImmeubleRapport] = useState<string>("");

  // Filtrer les locataires actuels (pas de dateSortie)
  const locatairesActuels = (locataires || []).filter((l) => !l.dateSortie);

  // Récupérer les immeubles au chargement du composant
  useEffect(() => {
    immeublesService.obtenirImmeubles().then(res => {
      setImmeubles(res.success && res.data ? res.data : []);
    });
  }, []);

  // Ajout d'une dépense (tu peux remplacer ce stockage local par un enregistrement en base)
  const handleSaveDepense = (depense: any) => {
    setDepenses((prev) => [...prev, depense]);
  };

  // Ajout pour filtrer les immeubles selon les droits du gestionnaire
  const { canAccessImmeuble } = useAuthWithRole();
  const immeublesAutorises = immeubles.filter(im => canAccessImmeuble(im.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-6">
            <Calculator size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Comptabilité
              </h1>
              <p className="text-gray-600 flex items-center">
                Suivi des revenus, dépenses, rapports et reçus de paiement
              </p>
            </div>
          </div>
        </div>

        {/* Navigation interne style BuildingList */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("revenus")}
            className={`flex-1 flex flex-col items-start p-4 rounded-xl border transition
              ${
                activeTab === "revenus"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200"
              }
            `}
          >
            <DollarSign size={24} className="mb-2" />
            <span className="font-semibold text-lg">Soumettre un reçu</span>
            <span className="text-xs text-gray-400">
              Suivi des paiements reçus
            </span>
          </button>
          <button
            onClick={() => setActiveTab("depenses")}
            className={`flex-1 flex flex-col items-start p-4 rounded-xl border transition
              ${
                activeTab === "depenses"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200"
              }
            `}
          >
            <TrendingUp size={24} className="mb-2" />
            <span className="font-semibold text-lg">Dépenses</span>
            <span className="text-xs text-gray-400">
              Gestion des sorties d'argent
            </span>
          </button>
          <button
            onClick={() => setActiveTab("rapports")}
            className={`flex-1 flex flex-col items-start p-4 rounded-xl border transition
              ${
                activeTab === "rapports"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200"
              }
            `}
          >
            <FileBarChart2 size={24} className="mb-2" />
            <span className="font-semibold text-lg">Rapports financiers</span>
            <span className="text-xs text-gray-400">Synthèse et bilans</span>
          </button>
          <button
            onClick={() => setActiveTab("recus")}
            className={`flex-1 flex flex-col items-start p-4 rounded-xl border transition
              ${
                activeTab === "recus"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200"
              }
            `}
          >
            <Receipt size={24} className="mb-2" />
            <span className="font-semibold text-lg">Validation des reçus</span>
            <span className="text-xs text-gray-400">
              Contrôle des justificatifs
            </span>
          </button>
        </div>

        {/* Contenu selon l'onglet actif */}
        {activeTab === "revenus" && (
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-gray-900 flex items-center">
                <DollarSign size={20} className="mr-3 text-blue-600" />
                Déposer un reçu de paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Chargement des locataires...</div>
              ) : (
                <DepotRecuForm locataires={locatairesActuels} immeubles={immeublesAutorises} />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "depenses" && (
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-gray-900 flex items-center">
                <TrendingUp size={20} className="mr-3 text-blue-600" />
                Gestion des dépenses
              </CardTitle>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
                onClick={() => setShowDepenseForm(true)}
              >
                Ajouter une dépense
              </Button>
            </CardHeader>
            <CardContent>
              {/* Select immeuble pour filtrer les dépenses */}
              <div className="mb-4">
                <label className="block font-medium mb-1">Filtrer par immeuble</label>
                <select
                  value={selectedImmeuble}
                  onChange={e => setSelectedImmeuble(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="">Tous les immeubles</option>
                  {immeublesAutorises.map(im => (
                    <option key={im.id} value={im.id}>
                      {im.nom}
                    </option>
                  ))}
                </select>
              </div>
              {showDepenseForm && (
                <AjoutDepenseForm
                  onSave={() => {
                    setShowDepenseForm(false);
                    setRefreshDepenses((r) => r + 1);
                  }}
                  onClose={() => setShowDepenseForm(false)}
                  immeubleId={selectedImmeuble}
                />
              )}
              <DepensesList refresh={refreshDepenses} immeubleId={selectedImmeuble} />
            </CardContent>
          </Card>
        )}

        {activeTab === "rapports" && (
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-gray-900 flex items-center">
                <FileBarChart2 size={20} className="mr-3 text-blue-600" />
                Rapports financiers
              </CardTitle>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
                onClick={() => setShowRapport(true)}
              >
                Générer un rapport
              </Button>
            </CardHeader>
            <CardContent>
              {/* Select immeuble pour filtrer le rapport */}
              <div className="mb-4">
                <label className="block font-medium mb-1">Filtrer le rapport par immeuble</label>
                <select
                  value={selectedImmeubleRapport}
                  onChange={e => setSelectedImmeubleRapport(e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="">Tous les immeubles</option>
                  {immeublesAutorises.map(im => (
                    <option key={im.id} value={im.id}>
                      {im.nom}
                    </option>
                  ))}
                </select>
              </div>
              <ListeRapportsFinanciers refresh={refreshRapports} immeubles={immeublesAutorises} />
            </CardContent>
            <RapportAnnuel
              open={showRapport}
              onClose={() => {
                setShowRapport(false);
                setRefreshRapports((r) => r + 1);
              }}
              immeubleId={selectedImmeubleRapport}
            />
          </Card>
        )}

        {activeTab === "recus" && (
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-gray-900 flex items-center">
                <Receipt size={20} className="mr-3 text-blue-600" />
                Validation des reçus de paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ValidationRecusAdmin />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}