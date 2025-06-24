"use client";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  token?: string;
}

interface InvitationsListProps {
  initialToken?: string;
}

export function InvitationsList({ initialToken }: InvitationsListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Invitation | null>(null);

  // Pour le formulaire de mot de passe
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/invitations")
      .then(async res => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des invitations");
        }
        return res.json();
      })
      .then(data => {
        setInvitations(data.invitations || []);
        setError(null);
      })
      .catch(err => {
        setError(err.message || "Erreur inconnue");
        setInvitations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Affiche automatiquement le détail si initialToken est fourni et correspond à une invitation
  useEffect(() => {
    if (initialToken && invitations.length > 0) {
      const found = invitations.find(inv => inv.token === initialToken);
      if (found) setSelected(found);
    }
  }, [initialToken, invitations]);

  // Gestion du formulaire de changement de mot de passe
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!selected?.token) {
      setMessage("Token d'invitation manquant.");
      return;
    }
    // Appelle ici une API route pour valider le token et changer le mot de passe
    const res = await fetch("/api/accept-invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: selected.token, password }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage("Mot de passe défini, compte activé !");
    } else {
      setMessage(data.error || "Erreur lors de la validation.");
    }
  };

  if (loading) return <div>Chargement...</div>;

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-8 text-center text-red-700">
        <h4 className="text-lg font-medium mb-2">Erreur</h4>
        <p>{error}</p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="bg-white rounded shadow p-6">
        <h4 className="text-lg font-semibold mb-2">Détail de l'invitation</h4>
        <div className="mb-2"><b>Email :</b> {selected.email}</div>
        <div className="mb-2"><b>Rôle :</b> {selected.role}</div>
        <div className="mb-2"><b>Status :</b> {selected.status}</div>
        <div className="mb-2"><b>Expire le :</b> {new Date(selected.expiresAt).toLocaleString()}</div>
        {selected.token && (
          <div className="mb-2 break-all">
            <b>Lien d’invitation :</b>{" "}
            <a
              href={`/dashboard?tab=invitations&token=${selected.token}`}
              className="text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir l’invitation
            </a>
          </div>
        )}

        {/* Formulaire de changement de mot de passe */}
        <form onSubmit={handlePasswordChange} className="mt-4 space-y-2">
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Définir le mot de passe
          </button>
          {message && <div className="text-sm mt-2">{message}</div>}
        </form>

        <button
          className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          onClick={() => setSelected(null)}
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <Mail size={48} className="mx-auto text-gray-400 mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          Aucune invitation en cours
        </h4>
        <p className="text-gray-600">
          Les invitations envoyées apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map(invite => (
        <div
          key={invite.id}
          className="p-4 bg-white rounded shadow flex justify-between items-center"
        >
          <div>
            <div className="font-semibold">{invite.email}</div>
            <div className="text-sm text-gray-500">Rôle : {invite.role}</div>
            <div className="text-xs text-gray-400">
              Expire le : {new Date(invite.expiresAt).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
              {invite.status}
            </span>
            <button
              className="ml-2 px-3 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
              onClick={() => setSelected(invite)}
            >
              Voir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}