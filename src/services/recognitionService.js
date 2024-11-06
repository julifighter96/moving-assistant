// services/recognitionService.js
const API_URL = process.env.REACT_APP_API_URL;

export const recognitionService = {
  async analyzeRoom(images, roomName) {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          roomName,
          companyId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  },

  async submitFeedback(originalItem, correctedItem, imageData, roomName) {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await fetch(`${API_URL}/api/recognition/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalItem,
          correctedItem,
          imageData,
          roomName,
          companyId,
          isMisrecognition: originalItem.name !== correctedItem.name
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Feedback error:', error);
      throw error;
    }
  }
};