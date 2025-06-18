'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import TenantForm from '../../components/tenantForm';
import { getLocataireById } from '@/app/services/locatairesService';
import { Locataire } from '@/app/types/locataires';

export default function EditTenantPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locataireId = params.id as string;

  const [locataire, setLocataire] = useState<Locataire | null>(null);
  const [loadingLocataire, setLoadingLocataire] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rediriger si pas connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Charger les données du locataire
  useEffect(() => {
    const chargerLocataire = async () => {
      if (!locataireId) return;
      
      try {
        const locataireData = await getLocataireById(locataireId);
        if (locataireData) {
          setLocataire(locataireData);
        } else {
          setError('Locataire introuvable');
        }
      } catch (err) {
        console.error('Erreur lors du chargement du locataire:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoadingLocataire(false);
      }
    };

    if (user && locataireId) {
      chargerLocataire();
    }
  }, [user, locataireId]);

  // Afficher un loader pendant la vérification auth
  if (loading || loadingLocataire) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {loading ? 'Vérification...' : 'Chargement du locataire...'}
          </p>
        </div>
      </div>
    );
  }

  // Ne rien afficher si pas connecté (évite le flash)
  if (!user) {
    return null;
  }

  // Afficher une erreur si problème
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/dashboard/locataires')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // Afficher un message si locataire non trouvé
  if (!locataire) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Locataire introuvable</h2>
          <p className="text-yellow-600">Le locataire demandé n'existe pas ou a été supprimé.</p>
          <button
            onClick={() => router.push('/dashboard/locataires')}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Modifier le locataire</h1>
        <p className="text-gray-600 mt-2">
          Modification de <span className="font-medium">{locataire.prenom} {locataire.nom}</span>
        </p>
      </div>
      
      <TenantForm 
        initialData={{
          nom: locataire.nom,
          prenom: locataire.prenom,
          email: locataire.email,
          telephone: locataire.telephone || '',
          dateEntree: locataire.dateEntree,
          finBailProbable: locataire.finBailProbable,
          appartementId: locataire.appartementId,
        }}
        isEditing={true}
        locataireId={locataireId}
      />
    </div>
  );
}