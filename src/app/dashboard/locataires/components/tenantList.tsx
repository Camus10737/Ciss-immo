"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Edit, Trash2, LogOut, Phone, Mail, Calendar, Search, Filter, Users } from "lucide-react"
import { getLocataires, deleteLocataire, marquerSortieLocataire } from "@/app/services/locatairesService"
import { useAuth } from "@/hooks/useAuth"
import type { Locataire } from "@/app/types/locataires"
import { immeublesService } from "@/app/services/immeublesService"
import { useAuthWithRole } from "@/hooks/useAuthWithRole"

export default function TenantList() {
  const router = useRouter()
  const { user } = useAuth()
  const { canAccessImmeuble, canWriteLocataires, isGestionnaire } = useAuthWithRole()

  const [locataires, setLocataires] = useState<Locataire[]>([])
  const [filteredLocataires, setFilteredLocataires] = useState<Locataire[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statutFilter, setStatutFilter] = useState("tous")
  const [immeubleMap, setImmeubleMap] = useState<Record<string, string>>({}) // appartementId -> immeubleId

  // Charger la correspondance appartementId -> immeubleId
  useEffect(() => {
    const chargerImmeubles = async () => {
      const result = await immeublesService.obtenirImmeubles()
      if (result.success && result.data) {
        const map: Record<string, string> = {}
        for (const im of result.data) {
          for (const apt of im.appartements) {
            map[apt.id] = im.id
          }
        }
        setImmeubleMap(map)
      }
    }
    chargerImmeubles()
  }, [])

  // Charger les locataires
  useEffect(() => {
    const chargerLocataires = async () => {
      if (!user) return
      try {
        const locatairesData = await getLocataires(user.uid)
        setLocataires(locatairesData)
        setFilteredLocataires(locatairesData)
      } catch (error) {
        console.error("Erreur lors du chargement:", error)
      } finally {
        setLoading(false)
      }
    }
    chargerLocataires()
  }, [user])

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...locataires]

    // 🔒 Filtrer selon les droits du gestionnaire (doit avoir write sur gestion_locataires)
    if (isGestionnaire()) {
      filtered = filtered.filter(
        (locataire) => {
          const immeubleId = immeubleMap[locataire.appartementId]
          return (
            locataire.appartementId &&
            immeubleId &&
            canAccessImmeuble(immeubleId) &&
            canWriteLocataires(immeubleId)
          )
        }
      )
    }

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (locataire) =>
          locataire.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          locataire.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (locataire.telephone && locataire.telephone.includes(searchTerm)),
      )
    }

    // Filtre par statut
    if (statutFilter !== "tous") {
      filtered = filtered.filter((locataire) => {
        if (statutFilter === "actuel") return !locataire.dateSortie
        if (statutFilter === "sorti") return !!locataire.dateSortie
        return true
      })
    }

    setFilteredLocataires(filtered)
  }, [locataires, searchTerm, statutFilter, immeubleMap, canAccessImmeuble, canWriteLocataires, isGestionnaire, user])

  const handleDeleteLocataire = async (id: string, nom: string, prenom: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${prenom} ${nom} ?`)) {
      try {
        await deleteLocataire(id)
        setLocataires((prev) => prev.filter((loc) => loc.id !== id))
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
        alert("Erreur lors de la suppression")
      }
    }
  }

  const handleMarquerSortie = async (id: string, nom: string, prenom: string) => {
    if (window.confirm(`Marquer la sortie de ${prenom} ${nom} ?`)) {
      try {
        await marquerSortieLocataire(id)
        // Recharger les données
        const locatairesData = await getLocataires(user!.uid)
        setLocataires(locatairesData)
      } catch (error) {
        console.error("Erreur lors du marquage de sortie:", error)
        alert("Erreur lors du marquage de sortie")
      }
    }
  }

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("fr-FR")
  }

  const locatairesActuels = filteredLocataires.filter((l) => !l.dateSortie).length
  const ancienLocataires = filteredLocataires.filter((l) => l.dateSortie).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-700 font-medium">Chargement des locataires...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* En-tête avec statistiques */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Gestion des Locataires</h1>
          <p className="text-blue-700 text-lg">Gérez efficacement vos locataires</p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{filteredLocataires.length}</div>
              <div className="text-blue-800 font-medium">Total Locataires</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{locatairesActuels}</div>
              <div className="text-blue-800 font-medium">Locataires Actuels</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-gray-600 mb-2">{ancienLocataires}</div>
              <div className="text-blue-800 font-medium">Anciens Locataires</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions principales */}
        {!isGestionnaire() && (
          <div className="flex justify-center mb-8">
            <Button
              onClick={() => router.push("/dashboard/locataires/add")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Ajouter un Locataire
            </Button>
          </div>
        )}

        {/* Filtres */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-blue-900">
              <Filter className="h-6 w-6" />
              Recherche et Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
                <Input
                  placeholder="Rechercher par nom, prénom ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Filtre par statut */}
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="actuel">Locataires actuels</SelectItem>
                  <SelectItem value="sorti">Anciens locataires</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Résultats */}
        <div className="text-center mb-6">
          <p className="text-blue-700 font-medium">
            {filteredLocataires.length} locataire{filteredLocataires.length > 1 ? "s" : ""} trouvé
            {filteredLocataires.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Liste des locataires */}
        {filteredLocataires.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <UserPlus className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-3">
                {locataires.length === 0 ? "Aucun locataire" : "Aucun résultat"}
              </h3>
              <p className="text-blue-600 mb-6 max-w-md mx-auto">
                {locataires.length === 0
                  ? "Commencez par ajouter votre premier locataire pour gérer vos biens immobiliers"
                  : "Aucun locataire ne correspond à vos critères de recherche"}
              </p>
              {!isGestionnaire() && locataires.length === 0 && (
                <Button
                  onClick={() => router.push("/dashboard/locataires/add")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un locataire
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredLocataires.map((locataire) => (
              <Card
                key={locataire.id}
                className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {locataire.prenom.charAt(0)}
                            {locataire.nom.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-blue-900">
                            {locataire.prenom} {locataire.nom}
                          </h3>
                          <Badge
                            className={`mt-1 ${
                              locataire.dateSortie
                                ? "bg-gray-100 text-gray-800 border-gray-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }`}
                            variant="outline"
                          >
                            {locataire.dateSortie ? "Ancien locataire" : "Locataire actuel"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-blue-700">
                        {locataire.telephone && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-blue-500">Téléphone</p>
                              <p className="font-medium">{locataire.telephone}</p>
                            </div>
                          </div>
                        )}

                        {locataire.email && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Mail className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-blue-500">Email</p>
                              <p className="font-medium">{locataire.email}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-blue-500">Date d'entrée</p>
                            <p className="font-medium">{formatDate(locataire.dateEntree)}</p>
                          </div>
                        </div>

                        {locataire.dateSortie && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm text-red-500">Date de sortie</p>
                              <p className="font-medium">{formatDate(locataire.dateSortie)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isGestionnaire() && (
                      <div className="flex flex-col gap-3 ml-6">
                        {!locataire.dateSortie && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarquerSortie(locataire.id, locataire.nom, locataire.prenom)}
                            className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            <LogOut className="h-4 w-4" />
                            Marquer sortie
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/locataires/${locataire.id}/edit`)}
                          className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                          Modifier
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLocataire(locataire.id, locataire.nom, locataire.prenom)}
                          className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}