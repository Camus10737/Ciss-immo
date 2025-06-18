"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import TenantForm from "../components/tenantForm"

export default function AddTenantPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Rediriger si pas connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Afficher un loader pendant la vérification auth
  if (loading) {
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

  return <TenantForm />
}
