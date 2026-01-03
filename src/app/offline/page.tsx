
"use client";

import { WifiOff, RefreshCw, Home, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (isOnline) {
      router.back();
    } else {
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-md mx-auto mt-16 md:mt-24 text-center">
        {/* Icon */}
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <WifiOff className="w-12 h-12 md:w-16 md:h-16 text-blue-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-sm md:text-base font-bold text-red-600">!</span>
          </div>
        </div>

        {/* Title & Message */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          {isOnline ? "Connexion Perdue" : "Hors Ligne"}
        </h1>
        
        <p className="text-gray-600 mb-2">
          {isOnline 
            ? "Votre connexion a été interrompue. Veuillez vérifier votre réseau."
            : "Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées."
          }
        </p>
        
        <p className="text-sm text-gray-500 mb-8">
          Hissab peut fonctionner hors ligne pour les transactions. Vos données seront synchronisées lorsque vous serez de nouveau en ligne.
        </p>

        {/* Connection Status */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 ${isOnline ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm font-medium">
            {isOnline ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            {isOnline ? "Réessayer" : "Vérifier la connexion"}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/')}
              className="py-3 px-4 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Accueil
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="py-3 px-4 border border-blue-200 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Tableau de bord
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Fonctionnalités disponibles hors ligne :
          </h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
              <span>Créer de nouvelles transactions de vente</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
              <span>Consulter les produits et stocks (version locale)</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
              <span>Gérer les crédits clients</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
              <span>Voir les transactions récentes</span>
            </li>
          </ul>
        </div>

        {/* App Info */}
        <div className="mt-8 text-xs text-gray-500">
          <p>Hissab POS v1.0 • Conçu pour fonctionner hors ligne</p>
        </div>
      </div>
    </main>
  );
}