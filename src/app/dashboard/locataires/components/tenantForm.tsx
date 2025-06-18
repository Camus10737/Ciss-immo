"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, ArrowLeft, Building2, User, Phone, Calendar } from "lucide-react"
import { createLocataire, updateLocataire } from "@/app/services/locatairesService"
import { useAuth } from "@/hooks/useAuth"
import type { LocataireFormData } from "@/app/types/locataires"
import { immeublesService } from "@/app/services/immeublesService"

interface TenantFormProps {
  initialData?: Partial<LocataireFormData>
  isEditing?: boolean
  locataireId?: string
}

export default function TenantForm({ initialData, isEditing = false, locataireId }: TenantFormProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [formData, setFormData] = useState<LocataireFormData>({
    nom: initialData?.nom || "",
    prenom: initialData?.prenom || "",
    email: initialData?.email || "",
    telephone: initialData?.telephone || "",
    dateEntree: initialData?.dateEntree || new Date(),
    finBailProbable: initialData?.finBailProbable || undefined,
    appartementId: initialData?.appartementId || "",
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [appartements, setAppartements] = useState<Array<{ id: string; nom: string; immeubleNom: string }>>([])
  const [loadingAppartements, setLoadingAppartements] = useState(true)

  // Charger les appartements disponibles au montage du composant
  useEffect(() => {
    const chargerAppartements = async () => {
      try {
        const result = await immeublesService.obtenirAppartementsDisponibles()
        if (result.success && result.data) {
          setAppartements(result.data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des appartements:", error)
      } finally {
        setLoadingAppartements(false)
      }
    }

    chargerAppartements()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis"
    }
    if (!formData.prenom.trim()) {
      newErrors.prenom = "Le prénom est requis"
    }
    if (!formData.telephone || !formData.telephone.trim()) {
      newErrors.telephone = "Le téléphone est requis"
    }
    if (!formData.appartementId) {
      newErrors.appartementId = "Veuillez sélectionner un appartement"
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user) return

    setLoading(true)
    try {
      if (isEditing && locataireId) {
        // Utiliser la fonction de mise à jour réelle
        await updateLocataire(locataireId, formData)
      } else {
        await createLocataire(formData, user.uid)
      }

router.push('/dashboard?section=locataires');
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      alert("Erreur lors de la sauvegarde")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof LocataireFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Effacer l'erreur si le champ devient valide
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
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

        {/* Bouton retour */}
        <div className="flex justify-center mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
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

              {/* Section Appartement */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">Appartement</h3>
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900 font-medium">Appartement *</Label>
                  {loadingAppartements ? (
                    <div className="p-4 text-center text-blue-600 bg-blue-50 rounded-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      Chargement des appartements...
                    </div>
                  ) : (
                    <Select
                      value={formData.appartementId}
                      onValueChange={(value) => handleInputChange("appartementId", value)}
                    >
                      <SelectTrigger
                        className={`border-blue-200 focus:border-blue-500 focus:ring-blue-500 ${errors.appartementId ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Sélectionner un appartement" />
                      </SelectTrigger>
                      <SelectContent>
                        {appartements.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">Aucun appartement disponible</div>
                        ) : (
                          appartements.map((apt) => (
                            <SelectItem key={apt.id} value={apt.id}>
                              {apt.nom}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.appartementId && <p className="text-red-500 text-sm">{errors.appartementId}</p>}
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
                  onClick={() => router.back()}
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
