export interface RecuPaiement {
  id: string;
  locataireId: string;
  appartementId: string;
  moisPayes: number;
  fichierUrl: string;
  statut: "en_attente" | "valide" | "refuse";
  moisArray?: { year: number; month: number }[]; // <-- ajoute cette ligne
  moisPayesArray?: { year: number; month: number }[]; // <-- si tu veux la compatibilité
  montant?: number;
  description?: string;
  commentaire?: string;
  createdAt: Date;
  updatedAt: Date;
}
