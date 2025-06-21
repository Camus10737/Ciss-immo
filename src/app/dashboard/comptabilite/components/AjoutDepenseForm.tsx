"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AjoutDepenseForm({ onSave, onClose }: { onSave: (depense: any) => void; onClose: () => void }) {
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !montant) return;
    onSave({ client, description, montant: Number(montant), date: new Date() });
    setClient("");
    setDescription("");
    setMontant("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          type="button"
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="mb-4 font-semibold text-lg">Ajouter une dépense</div>
        <div className="space-y-3">
          <div>
            <label className="block font-medium">Nom du compte de dépense</label>
            <input
              type="text"
              value={client}
              onChange={e => setClient(e.target.value)}
              className="border rounded px-2 py-1 w-full"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block font-medium">Montant (€)</label>
            <input
              type="text"
              value={montant}
              onChange={e => setMontant(e.target.value.replace(/[^0-9.,]/g, ""))}
              className="border rounded px-2 py-1 w-full"
              required
              inputMode="decimal"
              pattern="^\d+([.,]\d{1,2})?$"
              placeholder="Ex: 120"
            />
          </div>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            Ajouter la dépense
          </Button>
        </div>
      </form>
    </div>
  );
}