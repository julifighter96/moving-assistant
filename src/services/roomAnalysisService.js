// src/services/roomAnalysisService.js
import axios from 'axios';

export const analyzeRoomImages = async (images, roomName, customPrompt) => {
  try {
    // Convert images to base64
    const imagePromises = images.map(async (image) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(image.file);
      });
    });

    const base64Images = await Promise.all(imagePromises);
    const response = await axios.post('/api/analyze', {
      images: base64Images,
      roomName,
      prompt: customPrompt
    });

    return JSON.parse(response.data[0].text);
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
};