'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Building2, MapPin, User, Phone, Mail, Calendar, Home, UserCheck, UserX, History, TrendingUp } from 'lucide-react';
import { Immeuble } from '@/app/types';

interface BuildingDetailProps {
  immeuble: Immeuble;
  onBack: () => void;
  onEdit: () => void;
}

export function BuildingDetail({ immeuble, onBack, onEdit }: BuildingDetailProps) {
  const [activeTab, setActiveTab] = useState('infos');
  const router = useRouter();

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'habitation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'commercial':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'mixte':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatutBadge = (statut: string) => {
    return statut === 'occupe' 
      ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">Occupé</Badge>
      : <Badge className="bg-red-50 text-red-700 border-red-200 font-medium">Libre</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // 🔥 NOUVELLE FONCTION : Naviguer vers l'ajout de locataire
  const handleAjouterLocataire = (appartementId: string, appartementNumero: string) => {
    const params = new URLSearchParams({
      appartementId: appartementId,
      immeubleId: immeuble.id,
      appartementNumero: appartementNumero,
      immeubleNom: immeuble.nom,
      retour: 'immeuble'
    });
    
    // 🔥 CORRECTION : Utiliser le bon chemin /dashboard/locataires/add
    router.push(`/dashboard/locataires/add?${params.toString()}`);
  };

  // 🔥 NOUVELLE FONCTION : Naviguer vers les détails du locataire
  const handleVoirLocataire = (locataireId: string) => {
    const params = new URLSearchParams({
      retour: 'immeuble',
      immeubleId: immeuble.id
    });
    
    // 🔥 CORRECTION : Utiliser le bon chemin /dashboard/locataires/details/[id]
    router.push(`/dashboard/locataires/details/${locataireId}?${params.toString()}`);
  };

  const appartementLibres = immeuble.appartements.filter(apt => apt.statut === 'libre').length;
  const appartementOccupes = immeuble.appartements.filter(apt => apt.statut === 'occupe').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header avec design moderne */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={18} className="mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{immeuble.nom}</h1>
                <p className="text-gray-600 flex items-center">
                  <Building2 size={16} className="mr-2" />
                  Détails et gestion des appartements
                </p>
              </div>
            </div>
            <Button 
              onClick={onEdit} 
              className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all duration-200"
            >
              <Edit size={18} className="mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        {/* Statistiques avec design amélioré */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total appartements</p>
                  <p className="text-3xl font-bold text-gray-900">{immeuble.nombreAppartements}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Occupés</p>
                  <p className="text-3xl font-bold text-emerald-600">{appartementOccupes}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Libres</p>
                  <p className="text-3xl font-bold text-red-500">{appartementLibres}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <UserX className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Taux d'occupation</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {immeuble.nombreAppartements > 0 ? Math.round((appartementOccupes / immeuble.nombreAppartements) * 100) : 0}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal avec onglets redesignés */}
        <Card className="bg-white border-0 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-100">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="infos" 
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 font-medium"
                >
                  Informations
                </TabsTrigger>
                <TabsTrigger 
                  value="appartements"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 font-medium"
                >
                  Appartements
                </TabsTrigger>
                <TabsTrigger 
                  value="historique"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 font-medium"
                >
                  Historique
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Onglet Informations */}
            <TabsContent value="infos" className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations générales */}
                <Card className="border border-gray-100">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-gray-900 flex items-center">
                      <Building2 size={20} className="mr-3 text-blue-600" />
                      Informations générales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Type :</span>
                      <Badge className={getBadgeColor(immeuble.type)}>
                        {immeuble.type}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Nombre d'appartements :</span>
                      <span className="font-semibold text-gray-900">{immeuble.nombreAppartements}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Date de création :</span>
                      <span className="text-gray-600">{formatDate(immeuble.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Dernière modification :</span>
                      <span className="text-gray-600">{formatDate(immeuble.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Localisation */}
                <Card className="border border-gray-100">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-gray-900 flex items-center">
                      <MapPin size={20} className="mr-3 text-blue-600" />
                      Localisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Ville :</span>
                      <span className="font-semibold text-gray-900">{immeuble.ville}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Quartier :</span>
                      <span className="font-semibold text-gray-900">{immeuble.quartier}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Secteur :</span>
                      <span className="font-semibold text-gray-900">{immeuble.secteur}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Propriétaire actuel */}
              <Card className="border border-gray-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-900 flex items-center">
                    <User size={20} className="mr-3 text-blue-600" />
                    Propriétaire actuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <User size={16} className="mr-3 text-gray-500" />
                        <span className="font-semibold text-gray-900">
                          {immeuble.proprietaireActuel.prenom} {immeuble.proprietaireActuel.nom}
                        </span>
                      </div>
                      {immeuble.proprietaireActuel.email && (
                        <div className="flex items-center">
                          <Mail size={16} className="mr-3 text-gray-500" />
                          <span className="text-gray-700">{immeuble.proprietaireActuel.email}</span>
                        </div>
                      )}
                      {immeuble.proprietaireActuel.telephone && (
                        <div className="flex items-center">
                          <Phone size={16} className="mr-3 text-gray-500" />
                          <span className="text-gray-700">{immeuble.proprietaireActuel.telephone}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-3 text-gray-500" />
                        <span className="text-gray-700">
                          Propriétaire depuis le {formatDate(immeuble.proprietaireActuel.dateDebut)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Appartements - 🔥 VERSION MODIFIÉE AVEC NAVIGATION */}
            <TabsContent value="appartements" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {immeuble.appartements.map((appartement) => (
                  <Card key={appartement.id} className="border border-gray-100 hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center text-gray-900">
                          <Home size={20} className="mr-3 text-blue-600" />
                          Apt. {appartement.numero}
                        </CardTitle>
                        {getStatutBadge(appartement.statut)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {appartement.locataireActuel ? (
                        <div className="space-y-3">
                          {/* 🔥 NOM CLIQUABLE pour voir les détails */}
                          <button
                            onClick={() => handleVoirLocataire(appartement.locataireActuel!.id)}
                            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                          >
                            {appartement.locataireActuel.prenom} {appartement.locataireActuel.nom}
                          </button>
                          
                          {appartement.locataireActuel.email && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Mail size={14} className="mr-2" />
                              {appartement.locataireActuel.email}
                            </p>
                          )}
                          {appartement.locataireActuel.telephone && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Phone size={14} className="mr-2" />
                              {appartement.locataireActuel.telephone}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 flex items-center">
                            <Calendar size={14} className="mr-2" />
                            Depuis le {formatDate(appartement.locataireActuel.dateEntree)}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-6">
                          <Home size={32} className="mx-auto mb-3 text-gray-300" />
                          <p className="mb-3">Appartement libre</p>
                          {/* 🔥 BOUTON MODIFIÉ AVEC NAVIGATION */}
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleAjouterLocataire(appartement.id, appartement.numero)}
                          >
                            Ajouter locataire
                          </Button>
                        </div>
                      )}
                      
                      {appartement.historiqueLocataires.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
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
            <TabsContent value="historique" className="p-6 space-y-6">
              <Card className="border border-gray-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-900 flex items-center">
                    <History size={20} className="mr-3 text-blue-600" />
                    Historique des propriétaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {immeuble.historiqueProprietaires.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun historique de propriétaire</p>
                  ) : (
                    <div className="space-y-4">
                      {immeuble.historiqueProprietaires.map((proprietaire, index) => (
                        <div key={proprietaire.id} className="border-l-4 border-blue-200 pl-6 py-3 bg-blue-50/30 rounded-r-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {proprietaire.prenom} {proprietaire.nom}
                              </p>
                              {proprietaire.email && <p className="text-sm text-gray-600 mt-1">{proprietaire.email}</p>}
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

              <Card className="border border-gray-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-gray-900 flex items-center">
                    <History size={20} className="mr-3 text-blue-600" />
                    Historique des locataires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {immeuble.appartements.every(apt => apt.historiqueLocataires.length === 0) ? (
                    <p className="text-gray-500 text-center py-8">Aucun historique de locataire</p>
                  ) : (
                    <div className="space-y-6">
                      {immeuble.appartements.map((appartement) => (
                        appartement.historiqueLocataires.length > 0 && (
                          <div key={appartement.id}>
                            <h4 className="font-semibold text-blue-700 mb-4">Appartement {appartement.numero}</h4>
                            <div className="space-y-3">
                              {appartement.historiqueLocataires.map((locataire, index) => (
                                <div key={locataire.id} className="border-l-4 border-gray-200 pl-6 py-3 bg-gray-50/50 rounded-r-lg">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      {/* 🔥 HISTORIQUE AUSSI CLIQUABLE */}
                                      <button
                                        onClick={() => handleVoirLocataire(locataire.id)}
                                        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                                      >
                                        {locataire.prenom} {locataire.nom}
                                      </button>
                                      {locataire.email && <p className="text-sm text-gray-600 mt-1">{locataire.email}</p>}
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
        </Card>
      </div>
    </div>
  );
}