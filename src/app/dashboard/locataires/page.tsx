// src/app/dashboard/locataires/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  LogOut, 
  Building,
  Home,
  User,
  Calendar,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuthSMS } from '@/hooks/useAuthSMS';
import { recuService } from '@/app/services/recusService';
import { Immeuble } from '@/app/types';
import { immeublesService } from '@/app/services/immeublesService';

const LocataireDashboard = () => {
  const router = useRouter();
  const { 
    locataire, 
    deconnexion, 
    isAuthenticated, 
    isTestMode,
    isInitialized // ✅ Nouveau: utiliser l'état d'initialisation du hook
  } = useAuthSMS();

  // États pour le formulaire d'upload
  const [moisPayes, setMoisPayes] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // États pour les données réelles
  const [immeubleData, setImmeubleData] = useState<Immeuble | null>(null);
  const [appartementInfo, setAppartementInfo] = useState<{numero: string} | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // 🔑 CORRECTION: Vérifier l'authentification seulement après initialisation
  useEffect(() => {
    if (!isInitialized) {
      console.log('⏳ En attente d\'initialisation...');
      return;
    }

    console.log('🔍 Vérification auth après initialisation:', {
      hasLocataire: !!locataire,
      isAuthenticated: isAuthenticated(),
      isTestMode
    });
    
    if (!isAuthenticated()) {
      console.log('❌ Pas authentifié, redirection vers login');
      router.push('/locataires/login');
    } else {
      console.log('✅ Authentifié, reste sur le dashboard');
    }
  }, [isInitialized, isAuthenticated, router, locataire, isTestMode]);

  // Charger les données réelles de l'immeuble
  useEffect(() => {
    const chargerDonneesImmeuble = async () => {
      if (!locataire?.immeubleId || !locataire?.appartementId) {
        setLoadingData(false);
        return;
      }

      try {
        setLoadingData(true);
        console.log('🏢 Chargement données immeuble:', locataire.immeubleId);
        
        const result = await immeublesService.obtenirImmeuble(locataire.immeubleId);
        
        if (result.success && result.data) {
          setImmeubleData(result.data);
          
          // Chercher l'appartement dans les données de l'immeuble
          const appartements = (result.data as any).appartements || [];
          const appartement = appartements.find((apt: any) => apt.id === locataire.appartementId);
          
          if (appartement) {
            setAppartementInfo({ numero: appartement.numero });
          } else {
            setAppartementInfo({ numero: 'N/A' });
          }
          
          console.log('✅ Données immeuble chargées');
        } else {
          setMessage("❌ Impossible de charger les données de l'immeuble");
        }
      } catch (error) {
        console.error('❌ Erreur chargement immeuble:', error);
        setMessage("❌ Erreur lors du chargement des données");
      } finally {
        setLoadingData(false);
      }
    };

    // Ne charger que si on est initialisé ET qu'on a un locataire
    if (isInitialized && locataire) {
      chargerDonneesImmeuble();
    }
  }, [locataire, isInitialized]);

  // Gestion de la déconnexion
  const handleLogout = async () => {
    console.log('🚪 Déconnexion demandée');
    const result = await deconnexion();
    if (result.success) {
      router.push('/locataires/login');
    }
  };

  // Gestion du drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Sélection de fichier avec validation basique
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validation basique côté client
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage("❌ Veuillez sélectionner un fichier JPG, PNG ou PDF");
      return;
    }

    setFile(selectedFile);
    setMessage(null); // Effacer les messages précédents
  };

  // Gestion du drag & drop avec validation
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    // Validation basique côté client
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(droppedFile.type)) {
      setMessage("❌ Veuillez sélectionner un fichier JPG, PNG ou PDF");
      return;
    }

    setFile(droppedFile);
    setMessage(null);
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setMessage("❌ Veuillez sélectionner un fichier");
      return;
    }

    if (!locataire || !immeubleData) {
      setMessage("❌ Erreur : données manquantes");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Simuler l'upload pour le mode test
      if (isTestMode) {
        console.log('🧪 Upload simulé en mode test');
        await new Promise(resolve => setTimeout(resolve, 2000));
        setMessage("✅ Reçu téléversé avec succès ! (Mode test)");
        setFile(null);
        setMoisPayes(1);
        return;
      }

      // Upload réel vers Cloudinary via ton API
      console.log('📤 Upload réel du fichier...');
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload-recu", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Erreur lors de l'upload");
      }

      const { url: fichierUrl } = await uploadResponse.json();
      
      // Sauvegarder le reçu en base de données avec ton service
      await recuService.creerRecu(
        locataire.id,
        locataire.appartementId,
        moisPayes,
        fichierUrl,
        locataire.immeubleId
      );

      setMessage("✅ Reçu téléversé avec succès ! Il sera examiné par le gestionnaire.");
      setFile(null);
      setMoisPayes(1);
      
    } catch (error: any) {
      console.error('❌ Erreur upload:', error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
      // Effacer le message après 8 secondes
      setTimeout(() => setMessage(null), 8000);
    }
  };

  // 🔑 CORRECTION: Afficher un loader pendant l'initialisation
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation de votre espace...</p>
          <p className="text-sm text-gray-400 mt-2">Chargement des données d'authentification</p>
        </div>
      </div>
    );
  }

  // Vérifier après initialisation
  if (!locataire || !isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirection...</p>
        </div>
      </div>
    );
  }

  // Loader pour les données de l'immeuble
  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header avec informations locataire */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Home className="w-8 h-8 text-blue-600" />
              Espace Locataire
            </h1>
            <div className="mt-2 space-y-1">
              <p className="text-lg text-gray-700">
                <User className="w-4 h-4 inline mr-2" />
                {locataire.prenom} {locataire.nom}
                {isTestMode && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">🧪 Test</span>}
              </p>
              {immeubleData && (
                <>
                  <p className="text-gray-600">
                    <Building className="w-4 h-4 inline mr-2" />
                    {immeubleData.nom} - Appartement {appartementInfo?.numero}
                  </p>
                  <p className="text-sm text-gray-500">
                    Propriétaire: {immeubleData.proprietaireActuel.prenom} {immeubleData.proprietaireActuel.nom}
                  </p>
                </>
              )}
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" className="mt-4 md:mt-0">
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </div>

        {/* Messages de feedback */}
        {message && (
          <Alert className={`mb-6 ${
            message.includes('✅') 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <AlertDescription className={
              message.includes('✅') ? 'text-green-800' : 'text-red-800'
            }>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Formulaire principal */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Téléverser un reçu de paiement
            </CardTitle>
            <CardDescription>
              Sélectionnez le nombre de mois payés et uploadez votre reçu (PDF, JPG, PNG)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Informations pré-remplies (grisées) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Locataire</Label>
                  <p className="font-semibold text-gray-700">
                    {locataire.prenom} {locataire.nom}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Appartement</Label>
                  <p className="font-semibold text-gray-700">
                    {appartementInfo?.numero || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Immeuble</Label>
                  <p className="font-semibold text-gray-700">
                    {immeubleData?.nom || 'Chargement...'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Propriétaire</Label>
                  <p className="font-semibold text-gray-700">
                    {immeubleData?.proprietaireActuel 
                      ? `${immeubleData.proprietaireActuel.prenom} ${immeubleData.proprietaireActuel.nom}`
                      : 'Chargement...'
                    }
                  </p>
                </div>
              </div>

              {/* Nombre de mois payés */}
              <div className="space-y-2">
                <Label htmlFor="moisPayes" className="text-sm font-medium">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Nombre de mois payés
                </Label>
                <Input
                  id="moisPayes"
                  type="number"
                  min={1}
                  max={12}
                  value={moisPayes}
                  onChange={(e) => setMoisPayes(Number(e.target.value))}
                  className="w-32"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Entre 1 et 12 mois
                </p>
              </div>

              {/* Zone d'upload */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Reçu de paiement
                </Label>
                
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver
                      ? 'border-blue-400 bg-blue-50'
                      : file
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    disabled={loading}
                  />
                  
                  {file ? (
                    <div className="space-y-3">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                      <div>
                        <p className="font-medium text-green-800">Fichier sélectionné</p>
                        <p className="text-sm text-green-600 break-all font-mono">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={loading}
                        className="mt-2"
                      >
                        Changer de fichier
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          Glissez votre fichier ici ou cliquez pour sélectionner
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          PDF, JPG, PNG (max 10MB)
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={loading}
                        className="bg-white"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Sélectionner un fichier
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bouton de soumission */}
              <Button
                type="submit"
                disabled={loading || !file}
                className="w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Téléversement en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Téléverser mon reçu
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LocataireDashboard;