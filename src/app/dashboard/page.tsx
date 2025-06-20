"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  Calculator,
  BarChart3,
  LogOut,
  User,
} from "lucide-react";
import { BuildingList } from "./immeubles/buildingList";
import TenantList from "./locataires/components/tenantList";
import { DepotRecuForm } from "@/app/dashboard/comptabilite/components/DepotRecuForm";
import { ValidationRecusAdmin } from "@/app/dashboard/comptabilite/components/ValidationRecusAdmin";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ComptabiliteDetail } from "@/app/dashboard/comptabilite/ComptabiliteDetail";
import { getLocataires } from "@/app/services/locatairesService";

type Section = "immeubles" | "locataires" | "comptabilite" | "statistiques";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<Section>("immeubles");
  const [appartementId, setAppartementId] = useState<string | null>(null);


  useEffect(() => {
    const fetchLocataireActuel = async () => {
      if (user?.uid) {
        const locataires = await getLocataires(user.uid);
        const locataireActuel = locataires.find(l => !l.dateSortie);
        setAppartementId(locataireActuel?.appartementId || null);
      }
    };
    fetchLocataireActuel();
  }, [user?.uid]);

  // Redirection si pas connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  useEffect(() => {
    const section = searchParams.get("section");
    if (
      section &&
      ["immeubles", "locataires", "comptabilite", "statistiques"].includes(
        section
      )
    ) {
      setActiveSection(section as Section);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push("/login");
    }
  };

  // Affichage de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-600 bg-white transition ease-in-out duration-150">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Chargement...
          </div>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur (pendant la redirection)
  if (!user) {
    return null;
  }

  const menuItems = [
    {
      id: "immeubles" as Section,
      label: "Immeubles",
      icon: Building2,
      description: "Gérez vos biens immobiliers",
    },
    {
      id: "locataires" as Section,
      label: "Locataires",
      icon: Users,
      description: "Gestion des locataires",
    },
    {
      id: "comptabilite" as Section,
      label: "Comptabilité",
      icon: Calculator,
      description: "Revenus et dépenses",
    },
    {
      id: "statistiques" as Section,
      label: "Statistiques",
      icon: BarChart3,
      description: "Analyses et rapports",
    },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case "immeubles":
        return <BuildingList />;

      case "locataires":
        return <TenantList />;

     
      case "comptabilite":
        return (
          <ComptabiliteDetail
            locataireId={user?.uid}
            appartementId={appartementId}
            isAdmin={user?.role === "admin"}            />
         );

      case "statistiques":
        return (
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-gray-900 flex items-center">
                <BarChart3 size={24} className="mr-3 text-blue-600" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Visualisez vos performances avec des graphiques et analyses
                détaillées.
              </p>
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                <h3 className="text-purple-900 font-semibold mb-4">
                  Fonctionnalités à venir :
                </h3>
                <ul className="text-purple-800 space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Taux d'occupation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Rentabilité par bien
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Évolution des revenus
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Comparaisons annuelles
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header moderne */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                CISS Immobilier
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                <User size={18} className="text-blue-600" />
                <span className="hidden sm:block font-medium">
                  {user.email}
                </span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-200 hover:bg-gray-50"
              >
                <LogOut size={16} className="mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation moderne */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-200 whitespace-nowrap min-w-fit ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Icon
                    size={20}
                    className={isActive ? "text-white" : "text-gray-500"}
                  />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div
                      className={`text-xs ${
                        isActive ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderSectionContent()}
      </div>
    </div>
  );
}
