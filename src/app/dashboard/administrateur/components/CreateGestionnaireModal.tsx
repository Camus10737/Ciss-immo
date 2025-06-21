// src/app/dashboard/administrateur/components/CreateGestionnaireModal.tsx

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Loader2
} from "lucide-react";

import { useAuthWithRole } from "@/hooks/useAuthWithRole";
import { Immeuble } from "@/app/types";
import { InvitationService } from '@/app/services/invitationService';
import { DataFilterService } from "@/app/services/dataFilterService";
import { 
  CreateGestionnaireFormData, 
  Gestionnaire, 
  ImmeublePermissions, 
  LocataireUser, 
  SuperAdmin, 
  UserFilters 
} from '@/app/types/user-management';
import { UserManagementService } from "@/app/services/userManagementService";
interface CreateGestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateGestionnaireModal({ isOpen, onClose, onSuccess }: CreateGestionnaireModalProps) {
  const { user } = useAuthWithRole();
  const [loading, setLoading] = useState(false);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    immeubles_assignes: [] as string[],
    permissions_supplementaires: {} as any
  });

  // Charger les immeubles disponibles
  useEffect(() => {
    const loadImmeubles = async () => {
      if (user?.uid && isOpen) {
        const data = await DataFilterService.getFilteredImmeubles(user.uid);
        setImmeubles(data);
      }
    };
    loadImmeubles();
  }, [user?.uid, isOpen]);

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        immeubles_assignes: [],
        permissions_supplementaires: {}
      });
    }
  }, [isOpen]);

  const handleImmeubleToggle = (immeubleId: string) => {
    setFormData(prev => {
      const newAssignments = prev.immeubles_assignes.includes(immeubleId)
        ? prev.immeubles_assignes.filter(id => id !== immeubleId)
        : [...prev.immeubles_assignes, immeubleId];

      // Initialiser ou supprimer les permissions pour cet immeuble
      const newPermissions = { ...prev.permissions_supplementaires };
      if (newAssignments.includes(immeubleId) && !newPermissions[immeubleId]) {
        newPermissions[immeubleId] = {
          comptabilite: { read: false, write: false, export: false },
          statistiques: { read: false, export: false },
          delete_immeuble: false
        };
      } else if (!newAssignments.includes(immeubleId)) {
        delete newPermissions[immeubleId];
      }

      return {
        ...prev,
        immeubles_assignes: newAssignments,
        permissions_supplementaires: newPermissions
      };
    });
  };

  const handlePermissionChange = (immeubleId: string, category: string, permission: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions_supplementaires: {
        ...prev.permissions_supplementaires,
        [immeubleId]: {
          ...prev.permissions_supplementaires[immeubleId],
          [category]: category === 'delete_immeuble' 
            ? value 
            : {
                ...prev.permissions_supplementaires[immeubleId][category],
                [permission]: value
              }
        }
      }
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

    // 🐛 DEBUG
    console.log('UserManagementService:', UserManagementService);
    console.log('UserManagementService.createGestionnaire:', UserManagementService?.createGestionnaire);

    try {
      const result = await UserManagementService.createGestionnaire(
        user.uid,
        formData as CreateGestionnaireFormData
      );

      if (result.success) {
        toast.success(`Gestionnaire ${formData.name} créé avec succès. Une invitation a été envoyée.`);
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error('Erreur création gestionnaire:', error);
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
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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
                    <Card key={immeuble.id} className="border-2 border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <Checkbox
                            checked={formData.immeubles_assignes.includes(immeuble.id)}
                            onCheckedChange={() => handleImmeubleToggle(immeuble.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">{immeuble.nom}</h4>
                                <p className="text-sm text-gray-600">
                                  {immeuble.quartier}, {immeuble.ville} • {immeuble.nombreAppartements} appartements
                                </p>
                              </div>
                              <Badge variant="outline">{immeuble.type}</Badge>
                            </div>

                            {/* Permissions pour cet immeuble */}
                            {formData.immeubles_assignes.includes(immeuble.id) && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                  <Shield size={16} className="mr-2 text-indigo-600" />
                                  Permissions spéciales
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Comptabilité */}
                                  <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Calculator size={16} className="text-green-600" />
                                      <span className="font-medium text-sm">Comptabilité</span>
                                    </div>
                                    <div className="space-y-2 ml-6">
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={formData.permissions_supplementaires[immeuble.id]?.comptabilite?.read || false}
                                          onCheckedChange={(checked) => 
                                            handlePermissionChange(immeuble.id, 'comptabilite', 'read', !!checked)
                                          }
                                        />
                                        <span className="text-sm">Voir</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={formData.permissions_supplementaires[immeuble.id]?.comptabilite?.write || false}
                                          onCheckedChange={(checked) => 
                                            handlePermissionChange(immeuble.id, 'comptabilite', 'write', !!checked)
                                          }
                                        />
                                        <span className="text-sm">Modifier</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={formData.permissions_supplementaires[immeuble.id]?.comptabilite?.export || false}
                                          onCheckedChange={(checked) => 
                                            handlePermissionChange(immeuble.id, 'comptabilite', 'export', !!checked)
                                          }
                                        />
                                        <span className="text-sm">Exporter</span>
                                      </label>
                                    </div>
                                  </div>

                                  {/* Statistiques */}
                                  <div>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <BarChart3 size={16} className="text-blue-600" />
                                      <span className="font-medium text-sm">Statistiques</span>
                                    </div>
                                    <div className="space-y-2 ml-6">
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={formData.permissions_supplementaires[immeuble.id]?.statistiques?.read || false}
                                          onCheckedChange={(checked) => 
                                            handlePermissionChange(immeuble.id, 'statistiques', 'read', !!checked)
                                          }
                                        />
                                        <span className="text-sm">Voir</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={formData.permissions_supplementaires[immeuble.id]?.statistiques?.export || false}
                                          onCheckedChange={(checked) => 
                                            handlePermissionChange(immeuble.id, 'statistiques', 'export', !!checked)
                                          }
                                        />
                                        <span className="text-sm">Exporter</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                {/* Permission spéciale : Supprimer immeuble */}
                                <Separator className="my-3" />
                                <label className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={formData.permissions_supplementaires[immeuble.id]?.delete_immeuble || false}
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(immeuble.id, 'delete_immeuble', '', !!checked)
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
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
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