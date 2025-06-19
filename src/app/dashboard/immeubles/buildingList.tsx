'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Building2, MapPin, Users, Eye } from 'lucide-react';
import { FilterOptions, Immeuble } from '@/app/types';
import { immeublesService } from '@/app/services/immeublesService';
import { BuildingForm } from './buildingForm';
import { BuildingDetail } from './buildingDetail';


export function BuildingList() { 
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [villes, setVilles] = useState<string[]>([]);
  
  // États pour les modales
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedImmeuble, setSelectedImmeuble] = useState<Immeuble | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    chargerImmeubles();
    chargerVilles();
  }, [filters]);

  const chargerImmeubles = async () => {
    setLoading(true);
    const result = await immeublesService.obtenirImmeubles(filters);
    
    if (result.success && result.data) {
      setImmeubles(result.data);
      setError('');
    } else {
      setError(result.error || 'Erreur lors du chargement');
    }
    setLoading(false);
  };

  const chargerVilles = async () => {
    const result = await immeublesService.obtenirVilles();
    if (result.success && result.data) {
      setVilles(result.data);
    }
  };

  const handleSupprimerImmeuble = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet immeuble ?')) return;
    
    const result = await immeublesService.supprimerImmeuble(id);
    if (result.success) {
      chargerImmeubles();
    } else {
      setError(result.error || 'Erreur lors de la suppression');
    }
  };

  const handleModifierImmeuble = (immeuble: Immeuble) => {
    setSelectedImmeuble(immeuble);
    setEditMode(true);
    setShowForm(true);
  };

  const handleVoirDetail = (immeuble: Immeuble) => {
    setSelectedImmeuble(immeuble);
    setShowDetail(true);
  };

  const handleNouvelImmeuble = () => {
    setSelectedImmeuble(null);
    setEditMode(false);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    chargerImmeubles();
  };

  // Filtrer les immeubles par terme de recherche
  const immeublesFiltres = immeubles.filter(immeuble =>
    immeuble.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    immeuble.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
    immeuble.quartier.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (showForm) {
    return (
      <BuildingForm
        immeuble={selectedImmeuble}
        editMode={editMode}
        onSuccess={handleFormSuccess}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (showDetail && selectedImmeuble) {
    return (
      <BuildingDetail
        immeuble={selectedImmeuble}
        onBack={() => setShowDetail(false)}
        onEdit={() => {
          setShowDetail(false);
          handleModifierImmeuble(selectedImmeuble);
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header moderne */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des immeubles</h1>
            <p className="text-gray-600">Gérez vos biens immobiliers et leurs appartements</p>
          </div>
          <Button 
            onClick={handleNouvelImmeuble} 
            className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all duration-200"
          >
            <Plus size={18} className="mr-2" />
            Nouvel immeuble
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher un immeuble..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Filtre par ville */}
            <Select value={filters.ville || 'all'} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, ville: value === 'all' ? undefined : value }))
            }>
              <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Toutes les villes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {villes.map(ville => (
                  <SelectItem key={ville} value={ville}>{ville}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre par type */}
            <Select value={filters.type || 'all'} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value as any }))
            }>
              <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="habitation">Habitation</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="mixte">Mixte</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset filtres */}
            <Button 
              variant="outline" 
              onClick={() => setFilters({})}
              className="border-gray-200 hover:bg-gray-50"
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Liste des immeubles */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-600 bg-blue-50 transition ease-in-out duration-150">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement des immeubles...
          </div>
        </div>
      ) : immeublesFiltres.length === 0 ? (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="text-center py-12">
            <Building2 size={64} className="mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun immeuble trouvé</h3>
            <p className="text-gray-600 mb-6">Commencez par créer votre premier immeuble</p>
            <Button 
              onClick={handleNouvelImmeuble} 
              className="bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <Plus size={18} className="mr-2" />
              Créer votre premier immeuble
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {immeublesFiltres.map((immeuble) => (
            <Card key={immeuble.id} className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl text-gray-900 group-hover:text-blue-700 transition-colors">
                    {immeuble.nom}
                  </CardTitle>
                  <Badge className={getBadgeColor(immeuble.type)}>
                    {immeuble.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Localisation */}
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="mr-3 text-blue-500" />
                  <span className="text-sm">
                    {immeuble.ville} • {immeuble.quartier} • {immeuble.secteur}
                  </span>
                </div>

                {/* Informations */}
                <div className="flex items-center text-gray-600">
                  <Users size={16} className="mr-3 text-blue-500" />
                  <span className="text-sm">
                    {immeuble.nombreAppartements} appartement{immeuble.nombreAppartements > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Propriétaire */}
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <span className="font-medium text-gray-900">Propriétaire :</span>
                  <br />
                  {immeuble.proprietaireActuel.prenom} {immeuble.proprietaireActuel.nom}
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  <Button 
                    size="sm" 
                    onClick={() => handleVoirDetail(immeuble)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Eye size={16} className="mr-2" />
                    Détails
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleModifierImmeuble(immeuble)}
                    className="border-gray-200 hover:bg-gray-50"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSupprimerImmeuble(immeuble.id)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
