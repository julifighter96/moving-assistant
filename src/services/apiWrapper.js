import { offlineStorage } from './offlineStorage';
import { syncService } from './syncService';
import { updateDealDirectly, updateDealForOffer } from '../utils/dealUpdateFunctions';
import axios from 'axios';

/**
 * API Wrapper - Leitet alle API-Calls durch die Offline-Queue
 * Falls offline, werden Requests in der Queue gespeichert und später synchronisiert
 */
export const apiWrapper = {
  /**
   * Update Deal (mit Offline-Support)
   */
  async updateDeal(dealId, data) {
    try {
      if (syncService.isOnline()) {
        // Online - direkt ausführen
        const response = await updateDealDirectly(dealId, data);
        return response;
      } else {
        // Offline - in Queue speichern
        console.log('📴 Offline - Deal-Update wird in Queue gespeichert');
        await offlineStorage.addToSyncQueue('updateDeal', { dealId, data }, dealId);
        return { success: true, offline: true, message: 'Wird synchronisiert sobald wieder online' };
      }
    } catch (error) {
      // Bei Fehler auch in Queue speichern für Retry
      if (!syncService.isOnline()) {
        await offlineStorage.addToSyncQueue('updateDeal', { dealId, data }, dealId);
        return { success: false, offline: true, error: error.message };
      }
      throw error;
    }
  },

  /**
   * Save Inspection (mit Offline-Support)
   */
  async saveInspection(dealId, inspectionData) {
    try {
      // Speichere immer lokal
      await offlineStorage.saveInspectionState(dealId, inspectionData);
      
      if (syncService.isOnline()) {
        // Online - direkt speichern
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
        return response.data;
      } else {
        // Offline - in Queue speichern
        console.log('📴 Offline - Inspektion wird in Queue gespeichert');
        await offlineStorage.addToSyncQueue('saveInspection', { dealId, inspectionData }, dealId);
        return { success: true, offline: true, message: 'Wird synchronisiert sobald wieder online' };
      }
    } catch (error) {
      // Bei Fehler auch in Queue speichern
      if (!syncService.isOnline()) {
        await offlineStorage.addToSyncQueue('saveInspection', { dealId, inspectionData }, dealId);
        return { success: false, offline: true, error: error.message };
      }
      throw error;
    }
  },

  /**
   * Upload Photo (mit Offline-Support)
   */
  async uploadPhoto(dealId, roomId, blob) {
    try {
      // Speichere immer lokal
      const photoId = await offlineStorage.savePhoto(roomId, blob, dealId);
      
      if (syncService.isOnline()) {
        // Online - direkt hochladen
        try {
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
            return { success: true, data: response.data.data };
          }
        } catch (error) {
          console.error('Fehler beim Foto-Upload:', error);
          // Foto ist bereits lokal gespeichert, wird später synchronisiert
        }
      }
      
      // Offline oder Fehler - bereits in Queue durch savePhoto
      return { success: true, offline: true, photoId, message: 'Wird synchronisiert sobald wieder online' };
    } catch (error) {
      console.error('Fehler beim Speichern des Fotos:', error);
      throw error;
    }
  },

  /**
   * Update Offer (mit Offline-Support)
   */
  async updateOffer(dealId, offerData) {
    try {
      if (syncService.isOnline()) {
        // Online - direkt ausführen
        await updateDealForOffer(dealId, offerData);
        return { success: true };
      } else {
        // Offline - in Queue speichern
        console.log('📴 Offline - Angebot wird in Queue gespeichert');
        await offlineStorage.addToSyncQueue('updateOffer', { dealId, offerData }, dealId);
        return { success: true, offline: true, message: 'Wird synchronisiert sobald wieder online' };
      }
    } catch (error) {
      // Bei Fehler auch in Queue speichern
      if (!syncService.isOnline()) {
        await offlineStorage.addToSyncQueue('updateOffer', { dealId, offerData }, dealId);
        return { success: false, offline: true, error: error.message };
      }
      throw error;
    }
  },

  /**
   * Lade gespeicherten Zustand für einen Deal
   */
  async loadDealState(dealId) {
    return await offlineStorage.loadInspectionState(dealId);
  },

  /**
   * Lösche Deal-Daten (nach erfolgreichem Abschluss)
   */
  async clearDealData(dealId) {
    await offlineStorage.clearDealData(dealId);
  }
};

export default apiWrapper;

