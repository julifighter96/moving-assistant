import Dexie from 'dexie';

const db = new Dexie('MovingAssistantDB');
db.version(1).stores({
  photos: 'id,roomId,data'
});

export const photoStorage = {
  async savePhoto(roomId, blob) {
    const blobToBase64 = (blob) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    };

    const base64 = await blobToBase64(blob);
    const id = Date.now();
    await db.photos.add({
      id,
      roomId,
      data: base64
    });
    
    return id;
  },

  async getPhotos(roomId) {
    try {
      const photos = await db.photos.where('roomId').equals(roomId).toArray();
      return photos;
    } catch (error) {
      console.error(`❌ Error getting photos for room ${roomId}:`, error);
      throw error;
    }
  },

  async deleteAllPhotos() {
    try {
      await db.photos.clear();
    } catch (error) {
      console.error('❌ Error deleting all photos:', error);
      throw error;
    }
  },

  async getAllPhotos() {
    try {
      const photos = await db.photos.toArray();
      return photos;
    } catch (error) {
      console.error('❌ Error getting all photos:', error);
      throw error;
    }
  },

  async deletePhoto(id) {
    await db.photos.delete(id);
  }
};

export default photoStorage;