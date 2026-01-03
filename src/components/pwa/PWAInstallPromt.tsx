/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Hide prompt if user installs the app
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setIsStandalone(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
  };

  // Don't show if already installed or if dismissed recently
  if (!isVisible || isStandalone) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:right-4 z-50 animate-fade-in-up">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Installer Hissab :)</h3>
              <p className="text-xs text-blue-100 mt-1">
                Installez l&apos;application pour une meilleure expérience et un accès hors ligne
              </p>
              
              {isIOS && (
                <div className="mt-2 text-xs bg-white/10 p-2 rounded">
                  <p className="font-semibold">Sur iOS :</p>
                  <p>Appuyez sur <span className="font-bold">Partager</span> puis <span className="font-bold">&quot;Sur l&apos;écran d&apos;accueil&quot;</span></p>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {!isIOS && deferredPrompt && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-white text-blue-600 text-sm font-semibold py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Installer
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
            >
              Plus tard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}