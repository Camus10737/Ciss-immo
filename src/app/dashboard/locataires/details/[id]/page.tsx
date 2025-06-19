"use client"

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getLocataireById } from '@/app/services/locatairesService'
import { Locataire } from '@/app/types/locataires'
// 🔥 CORRECTION : Bon chemin vers components/tenantDetails
import TenantDetails from '../../components/tenantDetails'

interface TenantDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function TenantDetailsPage({ params }: TenantDetailsPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  // 🔥 CORRECTION : Unwrapper les paramètres avec React.use()
  const resolvedParams = use(params)

  const [locataire, setLocataire] = useState<Locataire | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Récupérer les paramètres de retour
  const retour = searchParams.get('retour')
  const immeubleId = searchParams.get('immeubleId')

  // Rediriger si pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Charger les données du locataire
  useEffect(() => {
    const chargerLocataire = async () => {
      if (!resolvedParams.id) return

      try {
        setLoading(true)
        const locataireData = await getLocataireById(resolvedParams.id)
        
        if (locataireData) {
          setLocataire(locataireData)
        } else {
          setError('Locataire introuvable')
        }
      } catch (err) {
        console.error('Erreur lors du chargement du locataire:', err)
        setError('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      chargerLocataire()
    }
  }, [resolvedParams.id, user])

  // Fonction pour gérer le retour
  const handleRetour = () => {
    if (retour === 'immeuble' && immeubleId) {
      router.push(`/dashboard?section=immeubles&action=detail&id=${immeubleId}`)
    } else {
      router.push('/dashboard?section=locataires')
    }
  }

  // Fonction pour gérer la modification
  const handleModifier = () => {
    if (!locataire) return
    
    const params = new URLSearchParams()
    if (retour) params.set('retour', retour)
    if (immeubleId) params.set('immeubleId', immeubleId)
    
    router.push(`/dashboard/locataires/edit/${locataire.id}?${params.toString()}`)
  }

  // Fonction appelée après modification réussie
  const handleModificationSuccess = () => {
    // Recharger les données du locataire
    if (resolvedParams.id) {
      getLocataireById(resolvedParams.id).then(setLocataire)
    }
  }

  // Afficher un loader pendant la vérification auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  // Ne rien afficher si pas connecté (évite le flash)
  if (!user) {
    return null
  }

  // Afficher l'erreur si problème de chargement
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={handleRetour}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  // Afficher un loader pendant le chargement des données
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700 font-medium">Chargement des détails du locataire...</p>
        </div>
      </div>
    )
  }

  // Afficher les détails du locataire
  if (locataire) {
    return (
      <TenantDetails
        locataire={locataire}
        onRetour={handleRetour}
        onModifier={handleModifier}
        onModificationSuccess={handleModificationSuccess}
      />
    )
  }

  // Fallback si aucun locataire trouvé
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-600 text-xl mb-4">Aucun locataire trouvé</div>
        <button
          onClick={handleRetour}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Retour
        </button>
      </div>
    </div>
  )
}