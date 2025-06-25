"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, ArrowLeft, Building2, User, Phone, Calendar, Home, Lock } from "lucide-react"
import { createLocataire, updateLocataire } from "@/app/services/locatairesService"
import { useAuth } from "@/hooks/useAuth"
import type { LocataireFormData } from "@/app/types/locataires"
import { immeublesService } from "@/app/services/immeublesService"
import type { Immeuble } from "@/app/types"
import { useAuthWithRole } from "@/hooks/useAuthWithRole"

interface TenantFormProps {
  initialData?: Partial<LocataireFormData>
  isEditing?: boolean
  locataireId?: string
}

export default function TenantForm({ initialData, isEditing = false, locataireId }: TenantFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { canAccessImmeuble, canWriteLocataires, isGestionnaire } = useAuthWithRole()

  // Récupérer les paramètres URL
  const appartementIdFromUrl = searchParams.get('appartementId')
  const immeubleIdFromUrl = searchParams.get('immeubleId')
  const appartementNumeroFromUrl = searchParams.get('appartementNumero')
  const immeubleNomFromUrl = searchParams.get('immeubleNom')
  const retourFromUrl = searchParams.get('retour')

  const [formData, setFormData] = useState<LocataireFormData>({
    nom: initialData?.nom || "",
    prenom: initialData?.prenom || "",
    email: initialData?.email || "",
    telephone: initialData?.telephone || "",
    dateEntree: initialData?.dateEntree || new Date(),
    finBailProbable: initialData?.finBailProbable || undefined,
    appartementId: initialData?.appartementId || appartementIdFromUrl || "",
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [immeubles, setImmeubles] = useState<Immeuble[]>([])
  const [immeubleSelectionne, setImmeubleSelectionne] = useState<string>(immeubleIdFromUrl || "")
  const [loadingImmeubles, setLoadingImmeubles] = useState(true)
  const [appartementPreselectionne, setAppartementPreselectionne] = useState<{
    numero: string;
    immeubleNom: string;
  } | null>(null)

  // Charger tous les immeubles puis filtrer selon les droits réels (write sur gestion_locataires)
  useEffect(() => {
    const chargerImmeubles = async () => {
      try {
        const result = await immeublesService.obtenirImmeubles();
        if (result.success && result.data) {
          setImmeubles(
            result.data.filter(im =>
              canAccessImmeuble(im.id) &&
              canWriteLocataires(im.id)
            )
          );
        }
      } catch (error) {
        console.error("Erreur lors du chargement des immeubles:", error);
      } finally {
        setLoadingImmeubles(false);
      }
    };
    chargerImmeubles()
    // eslint-disable-next-line
  }, [user, canAccessImmeuble, canWriteLocataires])

  // Gérer l'appartement pré-sélectionné depuis l'URL
  useEffect(() => {
    if (appartementIdFromUrl && appartementNumeroFromUrl && immeubleNomFromUrl) {
      setAppartementPreselectionne({
        numero: appartementNumeroFromUrl,
        immeubleNom: immeubleNomFromUrl
      })
    }
  }, [appartementIdFromUrl, appartementNumeroFromUrl, immeubleNomFromUrl])

  // Obtenir les appartements de l'immeuble sélectionné
  const getAppartementsImmeuble = () => {
    if (!immeubleSelectionne) return []
    const immeuble = immeubles.find(imm => imm.id === immeubleSelectionne)
    return immeuble?.appartements || []
  }

  const handleImmeubleChange = (immeubleId: string) => {
    setImmeubleSelectionne(immeubleId)
    setFormData(prev => ({ ...prev, appartementId: "" }))
    if (errors.appartementId) {
      setErrors(prev => ({ ...prev, appartementId: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.nom.trim()) newErrors.nom = "Le nom est requis"
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est requis"
    if (!formData.telephone || !formData.telephone.trim()) newErrors.telephone = "Le téléphone est requis"
    if (!immeubleSelectionne) newErrors.immeuble = "Veuillez sélectionner un immeuble"
    if (!formData.appartementId) newErrors.appartementId = "Veuillez sélectionner un appartement"
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Format d'email invalide"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !user) return
    setLoading(true)
    try {
      if (isEditing && locataireId) {
        await updateLocataire(locataireId, formData)
      } else {
        await createLocataire(formData, user.uid)
      }
      if (retourFromUrl === 'immeuble' && immeubleIdFromUrl) {
        router.push(`/dashboard?section=immeubles&action=detail&id=${immeubleIdFromUrl}&tab=appartements`)
      } else {
        router.push('/dashboard?section=locataires')
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      alert("Erreur lors de la sauvegarde")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof LocataireFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleRetour = () => {
    if (retourFromUrl === 'immeuble' && immeubleIdFromUrl) {
      router.push(`/dashboard?section=immeubles&action=detail&id=${immeubleIdFromUrl}`)
    } else {
      router.push('/dashboard?section=locataires')
    }
  }

  // 🔒 Bloque l'accès si le gestionnaire n'a aucun immeuble autorisé (write sur gestion_locataires)
  if (isGestionnaire() && !loadingImmeubles && immeubles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Accès refusé
          </h2>
          <p>
            Vous n'avez pas la permission d'ajouter un locataire (aucun immeuble autorisé).
          </p>
          <Button className="mt-6" onClick={handleRetour}>
            Retour
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* ...le reste de ton formulaire inchangé... */}
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            {isEditing ? "Modifier le Locataire" : "Nouveau Locataire"}
          </h1>
          <p className="text-blue-700 text-lg">
            {isEditing ? "Modifiez les informations du locataire" : "Ajoutez un nouveau locataire à votre portefeuille"}
          </p>
        </div>

        {/* Affichage de l'appartement pré-sélectionné */}
        {appartementPreselectionne && (
          <div className="max-w-4xl mx-auto mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-3 text-blue-700">
                  <Home size={20} />
                  <span className="font-medium">
                    Appartement sélectionné : Apt. {appartementPreselectionne.numero} - {appartementPreselectionne.immeubleNom}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bouton retour */}
        <div className="flex justify-center mb-8">
          <Button
            variant="outline"
            onClick={handleRetour}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Formulaire */}
        <Card className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-blue-900">Informations du Locataire</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section Informations personnelles */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">Informations personnelles</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-blue-900 font-medium">
                      Nom *
                    </Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => handleInputChange("nom", e.target.value)}
                      className={`border-blue-200 focus:border-blue-500 focus:ring-blue-500 ${errors.nom ? "border-red-500" : ""}`}
                      placeholder="Nom de famille"
                    />
                    {errors.nom && <p className="text-red-500 text-sm">{errors.nom}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="text-blue-900 font-medium">
                      Prénom *
                    </Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => handleInputChange("prenom", e.target.value)}
                      className={`border-blue-200 focus:border-blue-500 focus:ring-blue-500 ${errors.prenom ? "border-red-500" : ""}`}
                      placeholder="Prénom"
                    />
                    {errors.prenom && <p className="text-red-500 text-sm">{errors.prenom}</p>}
                  </div>
                </div>
              </div>

              {/* Section Contact */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">Informations de contact</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="telephone" className="text-blue-900 font-medium">
                      Téléphone *
                    </Label>
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) => handleInputChange("telephone", e.target.value)}
                      className={`border-blue-200 focus:border-blue-500 focus:ring-blue-500 ${errors.telephone ? "border-red-500" : ""}`}
                      placeholder="06 12 34 56 78"
                    />
                    {errors.telephone && <p className="text-red-500 text-sm">{errors.telephone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-blue-900 font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`border-blue-200 focus:border-blue-500 focus:ring-blue-500 ${errors.email ? "border-red-500" : ""}`}
                      placeholder="email@exemple.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Section Logement avec sélection en cascade */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">Logement</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sélection d'immeuble */}
                  <div className="space-y-2">
                    <Label className="text-blue-900 font-medium">Immeuble *</Label>
                    {loadingImmeubles ? (
                      <div className="p-4 text-center text-blue-600 bg-blue-50 rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        Chargement des immeubles...
                      </div>
                    ) : (
                      <Select
                        value={immeubleSelectionne}
                        onValueChange={handleImmeubleChange}
                      >
                        <SelectTrigger
                          className={`border-blue-200 focus:border-blue-500 focus:ring-blue-500 ${errors.immeuble ? "border-red-500" : ""}`}
                        >
                          <SelectValue placeholder="Sélectionner un immeuble" />
                        </SelectTrigger>
                        <SelectContent>
                          {immeubles.map((immeuble) => (
                            <SelectItem key={immeuble.id} value={immeuble.id}>
                              <div className="flex items-center space-x-2">
                                <Building2 size={16} />
                                <span>{immeuble.nom}</span>
                                <span className="text-xs text-gray-500">
                                  ({immeuble.ville} - {immeuble.quartier})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.immeuble && <p className="text-red-500 text-sm">{errors.immeuble}</p>}
                  </div>

                  {/* Sélection d'appartement */}
                  <div className="space-y-2">
                    <Label className="text-blue-900 font-medium">Appartement *</Label>
                    <Select
                      value={formData.appartementId}
                      onValueChange={(value) => handleInputChange("appartementId", value)}
                      disabled={!immeubleSelectionne}
                    >
                      <SelectTrigger
                        className={`border-blue-200 focus:border-blue-500 focus:ring-blue-500 ${errors.appartementId ? "border-red-500" : ""}`}
                      >
                        <SelectValue 
                          placeholder={
                            !immeubleSelectionne 
                              ? "Sélectionnez d'abord un immeuble" 
                              : "Sélectionner un appartement"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {getAppartementsImmeuble().map((appartement) => (
                          <SelectItem 
                            key={appartement.id} 
                            value={appartement.id}
                            disabled={appartement.statut === 'occupe'}
                            className={appartement.statut === 'occupe' ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                {appartement.statut === 'occupe' ? (
                                  <Lock size={16} className="text-gray-400" />
                                ) : (
                                  <Home size={16} className="text-green-600" />
                                )}
                                <span className={appartement.statut === 'occupe' ? "text-gray-400" : ""}>
                                  Apt. {appartement.numero}
                                </span>
                              </div>
                              {appartement.statut === 'occupe' && appartement.locataireActuel && (
                                <span className="text-xs text-gray-400 ml-2">
                                  Occupé par {appartement.locataireActuel.prenom} {appartement.locataireActuel.nom}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                        {getAppartementsImmeuble().length === 0 && immeubleSelectionne && (
                          <div className="p-4 text-center text-gray-500">
                            Aucun appartement dans cet immeuble
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.appartementId && <p className="text-red-500 text-sm">{errors.appartementId}</p>}
                    
                    {/* Indicateur du nombre d'appartements libres/occupés */}
                    {immeubleSelectionne && (
                      <div className="text-xs text-gray-600 mt-1">
                        {(() => {
                          const appartements = getAppartementsImmeuble()
                          const libres = appartements.filter(apt => apt.statut === 'libre').length
                          const occupes = appartements.filter(apt => apt.statut === 'occupe').length
                          return `${libres} libre(s) • ${occupes} occupé(s)`
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Dates */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">Dates importantes</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dateEntree" className="text-blue-900 font-medium">
                      Date d'entrée *
                    </Label>
                    <Input
                      id="dateEntree"
                      type="date"
                      value={formData.dateEntree.toISOString().split("T")[0]}
                      onChange={(e) => handleInputChange("dateEntree", new Date(e.target.value))}
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="finBailProbable" className="text-blue-900 font-medium">
                      Fin de bail probable
                    </Label>
                    <Input
                      id="finBailProbable"
                      type="date"
                      value={formData.finBailProbable ? formData.finBailProbable.toISOString().split("T")[0] : ""}
                      onChange={(e) =>
                        handleInputChange("finBailProbable", e.target.value ? new Date(e.target.value) : undefined)
                      }
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRetour}
                  className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 py-3"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {isEditing ? "Modifier" : "Ajouter"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}