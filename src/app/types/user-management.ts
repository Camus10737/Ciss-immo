/**
RÔLES UTILISATEURS
 */
// Ajout du rôle ADMIN
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'GESTIONNAIRE' | 'LOCATAIRE';

/**
 *  PERMISSIONS GRANULAIRES
 */
export interface Permission {
  read: boolean;
  write: boolean;
  export?: boolean;
}

export interface ImmeublePermissions {
  gestion_immeuble: Permission;
  gestion_locataires: Permission;
  comptabilite: { read: boolean; write: boolean; export: boolean };
  statistiques: { read: boolean; export: boolean };
  delete_immeuble: boolean;
}

/**
 * NOUVEAU TYPE pour l'assignation d'un immeuble à un gestionnaire
 */
export interface ImmeubleAssignment {
  id: string; // id de l'immeuble
  assignedBy: string; // id de l'admin qui a assigné
}

/**
  UTILISATEUR DE BASE
 */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

/**
 SUPER ADMIN
 */
export interface SuperAdmin extends User {
  role: 'SUPER_ADMIN';
  name: string;
  phone?: string;
}

/**
  ADMIN
 */
export interface Admin extends User {
  role: 'ADMIN';
  name: string;
  phone?: string;
}

/**
  GESTIONNAIRE 
 */
export interface Gestionnaire extends User {
  role: 'GESTIONNAIRE';
  name: string;
  phone?: string;

  // Immeubles assignés (corrigé)
  immeubles_assignes: ImmeubleAssignment[];
  // Permissions par immeuble
  permissions_supplementaires: {
    [immeubleId: string]: ImmeublePermissions;
  };

  invitedBy: string;
  invitedAt: Date;
  lastLogin?: Date;
}

/**
 LOCATAIRE UTILISATEUR 
 */
export interface LocataireUser extends User {
  role: 'LOCATAIRE';
  name: string;
  appartementId: string;
  canUploadRecus: boolean;
}

/**
  INVITATION
 */
export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  targetData: {
    name: string;
    phone?: string;
    immeubles_assignes?: ImmeubleAssignment[];
    appartementId?: string;
    permissions_supplementaires?: {
      [immeubleId: string]: ImmeublePermissions;
    };
  };
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
  token: string;
}

/**
 FORMULAIRES
 */
export interface CreateGestionnaireFormData {
  name: string;
  email: string;
  phone?: string;
  immeubles_assignes: ImmeubleAssignment[];
  permissions_supplementaires: {
    [immeubleId: string]: ImmeublePermissions;
  };
}

export interface CreateLocataireUserFormData {
  name: string;
  email: string;
  appartementId: string;
}

// Ajout d'un formulaire pour créer un admin
export interface CreateAdminFormData {
  name: string;
  email: string;
  phone?: string;
}

/**
 FILTRES ET RECHERCHE
 */
export interface UserFilters {
  role?: UserRole;
  status?: 'active' | 'inactive' | 'pending';
  immeubleId?: string;
}

/**
  CONTEXTE UTILISATEUR (pour l'app)
 */
export interface UserContext {
  user: SuperAdmin | Admin | Gestionnaire | LocataireUser;
  permissions: {
    canManageUsers: boolean;
    canAccessImmeuble: (immeubleId: string) => boolean;
    canAccessComptabilite: (immeubleId: string) => boolean;
    canAccessStatistiques: (immeubleId: string) => boolean;
    canDeleteImmeuble: (immeubleId: string) => boolean;
  };
}

/**
  ÉTATS D'INTERFACE
 */
export interface UserManagementState {
  gestionnaires: Gestionnaire[];
  invitations: Invitation[];
  selectedGestionnaire: Gestionnaire | null;
  loading: boolean;
  error: string | null;
}

/**
  ASSIGNATION D'IMMEUBLES (pour affichage)
 */
export interface ImmeubleAssignmentData {
  immeubleId: string;
  immeubleNom: string;
  isAssigned: boolean;
  permissions: ImmeublePermissions;
}

export interface GestionnaireWithImmeubles extends Gestionnaire {
  immeublesList: ImmeubleAssignmentData[];
}

/**
  ACTIONS UTILISATEUR
 */
export type UserAction =
  | 'CREATE_GESTIONNAIRE'
  | 'UPDATE_GESTIONNAIRE'
  | 'DELETE_GESTIONNAIRE'
  | 'ASSIGN_IMMEUBLE'
  | 'UPDATE_PERMISSIONS'
  | 'RESEND_INVITATION'
  | 'DEACTIVATE_USER';