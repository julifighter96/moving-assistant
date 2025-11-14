import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { useOfflineDetection } from '../hooks/useOfflineDetection';
import { syncService } from '../services/syncService';
import { useState, useEffect } from 'react';

/**
 * Offline-Indikator Komponente
 * Zeigt den Online/Offline-Status und Sync-Status an
 */
const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOfflineDetection();
  const [syncStatus, setSyncStatus] = useState({ isSyncing: false, pendingCount: 0 });

  useEffect(() => {
    // Listener für Sync-Events
    const unsubscribe = syncService.onSync((event, data) => {
      if (event === 'syncStart') {
        setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      } else if (event === 'syncComplete') {
        setSyncStatus(prev => ({ 
          ...prev, 
          isSyncing: false,
          pendingCount: Math.max(0, prev.pendingCount - (data.successCount || 0))
        }));
      } else if (event === 'syncError') {
        setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      }
    });

    // Lade initiale Pending-Count
    const loadPendingCount = async () => {
      try {
        const { offlineStorage } = await import('../services/offlineStorage');
        const pending = await offlineStorage.getPendingSyncItems();
        setSyncStatus(prev => ({ ...prev, pendingCount: pending.length }));
      } catch (error) {
        console.error('Fehler beim Laden der Pending-Count:', error);
      }
    };
    loadPendingCount();

    // Aktualisiere Pending-Count regelmäßig
    const interval = setInterval(loadPendingCount, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Manueller Sync-Button
  const handleManualSync = async () => {
    if (isOnline && !syncStatus.isSyncing) {
      await syncService.syncAll();
    }
  };

  if (isOnline && syncStatus.pendingCount === 0 && !wasOffline) {
    return null; // Verstecke wenn alles synchronisiert ist
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOnline ? (
        <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
          <WifiOff className="w-5 h-5" />
          <div>
            <div className="font-semibold">Offline</div>
            <div className="text-sm opacity-90">Ihre Daten werden lokal gespeichert</div>
          </div>
        </div>
      ) : wasOffline ? (
        <div className="bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <Cloud className="w-5 h-5" />
          <div>
            <div className="font-semibold">Wieder online</div>
            <div className="text-sm opacity-90">
              {syncStatus.pendingCount > 0 
                ? `${syncStatus.pendingCount} Einträge werden synchronisiert...`
                : 'Synchronisierung abgeschlossen'}
            </div>
          </div>
        </div>
      ) : syncStatus.pendingCount > 0 ? (
        <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          {syncStatus.isSyncing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <div>
                <div className="font-semibold">Synchronisiere...</div>
                <div className="text-sm opacity-90">{syncStatus.pendingCount} Einträge</div>
              </div>
            </>
          ) : (
            <>
              <CloudOff className="w-5 h-5" />
              <div>
                <div className="font-semibold">{syncStatus.pendingCount} ausstehende Einträge</div>
                <button
                  onClick={handleManualSync}
                  className="text-sm underline opacity-90 hover:opacity-100 mt-1"
                >
                  Jetzt synchronisieren
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default OfflineIndicator;

