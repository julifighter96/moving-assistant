import Dexie from 'dexie';

// Erweitere die bestehende Datenbank um Inspektionsdaten
const db = new Dexie('MovingAssistantDB');
db.version(2).stores({
  photos: 'id,roomId,data',
  inspections: 'id,dealId,timestamp,status',
  syncQueue: '++id,type,dealId,timestamp,status,retryCount',
  inspectionState: 'dealId'
});

// Migration von Version 1 zu 2
db.version(2).upgrade(async (trans) => {
  // Erstelle neue Stores falls sie nicht existieren
  if (!trans.store('inspections')) {
    await trans.store('inspections');
  }
  if (!trans.store('syncQueue')) {
    await trans.store('syncQueue');
  }
  if (!trans.store('inspectionState')) {
    await trans.store('inspectionState');
  }
});

/**
 * Offline Storage Service für Inspektionsdaten
 * Speichert alle Inspektionsdaten lokal in IndexedDB
 */
export const offlineStorage = {
  /**
   * Speichere den aktuellen Inspektionszustand
   */
  async saveInspectionState(dealId, inspectionData) {
    try {
      const state = {
        dealId,
        data: inspectionData,
        timestamp: new Date().toISOString(),
        version: 1
      };
      
      await db.inspectionState.put(state, dealId);
      console.log('✅ Inspektionszustand gespeichert:', dealId);
      return true;
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Inspektionszustands:', error);
      throw error;
    }
  },

  /**
   * Lade den gespeicherten Inspektionszustand
   */
  async loadInspectionState(dealId) {
    try {
      const state = await db.inspectionState.get(dealId);
      if (state) {
        console.log('✅ Inspektionszustand geladen:', dealId);
        return state.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Fehler beim Laden des Inspektionszustands:', error);
      return null;
    }
  },

  /**
   * Lösche den Inspektionszustand (nach erfolgreicher Synchronisation)
   */
  async deleteInspectionState(dealId) {
    try {
      await db.inspectionState.delete(dealId);
      console.log('✅ Inspektionszustand gelöscht:', dealId);
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Inspektionszustands:', error);
    }
  },

  /**
   * Speichere eine Inspektion
   */
  async saveInspection(inspection) {
    try {
      const inspectionData = {
        id: inspection.id || `inspection_${Date.now()}`,
        dealId: inspection.dealId,
        timestamp: inspection.timestamp || new Date().toISOString(),
        status: inspection.status || 'draft',
        data: inspection.data,
        ...inspection
      };
      
      await db.inspections.put(inspectionData);
      console.log('✅ Inspektion gespeichert:', inspectionData.id);
      return inspectionData.id;
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Inspektion:', error);
      throw error;
    }
  },

  /**
   * Lade eine Inspektion
   */
  async getInspection(dealId) {
    try {
      const inspection = await db.inspections
        .where('dealId')
        .equals(dealId)
        .first();
      return inspection;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Inspektion:', error);
      return null;
    }
  },

  /**
   * Lade alle Inspektionen
   */
  async getAllInspections() {
    try {
      return await db.inspections.toArray();
    } catch (error) {
      console.error('❌ Fehler beim Laden aller Inspektionen:', error);
      return [];
    }
  },

  /**
   * Speichere einen Sync-Queue Eintrag
   */
  async addToSyncQueue(type, data, dealId) {
    try {
      const queueItem = {
        type, // z.B. 'updateDeal', 'uploadPhoto', 'saveInspection'
        data,
        dealId,
        timestamp: new Date().toISOString(),
        status: 'pending',
        retryCount: 0
      };
      
      const id = await db.syncQueue.add(queueItem);
      console.log('✅ Item zur Sync-Queue hinzugefügt:', id, type);
      return id;
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen zur Sync-Queue:', error);
      throw error;
    }
  },

  /**
   * Lade alle pending Sync-Queue Einträge
   */
  async getPendingSyncItems() {
    try {
      return await db.syncQueue
        .where('status')
        .equals('pending')
        .toArray();
    } catch (error) {
      console.error('❌ Fehler beim Laden der Sync-Queue:', error);
      return [];
    }
  },

  /**
   * Markiere Sync-Queue Eintrag als erfolgreich
   */
  async markSyncItemSuccess(id) {
    try {
      await db.syncQueue.update(id, { 
        status: 'completed',
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Fehler beim Markieren als erfolgreich:', error);
    }
  },

  /**
   * Markiere Sync-Queue Eintrag als fehlgeschlagen
   */
  async markSyncItemFailed(id, error) {
    try {
      const item = await db.syncQueue.get(id);
      if (item) {
        const retryCount = (item.retryCount || 0) + 1;
        await db.syncQueue.update(id, { 
          status: retryCount >= 5 ? 'failed' : 'pending',
          retryCount,
          lastError: error?.message || String(error),
          lastRetryAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('❌ Fehler beim Markieren als fehlgeschlagen:', err);
    }
  },

  /**
   * Lösche Sync-Queue Eintrag
   */
  async deleteSyncItem(id) {
    try {
      await db.syncQueue.delete(id);
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Sync-Items:', error);
    }
  },

  /**
   * Lösche alle abgeschlossenen Sync-Items (älter als 7 Tage)
   */
  async cleanupOldSyncItems() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      await db.syncQueue
        .where('status')
        .anyOf(['completed', 'failed'])
        .and(item => new Date(item.completedAt || item.timestamp) < sevenDaysAgo)
        .delete();
    } catch (error) {
      console.error('❌ Fehler beim Aufräumen alter Sync-Items:', error);
    }
  },

  /**
   * Speichere Fotos lokal (erweitert photoStorage)
   */
  async savePhoto(roomId, blob, dealId = null) {
    try {
      const blobToBase64 = (blob) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      };

      const base64 = await blobToBase64(blob);
      const id = Date.now();
      const photoData = {
        id,
        roomId,
        dealId,
        data: base64,
        timestamp: new Date().toISOString(),
        synced: false
      };
      
      await db.photos.add(photoData);
      console.log('✅ Foto lokal gespeichert:', id);
      
      // Füge zur Sync-Queue hinzu wenn dealId vorhanden
      if (dealId) {
        await this.addToSyncQueue('uploadPhoto', { photoId: id, roomId, dealId }, dealId);
      }
      
      return id;
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Fotos:', error);
      throw error;
    }
  },

  /**
   * Lade alle nicht synchronisierten Fotos
   */
  async getUnsyncedPhotos(dealId = null) {
    try {
      let query = db.photos.where('synced').equals(false);
      if (dealId) {
        query = query.and(photo => photo.dealId === dealId);
      }
      return await query.toArray();
    } catch (error) {
      console.error('❌ Fehler beim Laden nicht synchronisierter Fotos:', error);
      return [];
    }
  },

  /**
   * Markiere Foto als synchronisiert
   */
  async markPhotoSynced(photoId) {
    try {
      await db.photos.update(photoId, { synced: true });
    } catch (error) {
      console.error('❌ Fehler beim Markieren des Fotos als synchronisiert:', error);
    }
  },

  /**
   * Lösche alle Daten für einen Deal (Cleanup)
   */
  async clearDealData(dealId) {
    try {
      await db.inspectionState.delete(dealId);
      await db.inspections.where('dealId').equals(dealId).delete();
      await db.photos.where('dealId').equals(dealId).delete();
      await db.syncQueue.where('dealId').equals(dealId).delete();
      console.log('✅ Alle Daten für Deal gelöscht:', dealId);
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Deal-Daten:', error);
    }
  }
};

export default offlineStorage;

