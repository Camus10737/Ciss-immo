<<<<<<< HEAD
=======
// src/app/dashboard/page.tsx

>>>>>>> 02ff611ab56871b546c1b98e12a61e36024d46be
"use client";

import { useAuthWithRole } from "@/hooks/useAuthWithRole";
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
  Shield,
} from "lucide-react";
import { BuildingList } from "./immeubles/buildingList";
import TenantList from "./locataires/components/tenantList";
import { ComptabiliteDetail } from "@/app/dashboard/comptabilite/ComptabiliteDetail";
import { getLocataires } from "@/app/services/locatairesService";
import { AdminSection } from "./administrateur/components/AdminSection";
<<<<<<< HEAD
=======

>>>>>>> 02ff611ab56871b546c1b98e12a61e36024d46be
import { ProfileNavbarLinkWithAvatar } from "./profile/components/ProfileNavbarLink";

type Section = "immeubles" | "locataires" | "comptabilite" | "statistiques" | "administrateur";

export default function DashboardPage() {
  const { user, loading, logout, isAdmin } = useAuthWithRole();
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

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const section = searchParams.get("section");
    if (
      section &&
      ["immeubles", "locataires", "comptabilite", "statistiques", "administrateur"].includes(
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

  if (!user) {
    return null;
  }

  const baseMenuItems = [
    {
      id: "immeubles" as Section,
      label: "Immeubles",
      icon: Building2,
      description: "Gérez vos biens immobiliers",
      roles: ["SUPER_ADMIN", "GESTIONNAIRE", "ADMIN"],
    },
    {
      id: "locataires" as Section,
      label: "Locataires",
      icon: Users,
      description: "Gestion des locataires",
      roles: ["SUPER_ADMIN", "GESTIONNAIRE", "ADMIN"],
    },
    {
      id: "comptabilite" as Section,
      label: "Comptabilité",
      icon: Calculator,
      description: "Revenus et dépenses",
      roles: ["SUPER_ADMIN", "GESTIONNAIRE", "LOCATAIRE", "ADMIN"],
    },
    {
      id: "statistiques" as Section,
      label: "Statistiques",
      icon: BarChart3,
      description: "Analyses et rapports",
      roles: ["SUPER_ADMIN", "GESTIONNAIRE", "ADMIN"],
    },
    {
      id: "administrateur" as Section,
      label: "Administrateur",
      icon: Shield,
      description: "Gestion des utilisateurs",
      roles: ["SUPER_ADMIN", "ADMIN"], // Correction ici
    },
  ];

  const userRole = user?.role || 'GESTIONNAIRE';
  const menuItems = baseMenuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "immeubles":
        return <BuildingList />;
      case "locataires":
        return <TenantList />;
      case "comptabilite":
        return <ComptabiliteDetail />;
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
      case "administrateur":
        if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
          return (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Shield size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Accès non autorisé
                  </h3>
                  <p className="text-gray-600">
                    Seuls les administrateurs peuvent accéder à cette section.
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        }
        return <AdminSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header  */}
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
              <div className="flex items-center space-x-3">
                <ProfileNavbarLinkWithAvatar />
                {/* Badge de rôle */}
                {isAdmin() && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                    Admin
                  </span>
                )}
              </div>
<<<<<<< HEAD
=======
              
>>>>>>> 02ff611ab56871b546c1b98e12a61e36024d46be
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

      {/* Navigation  */}
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
                      ? item.id === "administrateur"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                        : "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
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
                        isActive 
                          ? item.id === "administrateur" 
                            ? "text-indigo-100" 
                            : "text-blue-100"
                          : "text-gray-500"
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

      {/* Contenu  */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderSectionContent()}
      </div>
    </div>
  );
}