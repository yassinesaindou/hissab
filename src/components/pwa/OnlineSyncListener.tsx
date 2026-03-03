'use client';

import { useEffect } from 'react';
import { performFullSync } from '@/lib/offline/fullSync';

export function OnlineSyncListener() {
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Back online — starting auto sync');
      await performFullSync();
    };

    window.addEventListener('online', handleOnline);

    // Optional: also try sync immediately if already online
    if (navigator.onLine) {
      performFullSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
}