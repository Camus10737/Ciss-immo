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
  MoreHorizontal
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
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GestionnairesListProps {
  onCreateClick: () => void;
  refreshKey: number;
}

export function GestionnairesList({ onCreateClick, refreshKey }: GestionnairesListProps) {
  const { user, isSuperAdmin } = useAuthWithRole();
  const [gestionnaires, setGestionnaires] = useState<Gestionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [immeublesAll, setImmeublesAll] = useState<{ id: string; nom: string }[]>([]);
  const [search, setSearch] = useState(""); // Barre de recherche

  // Charger tous les immeubles pour faire la correspondance id -> nom
  useEffect(() => {
    const fetchImmeubles = async () => {
      const snap = await getDocs(collection(db, "immeubles"));
      setImmeublesAll(
        snap.docs.map(doc => ({
          id: doc.id,
          nom: doc.data().nom || doc.id,
        }))
      );
    };
    fetchImmeubles();
  }, []);

  // Charger les gestionnaires
  const loadGestionnaires = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await UserManagementService.getGestionnaires();
      let filtered = data;
      if (!isSuperAdmin()) {
        // Admin : ne voit que les gestionnaires qui ont AU MOINS un immeuble assigné par lui
        filtered = data.filter(g =>
          Array.isArray(g.immeubles_assignes) &&
          g.immeubles_assignes.some(im => im.assignedBy === user.uid)
        );
      }
      setGestionnaires(filtered);
    } catch (error) {
      toast.error("Erreur lors du chargement des gestionnaires");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGestionnaires();
  }, [user?.uid, refreshKey]);

  // Recherche sur nom ou email
  const gestionnairesFiltered = gestionnaires.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.email?.toLowerCase().includes(search.toLowerCase())
  );

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
        loadGestionnaires(); // Recharger la liste
      } else {
        toast.error(result.error || "Erreur lors du changement de statut");
      }
    } catch (error) {
      toast.error("Une erreur inattendue s'est produite");
    }
  };

  // Correction : super admin retire tous les immeubles, admin retire seulement les siens
  const handleDelete = async (gestionnaire: Gestionnaire) => {
    if (!user?.uid) return;

    const immeublesARetirer = isSuperAdmin()
      ? (gestionnaire.immeubles_assignes || [])
      : (gestionnaire.immeubles_assignes || []).filter(
          (im) => im.assignedBy === user.uid
        );

    if (!immeublesARetirer.length) {
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
        toast.success(
          `Immeuble${immeublesARetirer.length > 1 ? "s" : ""} retiré${immeublesARetirer.length > 1 ? "s" : ""} à ${gestionnaire.name}`
        );
        loadGestionnaires(); // Recharger la liste
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
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

  return (
    <div className="space-y-4">
      {/* Header avec actions et barre de recherche toujours visible */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Gestionnaires ({gestionnairesFiltered.length})
          </h3>
          <p className="text-sm text-gray-600">
            Gérez les gestionnaires et leurs accès aux immeubles
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border rounded-md text-sm"
          />
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

      {/* Loading */}
      {loading && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <RefreshCw size={48} className="mx-auto text-gray-400 mb-4 animate-spin" />
          <p className="text-gray-600">Chargement des gestionnaires...</p>
        </div>
      )}

      {/* Aucun gestionnaire trouvé */}
      {!loading && gestionnairesFiltered.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucun gestionnaire
          </h4>
          <p className="text-gray-600 mb-4">
            {search
              ? "Aucun gestionnaire ne correspond à votre recherche."
              : "Commencez par ajouter des gestionnaires pour vos immeubles"}
          </p>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={onCreateClick}>
            <UserPlus size={16} className="mr-2" />
            Créer le premier gestionnaire
          </Button>
        </div>
      )}

      {/* Liste des gestionnaires */}
      {!loading && gestionnairesFiltered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gestionnairesFiltered.map((gestionnaire) => {
            const immeublesToShow = isSuperAdmin()
              ? gestionnaire.immeubles_assignes || []
              : (gestionnaire.immeubles_assignes || []).filter(
                  (im) => im.assignedBy === user?.uid
                );
            return (
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
                      <span>Immeubles assignés ({immeublesToShow.length})</span>
                    </div>
                    {immeublesToShow.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {immeublesToShow.slice(0, 3).map((im, index) => {
                          const immeubleNom = immeublesAll.find(i => i.id === im.id)?.nom || im.id;
                          return (
                            <Badge key={im.id} variant="outline" className="text-xs">
                              {immeubleNom}
                            </Badge>
                          );
                        })}
                        {immeublesToShow.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{immeublesToShow.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Aucun immeuble assigné</p>
                    )}
                  </div>

                  {/* Date de création */}
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Créé le {gestionnaire.createdAt?.toLocaleDateString
                      ? gestionnaire.createdAt.toLocaleDateString('fr-FR')
                      : ""}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}