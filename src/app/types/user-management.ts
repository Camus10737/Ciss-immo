// src/types/user-management.ts

/**
RÔLES UTILISATEURS
 */
export type UserRole = 'SUPER_ADMIN' | 'GESTIONNAIRE' | 'LOCATAIRE';

/**
 *  PERMISSIONS GRANULAIRES
 */
export interface Permission {
  read: boolean;
  write: boolean;
  export?: boolean;
}

export interface ImmeublePermissions {
  // Permissions automatiques 
  gestion_immeuble: Permission; 
  gestion_locataires: Permission; 
  
  // Permissions manuelles 
  comptabilite: Permission;
  statistiques: { read: boolean; export: boolean }; 
  delete_immeuble: boolean; 
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
  GESTIONNAIRE 
 */
export interface Gestionnaire extends User {
  role: 'GESTIONNAIRE';
  name: string;
  phone?: string;
  
  // Immeubles assignés
  immeubles_assignes: string[]; 
  // Permissions par immeuble
  permissions_supplementaires: {
    [immeubleId: string]: ImmeublePermissions;
  };
  
  // Invitation
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
  
  // Pas de permissions, juste upload de reçus
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
    immeubles_assignes?: string[]; 
    appartementId?: string; 
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
  immeubles_assignes: string[];
  permissions_supplementaires: {
    [immeubleId: string]: {
      
      
      // Permissions manuelles (choisies par SUPER_ADMIN)
      comptabilite: { read: boolean; write: boolean; export: boolean };
      statistiques: { read: boolean; export: boolean };
      delete_immeuble: boolean;
    };
  };
}

export interface CreateLocataireUserFormData {
  name: string;
  email: string;
  appartementId: string;
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
  user: SuperAdmin | Gestionnaire | LocataireUser;
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
  ASSIGNATION D'IMMEUBLES
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