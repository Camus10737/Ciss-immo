// src/app/(auth)/locataires/login/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, MessageSquare, ArrowLeft, CheckCircle, TestTube } from 'lucide-react';
import { useAuthSMS } from '@/hooks/useAuthSMS';

const LocataireLoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code' | 'success'>('phone');
  const [testCode, setTestCode] = useState<string>('');
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    isLoading,
    error,
    isPhoneNumberSent,
    isCodeVerified,
    isTestMode,
    isInitialized, // ✅ Nouveau
    locataire,
    envoyerCodeSMS,
    verifierCodeSMS,
    renvoyerCodeSMS,
    isAuthenticated,
  } = useAuthSMS();

  // 🔑 CORRECTION: Rediriger seulement après initialisation
  useEffect(() => {
    if (!isInitialized) {
      console.log('⏳ Login: En attente d\'initialisation...');
      return;
    }

    if (isAuthenticated()) {
      console.log('✅ Déjà authentifié, redirection vers dashboard');
      router.push('/dashboard/locataires');
    }
  }, [isAuthenticated, router, isInitialized]);

  // Gérer le succès de la vérification
  useEffect(() => {
    if (isCodeVerified && locataire) {
      console.log('✅ Code vérifié, passage à l\'étape succès');
      setStep('success');
      // Redirection après 2 secondes
      setTimeout(() => {
        router.push('/dashboard/locataires');
      }, 2000);
    }
  }, [isCodeVerified, locataire, router]);

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

  // Gérer l'envoi du numéro de téléphone
  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber.trim());
    
    console.log('📱 Tentative envoi SMS à:', formattedPhone);
    
    const result = await envoyerCodeSMS(formattedPhone);
    if (result.success) {
      setStep('code');
      setPhoneNumber(formattedPhone);
      if (result.testCode) {
        setTestCode(result.testCode);
      }
      console.log('✅ SMS envoyé avec succès');
    } else {
      console.error('❌ Erreur envoi SMS:', result.error);
    }
  };

  // Gérer la vérification du code
  const handleCodeSubmit = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      return;
    }

    console.log('🔐 Vérification du code:', verificationCode);
    
    const result = await verifierCodeSMS(verificationCode);
    if (result.success) {
      console.log('✅ Code vérifié avec succès');
    } else {
      console.error('❌ Erreur vérification:', result.error);
    }
  };

  // Retourner à l'étape du téléphone
  const retourTelephone = () => {
    setStep('phone');
    setVerificationCode('');
    setPhoneNumber('');
    setTestCode('');
  };

  // Renvoyer le code
  const handleRenvoiCode = async () => {
    console.log('📱 Renvoi du code SMS');
    const result = await renvoyerCodeSMS();
    if (result.success) {
      setVerificationCode('');
      if (result.testCode) {
        setTestCode(result.testCode);
      }
      console.log('✅ Code renvoyé avec succès');
    } else {
      console.error('❌ Erreur renvoi:', result.error);
    }
  };

  // Utiliser le code de test automatiquement
  const utiliserCodeTest = () => {
    if (testCode) {
      setVerificationCode(testCode);
    }
  };

  // Gérer les touches clavier
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  // 🔑 NOUVEAU: Attendre l'initialisation
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 text-center">Initialisation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            {step === 'success' ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : isTestMode ? (
              <TestTube className="w-8 h-8 text-white" />
            ) : (
              <Phone className="w-8 h-8 text-white" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {step === 'success' ? 'Connexion réussie !' : 'Espace Locataire'}
          </CardTitle>
          <CardDescription className="text-base">
            {step === 'phone' && 'Connectez-vous avec votre numéro de téléphone'}
            {step === 'code' && (isTestMode ? 'Mode test - Saisissez le code' : 'Saisissez le code reçu par SMS')}
            {step === 'success' && 'Redirection vers votre espace personnel...'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mode test indicator */}
          {isTestMode && step === 'code' && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <TestTube className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 font-medium">
                🧪 Mode développement activé
              </AlertDescription>
            </Alert>
          )}

          {/* Affichage des erreurs */}
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Étape 1: Saisie du numéro de téléphone */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Numéro de téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 XXX XXX XXXX ou +224 XXX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="text-lg h-12"
                  disabled={isLoading}
                  onKeyDown={(e) => handleKeyDown(e, handlePhoneSubmit)}
                />
                <p className="text-sm text-gray-500">
                  🇨🇦 Canada: +1XXXXXXXXXX • 🇬🇳 Guinée: +224XXXXXXXXX
                </p>
              </div>

              {/* Numéros de test suggestion */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  🧪 Numéros de test (développement)
                </h4>
                <div className="space-y-1 text-xs text-blue-700">
                  <div className="flex justify-between">
                    <span>Guinée:</span>
                    <code className="bg-blue-100 px-1 rounded">+224628407335</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Canada:</span>
                    <code className="bg-blue-100 px-1 rounded">+16111111111</code>
                  </div>
                </div>
              </div>

              {/* Container pour reCAPTCHA */}
              <div 
                id="recaptcha-container" 
                ref={recaptchaRef}
                className="flex justify-center py-2"
              />

              <Button 
                onClick={handlePhoneSubmit} 
                className="w-full h-12 text-base font-medium"
                disabled={isLoading || !phoneNumber.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Recevoir le code SMS
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Étape 2: Vérification du code SMS */}
          {step === 'code' && (
            <div className="space-y-4">
              {/* Info numéro */}
              <div className={`p-4 rounded-lg border ${
                isTestMode ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {isTestMode ? (
                    <TestTube className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-green-600" />
                  )}
                  <p className={`text-sm font-medium ${
                    isTestMode ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                    {isTestMode ? `Mode test - Code: ${testCode}` : `Code envoyé au ${phoneNumber}`}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Code de vérification
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-2xl text-center tracking-widest h-14 font-mono"
                    disabled={isLoading}
                    maxLength={6}
                    onKeyDown={(e) => {
                      if (verificationCode.length === 6) {
                        handleKeyDown(e, handleCodeSubmit);
                      }
                    }}
                  />
                  <p className="text-sm text-gray-500 text-center">
                    Code à 6 chiffres {isTestMode ? '(mode test)' : 'reçu par SMS'}
                  </p>
                </div>

                {/* Bouton pour utiliser le code de test */}
                {isTestMode && testCode && (
                  <Button 
                    variant="outline"
                    onClick={utiliserCodeTest}
                    className="w-full"
                    disabled={isLoading}
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Utiliser le code test ({testCode})
                  </Button>
                )}

                <Button 
                  onClick={handleCodeSubmit} 
                  className="w-full h-12 text-base font-medium"
                  disabled={isLoading || verificationCode.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Vérifier le code
                    </>
                  )}
                </Button>
              </div>

              {/* Actions secondaires */}
              <div className="flex flex-col space-y-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleRenvoiCode}
                  disabled={isLoading}
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Renvoyer le code
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={retourTelephone}
                  disabled={isLoading}
                  size="sm"
                  className="w-full text-gray-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Changer de numéro
                </Button>
              </div>
            </div>
          )}

          {/* Étape 3: Succès */}
          {step === 'success' && (
            <div className="space-y-4 text-center">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Bienvenue {locataire?.prenom} !
                </h3>
                <p className="text-green-700">
                  Vous êtes maintenant connecté à votre espace locataire.
                </p>
                {isTestMode && (
                  <p className="text-xs text-green-600 mt-2">
                    🧪 Connexion en mode test
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirection automatique...</span>
              </div>

              <Button 
                onClick={() => router.push('/dashboard/locataires')}
                className="w-full"
                variant="outline"
              >
                Accéder maintenant à mon espace
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocataireLoginPage;