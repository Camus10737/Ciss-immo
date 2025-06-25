"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UserPlus,
  Building2,
  Mail,
  Phone,
  User,
  Shield,
  Calculator,
  BarChart3,
  Trash2,
  Loader2,
} from "lucide-react";

import { useAuthWithRole } from "@/hooks/useAuthWithRole";
import { Immeuble } from "@/app/types";
import { immeublesService } from "@/app/services/immeublesService"; // Correction ici
import {
  CreateGestionnaireFormData,
  ImmeubleAssignment,
} from "@/app/types/user-management";
import { UserManagementService } from "@/app/services/userManagementService";

interface CreateGestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateGestionnaireModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateGestionnaireModalProps) {
  const { user, isAdmin, isSuperAdmin } = useAuthWithRole();
  const [loading, setLoading] = useState(false);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [formData, setFormData] = useState<CreateGestionnaireFormData>({
    name: "",
    email: "",
    phone: "",
    immeubles_assignes: [],
    permissions_supplementaires: {},
  });

  // Charger les immeubles disponibles selon le rôle
  useEffect(() => {
    const loadImmeubles = async () => {
      if (user?.uid && isOpen) {
        let data: Immeuble[] = [];
        if (isSuperAdmin()) {
          // Super admin : tous les immeubles
          const res = await immeublesService.obtenirImmeubles({});
          data = res.data || [];
        } else if (isAdmin()) {
          // Admin : seulement ses immeubles assignés
          const res = await immeublesService.obtenirImmeubles({});
          const allImmeubles = res.data || [];
          const assignedIds = user.immeubles_assignes?.map((im: any) => im.id) || [];
          data = allImmeubles.filter(im => assignedIds.includes(im.id));
        }
        setImmeubles(data);
      }
    };
    loadImmeubles();
  }, [user?.uid, isOpen, isAdmin, isSuperAdmin]);

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        immeubles_assignes: [],
        permissions_supplementaires: {},
      });
    }
  }, [isOpen]);

  // Correction : gestion des immeubles assignés avec {id, assignedBy}
  const handleImmeubleToggle = (immeubleId: string) => {
    setFormData((prev) => {
      const isAssigned = prev.immeubles_assignes.some(
        (item) => item.id === immeubleId
      );
      let newAssignments: ImmeubleAssignment[];
      if (isAssigned) {
        newAssignments = prev.immeubles_assignes.filter(
          (item) => item.id !== immeubleId
        );
      } else {
        newAssignments = [
          ...prev.immeubles_assignes,
          { id: immeubleId, assignedBy: user?.uid || "" },
        ];
      }

      // Initialiser ou supprimer les permissions pour cet immeuble
      const newPermissions = { ...prev.permissions_supplementaires };
      if (!isAssigned && !newPermissions[immeubleId]) {
        newPermissions[immeubleId] = {
          gestion_immeuble: { read: false, write: false },
          gestion_locataires: { read: false, write: false },
          comptabilite: { read: false, write: false, export: false },
          statistiques: { read: false, export: false },
          delete_immeuble: false,
        };
      } else if (isAssigned) {
        delete newPermissions[immeubleId];
      }

      return {
        ...prev,
        immeubles_assignes: newAssignments,
        permissions_supplementaires: newPermissions,
      };
    });
  };

  const handlePermissionChange = (
    immeubleId: string,
    category: string,
    permission: string,
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      permissions_supplementaires: {
        ...prev.permissions_supplementaires,
        [immeubleId]: {
          ...prev.permissions_supplementaires[immeubleId],
          [category]:
            category === "delete_immeuble"
              ? value
              : {
                  ...prev.permissions_supplementaires[immeubleId]?.[category],
                  [permission]: value,
                },
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid) {
      toast.error("Utilisateur non authentifié");
      return;
    }

    if (!formData.name || !formData.email) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (formData.immeubles_assignes.length === 0) {
      toast.error("Veuillez assigner au moins un immeuble");
      return;
    }

    setLoading(true);

    try {
      const result = await UserManagementService.createGestionnaire(
        user.uid,
        formData
      );

      if (result.success) {
        if (result.alreadyExists) {
          toast.success(
            `Le gestionnaire existe déjà, ses immeubles ont été mis à jour.`
          );
          onSuccess();
          onClose();
          setLoading(false);
          return;
        }

        // Vérifie que le token existe
        const token = result.token;
        if (!token) {
          toast.error("Le token d'invitation est manquant.");
          setLoading(false);
          return;
        }

        // Envoi de l'email d'invitation via l'API route
        const emailRes = await fetch("/api/send-invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            token,
            role: "GESTIONNAIRE",
          }),
        });

        const emailData = await emailRes.json();
        console.log("Réponse API send-invitation :", emailData);

        if (!emailRes.ok) {
          toast.error("Erreur lors de l'envoi de l'email d'invitation.");
          setLoading(false);
          return;
        }

        toast.success(
          `Gestionnaire ${formData.name} créé avec succès. Une invitation a été envoyée.`
        );
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus size={24} className="text-indigo-600" />
            <span>Créer un nouveau gestionnaire</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User size={20} className="text-blue-600" />
                <span>Informations personnelles</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ex: Ahmed Diallo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="ahmed@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+224 XXX XXX XXX"
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignation d'immeubles et permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Building2 size={20} className="text-green-600" />
                <span>Assignation d'immeubles et permissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {immeubles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Aucun immeuble disponible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {immeubles.map((immeuble) => (
                    <Card
                      key={immeuble.id}
                      className="border-2 border-gray-100"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <Checkbox
                            checked={formData.immeubles_assignes.some(
                              (item) => item.id === immeuble.id
                            )}
                            onCheckedChange={() =>
                              handleImmeubleToggle(immeuble.id)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {immeuble.nom}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {immeuble.quartier}, {immeuble.ville} •{" "}
                                  {immeuble.nombreAppartements} appartements
                                </p>
                              </div>
                              <Badge variant="outline">{immeuble.type}</Badge>
                            </div>

                            {/* Permissions pour cet immeuble */}
                            {formData.immeubles_assignes.some(
                              (item) => item.id === immeuble.id
                            ) && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                  <Shield
                                    size={16}
                                    className="mr-2 text-indigo-600"
                                  />
                                  Permissions détaillées
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Gestion immeuble */}
                                  <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Building2
                                        size={16}
                                        className="text-blue-600"
                                      />
                                      <span className="font-medium text-sm">
                                        Gestion immeuble
                                      </span>
                                    </div>
                                    <div className="space-y-2 ml-6">
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={
                                            formData
                                              .permissions_supplementaires[
                                              immeuble.id
                                            ]?.gestion_immeuble?.read || false
                                          }
                                          onCheckedChange={(checked) =>
                                            handlePermissionChange(
                                              immeuble.id,
                                              "gestion_immeuble",
                                              "read",
                                              !!checked
                                            )
                                          }
                                        />
                                        <span className="text-sm">Voir</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={
                                            formData
                                              .permissions_supplementaires[
                                              immeuble.id
                                            ]?.gestion_immeuble?.write || false
                                          }
                                          onCheckedChange={(checked) =>
                                            handlePermissionChange(
                                              immeuble.id,
                                              "gestion_immeuble",
                                              "write",
                                              !!checked
                                            )
                                          }
                                        />
                                        <span className="text-sm">
                                          Modifier
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                  {/* Gestion locataires */}
                                  <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <User
                                        size={16}
                                        className="text-green-600"
                                      />
                                      <span className="font-medium text-sm">
                                        Gestion locataires
                                      </span>
                                    </div>
                                    <div className="space-y-2 ml-6">
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={
                                            formData
                                              .permissions_supplementaires[
                                              immeuble.id
                                            ]?.gestion_locataires?.read || false
                                          }
                                          onCheckedChange={(checked) =>
                                            handlePermissionChange(
                                              immeuble.id,
                                              "gestion_locataires",
                                              "read",
                                              !!checked
                                            )
                                          }
                                        />
                                        <span className="text-sm">Voir</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={
                                            formData
                                              .permissions_supplementaires[
                                              immeuble.id
                                            ]?.gestion_locataires?.write ||
                                            false
                                          }
                                          onCheckedChange={(checked) =>
                                            handlePermissionChange(
                                              immeuble.id,
                                              "gestion_locataires",
                                              "write",
                                              !!checked
                                            )
                                          }
                                        />
                                        <span className="text-sm">
                                          Modifier
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                  {/* Comptabilité */}
                                  <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Calculator
                                        size={16}
                                        className="text-green-600"
                                      />
                                      <span className="font-medium text-sm">
                                        Comptabilité
                                      </span>
                                    </div>
                                    <div className="space-y-2 ml-6">
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={
                                            formData
                                              .permissions_supplementaires[
                                              immeuble.id
                                            ]?.comptabilite?.read || false
                                          }
                                          onCheckedChange={(checked) =>
                                            handlePermissionChange(
                                              immeuble.id,
                                              "comptabilite",
                                              "read",
                                              !!checked
                                            )
                                          }
                                        />
                                        <span className="text-sm">Voir</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={
                                            formData
                                              .permissions_supplementaires[
                                              immeuble.id
                                            ]?.comptabilite?.write || false
                                          }
                                          onCheckedChange={(checked) =>
                                            handlePermissionChange(
                                              immeuble.id,
                                              "comptabilite",
                                              "write",
                                              !!checked
                                            )
                                          }
                                        />
                                        <span className="text-sm">
                                          Modifier
                                        </span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={
                                            formData
                                              .permissions_supplementaires[
                                              immeuble.id
                                            ]?.comptabilite?.export || false
                                          }
                                          onCheckedChange={(checked) =>
                                            handlePermissionChange(
                                              immeuble.id,
                                              "comptabilite",
                                              "export",
                                              !!checked
                                            )
                                          }
                                        />
                                        <span className="text-sm">
                                          Exporter
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                  {/* Statistiques */}
                                  <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <BarChart3
                                        size={16}
                                        className="text-blue-600"
                                      />
                                      <span className="font-medium text-sm">
                                        Statistiques
                                      </span>
                                    </div>
                                    <div className="space-y-2 ml-6">
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={
                                            formData
                                              .permissions_supplementaires[
                                              immeuble.id
                                            ]?.statistiques?.read || false
                                          }
                                          onCheckedChange={(checked) =>
                                            handlePermissionChange(
                                              immeuble.id,
                                              "statistiques",
                                              "read",
                                              !!checked
                                            )
                                          }
                                        />
                                        <span className="text-sm">Voir</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={
                                            formData
                                              .permissions_supplementaires[
                                              immeuble.id
                                            ]?.statistiques?.export || false
                                          }
                                          onCheckedChange={(checked) =>
                                            handlePermissionChange(
                                              immeuble.id,
                                              "statistiques",
                                              "export",
                                              !!checked
                                            )
                                          }
                                        />
                                        <span className="text-sm">
                                          Exporter
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                                {/* Permission spéciale : Supprimer immeuble */}
                                <Separator className="my-3" />
                                <label className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={
                                      formData.permissions_supplementaires[
                                        immeuble.id
                                      ]?.delete_immeuble || false
                                    }
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        immeuble.id,
                                        "delete_immeuble",
                                        "",
                                        !!checked
                                      )
                                    }
                                  />
                                  <Trash2 size={16} className="text-red-600" />
                                  <span className="text-sm font-medium text-red-600">
                                    Autoriser la suppression de cet immeuble
                                  </span>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <UserPlus size={16} className="mr-2" />
                  Créer le gestionnaire
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}