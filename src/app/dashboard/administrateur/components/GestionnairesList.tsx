"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Mail, 
  Phone, 
  Building2, 
  Settings, 
  Trash2,
  UserPlus,
  RefreshCw,
  MoreHorizontal,
  MapPin
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserManagementService } from "@/app/services/userManagementService";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";
import { Gestionnaire } from "@/app/types/user-management";
import { toast } from "sonner";

interface GestionnairesListProps {
  onCreateClick: () => void;
  refreshKey: number;
}

export function GestionnairesList({ onCreateClick, refreshKey }: GestionnairesListProps) {
  const { user } = useAuthWithRole();
  const [gestionnaires, setGestionnaires] = useState<Gestionnaire[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les gestionnaires
  const loadGestionnaires = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const data = await UserManagementService.getGestionnaires();
      setGestionnaires(data);
      console.log('📋 Gestionnaires chargés:', data);
    } catch (error) {
      console.error('Erreur chargement gestionnaires:', error);
      toast.error("Erreur lors du chargement des gestionnaires");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGestionnaires();
  }, [user?.uid, refreshKey]);

  const handleToggleStatus = async (gestionnaireId: string, currentStatus: string) => {
    if (!user?.uid) return;

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const result = await UserManagementService.toggleGestionnaireStatus(
        gestionnaireId,
        newStatus,
        user.uid
      );

      if (result.success) {
        toast.success(`Gestionnaire ${newStatus === 'active' ? 'activé' : 'désactivé'}`);
        loadGestionnaires(); 
      } else {
        toast.error(result.error || "Erreur lors du changement de statut");
      }
    } catch (error) {
      console.error('Erreur changement statut:', error);
      toast.error("Une erreur inattendue s'est produite");
    }
  };

  // NOUVELLE LOGIQUE : Retirer seulement les immeubles assignés par l'admin courant
  const handleDelete = async (gestionnaire: Gestionnaire) => {
    if (!user?.uid) return;

    // Ici, on suppose que tu as un moyen de savoir quels immeubles ont été assignés par l'admin courant.
    // Si ce n'est pas le cas, il faut stocker cette info lors de l'assignation.
    // Pour l'exemple, on retire tous les immeubles (à adapter selon ta logique réelle).
    const immeublesARetirer = gestionnaire.immeubles_assignes;

    if (!immeublesARetirer || immeublesARetirer.length === 0) {
      toast.info("Aucun immeuble à retirer pour ce gestionnaire.");
      return;
    }

    const confirmed = confirm(
      `Êtes-vous sûr de vouloir retirer ${immeublesARetirer.length > 1 ? "ces immeubles" : "cet immeuble"} à ${gestionnaire.name} ?`
    );
    if (!confirmed) return;

    try {
      const result = await UserManagementService.retirerImmeublesAuGestionnaire(
        gestionnaire.id,
        immeublesARetirer
      );

      if (result.success) {
        toast.success(`Gestionnaire ${gestionnaireNom} supprimé`);
        loadGestionnaires();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error("Une erreur inattendue s'est produite");
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Gestionnaires</h3>
          <div className="flex space-x-2">
            <Button size="sm" disabled>
              <RefreshCw size={16} className="mr-2 animate-spin" />
              Chargement...
            </Button>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <RefreshCw size={48} className="mx-auto text-gray-400 mb-4 animate-spin" />
          <p className="text-gray-600">Chargement des gestionnaires...</p>
        </div>
      </div>
    );
  }

  if (gestionnaires.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Gestionnaires</h3>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={onCreateClick}>
            <UserPlus size={16} className="mr-2" />
            Ajouter un gestionnaire
          </Button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucun gestionnaire
          </h4>
          <p className="text-gray-600 mb-4">
            Commencez par ajouter des gestionnaires pour vos immeubles
          </p>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={onCreateClick}>
            <UserPlus size={16} className="mr-2" />
            Créer le premier gestionnaire
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Gestionnaires ({gestionnaires.length})
          </h3>
          <p className="text-sm text-gray-600">
            Gérez les gestionnaires et leurs accès aux immeubles
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={loadGestionnaires}
            className="border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw size={16} className="mr-2" />
            Actualiser
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={onCreateClick}>
            <UserPlus size={16} className="mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Liste des gestionnaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gestionnaires.map((gestionnaire) => (
          <Card key={gestionnaire.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-indigo-100 text-indigo-600">
                      {getInitials(gestionnaire.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{gestionnaire.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusBadge(gestionnaire.status)}
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => console.log('Modifier', gestionnaire.id)}>
                      <Settings size={16} className="mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleToggleStatus(gestionnaire.id, gestionnaire.status)}
                    >
                      <Users size={16} className="mr-2" />
                      {gestionnaire.status === 'active' ? 'Désactiver' : 'Activer'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(gestionnaire)}
                      className="text-red-600"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Retirer mes immeubles
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Contact */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail size={14} />
                  <span>{gestionnaire.email}</span>
                </div>
                {gestionnaire.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone size={14} />
                    <span>{gestionnaire.phone}</span>
                  </div>
                )}
              </div>

              {/* Immeubles assignés */}
              <div>
                <div className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-2">
                  <Building2 size={14} />
                  <span>Immeubles assignés ({gestionnaire.immeubles_assignes?.length || 0})</span>
                </div>
                {gestionnaire.immeubles_assignes && gestionnaire.immeubles_assignes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {gestionnaire.immeubles_assignes.slice(0, 3).map((immeubleId, index) => (
                      <Badge key={immeubleId} variant="outline" className="text-xs">
                        Immeuble {index + 1}
                      </Badge>
                    ))}
                    {gestionnaire.immeubles_assignes.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{gestionnaire.immeubles_assignes.length - 3}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Aucun immeuble assigné</p>
                )}
              </div>

              {/* Date de création */}
              <div className="text-xs text-gray-500 pt-2 border-t">
                Créé le {gestionnaire.createdAt.toLocaleDateString('fr-FR')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}