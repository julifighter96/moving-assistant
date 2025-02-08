// services/recognitionService.js
const API_URL = process.env.REACT_APP_API_URL;

export const recognitionService = {
  async analyzeRoom(images, roomName, customPrompt) {
    try {
      // Remove any trailing slashes from API_URL
      const baseUrl = API_URL.replace(/\/+$/, '');
      const url = `${baseUrl}/analyze`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'  // Add explicit Accept header
        },
        body: JSON.stringify({
          images,
          roomName,
          customPrompt
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error('Analysis error details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      throw error;
    }
  },

  async submitFeedback(originalItem, correctedItem, imageData, roomName) {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await fetch(`${API_URL}/recognition/feedback`, {
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