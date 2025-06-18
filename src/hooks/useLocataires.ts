// src/hooks/useLocataires.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
// Test temporaire - change selon où est ton fichier service
// Si le service est dans src/services/
// OU si le service est dans src/app/services/
// import { LocataireService } from '@/app/services/locatairesService';
// ✅ CORRECTION : Import depuis le bon fichier locataire.ts
import { Locataire, LocataireFilters, LocataireFormData } from '@/app/types/locataires';
import { LocataireService } from '@/app/services/locatairesService';

export const useLocataires = () => {
  const { user } = useAuth();
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les locataires au montage du composant
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const chargerLocataires = () => {
      try {
        // Utiliser l'écoute en temps réel
        unsubscribe = LocataireService.ecouterLocataires(
          user.uid,
          (locatairesData: Locataire[]) => {
            setLocataires(locatairesData);
            setLoading(false);
            setError(null);
          }
        );
      } catch (err) {
        console.error('Erreur lors du chargement des locataires:', err);
        setError('Erreur lors du chargement des locataires');
        setLoading(false);
      }
    };

    chargerLocataires();

    // Nettoyer l'abonnement au démontage
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  // Créer un nouveau locataire
  const creerLocataire = useCallback(async (data: LocataireFormData) => {
    if (!user?.uid) {
      throw new Error('Utilisateur non connecté');
    }

    setLoading(true);
    setError(null);
    
    try {
      const id = await LocataireService.creerLocataire(data, user.uid);
      return id;
    } catch (err) {
      const message = 'Erreur lors de la création du locataire';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Modifier un locataire
  const modifierLocataire = useCallback(async (id: string, data: Partial<LocataireFormData>) => {
    setLoading(true);
    setError(null);
    
    try {
      await LocataireService.modifierLocataire(id, data);
    } catch (err) {
      const message = 'Erreur lors de la modification du locataire';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marquer la sortie d'un locataire
  const marquerSortie = useCallback(async (id: string, dateSortie: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      await LocataireService.marquerSortie(id, dateSortie);
    } catch (err) {
      const message = 'Erreur lors de la sortie du locataire';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer un locataire
  const supprimerLocataire = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await LocataireService.supprimerLocataire(id);
    } catch (err) {
      const message = 'Erreur lors de la suppression du locataire';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer un locataire spécifique
  const obtenirLocataire = useCallback(async (id: string) => {
    setError(null);
    
    try {
      return await LocataireService.obtenirLocataire(id);
    } catch (err) {
      const message = 'Erreur lors de la récupération du locataire';
      setError(message);
      throw new Error(message);
    }
  }, []);

  // Filtrer les locataires
  const filtrerLocataires = useCallback((filters: LocataireFilters) => {
    let locatairesFiltres = [...locataires];

    // Filtre par statut
    if (filters.statut && filters.statut !== 'tous') {
      locatairesFiltres = locatairesFiltres.filter(locataire => {
        const estActif = !locataire.dateSortie;
        return filters.statut === 'actif' ? estActif : !estActif;
      });
    }

    // Filtre par recherche (nom/prénom)
    if (filters.recherche) {
      const recherche = filters.recherche.toLowerCase();
      locatairesFiltres = locatairesFiltres.filter(locataire =>
        locataire.nom.toLowerCase().includes(recherche) ||
        locataire.prenom.toLowerCase().includes(recherche)
      );
    }

    return locatairesFiltres;
  }, [locataires]);

  // Statistiques simples
  const statistiques = useCallback(() => {
    const actifs = locataires.filter(l => !l.dateSortie);
    const sortis = locataires.filter(l => l.dateSortie);
    
    return {
      totalActifs: actifs.length,
      totalSortis: sortis.length,
      total: locataires.length
    };
  }, [locataires]);

  return {
    // Données
    locataires,
    loading,
    error,
    
    // Actions
    creerLocataire,
    modifierLocataire,
    marquerSortie,
    supprimerLocataire,
    obtenirLocataire,
    
    // Utilitaires
    filtrerLocataires,
    statistiques,
  };
};