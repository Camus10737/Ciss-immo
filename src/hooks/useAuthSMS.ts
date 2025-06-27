import { useState, useCallback, useEffect } from 'react';
import { getLocataireByTelephone } from '@/app/services/locatairesService';
import { Locataire } from '@/app/types/locataires';

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

  // Connexion simple par numéro de téléphone
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
      setLocataire(loc);
      localStorage.setItem("auth_locataire", JSON.stringify(loc));
      setIsLoading(false);
      return true;
    } catch (e: any) {
      setError("Erreur lors de la connexion.");
      setIsLoading(false);
      return false;
    }
  }, []);

  const deconnexion = useCallback(() => {
    setLocataire(null);
    setError(null);
    localStorage.removeItem("auth_locataire");
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