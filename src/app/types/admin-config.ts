// src/types/admin-config.ts

import { UserRole } from './user-management';

/**
 CONFIGURATION ADMIN
 */
export interface AdminConfig {
  invitationExpiryDays: number;
  maxGestionnairesPerImmeuble: number;
  requirePhoneForGestionnaire: boolean;
  autoActivateUsers: boolean;
  logRetentionDays: number;
}

/**
 VALIDATION RULES
 */
export interface ValidationRule {
  field: string;
  rule: 'required' | 'email' | 'phone' | 'minLength' | 'maxLength';
  value?: any;
  message: string;
}

export interface FormValidation {
  gestionnaire: ValidationRule[];
  invitation: ValidationRule[];
  permissions: ValidationRule[];
}

/**
  INTERFACE STATES
 */
export interface AdminPageState {
  activeTab: 'gestionnaires' | 'invitations' | 'permissions' | 'logs';
  selectedGestionnaire: string | null;
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteConfirm: boolean;
  filters: {
    status: 'all' | 'active' | 'pending' | 'inactive';
    role: UserRole | 'all';
    immeuble: string | 'all';
  };
}

/**
  DASHBOARD ADMIN STATS
 */
export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    pending: number;
    lastWeekCreated: number;
  };
  immeubles: {
    total: number;
    withGestionnaire: number;
    withoutGestionnaire: number;
  };
  invitations: {
    pending: number;
    expired: number;
    thisMonth: number;
  };
  activity: {
    todayLogins: number;
    thisWeekActions: number;
    lastActivity: Date;
  };
}

/**
  API RESPONSES
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 BULK OPERATIONS
 */
export interface BulkOperation {
  action: 'activate' | 'deactivate' | 'delete' | 'resend_invitation';
  userIds: string[];
  reason?: string;
}

export interface BulkResult {
  success: number;
  failed: number;
  errors: { userId: string; error: string }[];
}