import axios from 'axios';

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
  }
};



const formatDealData = (inspectionData) => {
  console.log('Formatting deal data. Inspection data:', inspectionData);

  const formattedData = {};

  // Process additional info
  if (inspectionData.additionalInfo) {
    inspectionData.additionalInfo.forEach(info => {
      if (API_MAPPING[info.name]) {
        if (['Möbellift', 'Matratzenhüllen', 'HVZ', 'Gegebenheiten Entladestelle', 'Gegebenheiten Beladestelle'].includes(info.name)) {
          if (Array.isArray(info.value) && info.value.length > 0) {
            const optionIds = info.value.map(label => OPTION_IDS[info.name]?.[label]).filter(Boolean);
            formattedData[API_MAPPING[info.name]] = optionIds;
          }
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

  // Process pack materials
  if (inspectionData.rooms) {
    Object.values(inspectionData.rooms).forEach(room => {
      room.packMaterials.forEach(material => {
        if (API_MAPPING[material.name]) {
          formattedData[API_MAPPING[material.name]] = (parseInt(formattedData[API_MAPPING[material.name]] || 0) + material.quantity).toString();
        }
      });
    });
  }

  // Add cbm
  if (inspectionData.combinedData) {
    formattedData[API_MAPPING['cbm']] = inspectionData.combinedData.totalVolume.toFixed(2);
  }

  console.log('Formatted data:', formattedData);
  return formattedData;
};

const updateDealForOffer = async (dealId, dealData) => {
  const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
  const apiUrl = `https://api.pipedrive.com/v1/deals/${dealId}?api_token=${apiToken}`;

  console.log('Raw deal data for offer:', dealData);

  const formattedData = formatDealData(dealData);
  console.log('Formatted data to be sent to Pipedrive:', formattedData);

  try {
    const response = await axios.put(apiUrl, formattedData);
    console.log('Response from Pipedrive:', response.data);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to update deal');
    }
  } catch (error) {
    console.error('Error updating deal for offer:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
};

const updateDealDirectly = async (dealId, dealData) => {
  const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
  const apiUrl = `https://api.pipedrive.com/v1/deals/${dealId}?api_token=${apiToken}`;

  console.log('Updating deal directly with data:', dealData);

  try {
    const response = await axios.put(apiUrl, dealData);
    console.log('Response from Pipedrive:', response.data);
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