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
  telephone?: string;
  dateEntree: Date;
  dateSortie?: Date; // null si locataire actuel
  finBailProbable?: Date; // Date de fin de bail prévue - AJOUTÉ
  appartementId: string;
  userId: string; // ID du propriétaire/gestionnaire - AJOUTÉ
  createdAt: Date; // AJOUTÉ
  updatedAt: Date; // AJOUTÉ
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

export interface Immeuble {
  id: string;
  nom: string;
  ville: string;
  quartier: string;
  secteur: string;
  type: 'habitation' | 'commercial' | 'mixte';
  nombreAppartements: number;
  proprietaireActuel: Proprietaire;
  historiqueProprietaires: Proprietaire[];
  appartements: Appartement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ImmeubleFormData {
  nom: string;
  ville: string;
  quartier: string;
  secteur: string;
  type: 'habitation' | 'commercial' | 'mixte';
  nombreAppartements: number;
  proprietaire: {
    nom: string;
    prenom: string;
    email?: string;
    telephone?: string;
  };
}

export interface FilterOptions {
  ville?: string;
  quartier?: string;
  secteur?: string;
  type?: 'habitation' | 'commercial' | 'mixte';
}
export interface LocataireFormData {
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  dateEntree: Date;
  finBailProbable?: Date;
  appartementId: string;
}

export interface LocataireFilters {
  immeuble?: string;
  quartier?: string;
  secteur?: string;
  statut?: 'actif' | 'sorti' | 'tous';
  recherche?: string;
}