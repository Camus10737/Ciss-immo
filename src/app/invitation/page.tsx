"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function InvitationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/accept-invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      // Redirige automatiquement vers la page de login
      window.location.href = "/login";
    } else {
      setMessage(data.error || "Erreur lors de la validation.");
    }
  };

  if (!token) {
    return <div className="p-8 text-center text-red-600">Lien d’invitation invalide.</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded shadow p-8">
      <h2 className="text-2xl font-bold mb-4">Définir votre mot de passe</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          className="bg-indigo-600 text-white px-4 py-2 rounded w-full"
          disabled={loading}
        >
          {loading ? "Traitement..." : "Définir le mot de passe"}
        </button>
        {message && <div className="text-sm mt-2 text-red-600">{message}</div>}
      </form>
    </div>
  );
}