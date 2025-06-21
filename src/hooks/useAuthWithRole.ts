// hooks/useAuthWithRole.ts
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

// Type utilisateur étendu avec rôle
export interface ExtendedUser {
  // Données Firebase Auth
  uid: string;
  email: string | null;
  emailVerified: boolean;
  
  // Données Firestore
  role?: UserRole;
  name?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'pending';
  
  // Données spécifiques selon le rôle
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

  // Écoute les changements d'état d'authentification
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

  // Fonction pour se connecter
  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Récupérer les données étendues immédiatement
      const extendedUser = await fetchUserData(result.user);
      setUser(extendedUser);
      
      return { success: true, user: extendedUser };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Fonction pour s'inscrire
  const register = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // L'utilisateur sera créé dans Firestore via le processus d'invitation
      const extendedUser = await fetchUserData(result.user);
      setUser(extendedUser);
      
      return { success: true, user: extendedUser };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Fonction pour se déconnecter
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Fonction pour rafraîchir les données utilisateur
  const refreshUserData = async () => {
    if (auth.currentUser) {
      setLoading(true);
      const extendedUser = await fetchUserData(auth.currentUser);
      setUser(extendedUser);
      setLoading(false);
    }
  };

  // Fonctions utilitaires pour vérifier les permissions
  const isAdmin = () => user?.role === 'SUPER_ADMIN';
  const isGestionnaire = () => user?.role === 'GESTIONNAIRE';
  const isLocataire = () => user?.role === 'LOCATAIRE';
  
  const hasRole = (role: UserRole) => user?.role === role;

  return {
    user,
    loading,
    login,
    register,
    logout,
    refreshUserData,
    
    // Fonctions utilitaires
    isAdmin,
    isGestionnaire,
    isLocataire,
    hasRole
  };
}