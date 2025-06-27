import { useState, useCallback, useEffect } from 'react';
import { getLocataireByTelephone } from '@/app/services/locatairesService';
import { Locataire } from '@/app/types/locataires';
import { getAuth, signInAnonymously, signOut, deleteUser } from "firebase/auth";

export const useAuthSMS = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locataire, setLocataire] = useState<Locataire | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restaure l'authentification depuis le localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem("auth_locataire");
    if (saved) {
      setLocataire(JSON.parse(saved));
    }
    setIsInitialized(true);
  }, []);

  // Connexion simple par numéro de téléphone + auth anonyme Firebase
  const connecterLocataire = useCallback(async (phoneNumber: string) => {
  setIsLoading(true);
  setError(null);
  setLocataire(null);

  try {
    const loc = await getLocataireByTelephone(phoneNumber);
    if (!loc) {
      setError("Aucun compte locataire trouvé pour ce numéro.");
      setIsLoading(false);
      return false;
    }
    // Log pour debug
    console.log("Locataire trouvé :", loc);

    // Authentification anonyme Firebase
    const auth = getAuth();
    await signInAnonymously(auth);
    console.log("Connexion anonyme réussie");

    setLocataire(loc);
    localStorage.setItem("auth_locataire", JSON.stringify(loc));
    setIsLoading(false);
    return true;
  } catch (e: any) {
    console.error("Erreur lors de la connexion :", e);
    setError("Erreur lors de la connexion.");
    setIsLoading(false);
    return false;
  }
}, []);

  // Déconnexion + suppression du compte anonyme Firebase
  const deconnexion = useCallback(async () => {
    setLocataire(null);
    setError(null);
    localStorage.removeItem("auth_locataire");
    const auth = getAuth();
    if (auth.currentUser) {
      try {
        await deleteUser(auth.currentUser);
      } catch {
        // Si l'utilisateur n'est plus valide, on force le signOut
        await signOut(auth);
      }
    } else {
      await signOut(auth);
    }
  }, []);

  const isAuthenticated = !!locataire;

  return {
    isLoading,
    error,
    locataire,
    connecterLocataire,
    deconnexion,
    isAuthenticated,
    isInitialized,
  };
};