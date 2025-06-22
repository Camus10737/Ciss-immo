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
  pays: string;      // <-- ajoute cette ligne
  ville: string;
  quartier: string;
  type: string;
  nombreAppartements: number;
  proprietaireActuel: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
}

export interface ImmeubleFormData {
  nom: string;
  pays: string;      // <-- ajoute cette ligne
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
