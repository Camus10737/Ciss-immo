'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft size={20} className="mr-2" />
          Retour
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-blue-700">
            {editMode ? 'Modifier l\'immeuble' : 'Nouvel immeuble'}
          </h2>
          <p className="text-gray-600">
            {editMode ? 'Modifiez les informations de l\'immeuble' : 'Ajoutez un nouvel immeuble à votre portefeuille'}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-700">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nom">Nom de l'immeuble *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  placeholder="Ex: Résidence Les Palmiers"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
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
              <div>
                <Label htmlFor="nombreAppartements">Nombre d'appartements *</Label>
                <Input
                  id="nombreAppartements"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.nombreAppartements}
                  onChange={(e) => handleInputChange('nombreAppartements', parseInt(e.target.value) || 1)}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Les appartements seront créés automatiquement
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-700">Localisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ville">Ville *</Label>
                <Input
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => handleInputChange('ville', e.target.value)}
                  placeholder="Ex: Casablanca"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="quartier">Quartier *</Label>
                <Input
                  id="quartier"
                  value={formData.quartier}
                  onChange={(e) => handleInputChange('quartier', e.target.value)}
                  placeholder="Ex: Maarif"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="secteur">Secteur *</Label>
                <Input
                  id="secteur"
                  value={formData.secteur}
                  onChange={(e) => handleInputChange('secteur', e.target.value)}
                  placeholder="Ex: Secteur 5"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Propriétaire (seulement en mode création) */}
        {!editMode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-blue-700">Propriétaire actuel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenomProprietaire">Prénom *</Label>
                  <Input
                    id="prenomProprietaire"
                    value={formData.proprietaire.prenom}
                    onChange={(e) => handleProprietaireChange('prenom', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="nomProprietaire">Nom *</Label>
                  <Input
                    id="nomProprietaire"
                    value={formData.proprietaire.nom}
                    onChange={(e) => handleProprietaireChange('nom', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="emailProprietaire">Email</Label>
                  <Input
                    id="emailProprietaire"
                    type="email"
                    value={formData.proprietaire.email}
                    onChange={(e) => handleProprietaireChange('email', e.target.value)}
                    placeholder="email@exemple.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telephoneProprietaire">Téléphone</Label>
                  <Input
                    id="telephoneProprietaire"
                    value={formData.proprietaire.telephone}
                    onChange={(e) => handleProprietaireChange('telephone', e.target.value)}
                    placeholder="+212 6 12 34 56 78"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              'Enregistrement...'
            ) : (
              <>
                <Save size={20} className="mr-2" />
                {editMode ? 'Modifier' : 'Créer l\'immeuble'}
              </>
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            <X size={20} className="mr-2" />
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}