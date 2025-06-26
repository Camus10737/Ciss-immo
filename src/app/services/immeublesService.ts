// src/services/immeublesService.ts
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

// 🔍 DEBUGGING: Fonction pour logger les détails
const debugLog = (message: string, data?: any) => {
  console.log(`🏢 [ImmeublesService] ${message}`, data ? data : '');
};

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
      debugLog('Début creerImmeuble', { data });
      
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
        pays: data.pays,
        ville: data.ville,
        quartier: data.quartier,
        type: data.type,
        nombreAppartements: data.nombreAppartements,
        proprietaireActuel: proprietaire,
        historiqueProprietaires: [],
        appartements: appartements,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      debugLog('Données à sauvegarder:', immeubleData);

      const docRef = await addDoc(
        collection(db, COLLECTION_NAME),
        immeubleData
      );

      debugLog('Immeuble créé avec ID:', docRef.id);

      // Mettre à jour les appartements avec l'ID de l'immeuble
      const appartementsMisAJour = appartements.map((apt) => ({
        ...apt,
        immeubleId: docRef.id,
      }));

      await updateDoc(doc(db, COLLECTION_NAME, docRef.id), {
        appartements: appartementsMisAJour,
      });

      debugLog('Appartements mis à jour');

      return { success: true, id: docRef.id };
    } catch (error: any) {
      debugLog('❌ Erreur creerImmeuble:', error);
      return { success: false, error: error.message };
    }
  },

  // Récupérer tous les immeubles
  async obtenirImmeubles(
    filters?: FilterOptions
  ): Promise<{ success: boolean; data?: Immeuble[]; error?: string }> {
    try {
      debugLog('Début obtenirImmeubles', { filters });

      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy("createdAt", "desc")
      );

      // Appliquer les filtres
      if (filters?.ville) {
        q = query(q, where("ville", "==", filters.ville));
        debugLog('Filtre ville appliqué:', filters.ville);
      }
      if (filters?.quartier) {
        q = query(q, where("quartier", "==", filters.quartier));
        debugLog('Filtre quartier appliqué:', filters.quartier);
      }
      if (filters?.secteur) {
        q = query(q, where("secteur", "==", filters.secteur));
        debugLog('Filtre secteur appliqué:', filters.secteur);
      }
      if (filters?.type) {
        q = query(q, where("type", "==", filters.type));
        debugLog('Filtre type appliqué:', filters.type);
      }

      debugLog('Exécution de la requête...');
      const querySnapshot = await getDocs(q);
      debugLog('Requête exécutée, nombre de documents:', querySnapshot.size);

      const immeubles: Immeuble[] = [];

      querySnapshot.forEach((doc) => {
        debugLog(`Document trouvé: ${doc.id}`);
        const data = convertTimestamps(doc.data());
        immeubles.push({
          id: doc.id,
          ...data,
        } as Immeuble);
      });

      debugLog('Immeubles récupérés:', immeubles.length);
      return { success: true, data: immeubles };
    } catch (error: any) {
      debugLog('❌ Erreur obtenirImmeubles:', error);
      return { success: false, error: error.message };
    }
  },

  // 🔍 DEBUGGING: Récupérer un immeuble par ID avec logs détaillés
  async obtenirImmeuble(
    id: string
  ): Promise<{ success: boolean; data?: Immeuble; error?: string }> {
    try {
      debugLog('=== DÉBUT obtenirImmeuble ===');
      debugLog('ID demandé:', id);
      debugLog('Timestamp:', new Date().toISOString());

      // Vérifications préliminaires
      if (!id) {
        const error = 'ID immeuble manquant';
        debugLog('❌ Erreur:', error);
        return { success: false, error };
      }

      if (!db) {
        const error = 'Firebase DB non initialisé';
        debugLog('❌ Erreur:', error);
        return { success: false, error };
      }

      debugLog('✅ Firebase DB connecté:', !!db);
      debugLog('✅ Type de DB:', typeof db);
      debugLog('✅ Collection cible:', COLLECTION_NAME);

      // Créer la référence du document
      debugLog('Création de la référence document...');
      const docRef = doc(db, COLLECTION_NAME, id);
      debugLog('✅ DocRef créé:', {
        path: docRef.path,
        id: docRef.id,
        parent: docRef.parent.path
      });

      // Exécuter la requête
      debugLog('🔄 Exécution getDoc...');
      const startTime = Date.now();
      
      const docSnap = await getDoc(docRef);
      
      const endTime = Date.now();
      debugLog(`✅ getDoc terminé en ${endTime - startTime}ms`);

      // Vérifier l'existence
      debugLog('Document existe:', docSnap.exists());
      
      if (docSnap.exists()) {
        debugLog('📄 Données brutes du document:');
        const rawData = docSnap.data();
        console.log(rawData); // Log complet pour debugging
        
        debugLog('🔄 Conversion des timestamps...');
        const data = convertTimestamps(rawData);
        
        const result = { id: docSnap.id, ...data } as Immeuble;
        debugLog('✅ Immeuble final:', {
          id: result.id,
          nom: result.nom,
          ville: result.ville,
          quartier: result.quartier,
          nombreAppartements: result.nombreAppartements,
          hasAppartements: !!result.appartements,
          nbAppartements: result.appartements?.length || 0
        });

        debugLog('=== FIN obtenirImmeuble (SUCCÈS) ===');
        return { success: true, data: result };
      } else {
        debugLog('❌ Document non trouvé');
        
        // 🔍 DEBUGGING: Vérifier si d'autres documents existent
        debugLog('🔍 Vérification de la collection...');
        try {
          const allDocs = await getDocs(collection(db, COLLECTION_NAME));
          debugLog('Documents dans la collection:', allDocs.size);
          
          if (allDocs.size > 0) {
            debugLog('IDs existants:');
            allDocs.forEach(doc => {
              console.log(`- ${doc.id}`);
            });
          } else {
            debugLog('⚠️ La collection est vide !');
          }
        } catch (collectionError) {
          debugLog('❌ Erreur vérification collection:', collectionError);
        }

        debugLog('=== FIN obtenirImmeuble (ÉCHEC) ===');
        return { success: false, error: "Immeuble introuvable" };
      }
    } catch (error: any) {
      debugLog('❌ Exception dans obtenirImmeuble:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      debugLog('=== FIN obtenirImmeuble (ERREUR) ===');
      return { success: false, error: error.message };
    }
  },

  // Mettre à jour un immeuble
  async modifierImmeuble(
    id: string,
    data: Partial<ImmeubleFormData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      debugLog('Début modifierImmeuble', { id, data });

      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      await updateDoc(docRef, updateData);
      debugLog('✅ Immeuble modifié');
      return { success: true };
    } catch (error: any) {
      debugLog('❌ Erreur modifierImmeuble:', error);
      return { success: false, error: error.message };
    }
  },

  // Supprimer un immeuble
  async supprimerImmeuble(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      debugLog('Début supprimerImmeuble', { id });

      await deleteDoc(doc(db, COLLECTION_NAME, id));
      debugLog('✅ Immeuble supprimé');
      return { success: true };
    } catch (error: any) {
      debugLog('❌ Erreur supprimerImmeuble:', error);
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
      debugLog('Début obtenirVilles');

      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      debugLog('Documents pour villes:', querySnapshot.size);
      
      const villes = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.ville) {
          villes.add(data.ville);
        }
      });

      const result = Array.from(villes).sort();
      debugLog('Villes trouvées:', result);
      return { success: true, data: result };
    } catch (error: any) {
      debugLog('❌ Erreur obtenirVilles:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtenir tous les appartements disponibles (libres)
  async obtenirAppartementsDisponibles(): Promise<{
    success: boolean;
    data?: Array<{ id: string; nom: string; immeubleNom: string }>;
    error?: string;
  }> {
    try {
      debugLog('Début obtenirAppartementsDisponibles');

      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      debugLog('Documents pour appartements:', querySnapshot.size);
      
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

      debugLog('Appartements disponibles trouvés:', appartementsDisponibles.length);
      return { success: true, data: appartementsDisponibles };
    } catch (error: any) {
      debugLog('❌ Erreur obtenirAppartementsDisponibles:', error);
      return { success: false, error: error.message };
    }
  },

  // 🔍 DEBUGGING: Fonction pour diagnostiquer la base de données
  async diagnostiquerDB(): Promise<void> {
    try {
      debugLog('=== DIAGNOSTIC BASE DE DONNÉES ===');
      
      // Test de connexion
      debugLog('Test de connexion Firebase...');
      console.log('Firebase DB object:', db);
      
      // Test de lecture de la collection
      debugLog('Test lecture collection immeubles...');
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      debugLog(`Collection contient ${snapshot.size} documents`);
      
      // Lister tous les documents
      if (snapshot.size > 0) {
        debugLog('Liste des documents:');
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`- ${doc.id}:`, {
            nom: data.nom,
            ville: data.ville,
            quartier: data.quartier,
            type: data.type
          });
        });
      } else {
        debugLog('⚠️ Aucun document trouvé dans la collection !');
        
        // Suggestions de résolution
        debugLog('💡 Suggestions:');
        console.log('1. Vérifiez que des immeubles ont été créés');
        console.log('2. Vérifiez les règles de sécurité Firestore');
        console.log('3. Vérifiez la configuration Firebase');
        console.log('4. Créez un immeuble de test');
      }
      
      debugLog('=== FIN DIAGNOSTIC ===');
    } catch (error: any) {
      debugLog('❌ Erreur diagnostic:', error);
    }
  }
};