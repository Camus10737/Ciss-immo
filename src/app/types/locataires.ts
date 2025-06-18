export interface Locataire {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  dateEntree: Date;
  dateSortie?: Date; // null si locataire actuel
  finBailProbable?: Date; // Date de fin de bail prévue
  appartementId: string;
  userId: string; // ID du propriétaire/gestionnaire
  createdAt: Date;
  updatedAt: Date;
}

export interface LocataireFormData {
  nom: string;
  prenom: string;
  email?: string;
  telephone: string; 
  dateEntree: Date;
  finBailProbable?: Date;
  appartementId: string;
}

export interface LocataireFilters {
  immeuble?: string;
  quartier?: string;
  secteur?: string;
  statut?: 'actuel' | 'sorti' | 'tous';
}