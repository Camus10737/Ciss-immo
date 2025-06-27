import { useState, useEffect, useCallback, useRef } from 'react';
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getLocataireByTelephone, activerCompteLocataire } from '@/app/services/locatairesService';
import { Locataire, LocataireUser } from '@/app/types/locataires';

interface AuthSMSState {
  isLoading: boolean;
  error: string | null;
  isPhoneNumberSent: boolean;
  isCodeVerified: boolean;
  confirmationResult: ConfirmationResult | null;
  locataire: Locataire | null;
  locataireUser: LocataireUser | null;
  firebaseUser: FirebaseUser | null;
  recaptchaVerifier: RecaptchaVerifier | null;
}

export const useAuthSMS = () => {
  const [state, setState] = useState<AuthSMSState>({
    isLoading: false,
    error: null,
    isPhoneNumberSent: false,
    isCodeVerified: false,
    confirmationResult: null,
    locataire: null,
    locataireUser: null,
    firebaseUser: null,
    recaptchaVerifier: null,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const hasInitializedRef = useRef(false);

  // Initialisation depuis localStorage
  useEffect(() => {
    if (hasInitializedRef.current) return;
    const initializeFromStorage = () => {
      try {
        hasInitializedRef.current = true;
        const savedLocataire = localStorage.getItem('auth_locataire');
        const savedLocataireUser = localStorage.getItem('auth_locataireUser');
        const savedIsCodeVerified = localStorage.getItem('auth_isCodeVerified');
        if (savedLocataire && savedIsCodeVerified === 'true') {
          const locataire = JSON.parse(savedLocataire);
          const locataireUser = savedLocataireUser ? JSON.parse(savedLocataireUser) : null;
          setState(prev => ({
            ...prev,
            locataire,
            locataireUser,
            isCodeVerified: true,
          }));
        }
      } catch {
        localStorage.removeItem('auth_locataire');
        localStorage.removeItem('auth_locataireUser');
        localStorage.removeItem('auth_isCodeVerified');
      } finally {
        setIsInitialized(true);
      }
    };
    initializeFromStorage();
  }, []);

  // Sauvegarde dans localStorage
  useEffect(() => {
    if (!isInitialized) return;
    if (state.locataire && state.isCodeVerified) {
      localStorage.setItem('auth_locataire', JSON.stringify(state.locataire));
      localStorage.setItem('auth_isCodeVerified', 'true');
      if (state.locataireUser) {
        localStorage.setItem('auth_locataireUser', JSON.stringify(state.locataireUser));
      }
    } else if (!state.locataire || !state.isCodeVerified) {
      localStorage.removeItem('auth_locataire');
      localStorage.removeItem('auth_locataireUser');
      localStorage.removeItem('auth_isCodeVerified');
    }
  }, [state.locataire, state.locataireUser, state.isCodeVerified, isInitialized]);

  // Ecouteur Firebase Auth
  useEffect(() => {
    if (!isInitialized) return;
    let isListenerActive = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isListenerActive) return;
      setState(prev => ({ ...prev, firebaseUser }));
    });
    return () => {
      isListenerActive = false;
      unsubscribe();
    };
  }, [isInitialized]);

  // Nettoyage du recaptcha
  useEffect(() => {
    return () => {
      if (state.recaptchaVerifier) {
        state.recaptchaVerifier.clear();
      }
    };
  }, [state.recaptchaVerifier]);

  // Formatage et validation numéro
  const formatPhoneNumber = (phone: string): string => {
    let formatted = phone.trim().replace(/\s+/g, '').replace(/[-()]/g, '');
    if (formatted.match(/^(\+1|1)?[2-9]\d{2}[2-9]\d{6}$/)) {
      const digits = formatted.replace(/^\+?1?/, '');
      if (digits.length === 10) return `+1${digits}`;
    }
    if (formatted.match(/^(\+224|224|0)?[6-7]\d{8}$/)) {
      let digits = formatted.replace(/^(\+224|224|0)/, '');
      if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
        return `+224${digits}`;
      }
    }
    if (formatted.startsWith('+224') && formatted.length === 13) return formatted;
    if (formatted.startsWith('+1') && formatted.length === 12) return formatted;
    return phone;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const guineaRegex = /^\+224[6-7]\d{8}$/;
    const canadaRegex = /^\+1[2-9]\d{2}[0-9]\d{6}$/;
    return guineaRegex.test(phone) || canadaRegex.test(phone);
  };

  // Chargement des données locataire
  const chargerDonneesLocataire = useCallback(async (phoneNumber: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const locataire = await getLocataireByTelephone(phoneNumber);
      if (!locataire) {
        setState(prev => ({
          ...prev,
          error: "Aucun compte locataire trouvé pour ce numéro",
          isLoading: false,
          isCodeVerified: false,
        }));
        return;
      }
      let locataireWithId = { ...locataire };
      if (!locataireWithId.id && locataireWithId.userId) {
        locataireWithId.id = locataireWithId.userId;
      }
      const locataireUser = await getLocataireUserByLocataireId(locataireWithId.id);
      setState(prev => ({
        ...prev,
        locataire: locataireWithId,
        locataireUser,
        isLoading: false,
        isCodeVerified: true,
      }));
      if (locataireWithId.accountStatus === 'pending') {
        await activerCompteLocataire(locataireWithId.id);
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
        isCodeVerified: false,
      }));
    }
  }, []);

  // Récupération du user locataire
  const getLocataireUserByLocataireId = async (locataireId: string): Promise<LocataireUser | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', locataireId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: userDoc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        } as LocataireUser;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Initialisation du recaptcha (toujours un nouveau à chaque envoi)
  const initialiserRecaptcha = useCallback(() => {
    if (state.recaptchaVerifier) {
      state.recaptchaVerifier.clear();
    }
    try {
      const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'normal',
        callback: () => {},
        'expired-callback': () => {
          setState(prev => ({
            ...prev,
            error: 'Captcha expiré, veuillez réessayer'
          }));
        }
      }, auth);
      setState(prev => ({ ...prev, recaptchaVerifier }));
      return recaptchaVerifier;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: 'Erreur initialisation captcha: ' + error.message
      }));
      return null;
    }
  }, [state.recaptchaVerifier]);

  // Envoyer le code SMS (toujours un nouveau recaptcha)
  const envoyerCodeSMS = useCallback(async (phoneNumber: string) => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        isPhoneNumberSent: false,
      }));

      const formattedPhone = formatPhoneNumber(phoneNumber);
      if (!validatePhoneNumber(formattedPhone)) {
        throw new Error('Format invalide. Utilisez +224XXXXXXXXX (Guinée) ou +1XXXXXXXXXX (Canada)');
      }

      // Toujours créer un nouveau recaptchaVerifier
      const recaptchaVerifier = initialiserRecaptcha();
      if (!recaptchaVerifier) {
        throw new Error('Impossible d\'initialiser le captcha');
      }

      // Attendre que le widget soit prêt
      await recaptchaVerifier.render();

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier
      );

      setState(prev => ({
        ...prev,
        confirmationResult,
        isPhoneNumberSent: true,
        isLoading: false,
      }));

      return { success: true, formattedPhone };

    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 'auth/billing-not-enabled') {
        errorMessage = 'Facturation non activée. Ajoutez un compte de facturation à Firebase.';
      }
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      return { success: false, error: errorMessage };
    }
  }, [initialiserRecaptcha, formatPhoneNumber, validatePhoneNumber]);

  // Vérification du code SMS (charge le locataire après auth)
  const verifierCodeSMS = useCallback(async (code: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (!state.confirmationResult) {
        throw new Error('Aucun code en attente de vérification');
      }

      let result;
      try {
        result = await state.confirmationResult.confirm(code);
      } catch (err) {
        throw err;
      }

      if (result.user && result.user.phoneNumber) {
        await chargerDonneesLocataire(result.user.phoneNumber);
        setState(prev => ({
          ...prev,
          isCodeVerified: true,
          firebaseUser: result.user,
          isLoading: false
        }));
        return { success: true, user: result.user };
      }

      throw new Error('Échec de la vérification');

    } catch (error: any) {
      let errorMessage = 'Code incorrect ou expiré';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Code de vérification incorrect';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Code expiré, demandez un nouveau code';
      } else if (error.message) {
        errorMessage = error.message;
      }
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      return { success: false, error: errorMessage };
    }
  }, [state.confirmationResult, chargerDonneesLocataire]);

  // Renvoyer le code SMS
  const renvoyerCodeSMS = useCallback(async () => {
    if (state.locataire?.telephone) {
      setState(prev => ({
        ...prev,
        isPhoneNumberSent: false,
        confirmationResult: null,
        error: null
      }));
      return await envoyerCodeSMS(state.locataire.telephone);
    }
    return { success: false, error: 'Numéro de téléphone manquant' };
  }, [state.locataire?.telephone, envoyerCodeSMS]);

  // Déconnexion
  const deconnexion = useCallback(async () => {
    try {
      localStorage.removeItem('auth_locataire');
      localStorage.removeItem('auth_locataireUser');
      localStorage.removeItem('auth_isCodeVerified');
      await signOut(auth);
      if (state.recaptchaVerifier) {
        state.recaptchaVerifier.clear();
      }
      setState({
        isLoading: false,
        error: null,
        isPhoneNumberSent: false,
        isCodeVerified: false,
        confirmationResult: null,
        locataire: null,
        locataireUser: null,
        firebaseUser: null,
        recaptchaVerifier: null,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [state.recaptchaVerifier]);

  // Mise à jour du profil locataire
  const mettreAJourProfil = useCallback(async (updates: { email?: string; telephone?: string }) => {
    try {
      if (!state.locataire) {
        throw new Error('Aucun locataire connecté');
      }
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const locataireRef = doc(db, 'locataires', state.locataire.id);
      const updateData: any = {
        updatedAt: Timestamp.now(),
      };
      if (updates.email) updateData.email = updates.email;
      if (updates.telephone) {
        updateData.telephone = updates.telephone;
        updateData.accountStatus = 'pending';
      }
      await updateDoc(locataireRef, updateData);
      if (state.firebaseUser?.phoneNumber) {
        await chargerDonneesLocataire(state.firebaseUser.phoneNumber);
      }
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
      return { success: false, error: error.message };
    }
  }, [state.locataire, state.firebaseUser, chargerDonneesLocataire]);

  // Helpers d'auth
  const isAuthenticated = useCallback(() => {
    return !!(state.locataire && state.isCodeVerified);
  }, [state.locataire, state.isCodeVerified]);

  const canUploadRecus = useCallback(() => {
    return state.locataireUser?.canUploadRecus || false;
  }, [state.locataireUser]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    isPhoneNumberSent: state.isPhoneNumberSent,
    isCodeVerified: state.isCodeVerified,
    isInitialized,
    locataire: state.locataire,
    locataireUser: state.locataireUser,
    firebaseUser: state.firebaseUser,
    envoyerCodeSMS,
    verifierCodeSMS,
    renvoyerCodeSMS,
    deconnexion,
    mettreAJourProfil,
    isAuthenticated,
    canUploadRecus,
    initialiserRecaptcha,
  };
};