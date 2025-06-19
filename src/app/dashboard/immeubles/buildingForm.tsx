'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X, Building2, MapPin, User } from 'lucide-react';
import { Immeuble, ImmeubleFormData } from '@/app/types';
import { immeublesService } from '@/app/services/immeublesService';

interface BuildingFormProps {
  immeuble?: Immeuble | null;
  editMode: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BuildingForm({ immeuble, editMode, onSuccess, onCancel }: BuildingFormProps) {
  const [formData, setFormData] = useState<ImmeubleFormData>({
    nom: '',
    ville: '',
    quartier: '',
    secteur: '',
    type: 'habitation',
    nombreAppartements: 1,
    proprietaire: {
      nom: '',
      prenom: '',
      email: '',
      telephone: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (editMode && immeuble) {
      setFormData({
        nom: immeuble.nom,
        ville: immeuble.ville,
        quartier: immeuble.quartier,
        secteur: immeuble.secteur,
        type: immeuble.type,
        nombreAppartements: immeuble.nombreAppartements,
        proprietaire: {
          nom: immeuble.proprietaireActuel.nom,
          prenom: immeuble.proprietaireActuel.prenom,
          email: immeuble.proprietaireActuel.email || '',
          telephone: immeuble.proprietaireActuel.telephone || ''
        }
      });
    }
  }, [editMode, immeuble]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      
      if (editMode && immeuble) {
        // Mode édition - pour l'instant on ne modifie que les infos de base
        result = await immeublesService.modifierImmeuble(immeuble.id, {
          nom: formData.nom,
          ville: formData.ville,
          quartier: formData.quartier,
          secteur: formData.secteur,
          type: formData.type
          // Note: On ne modifie pas le nombre d'appartements et le propriétaire pour simplifier
        });
      } else {
        // Mode création
        result = await immeublesService.creerImmeuble(formData);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ImmeubleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProprietaireChange = (field: keyof ImmeubleFormData['proprietaire'], value: string) => {
    setFormData(prev => ({
      ...prev,
      proprietaire: {
        ...prev.proprietaire,
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header moderne */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-6">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {editMode ? 'Modifier l\'immeuble' : 'Nouvel immeuble'}
              </h1>
              <p className="text-gray-600">
                {editMode ? 'Modifiez les informations de l\'immeuble' : 'Ajoutez un nouvel immeuble à votre portefeuille'}
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-900 flex items-center">
                <Building2 size={24} className="mr-3 text-blue-600" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-sm font-medium text-gray-700">
                    Nom de l'immeuble *
                  </Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    placeholder="Ex: Résidence Les Palmiers"
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                    Type *
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="habitation">Habitation</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="mixte">Mixte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!editMode && (
                <div className="space-y-2">
                  <Label htmlFor="nombreAppartements" className="text-sm font-medium text-gray-700">
                    Nombre d'appartements *
                  </Label>
                  <Input
                    id="nombreAppartements"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.nombreAppartements}
                    onChange={(e) => handleInputChange('nombreAppartements', parseInt(e.target.value) || 1)}
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500">
                    Les appartements seront créés automatiquement
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-900 flex items-center">
                <MapPin size={24} className="mr-3 text-blue-600" />
                Localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ville" className="text-sm font-medium text-gray-700">
                    Ville *
                  </Label>
                  <Input
                    id="ville"
                    value={formData.ville}
                    onChange={(e) => handleInputChange('ville', e.target.value)}
                    placeholder="Ex: Casablanca"
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quartier" className="text-sm font-medium text-gray-700">
                    Quartier *
                  </Label>
                  <Input
                    id="quartier"
                    value={formData.quartier}
                    onChange={(e) => handleInputChange('quartier', e.target.value)}
                    placeholder="Ex: Maarif"
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secteur" className="text-sm font-medium text-gray-700">
                    Secteur *
                  </Label>
                  <Input
                    id="secteur"
                    value={formData.secteur}
                    onChange={(e) => handleInputChange('secteur', e.target.value)}
                    placeholder="Ex: Secteur 5"
                    required
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Propriétaire (seulement en mode création) */}
          {!editMode && (
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <User size={24} className="mr-3 text-blue-600" />
                  Propriétaire actuel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="prenomProprietaire" className="text-sm font-medium text-gray-700">
                      Prénom *
                    </Label>
                    <Input
                      id="prenomProprietaire"
                      value={formData.proprietaire.prenom}
                      onChange={(e) => handleProprietaireChange('prenom', e.target.value)}
                      required
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nomProprietaire" className="text-sm font-medium text-gray-700">
                      Nom *
                    </Label>
                    <Input
                      id="nomProprietaire"
                      value={formData.proprietaire.nom}
                      onChange={(e) => handleProprietaireChange('nom', e.target.value)}
                      required
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailProprietaire" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="emailProprietaire"
                      type="email"
                      value={formData.proprietaire.email}
                      onChange={(e) => handleProprietaireChange('email', e.target.value)}
                      placeholder="email@exemple.com"
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telephoneProprietaire" className="text-sm font-medium text-gray-700">
                      Téléphone
                    </Label>
                    <Input
                      id="telephoneProprietaire"
                      value={formData.proprietaire.telephone}
                      onChange={(e) => handleProprietaireChange('telephone', e.target.value)}
                      placeholder="+212 6 12 34 56 78"
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all duration-200 px-8"
            >
              {loading ? (
                'Enregistrement...'
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  {editMode ? 'Modifier' : 'Créer l\'immeuble'}
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
              className="border-gray-200 hover:bg-gray-50 px-8"
            >
              <X size={18} className="mr-2" />
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
