// src/services/logService.ts

import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  startAfter,
  DocumentSnapshot,
  writeBatch 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserManagementService } from './userManagementService';
import { ActionType, ActivityLog } from '../types/logs';

/**
 SERVICE LOGS
 */
export class LogService {
  
  /**
    Créer un log
   */
  static async createLog(data: {
    action: ActionType;
    performedBy: string;
    targetUserId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      // Récupérer le nom de l'utilisateur qui fait l'action
      const performer = await UserManagementService.getUserById(data.performedBy);
      const targetUser = data.targetUserId ? await UserManagementService.getUserById(data.targetUserId) : null;

      const logData: Omit<ActivityLog, 'id'> = {
        action: data.action,
        performedBy: data.performedBy,
        performedByName: performer?.name || 'Utilisateur inconnu',
        targetUserId: data.targetUserId,
        targetUserName: targetUser?.name,
        details: data.details || {},
        timestamp: new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      };

      await addDoc(collection(db, 'activity_logs'), {
        ...logData,
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error('Erreur création log:', error);
    }
  }

  /**
    Récupérer les logs avec pagination
   */
  static async getLogs(options?: {
    limitCount?: number;
    startAfterDoc?: DocumentSnapshot;
    filters?: {
      action?: ActionType;
      performedBy?: string;
      targetUserId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    };
  }): Promise<{
    logs: ActivityLog[];
    lastDoc?: DocumentSnapshot;
    hasMore: boolean;
  }> {
    try {
      let q = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'desc'),
        limit(options?.limitCount || 50)
      );

      // Filtres
      if (options?.filters?.action) {
        q = query(q, where('action', '==', options.filters.action));
      }

      if (options?.filters?.performedBy) {
        q = query(q, where('performedBy', '==', options.filters.performedBy));
      }

      if (options?.filters?.targetUserId) {
        q = query(q, where('targetUserId', '==', options.filters.targetUserId));
      }

      // Pagination
      if (options?.startAfterDoc) {
        q = query(q, startAfter(options.startAfterDoc));
      }

      const snapshot = await getDocs(q);
      
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as ActivityLog));

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const hasMore = snapshot.docs.length === (options?.limitCount || 50);

      return { logs, lastDoc, hasMore };

    } catch (error) {
      console.error('Erreur récupération logs:', error);
      return { logs: [], hasMore: false };
    }
  }

  /**
    Récupérer les statistiques d'activité
   */
  static async getActivityStats(userId?: string): Promise<{
    totalActions: number;
    todayActions: number;
    thisWeekActions: number;
    topActions: { action: ActionType; count: number }[];
  }> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

      let baseQuery = collection(db, 'activity_logs');
      
      // Actions d'aujourd'hui
      let todayQuery = query(
        baseQuery,
        where('timestamp', '>=', todayStart),
        orderBy('timestamp', 'desc')
      );
      
      if (userId) {
        todayQuery = query(todayQuery, where('performedBy', '==', userId));
      }

      const todaySnapshot = await getDocs(todayQuery);
      const todayActions = todaySnapshot.size;

      // Actions de la semaine
      let weekQuery = query(
        collection(db, 'activity_logs'),
        where('timestamp', '>=', weekStart),
        orderBy('timestamp', 'desc')
      );
      
      if (userId) {
        weekQuery = query(weekQuery, where('performedBy', '==', userId));
      }
      
      const weekSnapshot = await getDocs(weekQuery);
      const thisWeekActions = weekSnapshot.size;

      // Total 
      let totalQuery = query(collection(db, 'activity_logs'), limit(1000));
      
      if (userId) {
        totalQuery = query(totalQuery, where('performedBy', '==', userId));
      }
      const totalSnapshot = await getDocs(totalQuery);
      const totalActions = totalSnapshot.size;

      // Top actions 
      const actionCounts: { [key: string]: number } = {};
      totalSnapshot.docs.forEach(doc => {
        const action = doc.data().action;
        actionCounts[action] = (actionCounts[action] || 0) + 1;
      });

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action: action as ActionType, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalActions,
        todayActions,
        thisWeekActions,
        topActions
      };

    } catch (error) {
      console.error('Erreur récupération stats activité:', error);
      return {
        totalActions: 0,
        todayActions: 0,
        thisWeekActions: 0,
        topActions: []
      };
    }
  }

  /**
    Récupérer l'historique d'un utilisateur spécifique
   */
  static async getUserActivityHistory(
    userId: string,
    limitCount: number = 20
  ): Promise<ActivityLog[]> {
    try {
      const q = query(
        collection(db, 'activity_logs'),
        where('targetUserId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as ActivityLog));

    } catch (error) {
      console.error('Erreur récupération historique utilisateur:', error);
      return [];
    }
  }

  /**
    Nettoyer les anciens logs (optionnel)
   */
  static async cleanOldLogs(olderThanDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const q = query(
        collection(db, 'activity_logs'),
        where('timestamp', '<', cutoffDate),
        limit(500) 
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('Aucun log ancien à supprimer');
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`${snapshot.docs.length} logs supprimés`);

      // Si on a atteint la limite, continuer récursivement
      if (snapshot.docs.length === 500) {
        await this.cleanOldLogs(olderThanDays);
      }

    } catch (error) {
      console.error('Erreur nettoyage logs:', error);
    }
  }

  /**
    Rechercher dans les logs
   */
  static async searchLogs(searchTerm: string, limitCount: number = 50): Promise<ActivityLog[]> {
    try {
      // Cette méthode fait une recherche basique sur les noms
      const q = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'desc'),
        // Récupérer plus pour filtrer côté client
        limit(limitCount * 2) 
      );

      const snapshot = await getDocs(q);
      
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as ActivityLog));

      // Filtrage côté client (dans le futur e je vais utiliser utiliser Algolia )
      const filtered = logs.filter(log => 
        log.performedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, limitCount);

      return filtered;

    } catch (error) {
      console.error('Erreur recherche logs:', error);
      return [];
    }
  }
}