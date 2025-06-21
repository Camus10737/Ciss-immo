// src/app/dashboard/profile/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone,
  Building2,
  Save,
  ArrowLeft,
  Edit,
  AlertTriangle,
  Shield
} from "lucide-react";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";
import { UserManagementService } from "@/app/services/userManagementService";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
}

export default function ProfilePage() {
  const { user } = useAuthWithRole();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge className="bg-purple-100 text-purple-800">Super Administrateur</Badge>;
      case 'GESTIONNAIRE':
        return <Badge className="bg-blue-100 text-blue-800">Gestionnaire</Badge>;
      case 'LOCATAIRE':
        return <Badge className="bg-green-100 text-green-800">Locataire</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    // Ne permettre la modification que de l'email et du téléphone
    if (field === 'name') return; // Le nom n'est pas modifiable
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges || !user || !user.uid) return;

    setLoading(true);
    try {
      // Validation basique
      if (!formData.email.trim()) {
        toast.error("L'email est obligatoire");
        return;
      }

      // Appeler le service pour mettre à jour
      const result = await UserManagementService.updateGestionnaire(
        user.uid,
        {
          email: formData.email.trim(),
          phone: formData.phone.trim()
          // Ne pas inclure name car il n'est pas modifiable
        },
        user.uid
      );

      if (result.success) {
        toast.success("Profil mis à jour avec succès");
        setIsEditing(false);
        setHasChanges(false);
        // Recharger les données utilisateur
        window.location.reload();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
    setHasChanges(false);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Chargement du profil...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => router.back()}
            variant="outline" 
            size="sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
            <p className="text-gray-600">Gérez vos informations personnelles</p>
          </div>
        </div>
        
        {!isEditing && (
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Edit size={16} className="mr-2" />
            Modifier mes informations
          </Button>
        )}
      </div>

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl font-medium">
                {getInitials(user.name || user.email || 'User')}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{user.name || 'Nom non défini'}</CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                {getRoleBadge(user.role || 'USER')}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Utilisateur du système CISS Immobilier
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Formulaire d'informations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom complet - NON MODIFIABLE */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-500">
                Nom complet (non modifiable)
              </Label>
              <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-md border">
                <User size={16} className="text-gray-400" />
                <span className="text-gray-600">{user.name || 'Non défini'}</span>
              </div>
              <p className="text-xs text-gray-500">
                Contactez votre administrateur pour modifier votre nom
              </p>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Numéro de téléphone
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full"
                />
              ) : (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                  <Phone size={16} className="text-gray-500" />
                  <span className="text-gray-900">{user.phone || 'Non défini'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Adresse email *
            </Label>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="votre.email@example.com"
                  className="w-full"
                />
                <p className="text-xs text-orange-600 flex items-center">
                  <AlertTriangle size={12} className="mr-1" />
                  Attention : modifier votre email peut affecter votre connexion
                </p>
              </div>
            ) : (
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                <Mail size={16} className="text-gray-500" />
                <span className="text-gray-900">{user.email}</span>
              </div>
            )}
          </div>

          {/* Actions de sauvegarde */}
          {isEditing && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                {hasChanges && (
                  <p className="text-sm text-orange-600 flex items-center">
                    <AlertTriangle size={12} className="mr-1" />
                    Modifications non sauvegardées
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={loading}
                >
                  Annuler
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={loading || !hasChanges}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sauvegarde...
                    </div>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield size={20} className="text-indigo-600" />
            <span>Sécurité et accès</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium text-blue-900">Niveau d'accès</h4>
                <p className="text-sm text-blue-700 mt-1">
                  {user.role === 'SUPER_ADMIN' && "Accès administrateur complet au système"}
                  {user.role === 'GESTIONNAIRE' && "Accès gestionnaire aux immeubles assignés"}
                  {user.role === 'LOCATAIRE' && "Accès locataire à votre appartement"}
                </p>
              </div>
              {getRoleBadge(user.role || 'USER')}
            </div>
            
            <div className="text-sm text-gray-600">
              <p>• Votre compte est sécurisé et vos données sont protégées</p>
              <p>• Pour toute demande de modification de rôle, contactez votre administrateur</p>
              <p>• Connecté en tant que {(user.role || 'utilisateur').toLowerCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}