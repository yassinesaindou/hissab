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
    // Already installed — never show
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    // Dismissed within 7 days — don't show
    const dismissed = localStorage.getItem('pwaPromptDismissed');
    if (dismissed) {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissed) < sevenDaysMs) return;
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // iOS has no beforeinstallprompt, show manually
      setIsVisible(true);
      return;
    }

    // Android/Desktop: only show when browser is ready
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true); // ← only show when browser says it's installable
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setIsStandalone(true);
      localStorage.removeItem('pwaPromptDismissed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User choice:', outcome);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
  };

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

          <button onClick={handleDismiss} className="text-white/80 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isIOS && (
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

        {isIOS && (
          <div className="mt-3">
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
            >
              OK, compris
            </button>
          </div>
        )}
      </div>
    </div>
  );
}