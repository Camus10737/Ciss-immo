// src/types/locataires.ts

/**
 * LOCATAIRE - Table principale dans Firestore
 */
export interface Locataire {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone: string; // ← OBLIGATOIRE maintenant (format +224XXXXXXXX)
  dateEntree: Date;
  dateSortie?: Date; // null si locataire actuel
  finBailProbable?: Date; // Date de fin de bail prévue
  appartementId: string;
  immeubleId: string;
  userId: string; // ID du créateur (admin/gestionnaire)
  
  // Nouveaux champs pour l'auth
  hasAccount?: boolean; // Si le locataire a un compte Firebase Auth créé
  accountStatus?: 'pending' | 'active' | 'inactive';
  lastLogin?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * LOCATAIRE USER - Dans collection 'users' avec role LOCATAIRE
 */
export interface LocataireUser {
  id: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  role: 'LOCATAIRE';
  name: string; // nom + prenom
  phone: string; // téléphone pour l'auth SMS
  appartementId: string;
  immeubleId: string;
  locataireId: string; // Référence vers le document Locataire
  canUploadRecus: boolean;
  
  // Infos pour le dashboard
  dashboardData?: {
    immeubleNom: string;
    appartementNumero: string;
    proprietaireNom: string;
    gestionnaireNom?: string;
  };
}

/**
 * FORMULAIRE DE CRÉATION LOCATAIRE
 */
export interface LocataireFormData {
  nom: string;
  prenom: string;
  email?: string;
  telephone: string; // ← Maintenant obligatoire avec format +224XXXXXXXX
  dateEntree: Date;
  finBailProbable?: Date;
  appartementId: string;
  
  // Options pour l'account
  createAccount?: boolean; // Si on crée le compte immédiatement
  sendWelcomeSMS?: boolean; // Si on envoie le SMS de bienvenue
}

/**
 * HISTORIQUE DES PAIEMENTS - Pour le dashboard locataire
 */
export interface PaiementStatus {
  year: number;
  month: number;
  isPaid: boolean;
  montant?: number;
  datePaiement?: Date;
  recuUrl?: string;
  statut: 'paye' | 'impaye' | 'en_attente';
}

/**
 * DASHBOARD DATA - Ce que voit le locataire
 */
export interface LocataireDashboard {
  // Infos personnelles
  locataire: {
    nom: string;
    prenom: string;
    email?: string;
    telephone: string;
  };
  
  // Infos logement
  logement: {
    immeubleNom: string;
    appartementNumero: string;
    dateEntree: Date;
  };
  
  // Contacts
  contacts: {
    proprietaire: {
      nom: string;
      prenom: string;
      email?: string;
      telephone?: string;
    };
    gestionnaire?: {
      nom: string;
      prenom: string;
      email?: string;
      telephone?: string;
    };
  };
  
  // Historique paiements
  paiements: PaiementStatus[];
  
  // Statistiques
  stats: {
    moisPayes: number;
    moisImpayes: number;
    dernierPaiement?: Date;
  };
}

/**
 * MISE À JOUR PROFIL LOCATAIRE
 */
export interface LocataireProfileUpdate {
  email?: string;
  telephone?: string; // Si changé, doit re-vérifier par SMS
}

/**
 * FILTRES LOCATAIRES
 */
export interface LocataireFilters {
  immeuble?: string;
  quartier?: string;
  statut?: 'actif' | 'sorti' | 'tous';
  recherche?: string; // nom/prénom
  hasAccount?: boolean; // Filtrer par ceux qui ont un compte
}