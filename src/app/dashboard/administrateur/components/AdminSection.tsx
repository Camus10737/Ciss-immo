// src/app/dashboard/administrateur/components/AdminSection.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Users,
  Mail,
  Shield,
  Activity,
  RefreshCw,
  UserPlus,
  AlertCircle
} from "lucide-react";
import { CreateGestionnaireModal } from "./CreateGestionnaireModal";
import { GestionnairesList } from "./GestionnairesList";
import { ActivityLogs } from "./ActivityLogs";
import { PermissionsManager } from "./PermissionsManager";

type AdminTab = 'gestionnaires' | 'invitations' | 'permissions' | 'logs';

export function AdminSection() {
  const [activeTab, setActiveTab] = useState<AdminTab>('gestionnaires');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header avec stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Gestionnaires</p>
                <p className="text-2xl font-bold text-blue-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Mail size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Invitations</p>
                <p className="text-2xl font-bold text-orange-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Immeubles</p>
                <p className="text-2xl font-bold text-green-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Actions</p>
                <p className="text-2xl font-bold text-purple-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section principale avec onglets */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-2xl text-gray-900 flex items-center">
              <Shield size={24} className="mr-3 text-indigo-600" />
              Administration
            </CardTitle>
            <p className="text-gray-600 mt-1">
              Gérez les utilisateurs, permissions et surveillez l'activité
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw size={16} className="mr-2" />
            Actualiser
          </Button>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="gestionnaires" className="flex items-center space-x-2">
                <Users size={18} />
                <span>Gestionnaires</span>
              </TabsTrigger>
              <TabsTrigger value="invitations" className="flex items-center space-x-2">
                <Mail size={18} />
                <span>Invitations</span>
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center space-x-2">
                <Shield size={18} />
                <span>Permissions</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center space-x-2">
                <Activity size={18} />
                <span>Historique</span>
              </TabsTrigger>
            </TabsList>

            {/* Contenu des onglets */}
            <TabsContent value="gestionnaires" className="mt-0">
              <GestionnairesList 
                onCreateClick={() => setShowCreateModal(true)}
                refreshKey={refreshKey}
              />
            </TabsContent>

            <TabsContent value="invitations" className="mt-0">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Invitations en cours
                </h3>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Mail size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune invitation en cours
                  </h4>
                  <p className="text-gray-600">
                    Les invitations envoyées apparaîtront ici
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="mt-0">
              <PermissionsManager refreshKey={refreshKey} />
            </TabsContent>

            <TabsContent value="logs" className="mt-0">
              <ActivityLogs refreshKey={refreshKey} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer avec informations */}
      <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-start space-x-3">
          <AlertCircle size={20} className="text-indigo-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-indigo-900 font-semibold mb-2">
              💡 Conseils d'administration
            </h3>
            <ul className="text-indigo-800 space-y-1 text-sm">
              <li>• Assignez les gestionnaires aux immeubles spécifiques pour un contrôle précis</li>
              <li>• Configurez les permissions par immeuble selon les responsabilités</li>
              <li>• Consultez régulièrement l'historique pour surveiller l'activité</li>
              <li>• Renvoyez les invitations expirées si nécessaire</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de création */}
      <CreateGestionnaireModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}