"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { useAuth } from "@/hooks/useAuth"
import { getLocataireById } from "@/app/services/locatairesService"
import type { Locataire } from "@/app/types/locataires"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import TenantForm from "../../components/tenantForm"

interface EditTenantPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditTenantPage({ params }: EditTenantPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // 🔥 CORRECTION : Unwrapper les paramètres avec React.use()
  const resolvedParams = use(params)
  const locataireId = resolvedParams.id

  const [locataire, setLocataire] = useState<Locataire | null>(null)
  const [loadingLocataire, setLoadingLocataire] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Rediriger si pas connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Charger les données du locataire
  useEffect(() => {
    const chargerLocataire = async () => {
      if (!locataireId) return

      try {
        const locataireData = await getLocataireById(locataireId)
        if (locataireData) {
          setLocataire(locataireData)
        } else {
          setError("Locataire introuvable")
        }
      } catch (err) {
        console.error("Erreur lors du chargement du locataire:", err)
        setError("Erreur lors du chargement des données")
      } finally {
        setLoadingLocataire(false)
      }
    }

    if (user && locataireId) {
      chargerLocataire()
    }
  }, [user, locataireId])

  // Afficher un loader pendant la vérification auth
  if (loading || loadingLocataire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700 font-medium">{loading ? "Vérification..." : "Chargement du locataire..."}</p>
        </div>
      </div>
    )
  }

  // Ne rien afficher si pas connecté (évite le flash)
  if (!user) {
    return null
  }

  // Afficher une erreur si problème
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-3">Erreur</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <Button
              onClick={() => router.push("/dashboard?section=locataires")}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Afficher un message si locataire non trouvé
  if (!locataire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-800 mb-3">Locataire introuvable</h2>
            <p className="text-yellow-600 mb-6">Le locataire demandé n'existe pas ou a été supprimé.</p>
            <Button
              onClick={() => router.push("/dashboard?section=locataires")}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TenantForm
      initialData={{
        nom: locataire.nom,
        prenom: locataire.prenom,
        email: locataire.email,
        telephone: locataire.telephone || "",
        dateEntree: locataire.dateEntree,
        finBailProbable: locataire.finBailProbable,
        appartementId: locataire.appartementId,
      }}
      isEditing={true}
      locataireId={locataireId}
    />
  )
}