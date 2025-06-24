"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Home, 
  Building2,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Locataire } from '@/app/types/locataires'
import { immeublesService } from '@/app/services/immeublesService'
import { useAuthWithRole } from "@/hooks/useAuthWithRole" // AJOUT

interface TenantDetailsProps {
  locataire: Locataire
  onRetour: () => void
  onModifier: () => void
  onModificationSuccess: () => void
}

export default function TenantDetails({ 
  locataire, 
  onRetour, 
  onModifier, 
  onModificationSuccess 
}: TenantDetailsProps) {
  const [activeTab, setActiveTab] = useState('infos')
  const [appartementInfo, setAppartementInfo] = useState<{
    numero: string
    immeubleNom: string
    immeubleId: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const { canAccessImmeuble } = useAuthWithRole() // AJOUT

  // Charger les informations de l'appartement
  useEffect(() => {
    const chargerInfosAppartement = async () => {
      try {
        setLoading(true)
        // Récupérer tous les immeubles pour trouver l'appartement
        const result = await immeublesService.obtenirImmeubles()
        
        if (result.success && result.data) {
          for (const immeuble of result.data) {
            const appartement = immeuble.appartements.find(apt => apt.id === locataire.appartementId)
            if (appartement) {
              setAppartementInfo({
                numero: appartement.numero,
                immeubleNom: immeuble.nom,
                immeubleId: immeuble.id
              })
              break
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des infos appartement:', error)
      } finally {
        setLoading(false)
      }
    }

    chargerInfosAppartement()
  }, [locataire.appartementId])

  // 🔒 Contrôle d'accès : si on a l'info immeubleId et pas le droit, on bloque tout
  if (
    appartementInfo &&
    appartementInfo.immeubleId &&
    !canAccessImmeuble(appartementInfo.immeubleId)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Accès refusé
          </h2>
          <p>
            Vous n'avez pas la permission d'accéder à ce locataire.
          </p>
          <Button className="mt-6" onClick={onRetour}>
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const getStatutBadge = () => {
    const estActif = !locataire.dateSortie
    return estActif ? (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
        <CheckCircle size={14} className="mr-2" />
        Locataire actuel
      </Badge>
    ) : (
      <Badge className="bg-red-50 text-red-700 border-red-200 font-medium">
        <AlertCircle size={14} className="mr-2" />
        Ancien locataire
      </Badge>
    )
  }

  const calculerDureeLocation = () => {
    const dateDebut = locataire.dateEntree
    const dateFin = locataire.dateSortie || new Date()
    
    const diffTime = Math.abs(dateFin.getTime() - dateDebut.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    const days = diffDays % 30

    if (years > 0) {
      return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `et ${months} mois` : ''}`
    } else if (months > 0) {
      return `${months} mois ${days > 0 ? `et ${days} jour${days > 1 ? 's' : ''}` : ''}`
    } else {
      return `${days} jour${days > 1 ? 's' : ''}`
    }
  }

  const jours_restants_bail = () => {
    if (!locataire.finBailProbable) return null
    
    const aujourd_hui = new Date()
    const finBail = locataire.finBailProbable
    const diffTime = finBail.getTime() - aujourd_hui.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { expired: true, days: Math.abs(diffDays) }
    } else {
      return { expired: false, days: diffDays }
    }
  }

  const bailInfo = jours_restants_bail()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header moderne */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button 
                variant="outline" 
                onClick={onRetour}
                className="border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={18} className="mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {locataire.prenom} {locataire.nom}
                </h1>
                <p className="text-gray-600 flex items-center">
                  <User size={16} className="mr-2" />
                  Informations détaillées du locataire
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getStatutBadge()}
              <Button 
                onClick={onModifier} 
                className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all duration-200"
              >
                <Edit size={18} className="mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Durée de location</p>
                  <p className="text-2xl font-bold text-blue-600">{calculerDureeLocation()}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Appartement</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {loading ? '...' : `Apt. ${appartementInfo?.numero || '?'}`}
                  </p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Home className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Statut</p>
                  <p className="text-xl font-bold text-gray-900">
                    {locataire.dateSortie ? 'Sorti' : 'Actif'}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  locataire.dateSortie ? 'bg-red-100' : 'bg-emerald-100'
                }`}>
                  {locataire.dateSortie ? (
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {bailInfo && (
            <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow duration-200 ${
              bailInfo.expired ? 'bg-red-50' : bailInfo.days <= 30 ? 'bg-orange-50' : 'bg-white'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {bailInfo.expired ? 'Bail expiré' : 'Fin de bail'}
                    </p>
                    <p className={`text-2xl font-bold ${
                      bailInfo.expired ? 'text-red-600' : bailInfo.days <= 30 ? 'text-orange-600' : 'text-gray-900'
                    }`}>
                      {bailInfo.expired ? `+${bailInfo.days}j` : `${bailInfo.days}j`}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    bailInfo.expired ? 'bg-red-100' : bailInfo.days <= 30 ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    <Calendar className={`h-6 w-6 ${
                      bailInfo.expired ? 'text-red-600' : bailInfo.days <= 30 ? 'text-orange-600' : 'text-gray-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contenu principal avec onglets */}
        <Card className="bg-white border-0 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-100">
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="infos" 
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 font-medium"
                >
                  Informations personnelles
                </TabsTrigger>
                <TabsTrigger 
                  value="logement"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none py-4 font-medium"
                >
                  Logement & Dates
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Onglet Informations personnelles */}
            <TabsContent value="infos" className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations de base */}
                <Card className="border border-gray-100">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-gray-900 flex items-center">
                      <User size={20} className="mr-3 text-blue-600" />
                      Identité
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Prénom :</span>
                      <span className="font-semibold text-gray-900">{locataire.prenom}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Nom :</span>
                      <span className="font-semibold text-gray-900">{locataire.nom}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact */}
                <Card className="border border-gray-100">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-gray-900 flex items-center">
                      <Phone size={20} className="mr-3 text-blue-600" />
                      Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Téléphone :</span>
                      <span className="font-semibold text-gray-900">{locataire.telephone}</span>
                    </div>
                    {locataire.email && (
                      <div className="flex justify-between items-center py-2">
                        <span className="font-medium text-gray-700">Email :</span>
                        <span className="font-semibold text-gray-900">{locataire.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Logement & Dates */}
            <TabsContent value="logement" className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Logement */}
                <Card className="border border-gray-100">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-gray-900 flex items-center">
                      <Building2 size={20} className="mr-3 text-blue-600" />
                      Logement actuel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : appartementInfo ? (
                      <>
                        <div className="flex justify-between items-center py-2">
                          <span className="font-medium text-gray-700">Appartement :</span>
                          <span className="font-semibold text-gray-900">Apt. {appartementInfo.numero}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="font-medium text-gray-700">Immeuble :</span>
                          <span className="font-semibold text-gray-900">{appartementInfo.immeubleNom}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500">Informations indisponibles</p>
                    )}
                  </CardContent>
                </Card>

                {/* Dates importantes */}
                <Card className="border border-gray-100">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg text-gray-900 flex items-center">
                      <Calendar size={20} className="mr-3 text-blue-600" />
                      Dates importantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Date d'entrée :</span>
                      <span className="font-semibold text-gray-900">{formatDate(locataire.dateEntree)}</span>
                    </div>
                    {locataire.dateSortie && (
                      <div className="flex justify-between items-center py-2">
                        <span className="font-medium text-gray-700">Date de sortie :</span>
                        <span className="font-semibold text-gray-900">{formatDate(locataire.dateSortie)}</span>
                      </div>
                    )}
                    {locataire.finBailProbable && (
                      <div className="flex justify-between items-center py-2">
                        <span className="font-medium text-gray-700">Fin de bail probable :</span>
                        <span className={`font-semibold ${
                          bailInfo?.expired ? 'text-red-600' : bailInfo?.days && bailInfo.days <= 30 ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {formatDate(locataire.finBailProbable)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Durée de location :</span>
                      <span className="font-semibold text-blue-600">{calculerDureeLocation()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}