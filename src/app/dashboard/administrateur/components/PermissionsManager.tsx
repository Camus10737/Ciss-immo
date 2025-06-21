"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Shield, 
  User, 
  Building2, 
  Settings, 
  Calculator,
  BarChart3,
  Trash2,
  RefreshCw,
  Edit,
  CheckCircle,
  XCircle,
  ArrowLeft
} from "lucide-react";
import { UserManagementService } from "@/app/services/userManagementService";
import { DataFilterService } from "@/app/services/dataFilterService";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";
import { Gestionnaire } from "@/app/types/user-management";
import { Immeuble } from "@/app/types/index";
import { BuildingDetail } from "../../immeubles/buildingDetail";
import { EditPermissionsModal } from "./EditPermissionsModal"; // 🆕 Import de la nouvelle modal
import { toast } from "sonner";

interface PermissionsManagerProps {
  refreshKey: number;
}

export function PermissionsManager({ refreshKey }: PermissionsManagerProps) {
  const { user } = useAuthWithRole();
  const [gestionnaires, setGestionnaires] = useState<Gestionnaire[]>([]);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGestionnaire, setSelectedGestionnaire] = useState<Gestionnaire | null>(null);
  const [selectedImmeuble, setSelectedImmeuble] = useState<Immeuble | null>(null);

  // Charger les données
  const loadData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const [gestionnaireData, immeublesData] = await Promise.all([
        UserManagementService.getGestionnaires({ status: 'active' }),
        DataFilterService.getFilteredImmeubles(user.uid)
      ]);
      
      setGestionnaires(gestionnaireData);
      setImmeubles(immeublesData);
      console.log('📋 Données permissions chargées:', { gestionnaireData, immeublesData });
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
      toast.error("Erreur lors du chargement des permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid, refreshKey]);

  const getImmeubleNom = (immeubleId: string) => {
    const immeuble = immeubles.find(i => i.id === immeubleId);
    return immeuble?.nom || `Immeuble ${immeubleId.slice(0, 8)}`;
  };

  const getImmeuble = (immeubleId: string) => {
    return immeubles.find(i => i.id === immeubleId);
  };

  const handleImmeubleClick = (immeubleId: string) => {
    const immeuble = getImmeuble(immeubleId);
    if (immeuble) {
      setSelectedImmeuble(immeuble);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">En attente</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckCircle size={16} className="text-green-600" />
    ) : (
      <XCircle size={16} className="text-gray-400" />
    );
  };

  // 🆕 Gestion du succès de modification des permissions
  const handlePermissionsSuccess = () => {
    loadData(); // Recharger les données
    setSelectedGestionnaire(null); // Fermer la modal
  };

  // Si un immeuble est sélectionné, afficher ses détails
  if (selectedImmeuble) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setSelectedImmeuble(null)}
            variant="outline" 
            size="sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            Retour aux permissions
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Détails de {selectedImmeuble.nom}
            </h3>
            <p className="text-sm text-gray-600">
              Vue détaillée de l'immeuble et ses appartements
            </p>
          </div>
        </div>

        <BuildingDetail 
          immeuble={selectedImmeuble}
          onBack={() => setSelectedImmeuble(null)}
          onEdit={() => console.log('Modifier immeuble:', selectedImmeuble.id)}
          onRefresh={() => loadData()}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Gestion des permissions</h3>
          <Button size="sm" disabled>
            <RefreshCw size={16} className="mr-2 animate-spin" />
            Chargement...
          </Button>
        </div>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <RefreshCw size={48} className="mx-auto text-gray-400 mb-4 animate-spin" />
          <p className="text-gray-600">Chargement des permissions...</p>
        </div>
      </div>
    );
  }

  if (gestionnaires.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Gestion des permissions</h3>
          <Button size="sm" onClick={loadData} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            Actualiser
          </Button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Shield size={48} className="mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucun gestionnaire actif
          </h4>
          <p className="text-gray-600">
            Activez des gestionnaires pour gérer leurs permissions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Gestion des permissions ({gestionnaires.length} gestionnaires)
          </h3>
          <p className="text-sm text-gray-600">
            Configurez les permissions par gestionnaire et par immeuble
          </p>
        </div>
        <Button size="sm" onClick={loadData} variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Liste des gestionnaires avec leurs permissions */}
      <div className="space-y-4">
        {gestionnaires.map((gestionnaire) => (
          <Card key={gestionnaire.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-indigo-100 text-indigo-600">
                      {getInitials(gestionnaire.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{gestionnaire.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-600">{gestionnaire.email}</span>
                      {getStatusBadge(gestionnaire.status)}
                    </div>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedGestionnaire(gestionnaire)}
                >
                  <Edit size={16} className="mr-2" />
                  Modifier permissions
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-900">
                  <Building2 size={16} />
                  <span>Immeubles assignés ({gestionnaire.immeubles_assignes?.length || 0})</span>
                </div>

                {gestionnaire.immeubles_assignes && gestionnaire.immeubles_assignes.length > 0 ? (
                  <div className="space-y-3">
                    {gestionnaire.immeubles_assignes.map((immeubleId) => {
                      const permissions = gestionnaire.permissions_supplementaires?.[immeubleId];
                      
                      return (
                        <div key={immeubleId} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <button
                              onClick={() => handleImmeubleClick(immeubleId)}
                              className="text-left hover:text-blue-600 transition-colors"
                            >
                              <h4 className="font-medium text-gray-900 hover:text-blue-600 underline cursor-pointer">
                                {getImmeubleNom(immeubleId)}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                Cliquez pour voir les détails
                              </p>
                            </button>
                            <Badge variant="outline" className="text-xs">
                              ID: {immeubleId.slice(0, 8)}...
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Permissions automatiques */}
                            <div className="space-y-2">
                              <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                Permissions automatiques
                              </h5>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Gestion immeuble</span>
                                  {getPermissionIcon(true)}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Gestion locataires</span>
                                  {getPermissionIcon(true)}
                                </div>
                              </div>
                            </div>

                            {/* Comptabilité */}
                            <div className="space-y-2">
                              <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center">
                                <Calculator size={12} className="mr-1" />
                                Comptabilité
                              </h5>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Voir</span>
                                  {getPermissionIcon(permissions?.comptabilite?.read || false)}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Modifier</span>
                                  {getPermissionIcon(permissions?.comptabilite?.write || false)}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Exporter</span>
                                  {getPermissionIcon(permissions?.comptabilite?.export || false)}
                                </div>
                              </div>
                            </div>

                            {/* Statistiques & Actions */}
                            <div className="space-y-2">
                              <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center">
                                <BarChart3 size={12} className="mr-1" />
                                Statistiques & Actions
                              </h5>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Voir stats</span>
                                  {getPermissionIcon(permissions?.statistiques?.read || false)}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Exporter stats</span>
                                  {getPermissionIcon(permissions?.statistiques?.export || false)}
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Supprimer immeuble</span>
                                  {getPermissionIcon(permissions?.delete_immeuble || false)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Building2 size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucun immeuble assigné</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 🆕 Modal de modification des permissions - remplace l'ancien TODO */}
      <EditPermissionsModal
        gestionnaire={selectedGestionnaire}
        immeubles={immeubles}
        isOpen={selectedGestionnaire !== null}
        onClose={() => setSelectedGestionnaire(null)}
        onSuccess={handlePermissionsSuccess}
      />
    </div>
  );
}