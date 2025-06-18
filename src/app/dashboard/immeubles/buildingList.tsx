'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Building2, MapPin, Users } from 'lucide-react';
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
        return 'bg-blue-100 text-blue-800';
      case 'commercial':
        return 'bg-green-100 text-green-800';
      case 'mixte':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="space-y-6">
      {/* Header avec bouton d'ajout */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-700">Gestion des immeubles</h2>
          <p className="text-gray-600">Gérez vos biens immobiliers et leurs appartements</p>
        </div>
        <Button onClick={handleNouvelImmeuble} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={20} className="mr-2" />
          Nouvel immeuble
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Rechercher un immeuble..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre par ville */}
            <Select value={filters.ville || 'all'} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, ville: value === 'all' ? undefined : value }))
            }>
              <SelectTrigger>
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
              <SelectTrigger>
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
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Liste des immeubles */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Chargement des immeubles...</p>
        </div>
      ) : immeublesFiltres.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Aucun immeuble trouvé</p>
            <Button onClick={handleNouvelImmeuble} className="mt-4 bg-blue-600 hover:bg-blue-700">
              Créer votre premier immeuble
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {immeublesFiltres.map((immeuble) => (
            <Card key={immeuble.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-blue-700">{immeuble.nom}</CardTitle>
                  <Badge className={getBadgeColor(immeuble.type)}>
                    {immeuble.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Localisation */}
                  <div className="flex items-center text-gray-600">
                    <MapPin size={16} className="mr-2" />
                    <span className="text-sm">
                      {immeuble.ville} • {immeuble.quartier} • {immeuble.secteur}
                    </span>
                  </div>

                  {/* Informations */}
                  <div className="flex items-center text-gray-600">
                    <Users size={16} className="mr-2" />
                    <span className="text-sm">
                      {immeuble.nombreAppartements} appartement{immeuble.nombreAppartements > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Propriétaire */}
                  <div className="text-sm text-gray-600">
                    <strong>Propriétaire :</strong> {immeuble.proprietaireActuel.prenom} {immeuble.proprietaireActuel.nom}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-3 border-t">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleVoirDetail(immeuble)}
                      className="flex-1"
                    >
                      Voir détails
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleModifierImmeuble(immeuble)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSupprimerImmeuble(immeuble.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}