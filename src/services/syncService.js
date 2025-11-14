import { offlineStorage } from './offlineStorage';
import axios from 'axios';
import { updateDealDirectly, updateDealForOffer } from '../utils/dealUpdateFunctions';

/**
 * Sync Service - Synchronisiert offline gespeicherte Daten mit dem Server
 */
class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];
  }

  /**
   * Registriere einen Listener für Sync-Events
   */
  onSync(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Benachrichtige alle Listener
   */
  notifyListeners(event, data) {
    this.syncListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Fehler in Sync-Listener:', error);
      }
    });
  }

  /**
   * Prüfe ob Online
   */
  isOnline() {
    return navigator.onLine;
  }

  /**
   * Lade alle pending Sync-Items (Helper-Methode)
   */
  async getPendingSyncItems() {
    return await offlineStorage.getPendingSyncItems();
  }

  /**
   * Synchronisiere alle pending Items
   */
  async syncAll() {
    if (this.isSyncing) {
      console.log('⏳ Sync läuft bereits...');
      return;
    }

    if (!this.isOnline()) {
      console.log('📴 Offline - Sync übersprungen');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners('syncStart', {});

    try {
      const pendingItems = await offlineStorage.getPendingSyncItems();
      console.log(`🔄 Starte Sync von ${pendingItems.length} Items...`);

      let successCount = 0;
      let errorCount = 0;

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          successCount++;
        } catch (error) {
          console.error(`❌ Fehler beim Sync von Item ${item.id}:`, error);
          await offlineStorage.markSyncItemFailed(item.id, error);
          errorCount++;
        }
      }

      console.log(`✅ Sync abgeschlossen: ${successCount} erfolgreich, ${errorCount} Fehler`);
      this.notifyListeners('syncComplete', { successCount, errorCount, total: pendingItems.length });

      // Cleanup alte Items
      await offlineStorage.cleanupOldSyncItems();
    } catch (error) {
      console.error('❌ Kritischer Fehler beim Sync:', error);
      this.notifyListeners('syncError', { error });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Synchronisiere ein einzelnes Item
   */
  async syncItem(item) {
    console.log(`🔄 Sync Item: ${item.type} (${item.id})`);

    try {
      switch (item.type) {
        case 'updateDeal':
          await this.syncUpdateDeal(item);
          break;
        case 'saveInspection':
          await this.syncSaveInspection(item);
          break;
        case 'uploadPhoto':
          await this.syncUploadPhoto(item);
          break;
        case 'updateOffer':
          await this.syncUpdateOffer(item);
          break;
        default:
          console.warn(`⚠️ Unbekannter Sync-Typ: ${item.type}`);
      }

      await offlineStorage.markSyncItemSuccess(item.id);
      console.log(`✅ Item ${item.id} erfolgreich synchronisiert`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Synchronisiere Deal-Update
   */
  async syncUpdateDeal(item) {
    const { dealId, data } = item.data;
    const response = await updateDealDirectly(dealId, data);
    
    if (!response || response.success === false) {
      throw new Error(response?.message || 'Deal-Update fehlgeschlagen');
    }
  }

  /**
   * Synchronisiere Inspektion
   */
  async syncSaveInspection(item) {
    const { dealId, inspectionData } = item.data;
    const API_URL = process.env.REACT_APP_API_URL;
    
    const response = await axios.put(
      `${API_URL}/api/moves/${dealId}`,
      inspectionData,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (response.status !== 200) {
      throw new Error('Inspektion konnte nicht gespeichert werden');
    }
  }

  /**
   * Synchronisiere Foto-Upload
   */
  async syncUploadPhoto(item) {
    const { photoId, roomId, dealId } = item.data;
    
    // Lade Foto aus IndexedDB
    const photos = await offlineStorage.getUnsyncedPhotos(dealId);
    const photo = photos.find(p => p.id === photoId);
    
    if (!photo) {
      throw new Error('Foto nicht gefunden');
    }

    // Konvertiere Base64 zu Blob
    const base64Response = await fetch(photo.data);
    const blob = await base64Response.blob();

    // Upload zu Pipedrive
    const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
    const formData = new FormData();
    formData.append('file', blob, `room_photo_${photoId}.jpg`);
    formData.append('deal_id', dealId);

    const response = await axios.post(
      'https://api.pipedrive.com/v1/files',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          api_token: apiToken
        }
      }
    );

    if (response.data.success) {
      await offlineStorage.markPhotoSynced(photoId);
    } else {
      throw new Error('Foto-Upload fehlgeschlagen');
    }
  }

  /**
   * Synchronisiere Angebot-Update
   */
  async syncUpdateOffer(item) {
    const { dealId, offerData } = item.data;
    await updateDealForOffer(dealId, offerData);
  }

  /**
   * Starte automatische Sync-Überwachung
   */
  startAutoSync(intervalMs = 30000) {
    // Sync sofort wenn online
    if (this.isOnline()) {
      this.syncAll();
    }

    // Sync alle X Sekunden wenn online
    this.autoSyncInterval = setInterval(() => {
      if (this.isOnline() && !this.isSyncing) {
        this.syncAll();
      }
    }, intervalMs);

    // Sync wenn wieder online
    window.addEventListener('online', () => {
      console.log('🌐 Online - Starte Sync...');
      this.syncAll();
    });

    // Sync bei Sichtbarkeitswechsel (Tab wird wieder aktiv)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline() && !this.isSyncing) {
        this.syncAll();
      }
    });
  }

  /**
   * Stoppe automatische Sync-Überwachung
   */
  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }
}

// Singleton-Instanz
export const syncService = new SyncService();

export default syncService;

