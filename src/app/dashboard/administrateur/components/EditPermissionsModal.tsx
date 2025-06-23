// src/app/dashboard/administrateur/components/EditPermissionsModal.tsx

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Save, 
  X, 
  Building2, 
  Calculator, 
  BarChart3, 
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { UserManagementService } from "@/app/services/userManagementService";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";
import { Gestionnaire, ImmeublePermissions } from "@/app/types/user-management";
import { Immeuble } from "@/app/types/index";
import { toast } from "sonner";

interface EditPermissionsModalProps {
  gestionnaire: Gestionnaire | null;
  immeubles: Immeuble[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPermissionsModal({ 
  gestionnaire, 
  immeubles, 
  isOpen, 
  onClose, 
  onSuccess 
}: EditPermissionsModalProps) {
  const { user } = useAuthWithRole();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<{ [immeubleId: string]: ImmeublePermissions }>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Charger les permissions actuelles quand le gestionnaire change
  useEffect(() => {
    if (gestionnaire && isOpen) {
      const currentPermissions: { [immeubleId: string]: ImmeublePermissions } = {};
      
      gestionnaire.immeubles_assignes.forEach(immeubleId => {
        const existingPermissions = gestionnaire.permissions_supplementaires?.[immeubleId];
        
        currentPermissions[immeubleId] = {
          // Permissions automatiques (toujours actives)
          gestion_immeuble: { read: true, write: true },
          gestion_locataires: { read: true, write: true },
          
          // Permissions configurables
          comptabilite: existingPermissions?.comptabilite || { read: false, write: false, export: false },
          statistiques: existingPermissions?.statistiques || { read: false, export: false },
          delete_immeuble: existingPermissions?.delete_immeuble || false
        };
      });

      setPermissions(currentPermissions);
      setHasChanges(false);
    }
  }, [gestionnaire, isOpen]);

  const getImmeubleNom = (immeubleId: string) => {
    const immeuble = immeubles.find(i => i.id === immeubleId);
    return immeuble?.nom || `Immeuble ${immeubleId.slice(0, 8)}`;
  };

  const updatePermission = (immeubleId: string, path: string, value: boolean) => {
    setPermissions(prev => {
      const updated = { ...prev };
      const immeublePermissions = { ...updated[immeubleId] };
      
      // Gérer les permissions imbriquées 
      if (path.includes('.')) {
        const [category, permission] = path.split('.');
        immeublePermissions[category as keyof ImmeublePermissions] = {
          ...(immeublePermissions[category as keyof ImmeublePermissions] as any),
          [permission]: value
        };
      } else {
        // Permission simple
        (immeublePermissions as any)[path] = value;
      }
      
      updated[immeubleId] = immeublePermissions;
      return updated;
    });
    
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!gestionnaire || !user?.uid) return;

    setLoading(true);
    try {
      // Préparer les permissions pour la sauvegarde (exclure les permissions automatiques)
      const permissionsToSave: { [immeubleId: string]: any } = {};
      
      Object.entries(permissions).forEach(([immeubleId, immeublePermissions]) => {
        permissionsToSave[immeubleId] = {
          comptabilite: immeublePermissions.comptabilite,
          statistiques: immeublePermissions.statistiques,
          delete_immeuble: immeublePermissions.delete_immeuble
        };
      });

      const result = await UserManagementService.updateGestionnairePermissions(
        gestionnaire.id,
        permissionsToSave,
        user.uid
      );

      if (result.success) {
        toast.success("Permissions mises à jour avec succès");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error('Erreur sauvegarde permissions:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckCircle size={16} className="text-green-600" />
    ) : (
      <XCircle size={16} className="text-gray-400" />
    );
  };

  if (!gestionnaire) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Building2 size={24} className="text-indigo-600" />
            <div>
              <span>Permissions de {gestionnaire.name}</span>
              <p className="text-sm font-normal text-gray-600 mt-1">
                Configurez les permissions par immeuble - {gestionnaire.immeubles_assignes.length} immeuble(s) assigné(s)
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info sur les permissions automatiques */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-blue-900 font-medium mb-1">
                  Permissions automatiques
                </h4>
                <p className="text-blue-800 text-sm">
                  Chaque gestionnaire a automatiquement accès à la <strong>gestion des immeubles</strong> et des <strong>locataires</strong> 
                  pour tous ses immeubles assignés. Vous configurez ici les permissions supplémentaires.
                </p>
              </div>
            </div>
          </div>

          {/* Configuration par immeuble */}
          <div className="space-y-4">
            {gestionnaire.immeubles_assignes.map((immeubleId) => {
              const immeublePermissions = permissions[immeubleId];
              if (!immeublePermissions) return null;

              return (
                <Card key={immeubleId} className="border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-3">
                        <Building2 size={20} className="text-indigo-600" />
                        <span>{getImmeubleNom(immeubleId)}</span>
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        ID: {immeubleId.slice(0, 8)}...
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Permissions automatiques (lecture seule) */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wide flex items-center">
                        <CheckCircle size={14} className="mr-2 text-green-600" />
                        Permissions automatiques (activées)
                      </h5>
                      <div className="bg-green-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-800">Gestion de l'immeuble (lecture/écriture)</span>
                          {getPermissionIcon(true)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-800">Gestion des locataires (lecture/écriture)</span>
                          {getPermissionIcon(true)}
                        </div>
                      </div>
                    </div>

                    {/* Permissions configurables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Comptabilité */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wide flex items-center">
                          <Calculator size={14} className="mr-2 text-orange-600" />
                          Comptabilité
                        </h5>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`comptabilite-read-${immeubleId}`} className="text-sm">
                              Consulter la comptabilité
                            </Label>
                            <Switch
                              id={`comptabilite-read-${immeubleId}`}
                              checked={immeublePermissions.comptabilite.read}
                              onCheckedChange={(checked) => 
                                updatePermission(immeubleId, 'comptabilite.read', checked)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`comptabilite-write-${immeubleId}`} className="text-sm">
                              Modifier la comptabilité
                            </Label>
                            <Switch
                              id={`comptabilite-write-${immeubleId}`}
                              checked={immeublePermissions.comptabilite.write}
                              onCheckedChange={(checked) => 
                                updatePermission(immeubleId, 'comptabilite.write', checked)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`comptabilite-export-${immeubleId}`} className="text-sm">
                              Exporter les données comptables
                            </Label>
                            <Switch
                              id={`comptabilite-export-${immeubleId}`}
                              checked={immeublePermissions.comptabilite.export}
                              onCheckedChange={(checked) => 
                                updatePermission(immeubleId, 'comptabilite.export', checked)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Statistiques & Actions */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wide flex items-center">
                          <BarChart3 size={14} className="mr-2 text-purple-600" />
                          Statistiques & Actions
                        </h5>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`statistiques-read-${immeubleId}`} className="text-sm">
                              Consulter les statistiques
                            </Label>
                            <Switch
                              id={`statistiques-read-${immeubleId}`}
                              checked={immeublePermissions.statistiques.read}
                              onCheckedChange={(checked) => 
                                updatePermission(immeubleId, 'statistiques.read', checked)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`statistiques-export-${immeubleId}`} className="text-sm">
                              Exporter les statistiques
                            </Label>
                            <Switch
                              id={`statistiques-export-${immeubleId}`}
                              checked={immeublePermissions.statistiques.export}
                              onCheckedChange={(checked) => 
                                updatePermission(immeubleId, 'statistiques.export', checked)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`delete-immeuble-${immeubleId}`} className="text-sm font-medium">
                              <span className="flex items-center space-x-2 text-red-600">
                                <Trash2 size={14} />
                                <span>Supprimer l'immeuble</span>
                              </span>
                            </Label>
                            <Switch
                              id={`delete-immeuble-${immeubleId}`}
                              checked={immeublePermissions.delete_immeuble}
                              onCheckedChange={(checked) => 
                                updatePermission(immeubleId, 'delete_immeuble', checked)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Avertissement EN CAS changements */}
          {hasChanges && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-orange-900 font-medium mb-1">
                    Modifications non sauvegardées
                  </h4>
                  <p className="text-orange-800 text-sm">
                    Vous avez des modifications en attente. N'oubliez pas de sauvegarder.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={loading}
          >
            <X size={16} className="mr-2" />
            Annuler
          </Button>
          
          <div className="space-x-3">
            <Button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </div>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Sauvegarder les permissions
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}