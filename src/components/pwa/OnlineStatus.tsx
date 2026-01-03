"use client";

import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show online toast
      if (typeof window !== 'undefined') {
        // You can add a toast notification here
        console.log('Back online - Syncing data...');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Show offline toast
      if (typeof window !== 'undefined') {
        // You can add a toast notification here
        console.log('Offline - Working in offline mode');
      }
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="bg-yellow-500 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-lg flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>Mode hors ligne</span>
      </div>
    </div>
  );
}