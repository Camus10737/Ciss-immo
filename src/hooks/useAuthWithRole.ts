import { useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Gestionnaire, LocataireUser, SuperAdmin, UserRole, ImmeubleAssignment } from '@/app/types/user-management';

export interface ExtendedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  role?: UserRole;
  name?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'pending';
  immeubles_assignes?: ImmeubleAssignment[];
  permissions_supplementaires?: Record<string, any>;
  userData?: SuperAdmin | Gestionnaire | LocataireUser;
}

export function useAuthWithRole() {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer les données utilisateur depuis Firestore
  const fetchUserData = async (firebaseUser: User): Promise<ExtendedUser> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          role: userData.role,
          name: userData.name,
          phone: userData.phone,
          status: userData.status,
          immeubles_assignes: userData.immeubles_assignes || [],
          permissions_supplementaires: userData.permissions_supplementaires || {},
          userData: {
            id: userDoc.id,
            ...userData,
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
            invitedAt: userData.invitedAt?.toDate?.() || undefined,
            lastLogin: userData.lastLogin?.toDate?.() || undefined
          } as SuperAdmin | Gestionnaire | LocataireUser
        };
      } else {
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          role: undefined,
          status: 'pending'
        };
      }
    } catch (error) {
      console.error('Erreur récupération données utilisateur:', error);
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        role: undefined
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const extendedUser = await fetchUserData(firebaseUser);
        setUser(extendedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, []);

  // Auth functions
  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const extendedUser = await fetchUserData(result.user);
      setUser(extendedUser);
      return { success: true, user: extendedUser };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const extendedUser = await fetchUserData(result.user);
      setUser(extendedUser);
      return { success: true, user: extendedUser };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const refreshUserData = async () => {
    if (auth.currentUser) {
      setLoading(true);
      const extendedUser = await fetchUserData(auth.currentUser);
      setUser(extendedUser);
      setLoading(false);
    }
  };

  // Helpers pour les rôles
  const isAdmin = useCallback(() => user?.role === 'SUPER_ADMIN', [user]);
  const isGestionnaire = useCallback(() => user?.role === 'GESTIONNAIRE', [user]);
  const isLocataire = useCallback(() => user?.role === 'LOCATAIRE', [user]);
  const hasRole = useCallback((role: UserRole) => user?.role === role, [user]);

  // Helpers pour les permissions (corrigé pour la nouvelle structure)
  const canAccessImmeuble = useCallback((immeubleId: string) => {
    if (user?.role === 'SUPER_ADMIN') return true;
    return !!user?.immeubles_assignes?.some((item: any) => item.id === immeubleId);
  }, [user]);

  const canAccessComptabilite = useCallback((immeubleId: string) =>
    !!user?.permissions_supplementaires?.[immeubleId]?.comptabilite?.read, [user]);

  const canWriteComptabilite = useCallback((immeubleId: string) =>
    !!user?.permissions_supplementaires?.[immeubleId]?.comptabilite?.write, [user]);

  const canAccessStatistiques = useCallback((immeubleId: string) =>
    !!user?.permissions_supplementaires?.[immeubleId]?.statistiques?.read, [user]);

  const canDeleteImmeuble = useCallback((immeubleId: string) =>
    !!user?.permissions_supplementaires?.[immeubleId]?.delete_immeuble, [user]);

  // Helper pour la permission gestion_locataires.write
  const canWriteLocataires = useCallback((immeubleId: string) => {
    if (user?.role === 'SUPER_ADMIN') return true;
    return !!user?.permissions_supplementaires?.[immeubleId]?.gestion_locataires?.write;
  }, [user]);

  return {
    user,
    loading,
    login,
    register,
    logout,
    refreshUserData,
    isAdmin,
    isGestionnaire,
    isLocataire,
    hasRole,
    // Helpers permissions
    canAccessImmeuble,
    canAccessComptabilite,
    canWriteComptabilite,
    canAccessStatistiques,
    canDeleteImmeuble,
    canWriteLocataires // <-- Ajouté ici
  };
}