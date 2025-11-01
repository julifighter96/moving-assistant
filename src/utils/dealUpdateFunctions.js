import axios from 'axios';
import photoStorage from '../utils/photoStorage';  // Add this import


const API_MAPPING = {
  'HVZ': '78050c086c106b0e9f655eb0b92ceb1ae1825378',
  'Möbellift': '705d07fa2683d46703fdaa8a8dea0b82dcc48e47',
  'Matratzenhüllen': '1e9d250dbc5cfea31a5129feb1b777dcb7937a9d',
  'Packseide': '1df9741aa7e79a4aba3673706875c4f9ba458e86',
  'Gegebenheiten Entladestelle': 'b0f5f0e08c73cbea321ec0e96aea9ebb0a95af8c',
  'Gegebenheiten Beladestelle': '0d48a438be3fd78057e0b900b2e476d7d47f5a86',
  'cbm': '7389c69a33066781652d699f17cab018b7bdec21',
  'Auspackservice': '0085f40bb50ba7748922f9723a9ac4e91e1149cf',
  'Einpackservice': '05ab4ce4f91858459aad9bf20644e99b5d0619b1',
  'Anmerkungen für Personal': 'e587fe207006060c97d76f97a01351b08e850a95',
  'Umzugskartons': '4d802b9bcb9808a1e61da5aca6fb5bcb8a41e436',
  'Porzellankartons': 'REPLACE_WITH_ACTUAL_PORZELLANKARTONS_FIELD_KEY'
};

const OPTION_IDS = {
  'Möbellift': {
    'B': 69,
    'E': 70,
    'Z': 71
  },
  'Matratzenhüllen': {
    '1 x 90 * 200': 125,
    '2 x 90 * 200': 126,
    '3 x 90 * 200': 127,
    '4 x 90 * 200': 128,
    '1 x 140 * 200': 129,
    '2 x 140 * 200': 130,
    '3 x 140 * 200': 131,
    '4 x 140 * 200': 132,
    '1 x 160 * 200': 133,
    '2 x 160 * 200': 134,
    '3 x 160 * 200': 135,
    '4 x 160 * 200': 136,
    '1 x 180 * 200': 137,
    '2 x 180 * 200': 138,
    '3 x 180 * 200': 139,
    '4 x 180 * 200': 140,
    '1 x 200 * 200': 141,
    '2 x 200 * 200': 142,
    '3 x 200 * 200': 143,
    '4 x 200 * 200': 144
  },
  'HVZ': {
    'B': 64,
    'E': 65,
    'Z': 66
  }, 'Gegebenheiten Entladestelle': {
    'Aufzug': 37,
    'Maisonette': 38,
    'Garage': 39,
    'Keller': 40
  },
  'Gegebenheiten Beladestelle': {
    'Aufzug': 33,
    'Maisonette': 34,
    'Garage': 35,
    'Keller': 36
  },
  'Packseide': {
    '10': 866,
    '20': 867,
    '30': 868
  },
};



const uploadPhotos = async (dealId, photos) => {
  const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
  
  for (const photo of photos) {
    const formData = new FormData();
    formData.append('file', photo.blob, 'room_photo.jpg');
    formData.append('deal_id', dealId);
    
    try {
      await axios.post(`https://api.pipedrive.com/v1/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: { api_token: apiToken }
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  }
};

const uploadPhotosToFile = async (dealId, photos) => {
  const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
  const uploadedFiles = [];


  for (const photo of photos) {
    try {
      if (!photo || !photo.data) {
        console.warn('Invalid photo object:', photo);
        continue;
      }

      // Convert base64 to blob
      const base64Response = await fetch(photo.data);
      const blob = await base64Response.blob();

      // Create FormData
      const formData = new FormData();
      formData.append('file', blob, `room_photo_${photo.id || Date.now()}.jpg`);
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
        uploadedFiles.push(response.data.data);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  }

  return uploadedFiles;
};

const updateDealForOffer = async (dealId, dealData) => {
  const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
  const apiUrl = `https://api.pipedrive.com/v1/deals/${dealId}?api_token=${apiToken}`;


  try {
    // First, get all photos from IndexedDB for all rooms
    const allPhotos = [];
    if (dealData.rooms) {
      for (const roomName of Object.keys(dealData.rooms)) {
        try {
          const roomPhotos = await photoStorage.getPhotos(roomName);
          if (roomPhotos && roomPhotos.length > 0) {
            allPhotos.push(...roomPhotos);
          }
        } catch (error) {
          console.error(`Error getting photos for room ${roomName}:`, error);
        }
      }
    
    }
    else {
      console.log('⚠️ No rooms data found in dealData');
    }

    // Upload photos to Pipedrive if we have any
    if (allPhotos.length > 0) {
      await uploadPhotosToFile(dealId, allPhotos);
      try {
        await photoStorage.deleteAllPhotos();
      } catch (cleanupError) {
        console.error('⚠️ Error cleaning up local photos:', cleanupError);
        // Continue with the deal update even if cleanup fails
      }
    }

    const formattedData = formatDealData(dealData);

    const response = await axios({
      method: 'put',
      url: `https://api.pipedrive.com/v1/deals/${dealId}`,
      params: { api_token: apiToken },
      data: formattedData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update deal');
    }

    return response.data.data;
  } catch (error) {
    console.error('Error in updateDealForOffer:', error);
    throw error;
  }
};

const formatDealData = (inspectionData) => {
  const formattedData = {};

  // Füge pipedriveUpdateData hinzu (Mitarbeiter und Fahrzeuge aus MovingCalculation)
  if (inspectionData.pipedriveUpdateData) {
    console.log('📤 Füge pipedriveUpdateData hinzu:', inspectionData.pipedriveUpdateData);
    Object.assign(formattedData, inspectionData.pipedriveUpdateData);
  }

  if (inspectionData.combinedData) {
    let detailsText = '';

    // Add items that need work
    const filteredItems = Object.entries(inspectionData.combinedData.items)
      .filter(([_, item]) => item.duebelarbeiten || item.demontiert)
      .map(([name, item]) => 
        `${name}: ${item.quantity} (${[
          item.demontiert ? 'Demontiert' : '',
          item.duebelarbeiten ? 'Dübelarbeiten' : ''
        ].filter(Boolean).join(', ')})`
      );

    if (filteredItems.length > 0) {
      detailsText += `Möbel die bearbeitet werden müssen:\n${filteredItems.join('\n')}\n\n`;
    }

    // Handle Packseide from combinedData
    const packseideAmount = inspectionData.combinedData.packMaterials['Packseide'] || 0;
    if (API_MAPPING['Packseide']) {
      if (packseideAmount === 0) {
        formattedData[API_MAPPING['Packseide']] = [];
      } else if (packseideAmount <= 10) {
        formattedData[API_MAPPING['Packseide']] = [866];
      } else if (packseideAmount <= 20) {
        formattedData[API_MAPPING['Packseide']] = [867];
      } else {
        formattedData[API_MAPPING['Packseide']] = [868];
      }
    }

    // Add pack materials if any exist
    const packMaterials = Object.entries(inspectionData.combinedData.packMaterials)
      .filter(([name, quantity]) => quantity > 0 && name !== 'Packseide')
      .map(([name, quantity]) => `${name}: ${quantity}`);

    if (packMaterials.length > 0) {
      detailsText += `Packmaterialien:\n${packMaterials.join('\n')}\n\n`;
    }

    // Add box quantities from additionalInfo if they exist
    if (inspectionData.additionalInfo) {
      const umzugskartons = inspectionData.additionalInfo.find(
        f => f.name === 'Anzahl Umzugskartons' && f.type === 'number'
      )?.value || 0;
      
      const porzellankartons = inspectionData.additionalInfo.find(
        f => f.name === 'Anzahl Porzellankartons' && f.type === 'number'
      )?.value || 0;
      
      if (umzugskartons > 0 || porzellankartons > 0) {
        detailsText += `Kartons:\n`;
        if (umzugskartons > 0) {
          detailsText += `- Umzugskartons: ${umzugskartons} Stück\n`;
          formattedData[API_MAPPING['Umzugskartons']] = umzugskartons;
        }
        if (porzellankartons > 0) {
          detailsText += `- Porzellankartons: ${porzellankartons} Stück\n`;
          formattedData[API_MAPPING['Porzellankartons']] = porzellankartons;
        }
        detailsText += '\n';
      }
    }

    if (inspectionData.rooms) {
      const roomNotes = Object.entries(inspectionData.rooms)
        .filter(([_, roomData]) => roomData.notes && roomData.notes.trim())
        .map(([roomName, roomData]) => `${roomName}:\n${roomData.notes}`)
        .join('\n\n');
  
      if (roomNotes) {
        detailsText += `\nRaum-spezifische Anmerkungen:\n${roomNotes}\n\n`;
      }
    }

    // Add additional information
    if (inspectionData.additionalInfo) {
      const additionalDetails = [];

      // Process HVZ info
      const hvzInfo = inspectionData.additionalInfo.find(category => 
        category.category === 'Umzugstechnische Details' && 
        category.fields.some(f => f.name === 'HVZ')
      );
      
      if (hvzInfo) {
        const hvzField = hvzInfo.fields.find(f => f.name === 'HVZ');
        if (hvzField && Array.isArray(hvzField.value) && hvzField.value.length > 0) {
          additionalDetails.push(`HVZ: ${hvzField.value.join(', ')}`);
          // Set the HVZ field with option IDs
          const hvzOptionIds = hvzField.value.map(label => OPTION_IDS['HVZ']?.[label]).filter(Boolean);
          formattedData[API_MAPPING['HVZ']] = hvzOptionIds;
        }
      }

      // Add Möbellift info
      const moebelLiftInfo = inspectionData.additionalInfo.find(info => info.name === 'Möbellift');
      if (moebelLiftInfo && Array.isArray(moebelLiftInfo.value) && moebelLiftInfo.value.length > 0) {
        additionalDetails.push(`Möbellift: ${moebelLiftInfo.value.join(', ')}`);
      }

      // Add Matratzenhüllen info
      const matratzenInfo = inspectionData.additionalInfo.find(info => info.name === 'Matratzenhüllen');
      if (matratzenInfo && Array.isArray(matratzenInfo.value) && matratzenInfo.value.length > 0) {
        additionalDetails.push(`Matratzenhüllen: ${matratzenInfo.value.join(', ')}`);
      }

      // Add Ein/Auspackservice info
      const einpackInfo = inspectionData.additionalInfo.find(info => info.name === 'Einpackservice');
      if (einpackInfo && einpackInfo.value) {
        additionalDetails.push(`Einpackservice: ${einpackInfo.value}`);
      }

      const auspackInfo = inspectionData.additionalInfo.find(info => info.name === 'Auspackservice');
      if (auspackInfo && auspackInfo.value) {
        additionalDetails.push(`Auspackservice: ${auspackInfo.value}`);
      }

      if (additionalDetails.length > 0) {
        detailsText += `Zusätzliche Details:\n${additionalDetails.join('\n')}`;
      }
    }

    // Only set the field if we have content
    if (detailsText.trim()) {
      formattedData[API_MAPPING['Anmerkungen für Personal']] = detailsText;
    }
  }

  // Process additional info
  if (inspectionData.additionalInfo) {
    inspectionData.additionalInfo.forEach(info => {
      if (API_MAPPING[info.name]) {
        if (['Möbellift', 'Matratzenhüllen', 'HVZ', 'Gegebenheiten Entladestelle', 'Gegebenheiten Beladestelle'].includes(info.name)) {
          if (Array.isArray(info.value) && info.value.length > 0) {
            const optionIds = info.value.map(label => OPTION_IDS[info.name]?.[label]).filter(Boolean);
            formattedData[API_MAPPING[info.name]] = optionIds;
          }
        } else if (['Einpackservice', 'Auspackservice'].includes(info.name)) {
          formattedData[API_MAPPING[info.name]] = info.value || 'Nein';
        } else if (Array.isArray(info.value)) {
          formattedData[API_MAPPING[info.name]] = info.value.join(';');
        } else if (typeof info.value === 'boolean') {
          formattedData[API_MAPPING[info.name]] = info.value ? 'Ja' : 'Nein';
        } else if (info.value !== null && info.value !== undefined) {
          formattedData[API_MAPPING[info.name]] = info.value.toString();
        }
      }
    });
  }

  // Process pack materials from combinedData
  if (inspectionData.combinedData && inspectionData.combinedData.packMaterials) {
    Object.entries(inspectionData.combinedData.packMaterials).forEach(([name, quantity]) => {
      if (API_MAPPING[name] && name !== 'Packseide' && quantity > 0) {
        formattedData[API_MAPPING[name]] = quantity.toString();
      }
    });
  }

  // Add cbm
  if (inspectionData.combinedData) {
    const volume = inspectionData.combinedData.totalVolume;
    formattedData[API_MAPPING['cbm']] = parseFloat(volume) || 0; // Convert to number and handle null/undefined
  }

  return formattedData;
};


const updateDealDirectly = async (dealId, dealData) => {
  const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
  const apiUrl = `https://api.pipedrive.com/v1/deals/${dealId}?api_token=${apiToken}`;


  try {
    const response = await axios.put(apiUrl, dealData);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to update deal');
    }
  } catch (error) {
    console.error('Error updating deal:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
};


export { formatDealData, updateDealDirectly, updateDealForOffer };