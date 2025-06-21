// src/app/dashboard/administrateur/components/ActivityLogs.tsx

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Activity, 
  User, 
  UserPlus, 
  UserMinus, 
  Settings, 
  Clock,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ActivityLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  targetUserId?: string;
  targetUserName?: string;
  details: any;
  timestamp: Date;
}

interface ActivityLogsProps {
  refreshKey: number;
}

export function ActivityLogs({ refreshKey }: ActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Charger les logs
  const loadLogs = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as ActivityLog;
      });

      setLogs(logsData);
      console.log('📋 Logs chargés:', logsData);
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [refreshKey]);

  // Filtrer les logs selon le terme de recherche
  const filteredLogs = logs.filter(log => 
    log.performedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.targetUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_CREATED':
        return <UserPlus size={16} className="text-green-600" />;
      case 'USER_UPDATED':
        return <Settings size={16} className="text-blue-600" />;
      case 'USER_DELETED':
        return <UserMinus size={16} className="text-red-600" />;
      case 'USER_ACTIVATED':
        return <User size={16} className="text-green-600" />;
      case 'USER_DEACTIVATED':
        return <User size={16} className="text-orange-600" />;
      default:
        return <Activity size={16} className="text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'USER_CREATED':
        return <Badge className="bg-green-100 text-green-800">Création</Badge>;
      case 'USER_UPDATED':
        return <Badge className="bg-blue-100 text-blue-800">Modification</Badge>;
      case 'USER_DELETED':
        return <Badge className="bg-red-100 text-red-800">Suppression</Badge>;
      case 'USER_ACTIVATED':
        return <Badge className="bg-green-100 text-green-800">Activation</Badge>;
      case 'USER_DEACTIVATED':
        return <Badge className="bg-orange-100 text-orange-800">Désactivation</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getActionDescription = (log: ActivityLog) => {
    switch (log.action) {
      case 'USER_CREATED':
        return `a créé le gestionnaire ${log.targetUserName || 'inconnu'}`;
      case 'USER_UPDATED':
        return `a modifié le gestionnaire ${log.targetUserName || 'inconnu'}`;
      case 'USER_DELETED':
        return `a supprimé le gestionnaire ${log.targetUserName || 'inconnu'}`;
      case 'USER_ACTIVATED':
        return `a activé le gestionnaire ${log.targetUserName || 'inconnu'}`;
      case 'USER_DEACTIVATED':
        return `a désactivé le gestionnaire ${log.targetUserName || 'inconnu'}`;
      default:
        return `a effectué l'action ${log.action}`;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Historique des activités</h3>
          <Button size="sm" disabled>
            <RefreshCw size={16} className="mr-2 animate-spin" />
            Chargement...
          </Button>
        </div>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <RefreshCw size={48} className="mx-auto text-gray-400 mb-4 animate-spin" />
          <p className="text-gray-600">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Historique des activités</h3>
          <Button size="sm" onClick={loadLogs} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            Actualiser
          </Button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Activity size={48} className="mx-auto text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Aucune activité
          </h4>
          <p className="text-gray-600">
            L'historique des actions apparaîtra ici
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec recherche */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Historique des activités ({filteredLogs.length})
          </h3>
          <p className="text-sm text-gray-600">
            Toutes les actions effectuées sur la plateforme
          </p>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" onClick={loadLogs} variant="outline">
            <RefreshCw size={16} className="mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Rechercher dans l'historique..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste des logs */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  {/* Avatar de l'utilisateur qui a fait l'action */}
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600">
                      {getInitials(log.performedByName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getActionIcon(log.action)}
                        <span className="font-medium text-gray-900">
                          {log.performedByName || 'Utilisateur inconnu'}
                        </span>
                        <span className="text-gray-600">
                          {getActionDescription(log)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getActionBadge(log.action)}
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock size={12} className="mr-1" />
                          {formatTime(log.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Détails supplémentaires */}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {log.details.email && (
                          <span className="mr-4">
                            📧 {log.details.email}
                          </span>
                        )}
                        {log.details.role && (
                          <span className="mr-4">
                            👤 {log.details.role}
                          </span>
                        )}
                        {log.details.immeubles && Array.isArray(log.details.immeubles) && (
                          <span className="mr-4">
                            🏢 {log.details.immeubles.length} immeuble(s)
                          </span>
                        )}
                        {log.details.updatedFields && Array.isArray(log.details.updatedFields) && (
                          <span className="mr-4">
                            ✏️ Champs modifiés: {log.details.updatedFields.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer avec info */}
      {filteredLogs.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Affichage des {filteredLogs.length} activités les plus récentes
          {searchTerm && ` (filtrées par "${searchTerm}")`}
        </div>
      )}
    </div>
  );
}