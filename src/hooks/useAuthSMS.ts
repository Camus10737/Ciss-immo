// src/hooks/useAuthSMS.ts
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
import { 
  getLocataireByTelephone, 
  activerCompteLocataire,
  isTestNumber,
  getTestData
} from '@/app/services/locatairesService';
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
  isTestMode: boolean;
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
    isTestMode: false,
  });

  // 🔑 NOUVEAU: Flag pour éviter les chargements multiples
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 🔑 CORRECTION: Référence stable pour éviter double initialisation
  const hasInitializedRef = useRef(false);

  // 🔑 CORRECTION: Charger depuis localStorage une seule fois au démarrage
  useEffect(() => {
    // ✅ Si déjà initialisé, ne pas recommencer
    if (hasInitializedRef.current) {
      console.log('⚠️ Initialisation déjà effectuée, ignorée');
      return;
    }

    const initializeFromStorage = () => {
      try {
        console.log('🔄 Initialisation depuis localStorage...');
        hasInitializedRef.current = true; // ✅ Marquer comme initialisé immédiatement
        
        const savedLocataire = localStorage.getItem('auth_locataire');
        const savedLocataireUser = localStorage.getItem('auth_locataireUser');
        const savedIsTestMode = localStorage.getItem('auth_isTestMode');
        const savedIsCodeVerified = localStorage.getItem('auth_isCodeVerified');

        if (savedLocataire && savedIsCodeVerified === 'true') {
          const locataire = JSON.parse(savedLocataire);
          const locataireUser = savedLocataireUser ? JSON.parse(savedLocataireUser) : null;
          const isTestMode = savedIsTestMode === 'true';

          setState(prev => ({
            ...prev,
            locataire,
            locataireUser,
            isTestMode,
            isCodeVerified: true,
          }));

          console.log('✅ Session restaurée depuis localStorage');
        } else {
          console.log('📝 Aucune session sauvegardée trouvée');
        }
      } catch (error) {
        console.error('❌ Erreur restauration session:', error);
        // Nettoyer le localStorage corrompu
        localStorage.removeItem('auth_locataire');
        localStorage.removeItem('auth_locataireUser');
        localStorage.removeItem('auth_isTestMode');
        localStorage.removeItem('auth_isCodeVerified');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeFromStorage();
  }, []); // ✅ Aucune dépendance = exécuté une seule fois

  // 🔑 CORRECTION: Sauvegarder dans localStorage (sans dépendance problématique)
  useEffect(() => {
    if (!isInitialized) return; // Attendre l'initialisation

    if (state.locataire && state.isCodeVerified) {
      localStorage.setItem('auth_locataire', JSON.stringify(state.locataire));
      localStorage.setItem('auth_isCodeVerified', 'true');
      localStorage.setItem('auth_isTestMode', state.isTestMode.toString());
      
      if (state.locataireUser) {
        localStorage.setItem('auth_locataireUser', JSON.stringify(state.locataireUser));
      }
      
      console.log('💾 Session sauvegardée dans localStorage');
    } else if (!state.locataire || !state.isCodeVerified) {
      // Nettoyer le localStorage si déconnecté
      localStorage.removeItem('auth_locataire');
      localStorage.removeItem('auth_locataireUser');
      localStorage.removeItem('auth_isTestMode');
      localStorage.removeItem('auth_isCodeVerified');
    }
  }, [state.locataire, state.locataireUser, state.isCodeVerified, state.isTestMode, isInitialized]);

  // 🔑 CORRECTION: Firebase Auth State avec protection contre réinitialisation
  useEffect(() => {
    if (!isInitialized) {
      console.log('⏳ Firebase Auth: En attente d\'initialisation...');
      return; 
    }

    console.log('🔥 Configuration Firebase Auth listener...');
    
    let isListenerActive = true; // ✅ Flag pour éviter les actions après nettoyage
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isListenerActive) {
        console.log('🔥 Listener inactif, ignoré');
        return;
      }
      
      console.log('🔥 Firebase Auth State changed:', !!firebaseUser);
      
      setState(prev => ({ ...prev, firebaseUser }));
      
      // Si on a un utilisateur Firebase mais pas de locataire, charger
      if (firebaseUser && firebaseUser.phoneNumber && !state.locataire) {
        console.log('📱 Chargement données locataire pour:', firebaseUser.phoneNumber);
        await chargerDonneesLocataire(firebaseUser.phoneNumber);
      }
    });

    return () => {
      console.log('🔥 Nettoyage Firebase Auth listener');
      isListenerActive = false; // ✅ Marquer comme inactif
      unsubscribe();
    };
  }, [isInitialized]); // ✅ Seule dépendance : isInitialized

  // Formater automatiquement les numéros
  const formatPhoneNumber = (phone: string): string => {
    let formatted = phone.trim().replace(/\s+/g, '').replace(/[-()]/g, '');
    
    // Détecter et formater le Canada
    if (formatted.match(/^(\+1|1)?[2-9]\d{2}[2-9]\d{6}$/)) {
      const digits = formatted.replace(/^\+?1?/, '');
      if (digits.length === 10) {
        return `+1${digits}`;
      }
    }
    
    // Détecter et formater la Guinée
    if (formatted.match(/^(\+224|224|0)?[6-7]\d{8}$/)) {
      let digits = formatted.replace(/^(\+224|224|0)/, '');
      if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
        return `+224${digits}`;
      }
    }
    
    // Si déjà au bon format, vérifier et retourner
    if (formatted.startsWith('+224') && formatted.length === 13) {
      return formatted;
    }
    if (formatted.startsWith('+1') && formatted.length === 12) {
      return formatted;
    }
    
    return phone;
  };

  // Validation du téléphone
  const validatePhoneNumber = (phone: string): boolean => {
    const guineaRegex = /^\+224[6-7]\d{8}$/;
    const canadaRegex = /^\+1[2-9]\d{2}[0-9]\d{6}$/;
    const testCanadaRegex = /^\+16111111111$/;
    
    return guineaRegex.test(phone) || canadaRegex.test(phone) || testCanadaRegex.test(phone);
  };

  // Nettoyer le recaptcha au démontage
  useEffect(() => {
    return () => {
      if (state.recaptchaVerifier) {
        state.recaptchaVerifier.clear();
      }
    };
  }, [state.recaptchaVerifier]);

  // 🔑 CORRECTION: Charger les données du locataire (fonction stable)
  const chargerDonneesLocataire = useCallback(async (phoneNumber: string) => {
    try {
      console.log('📊 Chargement données locataire pour:', phoneNumber);
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const locataire = await getLocataireByTelephone(phoneNumber);
      if (!locataire) {
        throw new Error("Aucun compte locataire trouvé pour ce numéro");
      }

      const locataireUser = await getLocataireUserByLocataireId(locataire.id);
      
      setState(prev => ({ 
        ...prev, 
        locataire,
        locataireUser,
        isLoading: false 
      }));

      // Activer le compte si première connexion
      if (locataire.accountStatus === 'pending') {
        await activerCompteLocataire(locataire.id);
      }

      console.log('✅ Données locataire chargées');

    } catch (error: any) {
      console.error('❌ Erreur chargement locataire:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        isLoading: false 
      }));
    }
  }, []); // ✅ Pas de dépendances = fonction stable

  // Récupérer les données LocataireUser depuis Firestore
  const getLocataireUserByLocataireId = async (locataireId: string): Promise<LocataireUser | null> => {
    try {
      // Si c'est un ID de test, retourner des données de test
      if (locataireId.startsWith('test_')) {
        return {
          id: locataireId,
          email: 'test@locataire.app',
          role: 'LOCATAIRE',
          status: 'active',
          name: 'Test User',
          phone: '+224628407335',
          appartementId: 'apt_001',
          immeubleId: 'imm_001',
          locataireId: locataireId,
          canUploadRecus: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

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
    } catch (error) {
      console.error('Erreur récupération LocataireUser:', error);
      return null;
    }
  };

  // Initialiser le reCAPTCHA
  const initialiserRecaptcha = useCallback(() => {
    try {
      if (!state.recaptchaVerifier) {
        const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            console.log('✅ Recaptcha vérifié');
          },
          'expired-callback': () => {
            console.log('❌ Recaptcha expiré');
            setState(prev => ({ 
              ...prev, 
              error: 'Captcha expiré, veuillez réessayer' 
            }));
          }
        });

        setState(prev => ({ ...prev, recaptchaVerifier }));
        return recaptchaVerifier;
      }
      return state.recaptchaVerifier;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: 'Erreur initialisation captcha: ' + error.message 
      }));
      return null;
    }
  }, [state.recaptchaVerifier]);

  // Créer un confirmationResult de test
  const createTestConfirmationResult = (phoneNumber: string): ConfirmationResult => {
    const testData = getTestData(phoneNumber);
    return {
      confirm: async (code: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (code === testData?.code) {
          return {
            user: {
              uid: testData.locataire.id,
              phoneNumber: phoneNumber,
              getIdToken: async () => 'test_token',
              getIdTokenResult: async () => ({ token: 'test_token' } as any),
            } as FirebaseUser,
            providerId: 'phone',
            operationType: 'signIn'
          };
        } else {
          throw new Error('Code incorrect');
        }
      },
      verificationId: 'test_verification_id'
    };
  };

  // Envoyer le code SMS
  const envoyerCodeSMS = useCallback(async (phoneNumber: string) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        isPhoneNumberSent: false,
        isTestMode: false
      }));

      const formattedPhone = formatPhoneNumber(phoneNumber);
      if (!validatePhoneNumber(formattedPhone)) {
        throw new Error('Format invalide. Utilisez +224XXXXXXXXX (Guinée) ou +1XXXXXXXXXX (Canada)');
      }

      const locataire = await getLocataireByTelephone(formattedPhone);
      if (!locataire) {
        throw new Error('Aucun compte locataire trouvé pour ce numéro');
      }

      if (locataire.accountStatus === 'inactive') {
        throw new Error('Votre compte est désactivé. Contactez votre gestionnaire.');
      }

      // Mode test
      if (isTestNumber(formattedPhone)) {
        const testData = getTestData(formattedPhone);
        console.log(`🧪 MODE TEST activé pour ${formattedPhone}`);
        
        setState(prev => ({ 
          ...prev, 
          confirmationResult: createTestConfirmationResult(formattedPhone),
          isPhoneNumberSent: true,
          isLoading: false,
          locataire,
          isTestMode: true
        }));

        return { 
          success: true, 
          formattedPhone,
          testCode: testData?.code,
          message: `Mode test activé. Code: ${testData?.code}`
        };
      }

      // Mode réel avec Firebase
      const recaptchaVerifier = initialiserRecaptcha();
      if (!recaptchaVerifier) {
        throw new Error('Impossible d\'initialiser le captcha');
      }

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
        locataire,
        isTestMode: false
      }));

      return { success: true, formattedPhone };

    } catch (error: any) {
      console.error('❌ Erreur envoi SMS:', error);
      
      let errorMessage = error.message;
      if (error.code === 'auth/billing-not-enabled') {
        errorMessage = 'Facturation non activée. Utilisez le numéro de test: +224628407335';
      }

      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isLoading: false 
      }));
      return { success: false, error: errorMessage };
    }
  }, [initialiserRecaptcha]);

  // Vérifier le code SMS
  const verifierCodeSMS = useCallback(async (code: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (!state.confirmationResult) {
        throw new Error('Aucun code en attente de vérification');
      }

      const result = await state.confirmationResult.confirm(code);
      
      if (result.user) {
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
      console.error('❌ Erreur vérification code:', error);
      
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
  }, [state.confirmationResult]);

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

  // Se déconnecter
  const deconnexion = useCallback(async () => {
    try {
      // Nettoyer localStorage
      localStorage.removeItem('auth_locataire');
      localStorage.removeItem('auth_locataireUser');
      localStorage.removeItem('auth_isTestMode');
      localStorage.removeItem('auth_isCodeVerified');

      // Si mode test, pas besoin de signOut Firebase
      if (state.isTestMode) {
        console.log('🧪 Déconnexion mode test');
      } else {
        await signOut(auth);
      }
      
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
        isTestMode: false,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [state.recaptchaVerifier, state.isTestMode]);

  // Mettre à jour le profil
  const mettreAJourProfil = useCallback(async (updates: { email?: string; telephone?: string }) => {
    try {
      if (!state.locataire) {
        throw new Error('Aucun locataire connecté');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (state.locataire.id.startsWith('test_')) {
        console.log('🧪 Simulation mise à jour profil test:', updates);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: true };
      }

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

  // Helper pour vérifier l'état d'authentification
  const isAuthenticated = useCallback(() => {
    const result = !!(state.locataire && state.isCodeVerified);
    return result;
  }, [state.locataire, state.isCodeVerified]);

  const canUploadRecus = useCallback(() => {
    return state.locataireUser?.canUploadRecus || false;
  }, [state.locataireUser]);

  return {
    // États
    isLoading: state.isLoading,
    error: state.error,
    isPhoneNumberSent: state.isPhoneNumberSent,
    isCodeVerified: state.isCodeVerified,
    isTestMode: state.isTestMode,
    isInitialized, // ✅ Nouveau: pour savoir si l'initialisation est terminée
    
    // Données utilisateur
    locataire: state.locataire,
    locataireUser: state.locataireUser,
    firebaseUser: state.firebaseUser,
    
    // Actions
    envoyerCodeSMS,
    verifierCodeSMS,
    renvoyerCodeSMS,
    deconnexion,
    mettreAJourProfil,
    
    // Helpers
    isAuthenticated,
    canUploadRecus,
    
    // Utilitaires
    initialiserRecaptcha,
  };
};