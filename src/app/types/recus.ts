export interface RecuPaiement {
  id: string;
  locataireId: string;
  appartementId: string;
  moisPayes: number;
  fichierUrl: string;
  statut: "en_attente" | "valide" | "refuse";
  montant?: number;        
  description?: string;     
  commentaire?: string;
  createdAt: Date;
  updatedAt: Date;
}