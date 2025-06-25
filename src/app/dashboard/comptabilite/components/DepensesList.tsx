"use client";
import { useEffect, useState } from "react";
import { recuService } from "@/app/services/recusService";
import { getLocataireById } from "@/app/services/locatairesService";
import { RecuPaiement } from "@/app/types/recus";
import { depensesService } from "@/app/services/depensesService";
import { addDays, format, isAfter, isBefore, isEqual } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fr } from "date-fns/locale";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";

interface DepenseManuelle {
  client: string;
  description?: string;
  montant: number;
  date: Date;
  immeubleId?: string;
}

type DateRange = {
  from?: Date;
  to?: Date;
};

export function DepensesList({ refresh = 0, immeubleId }: { refresh?: number; immeubleId?: string }) {
  const [recus, setRecus] = useState<RecuPaiement[]>([]);
  const [locataireNames, setLocataireNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [depensesFirestore, setDepensesFirestore] = useState<DepenseManuelle[]>([]);

  // Recherche et filtres
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [montantFilter, setMontantFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [openDatePopover, setOpenDatePopover] = useState(false);

  // Permissions et immeubles accessibles
  const { isSuperAdmin, immeublesAssignes } = useAuthWithRole();
  const immeublesAutorises = isSuperAdmin()
    ? undefined
    : (immeublesAssignes?.map(im => String(im.id)) || []);

  // Recharge les dépenses Firestore à chaque changement de refresh
  useEffect(() => {
    const fetchDepenses = async () => {
      const depenses = await depensesService.getDepenses();
      setDepensesFirestore(depenses);
    };
    fetchDepenses();
  }, [refresh]);

  useEffect(() => {
    const fetchRecus = async () => {
      setLoading(true);
      const allRecus = await recuService.getRecusValides();
      setRecus(allRecus);

      const names: Record<string, string> = {};
      for (const recu of allRecus) {
        if (!names[recu.locataireId]) {
          try {
            const locataire = await getLocataireById(recu.locataireId);
            names[recu.locataireId] = locataire
              ? `${locataire.prenom} ${locataire.nom}`
              : recu.locataireId;
          } catch {
            names[recu.locataireId] = recu.locataireId;
          }
        }
      }
      setLocataireNames(names);
      setLoading(false);
    };
    fetchRecus();
  }, []);

  // Correction du filtrage pour super admin ET admin
  const filteredRecus = recus.filter(recu => {
    if (isSuperAdmin()) {
      if (immeubleId) return String(recu.immeubleId) === String(immeubleId);
      return true;
    }
    if (!recu.immeubleId) return false;
    if (immeubleId) {
      return (
        String(recu.immeubleId) === String(immeubleId) &&
        immeublesAutorises.includes(String(recu.immeubleId))
      );
    }
    // SANS filtre immeuble, on veut TOUT ce qui est dans immeublesAutorises
    return immeublesAutorises.includes(String(recu.immeubleId));
  });

  const filteredDepensesFirestore = depensesFirestore.filter(dep => {
    if (isSuperAdmin()) {
      if (immeubleId) return String(dep.immeubleId) === String(immeubleId);
      return true;
    }
    if (!dep.immeubleId) return false;
    if (immeubleId) {
      return (
        String(dep.immeubleId) === String(immeubleId) &&
        immeublesAutorises.includes(String(dep.immeubleId))
      );
    }
    return immeublesAutorises.includes(String(dep.immeubleId));
  });

  // Fusionne reçus validés et dépenses Firestore
  const operations = [
    ...filteredRecus.map(recu => ({
      type: "Ressource",
      client: locataireNames[recu.locataireId] || recu.locataireId,
      montant: recu.montant ?? 0,
      description: recu.description,
      date: recu.updatedAt ? new Date(recu.updatedAt) : new Date(),
      url: recu.fichierUrl,
      immeubleId: recu.immeubleId,
    })),
    ...filteredDepensesFirestore.map(dep => ({
      type: "Dépense",
      client: dep.client,
      montant: dep.montant,
      description: dep.description,
      date: dep.date,
      url: undefined,
      immeubleId: dep.immeubleId,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Liste unique des clients/comptes pour le filtre (seulement ceux accessibles)
  const clientsList = Array.from(new Set(
    operations.map(op => op.client)
  )).sort();

  // Filtres et recherche
  const filteredOperations = operations.filter(op => {
    // Recherche globale (inclut description)
    const searchLower = search.toLowerCase();
    const matchSearch =
      !search ||
      op.client?.toLowerCase().includes(searchLower) ||
      op.type?.toLowerCase().includes(searchLower) ||
      String(op.montant).includes(searchLower) ||
      op.date?.toLocaleDateString().includes(searchLower) ||
      op.description?.toLowerCase().includes(searchLower);

    // Filtres individuels
    const matchType = typeFilter ? op.type === typeFilter : true;
    const matchClient = clientFilter ? op.client === clientFilter : true;

    // Filtre date (plage ou unique)
    let matchDate = true;
    if (dateRange?.from && dateRange?.to) {
      const d = op.date;
      const from = dateRange.from;
      const to = addDays(dateRange.to, 1); // inclure la date de fin
      matchDate = (isAfter(d, from) || isEqual(d, from)) && (isBefore(d, to));
    } else if (dateRange?.from) {
      const d = op.date;
      matchDate = d.toDateString() === dateRange.from.toDateString();
    }

    const matchMontant = montantFilter
      ? String(op.montant).includes(montantFilter)
      : true;

    return (
      matchSearch &&
      matchType &&
      matchClient &&
      matchDate &&
      matchMontant
    );
  });

  // Affichage du champ de sélection de plage de dates (shadcn/ui)
  function DateRangeFilter() {
    return (
      <Popover open={openDatePopover} onOpenChange={setOpenDatePopover}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[230px] justify-start text-left font-normal",
              !dateRange?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: fr })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: fr })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: fr })
              )
            ) : (
              <span>Filtrer par date ou plage</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
            locale={fr}
          />
          <div className="flex justify-end p-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => setOpenDatePopover(false)}
            >
              OK
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4">Tableau des opérations</h3>
      {/* Barre de recherche et filtres */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Recherche "
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Tous types</option>
          <option value="Ressource">Ressource</option>
          <option value="Dépense">Dépense</option>
        </select>
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">Tous clients/comptes</option>
          {clientsList.map(client => (
            <option key={client} value={client}>{client}</option>
          ))}
        </select>
        <DateRangeFilter />
        <input
          type="text"
          placeholder="Montant"
          value={montantFilter}
          onChange={e => setMontantFilter(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button
          type="button"
          className="border rounded px-2 py-1 bg-gray-100"
          onClick={() => {
            setSearch("");
            setTypeFilter("");
            setClientFilter("");
            setDateRange(undefined);
            setMontantFilter("");
          }}
        >
          Réinitialiser
        </button>
      </div>
      {loading && <div>Chargement...</div>}
      {!loading && filteredOperations.length > 0 && (
        <table className="min-w-full border text-sm bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-left">Date</th>
              <th className="border px-2 py-1 text-left">Client / Compte</th>
              <th className="border px-2 py-1 text-left">Type</th>
              <th className="border px-2 py-1 text-left">Montant</th>
              <th className="border px-2 py-1 text-left">Description</th>
              <th className="border px-2 py-1 text-left">Reçu</th>
            </tr>
          </thead>
          <tbody>
            {filteredOperations.map((op, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1">{op.date.toLocaleDateString()}</td>
                <td className="border px-2 py-1">{op.client}</td>
                <td className="border px-2 py-1">{op.type}</td>
                <td
                  className={`border px-2 py-1 font-medium ${
                    op.type === "Ressource" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {op.montant?.toLocaleString()} GNF
                </td>
                <td className="border px-2 py-1">{op.description || "-"}</td>
                <td className="border px-2 py-1">
                  {op.url ? (
                    <a href={op.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      Voir le fichier
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && filteredOperations.length === 0 && (
        <div className="text-gray-500 mt-4">Aucune opération trouvée.</div>)
      }
    </div>
  );
}