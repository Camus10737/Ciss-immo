import { useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Gestionnaire, LocataireUser, SuperAdmin, UserRole } from '@/app/types/user-management';

// Type utilisateur étendu avec rôle et permissions
export interface ExtendedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  role?: UserRole;
  name?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'pending';
  immeubles_assignes?: string[];
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
            invitedAt: userData.invitedAt?.toDate(),
            lastLogin: userData.lastLogin?.toDate()
          } as SuperAdmin | Gestionnaire | LocataireUser
        };
      } else {
        // Utilisateur Firebase Auth mais pas dans Firestore
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
      if (firebaseUser) {
        const extendedUser = await fetchUserData(firebaseUser);
        setUser(extendedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
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
  const isAdmin = () => user?.role === 'SUPER_ADMIN';
  const isGestionnaire = () => user?.role === 'GESTIONNAIRE';
  const isLocataire = () => user?.role === 'LOCATAIRE';
  const hasRole = (role: UserRole) => user?.role === role;

  // Helpers pour les permissions
  const canAccessImmeuble = (immeubleId: string) =>
    !!user?.immeubles_assignes?.includes(immeubleId);

  const canAccessComptabilite = (immeubleId: string) =>
    !!user?.permissions_supplementaires?.[immeubleId]?.comptabilite?.read;

  const canWriteComptabilite = (immeubleId: string) =>
    !!user?.permissions_supplementaires?.[immeubleId]?.comptabilite?.write;

  const canAccessStatistiques = (immeubleId: string) =>
    !!user?.permissions_supplementaires?.[immeubleId]?.statistiques?.read;

  const canDeleteImmeuble = (immeubleId: string) =>
    !!user?.permissions_supplementaires?.[immeubleId]?.delete_immeuble;

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
    canDeleteImmeuble
  };
}