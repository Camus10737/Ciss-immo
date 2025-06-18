'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Building2, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Calendar,
  Home,
  UserCheck,
  UserX,
  History
} from 'lucide-react';
import { Immeuble } from '@/app/types';

interface BuildingDetailProps {
  immeuble: Immeuble;
  onBack: () => void;
  onEdit: () => void;
}

export function BuildingDetail({ immeuble, onBack, onEdit }: BuildingDetailProps) {
  const [activeTab, setActiveTab] = useState('infos');

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'habitation':
        return 'bg-blue-100 text-blue-800';
      case 'commercial':
        return 'bg-green-100 text-green-800';
      case 'mixte':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutBadge = (statut: string) => {
    return statut === 'occupe' 
      ? <Badge className="bg-green-100 text-green-800">Occupé</Badge>
      : <Badge className="bg-red-100 text-red-800">Libre</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const appartementLibres = immeuble.appartements.filter(apt => apt.statut === 'libre').length;
  const appartementOccupes = immeuble.appartements.filter(apt => apt.statut === 'occupe').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={20} className="mr-2" />
            Retour
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-blue-700">{immeuble.nom}</h2>
            <p className="text-gray-600">Détails et gestion des appartements</p>
          </div>
        </div>
        <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
          <Edit size={20} className="mr-2" />
          Modifier
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total appartements</p>
                <p className="text-2xl font-bold text-blue-700">{immeuble.nombreAppartements}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Occupés</p>
                <p className="text-2xl font-bold text-green-700">{appartementOccupes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Libres</p>
                <p className="text-2xl font-bold text-red-700">{appartementLibres}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">%</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taux d'occupation</p>
                <p className="text-2xl font-bold text-blue-700">
                  {immeuble.nombreAppartements > 0 ? Math.round((appartementOccupes / immeuble.nombreAppartements) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="infos">Informations</TabsTrigger>
          <TabsTrigger value="appartements">Appartements</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        {/* Onglet Informations */}
        <TabsContent value="infos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-blue-700 flex items-center">
                  <Building2 size={20} className="mr-2" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Type :</span>
                  <Badge className={getBadgeColor(immeuble.type)}>
                    {immeuble.type}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Nombre d'appartements :</span>
                  <span>{immeuble.nombreAppartements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date de création :</span>
                  <span>{formatDate(immeuble.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Dernière modification :</span>
                  <span>{formatDate(immeuble.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Localisation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-blue-700 flex items-center">
                  <MapPin size={20} className="mr-2" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Ville :</span>
                  <span>{immeuble.ville}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Quartier :</span>
                  <span>{immeuble.quartier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Secteur :</span>
                  <span>{immeuble.secteur}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Propriétaire actuel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-blue-700 flex items-center">
                <User size={20} className="mr-2" />
                Propriétaire actuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User size={16} className="mr-2 text-gray-500" />
                    <span>{immeuble.proprietaireActuel.prenom} {immeuble.proprietaireActuel.nom}</span>
                  </div>
                  {immeuble.proprietaireActuel.email && (
                    <div className="flex items-center">
                      <Mail size={16} className="mr-2 text-gray-500" />
                      <span>{immeuble.proprietaireActuel.email}</span>
                    </div>
                  )}
                  {immeuble.proprietaireActuel.telephone && (
                    <div className="flex items-center">
                      <Phone size={16} className="mr-2 text-gray-500" />
                      <span>{immeuble.proprietaireActuel.telephone}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-gray-500" />
                    <span>Propriétaire depuis le {formatDate(immeuble.proprietaireActuel.dateDebut)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Appartements */}
        <TabsContent value="appartements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {immeuble.appartements.map((appartement) => (
              <Card key={appartement.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <Home size={20} className="mr-2 text-blue-600" />
                      Apt. {appartement.numero}
                    </CardTitle>
                    {getStatutBadge(appartement.statut)}
                  </div>
                </CardHeader>
                <CardContent>
                  {appartement.locataireActuel ? (
                    <div className="space-y-2">
                      <p className="font-medium text-blue-700">
                        {appartement.locataireActuel.prenom} {appartement.locataireActuel.nom}
                      </p>
                      {appartement.locataireActuel.email && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <Mail size={14} className="mr-1" />
                          {appartement.locataireActuel.email}
                        </p>
                      )}
                      {appartement.locataireActuel.telephone && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <Phone size={14} className="mr-1" />
                          {appartement.locataireActuel.telephone}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 flex items-center">
                        <Calendar size={14} className="mr-1" />
                        Depuis le {formatDate(appartement.locataireActuel.dateEntree)}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <Home size={32} className="mx-auto mb-2 text-gray-300" />
                      <p>Appartement libre</p>
                      <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700">
                        Ajouter locataire
                      </Button>
                    </div>
                  )}
                  
                  {appartement.historiqueLocataires.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        {appartement.historiqueLocataires.length} ancien{appartement.historiqueLocataires.length > 1 ? 's' : ''} locataire{appartement.historiqueLocataires.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Onglet Historique */}
        <TabsContent value="historique" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-blue-700 flex items-center">
                <History size={20} className="mr-2" />
                Historique des propriétaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              {immeuble.historiqueProprietaires.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun historique de propriétaire</p>
              ) : (
                <div className="space-y-4">
                  {immeuble.historiqueProprietaires.map((proprietaire, index) => (
                    <div key={proprietaire.id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{proprietaire.prenom} {proprietaire.nom}</p>
                          {proprietaire.email && <p className="text-sm text-gray-600">{proprietaire.email}</p>}
                          {proprietaire.telephone && <p className="text-sm text-gray-600">{proprietaire.telephone}</p>}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>Du {formatDate(proprietaire.dateDebut)}</p>
                          {proprietaire.dateFin && <p>Au {formatDate(proprietaire.dateFin)}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-blue-700 flex items-center">
                <History size={20} className="mr-2" />
                Historique des locataires
              </CardTitle>
            </CardHeader>
            <CardContent>
              {immeuble.appartements.every(apt => apt.historiqueLocataires.length === 0) ? (
                <p className="text-gray-500 text-center py-4">Aucun historique de locataire</p>
              ) : (
                <div className="space-y-6">
                  {immeuble.appartements.map((appartement) => (
                    appartement.historiqueLocataires.length > 0 && (
                      <div key={appartement.id}>
                        <h4 className="font-medium text-blue-700 mb-3">Appartement {appartement.numero}</h4>
                        <div className="space-y-3">
                          {appartement.historiqueLocataires.map((locataire, index) => (
                            <div key={locataire.id} className="border-l-4 border-gray-200 pl-4 py-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{locataire.prenom} {locataire.nom}</p>
                                  {locataire.email && <p className="text-sm text-gray-600">{locataire.email}</p>}
                                  {locataire.telephone && <p className="text-sm text-gray-600">{locataire.telephone}</p>}
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                  <p>Du {formatDate(locataire.dateEntree)}</p>
                                  {locataire.dateSortie && <p>Au {formatDate(locataire.dateSortie)}</p>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}