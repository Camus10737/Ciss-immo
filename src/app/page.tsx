'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Calculator, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Si connecté → Dashboard
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Affichage pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Vérification de l'authentification...</div>
      </div>
    );
  }

  // Si pas connecté, afficher la page d'accueil
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-blue-700">CISS Immobilier</h1>
              <Button 
                onClick={() => router.push('/login')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Se connecter
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex items-center justify-center px-4 py-12">
          <div className="max-w-4xl w-full">
            {/* Message de bienvenue principal */}
            <Card className="mb-8">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 size={32} className="text-blue-600" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  Bonjour ! 👋
                </CardTitle>
                <p className="text-xl text-gray-600">
                  Merci d'utiliser <span className="font-bold text-blue-700">CISS Immobilier</span>
                </p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg text-gray-700 mb-6">
                  Connectez-vous pour gérer vos logements et optimiser votre gestion immobilière
                </p>
                <Button 
                  onClick={() => router.push('/login')}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
                >
                  Se connecter pour commencer
                </Button>
              </CardContent>
            </Card>

            {/* Fonctionnalités */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center p-6">
                <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 size={24} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gestion des immeubles</h3>
                <p className="text-sm text-gray-600">
                  Gérez vos biens immobiliers et leurs appartements
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users size={24} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gestion des locataires</h3>
                <p className="text-sm text-gray-600">
                  Suivez vos locataires et leurs contrats
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="mx-auto mb-4 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calculator size={24} className="text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Comptabilité</h3>
                <p className="text-sm text-gray-600">
                  Suivez vos revenus et dépenses
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="mx-auto mb-4 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 size={24} className="text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Statistiques</h3>
                <p className="text-sm text-gray-600">
                  Analysez vos performances
                </p>
              </Card>
            </div>

            {/* Footer */}
            <div className="text-center mt-12">
              <p className="text-gray-500">
                Vous n'avez pas encore de compte ? {' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Créez-en un maintenant
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}