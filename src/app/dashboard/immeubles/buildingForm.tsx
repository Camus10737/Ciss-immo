"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Immeuble, ImmeubleFormData } from "@/app/types";
import { immeublesService } from "@/app/services/immeublesService";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";

interface BuildingFormProps {
  immeuble?: Immeuble | null;
  editMode: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}
export function BuildingForm({
  immeuble,
  editMode,
  onSuccess,
  onCancel,
}: BuildingFormProps) {
  const [formData, setFormData] = useState<ImmeubleFormData>({
    nom: "",
    pays: "",
    ville: "",
    quartier: "",
    type: "habitation",
    nombreAppartements: 1,
    proprietaire: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
    },
  });

  const { canAddImmeuble } = useAuthWithRole();

  // 🔒 Bloque l'accès au formulaire pour tous sauf le super admin
  if (!canAddImmeuble()) {
    return (
      <div className="text-red-600 text-center font-semibold p-8">
        Vous n'avez pas la permission d’ajouter ou modifier un immeuble.
      </div>
    );
  }

  useEffect(() => {
    if (editMode && immeuble) {
      setFormData({
        nom: immeuble.nom ?? "",
        pays: immeuble.pays ?? "",
        ville: immeuble.ville ?? "",
        quartier: immeuble.quartier ?? "",
        type: immeuble.type ?? "habitation",
        nombreAppartements: immeuble.nombreAppartements ?? 1,
        proprietaire: {
          nom: immeuble.proprietaireActuel?.nom || "",
          prenom: immeuble.proprietaireActuel?.prenom || "",
          email: immeuble.proprietaireActuel?.email || "",
          telephone: immeuble.proprietaireActuel?.telephone || "",
        },
      });
    }
  }, [editMode, immeuble]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProprietaireChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      proprietaire: {
        ...prev.proprietaire,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editMode && immeuble) {
      // Modification
      await immeublesService.modifierImmeuble(immeuble.id, {
        nom: formData.nom,
        pays: formData.pays,
        ville: formData.ville,
        quartier: formData.quartier,
        type: formData.type,
        nombreAppartements: formData.nombreAppartements,
        proprietaire: formData.proprietaire,
      });
    } else {
      // Création
      await immeublesService.creerImmeuble(formData);
    }
    if (onSuccess) onSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ...le reste de ton formulaire inchangé... */}
          {/* Informations générales */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-900 flex items-center">
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="nom" className="text-sm font-medium text-gray-700">
                    Nom de l'immeuble *
                  </label>
                  <input
                    id="nom"
                    value={formData.nom ?? ""}
                    onChange={(e) => handleInputChange("nom", e.target.value)}
                    required
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium text-gray-700">
                    Type *
                  </label>
                  <select
                    id="type"
                    value={formData.type ?? ""}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    required
                    className="border rounded px-2 py-1 w-full"
                  >
                    <option value="habitation">Habitation</option>
                    <option value="mixte">Mixte</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="nombreAppartements" className="text-sm font-medium text-gray-700">
                    Nombre d'appartements *
                  </label>
                  <input
                    id="nombreAppartements"
                    type="number"
                    min={1}
                    value={formData.nombreAppartements ?? 1}
                    onChange={(e) => handleInputChange("nombreAppartements", Number(e.target.value))}
                    required
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-900 flex items-center">
                Localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="pays" className="text-sm font-medium text-gray-700">
                    Pays *
                  </label>
                  <input
                    id="pays"
                    value={formData.pays ?? ""}
                    onChange={(e) => handleInputChange("pays", e.target.value)}
                    required
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ville" className="text-sm font-medium text-gray-700">
                    Ville *
                  </label>
                  <input
                    id="ville"
                    value={formData.ville ?? ""}
                    onChange={(e) => handleInputChange("ville", e.target.value)}
                    required
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="quartier" className="text-sm font-medium text-gray-700">
                    Quartier *
                  </label>
                  <input
                    id="quartier"
                    value={formData.quartier ?? ""}
                    onChange={(e) => handleInputChange("quartier", e.target.value)}
                    required
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Propriétaire */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-900 flex items-center">
                Propriétaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label htmlFor="nomProprietaire" className="text-sm font-medium text-gray-700">
                    Nom *
                  </label>
                  <input
                    id="nomProprietaire"
                    value={formData.proprietaire.nom ?? ""}
                    onChange={(e) => handleProprietaireChange("nom", e.target.value)}
                    required
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="prenomProprietaire" className="text-sm font-medium text-gray-700">
                    Prénom *
                  </label>
                  <input
                    id="prenomProprietaire"
                    value={formData.proprietaire.prenom ?? ""}
                    onChange={(e) => handleProprietaireChange("prenom", e.target.value)}
                    required
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="emailProprietaire" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="emailProprietaire"
                    type="email"
                    value={formData.proprietaire.email ?? ""}
                    onChange={(e) => handleProprietaireChange("email", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="telephoneProprietaire" className="text-sm font-medium text-gray-700">
                    Téléphone
                  </label>
                  <input
                    id="telephoneProprietaire"
                    value={formData.proprietaire.telephone ?? ""}
                    onChange={(e) => handleProprietaireChange("telephone", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boutons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Retour
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {editMode ? "Enregistrer les modifications" : "Créer l'immeuble"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}