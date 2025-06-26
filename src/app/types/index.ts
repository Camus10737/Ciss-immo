// src/types/index.ts
export interface Proprietaire {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  dateDebut: Date;
  dateFin?: Date; // null si propriétaire actuel
}

export interface Locataire {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone: string;
  dateEntree: Date;
  dateSortie?: Date; // null si locataire actuel
  finBailProbable?: Date; // Date de fin de bail prévue - AJOUTÉ
  appartementId: string;
  userId: string; // ID du propriétaire/gestionnaire - AJOUTÉ
  createdAt: Date;
  updatedAt: Date;
  hasAccount?: boolean; // Si le locataire a un compte créé
  accountStatus?: 'pending' | 'active' | 'inactive';
}

export interface Appartement {
  id: string;
  numero: string;
  statut: 'occupe' | 'libre';
  locataireActuel?: Locataire;
  historiqueLocataires: Locataire[];
  immeubleId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 🔧 CORRECTION: Interface Immeuble complète
export interface Immeuble {
  id: string;
  nom: string;
  pays: string;
  ville: string;
  quartier: string;
  type: string;
  nombreAppartements: number;
  
  // 🔧 AJOUT: Propriétaire actuel complet
  proprietaireActuel: Proprietaire;
  
  // 🔧 AJOUT: Historique des propriétaires
  historiqueProprietaires: Proprietaire[];
  
  // 🔧 AJOUT: Liste des appartements (était manquant !)
  appartements: Appartement[];
  
  // 🔧 AJOUT: Dates de création/modification
  createdAt: Date;
  updatedAt: Date;
}

export interface ImmeubleFormData {
  nom: string;
  pays: string;
  ville: string;
  quartier: string;
  type: string;
  nombreAppartements: number;
  proprietaire: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
}

export interface FilterOptions {
  ville?: string;
  quartier?: string;
  secteur?: string;
  type?: 'habitation' | 'commercial' | 'mixte';
}