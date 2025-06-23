// src/types/logs.ts

import { UserRole } from "./user-management";

/**
  LOGS ET HISTORIQUE
 */
export type ActionType = 
  | 'USER_CREATED'
  | 'USER_UPDATED' 
  | 'USER_DELETED'
  | 'USER_INVITED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'IMMEUBLE_ASSIGNED'
  | 'IMMEUBLE_UNASSIGNED'
  | 'PERMISSIONS_UPDATED'
  | 'LOGIN'
  | 'LOGOUT';

export interface ActivityLog {
  id: string;
  action: ActionType;
  // ID de l'utilisateur qui a fait l'action
  performedBy: string; 
  // Nom pour l'affichage
  performedByName: string; 
  targetUserId?: string; // ID de l'utilisateur cible 
  targetUserName?: string; // Nom de l'utilisateur cible
  details: {
    immeubleId?: string;
    immeubleNom?: string;
    permissionsChanged?: string[];
    oldValues?: any;
    newValues?: any;
  };
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 TOKENS 
 */
export interface InvitationToken {
  id: string;
  token: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  usedAt?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface SecurityEvent {
  id: string;
  type: 'FAILED_LOGIN' | 'SUSPICIOUS_ACTIVITY' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED_ACCESS';
  userId?: string;
  email: string;
  details: string;
  ipAddress: string;
  timestamp: Date;
}

/**
 STATISTIQUES UTILISATEURS
 */
export interface UserStats {
  totalGestionnaires: number;
  activeGestionnaires: number;
  pendingInvitations: number;
  totalImmeubles: number;
  immeublesSansGestionnaire: number;
  lastLogin: {
    [userId: string]: Date;
  };
}