'use client';

import { useState, useEffect, useCallback } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  const checkOnlineStatus = useCallback(() => {
    const online = navigator.onLine;
    setIsOnline(online);
    
    if (!online) {
      setWasOffline(true);
    } else if (wasOffline && online) {
      // Just came back online
      setTimeout(() => setWasOffline(false), 3000);
    }
  }, [wasOffline]);

  useEffect(() => {
    // Set initial state
    checkOnlineStatus();

    // Add event listeners
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    // Optional: Check periodically (every 30 seconds)
    const interval = setInterval(checkOnlineStatus, 30000);

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
      clearInterval(interval);
    };
  }, [checkOnlineStatus]);

  return {
    isOnline,
    wasOffline,
    checkOnlineStatus,
  };
}