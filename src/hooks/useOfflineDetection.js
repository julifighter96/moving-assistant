import { useState, useEffect } from 'react';

/**
 * Hook für Offline-Erkennung
 * Überwacht den Online/Offline-Status
 */
export const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Online');
      setIsOnline(true);
      if (wasOffline) {
        // War offline, jetzt wieder online - könnte Sync auslösen
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      console.log('📴 Offline');
      setIsOnline(false);
      setWasOffline(true);
    };

    // Initiale Prüfung mit einem kleinen Request
    const checkOnlineStatus = async () => {
      try {
        const response = await fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
        setWasOffline(true);
      }
    };

    // Event Listener
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Zusätzliche Prüfung alle 10 Sekunden
    const interval = setInterval(checkOnlineStatus, 10000);
    checkOnlineStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};

export default useOfflineDetection;

