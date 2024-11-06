// src/services/roomAnalysisService.js
const API_URL = process.env.REACT_APP_API_URL;

export const analyzeRoomImages = async (images, roomName, customPrompt) => {
  try {
    const imagePromises = images.map(async (image) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(image.file);
      });
    });

    const base64Images = await Promise.all(imagePromises);
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        images: base64Images,
        roomName,
        prompt: customPrompt
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || error.message);
  }
};