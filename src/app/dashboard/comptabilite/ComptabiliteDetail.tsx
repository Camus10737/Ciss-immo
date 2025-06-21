"use client";

import { useState } from "react";
import { useLocataires } from "@/hooks/useLocataires";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Receipt, FileBarChart2, DollarSign } from "lucide-react";
import { DepotRecuForm } from "./components/DepotRecuForm";
import { ValidationRecusAdmin } from "./components/ValidationRecusAdmin";
import { DepensesList } from "./components/DepensesList";
import { AjoutDepenseForm } from "./components/AjoutDepenseForm";

export function ComptabiliteDetail({ }) {
  const [activeTab, setActiveTab] = useState("revenus");
  const { locataires, loading } = useLocataires();
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [depenses, setDepenses] = useState<any[]>([]);

  // Filtrer les locataires actuels (pas de dateSortie)
  const locatairesActuels = (locataires || []).filter(l => !l.dateSortie);

  // Ajout d'une dépense (tu peux remplacer ce stockage local par un enregistrement en base)
  const handleSaveDepense = (depense: any) => {
    setDepenses(prev => [...prev, depense]);
  };

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
              ${activeTab === "revenus"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200"}
            `}
          >
            <DollarSign size={24} className="mb-2" />
            <span className="font-semibold text-lg">Soumettre un reçu</span>
            <span className="text-xs text-gray-400">Suivi des paiements reçus</span>
          </button>
          <button
            onClick={() => setActiveTab("depenses")}
            className={`flex-1 flex flex-col items-start p-4 rounded-xl border transition
              ${activeTab === "depenses"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200"}
            `}
          >
            <TrendingUp size={24} className="mb-2" />
            <span className="font-semibold text-lg">Dépenses</span>
            <span className="text-xs text-gray-400">Gestion des sorties d'argent</span>
          </button>
          <button
            onClick={() => setActiveTab("rapports")}
            className={`flex-1 flex flex-col items-start p-4 rounded-xl border transition
              ${activeTab === "rapports"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200"}
            `}
          >
            <FileBarChart2 size={24} className="mb-2" />
            <span className="font-semibold text-lg">Rapports financiers</span>
            <span className="text-xs text-gray-400">Synthèse et bilans</span>
          </button>
          <button
            onClick={() => setActiveTab("recus")}
            className={`flex-1 flex flex-col items-start p-4 rounded-xl border transition
              ${activeTab === "recus"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-200"}
            `}
          >
            <Receipt size={24} className="mb-2" />
            <span className="font-semibold text-lg">Validation des reçus</span>
            <span className="text-xs text-gray-400">Contrôle des justificatifs</span>
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
                <DepotRecuForm locataires={locatairesActuels} />
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
              {showDepenseForm && (
                <AjoutDepenseForm
                  onSave={handleSaveDepense}
                  onClose={() => setShowDepenseForm(false)}
                />
              )}
              <DepensesList depenses={depenses} />
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
              >
                Générer un rapport
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500">Aucun rapport disponible.</div>
            </CardContent>
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