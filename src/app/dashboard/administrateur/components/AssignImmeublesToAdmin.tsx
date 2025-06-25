import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface AssignImmeublesToAdminProps {
  adminId: string;
  immeublesAssignes: { id: string }[];
  onClose?: () => void;
}

export function AssignImmeublesToAdmin({ adminId, immeublesAssignes, onClose }: AssignImmeublesToAdminProps) {
  const [immeubles, setImmeubles] = useState<{ id: string; nom: string }[]>([]);
  const [selected, setSelected] = useState<string[]>(immeublesAssignes?.map((im) => im.id) || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchImmeubles = async () => {
      // Récupère tous les immeubles
      const immeublesSnap = await getDocs(collection(db, "immeubles"));
      const allImmeubles = immeublesSnap.docs.map(doc => ({ id: doc.id, nom: doc.data().nom || doc.id }));

      // Récupère tous les admins pour savoir quels immeubles sont déjà assignés
      const usersSnap = await getDocs(collection(db, "users"));
      const admins = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === "ADMIN");

      // Liste des ids d'immeubles déjà assignés à d'autres admins
      const assignedImmeubleIds = new Set<string>();
      admins.forEach(admin => {
        if (admin.id !== adminId && Array.isArray(admin.immeubles_assignes)) {
          admin.immeubles_assignes.forEach((im: any) => assignedImmeubleIds.add(im.id));
        }
      });

      // On garde les immeubles non assignés OU déjà assignés à cet admin
      const assignables = allImmeubles.filter(
        im => !assignedImmeubleIds.has(im.id) || selected.includes(im.id)
      );

      setImmeubles(assignables);
    };
    fetchImmeubles();
    // eslint-disable-next-line
  }, [adminId, selected]);

  const handleToggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    await updateDoc(doc(db, "users", adminId), {
      immeubles_assignes: selected.map(id => ({ id })),
    });
    setLoading(false);
    if (onClose) onClose();
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">Immeubles assignés</h3>
      <div className="space-y-2 mb-4">
        {immeubles.length === 0 && (
          <div className="text-sm text-gray-500">Aucun immeuble disponible</div>
        )}
        {immeubles.map(im => (
          <label key={im.id} className="flex items-center space-x-2">
            <Checkbox
              checked={selected.includes(im.id)}
              onCheckedChange={() => handleToggle(im.id)}
            />
            <span>{im.nom}</span>
          </label>
        ))}
      </div>
      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </div>
  );
}