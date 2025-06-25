"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvitationService } from "@/app/services/invitationService";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { AssignImmeublesToAdmin } from "./AssignImmeublesToAdmin";
import { Shield, Plus, Mail, Phone, Building2, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users } from "lucide-react";

export default function AjouterAdminForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Pour la liste des admins
  const [admins, setAdmins] = useState<any[]>([]);
  const [refreshAdmins, setRefreshAdmins] = useState(0);

  // Pour l'assignation immeubles
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

  // Pour afficher/masquer le formulaire d'ajout
  const [showAddForm, setShowAddForm] = useState(false);

  // Pour la liste de tous les immeubles (id + nom)
  const [immeublesAll, setImmeublesAll] = useState<{ id: string; nom: string }[]>([]);

  // Barre de recherche
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAdmins = async () => {
      const snap = await getDocs(collection(db, "users"));
      const adminsList = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === "ADMIN");
      setAdmins(adminsList);
    };
    fetchAdmins();
  }, [refreshAdmins]);

  // Récupère tous les immeubles pour afficher leur nom
  useEffect(() => {
    const fetchImmeubles = async () => {
      const snap = await getDocs(collection(db, "immeubles"));
      setImmeublesAll(
        snap.docs.map(doc => ({
          id: doc.id,
          nom: doc.data().nom || doc.id,
        }))
      );
    };
    fetchImmeubles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !phone) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      const targetData: { name: string; phone: string } = { name, phone };

      const result = await InvitationService.createInvitation({
        email,
        role: "ADMIN",
        targetData,
        invitedBy: "SUPER_ADMIN",
      });

      if (result.success) {
        const token = result.invitation?.token;
        if (!token) {
          toast.error("Le token d'invitation est manquant.");
          setLoading(false);
          return;
        }

        const emailRes = await fetch("/api/send-invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            token,
            role: "ADMIN",
            name,
          }),
        });

        if (!emailRes.ok) {
          toast.error("Erreur lors de l'envoi de l'email d'invitation.");
          setLoading(false);
          return;
        }

        toast.success(
          `Administrateur ${name} invité avec succès. Un email a été envoyé.`
        );
        setEmail("");
        setName("");
        setPhone("");
        setShowAddForm(false);
        setRefreshAdmins(val => val + 1);
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Une erreur inattendue s'est produite");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des admins selon la recherche (nom ou email)
  const adminsFiltered = admins.filter(admin =>
    admin.name?.toLowerCase().includes(search.toLowerCase()) ||
    admin.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Bouton pour ouvrir le formulaire d'ajout */}
      {!showAddForm && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={18} className="mr-2" />
            Ajouter un administrateur
          </Button>
        </div>
      )}

      {/* Formulaire d'ajout d'admin dans une carte */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow p-6 max-w-lg mx-auto mb-8 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-700">
              <Shield className="text-blue-600" size={20} />
              Inviter un administrateur
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-blue-600"
            >
              ✕
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-name">Nom *</Label>
              <Input
                id="admin-name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="admin-email">Email *</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="admin-phone">Téléphone *</Label>
              <Input
                id="admin-phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? "Ajout..." : "Inviter l'administrateur"}
            </Button>
          </form>
        </div>
      )}

      {/* Liste des admins */}
      <div className="bg-white rounded-xl shadow p-6 border border-blue-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
            <Shield className="text-blue-600" size={18} />
            Liste des administrateurs
          </h3>
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border rounded-md text-sm"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminsFiltered.length === 0 ? (
            <div className="col-span-full text-center text-blue-500 py-8">
              <Users size={48} className="mx-auto text-blue-200 mb-4" />
              <div className="text-lg font-medium mb-2">Aucun administrateur</div>
              <div>
                {search
                  ? "Aucun administrateur ne correspond à votre recherche."
                  : "Ajoutez un administrateur pour commencer."}
              </div>
            </div>
          ) : (
            adminsFiltered.map(admin => (
              <Card key={admin.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {admin.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || "AD"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{admin.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setShowAssignModal(true);
                          }}
                        >
                          <Building2 size={16} className="mr-2" />
                          Assigner des immeubles
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Ajoute ici d'autres actions si besoin */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Contact */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-blue-800">
                      <Mail size={14} />
                      <span>{admin.email}</span>
                    </div>
                    {admin.phone && (
                      <div className="flex items-center space-x-2 text-sm text-blue-800">
                        <Phone size={14} />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                  </div>
                  {/* Immeubles assignés */}
                  <div>
                    <div className="flex items-center space-x-2 text-sm font-medium text-blue-900 mb-2">
                      <Building2 size={14} />
                      <span>Immeubles assignés ({admin.immeubles_assignes?.length || 0})</span>
                    </div>
                    {admin.immeubles_assignes && admin.immeubles_assignes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {admin.immeubles_assignes.slice(0, 3).map((im: any, index: number) => {
                          const immeubleNom = immeublesAll.find(i => i.id === im.id)?.nom || im.id;
                          return (
                            <Badge key={im.id} variant="outline" className="text-xs">
                              {immeubleNom}
                            </Badge>
                          );
                        })}
                        {admin.immeubles_assignes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{admin.immeubles_assignes.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-blue-500">Aucun immeuble assigné</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal d'assignation */}
      {showAssignModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative border border-blue-200">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-blue-600"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedAdmin(null);
                setRefreshAdmins(val => val + 1);
              }}
            >
              ✕
            </button>
            <AssignImmeublesToAdmin
              adminId={selectedAdmin.id}
              immeublesAssignes={selectedAdmin.immeubles_assignes || []}
              onClose={() => {
                setShowAssignModal(false);
                setSelectedAdmin(null);
                setRefreshAdmins(val => val + 1);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}