// src/services/immeubleService.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Appartement,
  FilterOptions,
  Immeuble,
  ImmeubleFormData,
  Proprietaire,
} from "../types";

const COLLECTION_NAME = "immeubles";

// Utilitaire pour convertir les timestamps Firestore en dates
const convertTimestamps = (data: any): any => {
  const converted = { ...data };

  // Convertir les timestamps en dates
  if (converted.createdAt?.toDate) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt?.toDate) {
    converted.updatedAt = converted.updatedAt.toDate();
  }

  // Convertir les dates des propriétaires
  if (converted.proprietaireActuel?.dateDebut?.toDate) {
    converted.proprietaireActuel.dateDebut =
      converted.proprietaireActuel.dateDebut.toDate();
  }
  if (converted.proprietaireActuel?.dateFin?.toDate) {
    converted.proprietaireActuel.dateFin =
      converted.proprietaireActuel.dateFin.toDate();
  }

  // Convertir l'historique des propriétaires
  if (converted.historiqueProprietaires) {
    converted.historiqueProprietaires = converted.historiqueProprietaires.map(
      (prop: any) => ({
        ...prop,
        dateDebut: prop.dateDebut?.toDate
          ? prop.dateDebut.toDate()
          : prop.dateDebut,
        dateFin: prop.dateFin?.toDate ? prop.dateFin.toDate() : prop.dateFin,
      })
    );
  }

  // Convertir les appartements et leurs locataires
  if (converted.appartements) {
    converted.appartements = converted.appartements.map((apt: any) => ({
      ...apt,
      createdAt: apt.createdAt?.toDate ? apt.createdAt.toDate() : apt.createdAt,
      updatedAt: apt.updatedAt?.toDate ? apt.updatedAt.toDate() : apt.updatedAt,
      locataireActuel: apt.locataireActuel
        ? {
            ...apt.locataireActuel,
            dateEntree: apt.locataireActuel.dateEntree?.toDate
              ? apt.locataireActuel.dateEntree.toDate()
              : apt.locataireActuel.dateEntree,
            dateSortie: apt.locataireActuel.dateSortie?.toDate
              ? apt.locataireActuel.dateSortie.toDate()
              : apt.locataireActuel.dateSortie,
          }
        : undefined,
      historiqueLocataires:
        apt.historiqueLocataires?.map((loc: any) => ({
          ...loc,
          dateEntree: loc.dateEntree?.toDate
            ? loc.dateEntree.toDate()
            : loc.dateEntree,
          dateSortie: loc.dateSortie?.toDate
            ? loc.dateSortie.toDate()
            : loc.dateSortie,
        })) || [],
    }));
  }

  return converted;
};

export const immeublesService = {
  // Créer un nouvel immeuble
  async creerImmeuble(
    data: ImmeubleFormData
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const now = new Date();
      const proprietaireId = `prop_${Date.now()}`;

      // Créer les appartements vides
      const appartements: Appartement[] = [];
      for (let i = 1; i <= data.nombreAppartements; i++) {
        appartements.push({
          id: `apt_${Date.now()}_${i}`,
          numero: i.toString(),
          statut: "libre",
          historiqueLocataires: [],
          immeubleId: "", // Sera mis à jour après la création
          createdAt: now,
          updatedAt: now,
        });
      }

      const proprietaire: Proprietaire = {
        id: proprietaireId,
        nom: data.proprietaire.nom,
        prenom: data.proprietaire.prenom,
        email: data.proprietaire.email,
        telephone: data.proprietaire.telephone,
        dateDebut: now,
      };

      const immeubleData = {
        nom: data.nom,
        pays: data.pays, // <-- nouveau champ
        ville: data.ville, // <-- ville = ville
        quartier: data.quartier, // <-- quartier = quartier
        type: data.type,
        nombreAppartements: data.nombreAppartements,
        proprietaireActuel: proprietaire,
        historiqueProprietaires: [],
        appartements: appartements,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const docRef = await addDoc(
        collection(db, COLLECTION_NAME),
        immeubleData
      );

      // Mettre à jour les appartements avec l'ID de l'immeuble
      const appartementsMisAJour = appartements.map((apt) => ({
        ...apt,
        immeubleId: docRef.id,
      }));

      await updateDoc(doc(db, COLLECTION_NAME, docRef.id), {
        appartements: appartementsMisAJour,
      });

      return { success: true, id: docRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Récupérer tous les immeubles
  async obtenirImmeubles(
    filters?: FilterOptions
  ): Promise<{ success: boolean; data?: Immeuble[]; error?: string }> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy("createdAt", "desc")
      );

      // Appliquer les filtres
      if (filters?.ville) {
        q = query(q, where("ville", "==", filters.ville));
      }
      if (filters?.quartier) {
        q = query(q, where("quartier", "==", filters.quartier));
      }
      if (filters?.secteur) {
        q = query(q, where("secteur", "==", filters.secteur));
      }
      if (filters?.type) {
        q = query(q, where("type", "==", filters.type));
      }

      const querySnapshot = await getDocs(q);
      const immeubles: Immeuble[] = [];

      querySnapshot.forEach((doc) => {
        const data = convertTimestamps(doc.data());
        immeubles.push({
          id: doc.id,
          ...data,
        } as Immeuble);
      });

      return { success: true, data: immeubles };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Récupérer un immeuble par ID
  async obtenirImmeuble(
    id: string
  ): Promise<{ success: boolean; data?: Immeuble; error?: string }> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = convertTimestamps(docSnap.data());
        return {
          success: true,
          data: { id: docSnap.id, ...data } as Immeuble,
        };
      } else {
        return { success: false, error: "Immeuble introuvable" };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Mettre à jour un immeuble
  async modifierImmeuble(
    id: string,
    data: Partial<ImmeubleFormData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      await updateDoc(docRef, updateData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Supprimer un immeuble
  async supprimerImmeuble(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Obtenir les villes uniques pour les filtres
  async obtenirVilles(): Promise<{
    success: boolean;
    data?: string[];
    error?: string;
  }> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const villes = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.ville) {
          villes.add(data.ville);
        }
      });

      return { success: true, data: Array.from(villes).sort() };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, // ✅ Virgule ici

  // Obtenir tous les appartements disponibles (libres)
  async obtenirAppartementsDisponibles(): Promise<{
    success: boolean;
    data?: Array<{ id: string; nom: string; immeubleNom: string }>;
    error?: string;
  }> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const appartementsDisponibles: Array<{
        id: string;
        nom: string;
        immeubleNom: string;
      }> = [];

      querySnapshot.forEach((doc) => {
        const data = convertTimestamps(doc.data());
        const immeuble = { id: doc.id, ...data } as Immeuble;

        // Parcourir les appartements de cet immeuble
        immeuble.appartements?.forEach((apt) => {
          if (apt.statut === "libre") {
            appartementsDisponibles.push({
              id: apt.id,
              nom: `Apt ${apt.numero} - ${immeuble.nom}`,
              immeubleNom: immeuble.nom,
            });
          }
        });
      });

      return { success: true, data: appartementsDisponibles };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
