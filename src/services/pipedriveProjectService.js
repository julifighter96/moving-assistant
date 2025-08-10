/**
 * Pipedrive Project Service - Exakte Kopie der TourPlanner.js Logik
 * Lädt Projekte direkt von der Pipedrive API wie in TourPlanner.js
 */

// Konstanten aus TourPlanner.js
const SCHLAILE_FIXED_ADDRESS = "Kaiserstraße 175, 76133 Karlsruhe, Deutschland";
const SCHLAILE_TYPE_DELIVERY = "148";
const SCHLAILE_TYPE_PICKUP = "149";
const SCHLAILE_TRANSPORT_TYPE_KEY = "7a2f7e7908160ae7e6288c0a238b74328a5eb4af";
const PIANO_FLOOR_COUNT_FIELD_KEY = "384e703f3b71a344cbff7adf46f2eab3ff28c0a0";
const ORIGIN_FLOOR_FIELD_KEY = "9e4e07bce884e21671546529b564da98ceb4765a";
const DESTINATION_FLOOR_FIELD_KEY = "72cfdc30fa0621d1d6947cf408409e44c6bb40d6";
const SCHLAILE_DELIVERY_FLOOR_FIELD_KEY = "2c2118401f79c6d3276e7bce4aaa41e4decd7592";
// const GRAND_PIANO_SIZE_FIELD_KEY = "DEINE_PIPEDRIVE_FLUEGELGROESSE_FELD_ID"; // Unused

// Regionen Definition (exakt aus TourPlanner.js)
export const REGIONS = [
  { id: 'all', name: 'Alle Regionen', phase_id: null },
  { id: 'nord', name: 'Norden', phase_id: 19 },
  { id: 'sued', name: 'Süden', phase_id: 21 },
  { id: 'ost', name: 'Osten', phase_id: 22 },
  { id: 'west', name: 'Westen', phase_id: 23 },
  { id: 'ka', name: 'Karlsruhe', phase_id: 20 },
];

// Regionname aus phase_id ermitteln
export const getRegionNameFromPhaseId = (phaseId) => {
  const region = REGIONS.find(r => r.phase_id === phaseId);
  return region ? region.name : 'Unbekannt';
};

// Hilfsfunktion zur Verarbeitung von Projektdaten (exakt aus TourPlanner.js)
export const processProjects = async (projectsData, resultArray, apiToken) => {
  for (const project of projectsData) {
    let dealObjectToAdd = null;
    try {
      if (project.deal_ids && project.deal_ids.length > 0) {
        const dealId = project.deal_ids[0];
        const dealResponse = await fetch(`https://api.pipedrive.com/v1/deals/${dealId}?api_token=${apiToken}`);
        const dealData = await dealResponse.json();

        if (dealData.success && dealData.data) {
          // Definiere die bekannten Feld-IDs hier
          const knownFieldIds = {
            originAddress: process.env.REACT_APP_PIPEDRIVE_ADDRESS_FIELD_KEY || '07c3da8804f7b96210e45474fba35b8691211ddd',
            destinationAddress: process.env.REACT_APP_PIPEDRIVE_DELIVERY_ADDRESS_FIELD_KEY || '9cb4de1018ec8404feeaaaf7ee9b293c78c44281',
            moveDate: process.env.REACT_APP_PIPEDRIVE_MOVE_DATE_FIELD_KEY || '949696aa9d99044db90383a758a74675587ed893'
          };

          let originAddress = dealData.data[knownFieldIds.originAddress] || '';
          let destinationAddress = dealData.data[knownFieldIds.destinationAddress] || '';
          let moveDate = dealData.data[knownFieldIds.moveDate] || '';

          // Heuristik, falls bekannte Felder leer sind
          if ((!originAddress || !destinationAddress) && typeof dealData.data === 'object') {
            for (const [key, value] of Object.entries(dealData.data)) {
              if (key.length > 30 && typeof value === 'string' && value.trim().length > 5) {
                if (!originAddress && (value.toLowerCase().includes('straße') || /\d{5}/.test(value))) {
                  originAddress = value;
                } else if (!destinationAddress && (value.toLowerCase().includes('straße') || /\d{5}/.test(value))) {
                  destinationAddress = value;
                }
              }
            }
          }

          // Standardadressen zuerst holen
          let originAddressFinal = originAddress.trim();
          let destinationAddressFinal = destinationAddress.trim();
          const schlaileTransportType = dealData.data[SCHLAILE_TRANSPORT_TYPE_KEY];

          if (schlaileTransportType === SCHLAILE_TYPE_DELIVERY) {
            // Lieferung VON Schlaile: Start ist die feste Schlaile-Adresse
            originAddressFinal = SCHLAILE_FIXED_ADDRESS;
          } else if (schlaileTransportType === SCHLAILE_TYPE_PICKUP) {
            // Abholung BEI Kunde für Schlaile: Ziel ist die feste Schlaile-Adresse
            destinationAddressFinal = SCHLAILE_FIXED_ADDRESS;
          }

          // Stockwerk-Informationen abrufen
          const originFloor = dealData.data[ORIGIN_FLOOR_FIELD_KEY] || '';
          const destinationFloor = dealData.data[DESTINATION_FLOOR_FIELD_KEY] || '';
          const schlaileDeliveryFloor = dealData.data[SCHLAILE_DELIVERY_FLOOR_FIELD_KEY] || '';

          // Erstelle das Objekt
          dealObjectToAdd = {
            id: project.id,
            dealId: dealId,
            title: project.title || dealData.data.title,
            organization: dealData.data.org_name,
            moveDate: moveDate || project.start_date,
            originAddress: originAddressFinal,
            destinationAddress: destinationAddressFinal,
            value: dealData.data.value,
            currency: dealData.data.currency,
            region: getRegionNameFromPhaseId(project.phase_id),
            projectStartDate: project.start_date,
            projectEndDate: project.end_date,
            schlaileType: schlaileTransportType || null,
            status: dealData.data.status, // Für OrderManagement
            person_name: dealData.data.person_name,
            phone: dealData.data.person_phone,
            email: dealData.data.person_email,
            notes: dealData.data.notes,
            add_time: dealData.data.add_time,
            update_time: dealData.data.update_time,
            // Stockwerk-Felder
            originFloor: originFloor,
            destinationFloor: destinationFloor,
            [PIANO_FLOOR_COUNT_FIELD_KEY]: dealData.data[PIANO_FLOOR_COUNT_FIELD_KEY] || 0,
            [SCHLAILE_DELIVERY_FLOOR_FIELD_KEY]: schlaileDeliveryFloor
          };

        } else {
          // Fallback-Objekt
          dealObjectToAdd = {
            id: project.id,
            dealId: dealId,
            title: project.title,
            region: getRegionNameFromPhaseId(project.phase_id),
            moveDate: project.start_date,
            projectStartDate: project.start_date,
            projectEndDate: project.end_date,
            originAddress: '',
            destinationAddress: '',
            schlaileType: null,
            status: 'unknown',
            organization: '',
            person_name: '',
            phone: '',
            email: '',
            notes: '',
            value: 0,
            currency: 'EUR',
            originFloor: '',
            destinationFloor: '',
            [PIANO_FLOOR_COUNT_FIELD_KEY]: 0,
            [SCHLAILE_DELIVERY_FLOOR_FIELD_KEY]: '',
          };
        }
      } else {
        // Fallback ohne Deal-IDs
        dealObjectToAdd = {
          id: project.id,
          dealId: null,
          title: project.title,
          region: getRegionNameFromPhaseId(project.phase_id),
          moveDate: project.start_date,
          projectStartDate: project.start_date,
          projectEndDate: project.end_date,
          originAddress: '',
          destinationAddress: '',
          schlaileType: null,
          status: 'unknown',
          organization: '',
          person_name: '',
          phone: '',
          email: '',
          notes: '',
          value: 0,
          currency: 'EUR',
          originFloor: '',
          destinationFloor: '',
          [PIANO_FLOOR_COUNT_FIELD_KEY]: 0,
          [SCHLAILE_DELIVERY_FLOOR_FIELD_KEY]: '',
        };
      }
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      console.error(`Fehler bei der Verarbeitung von Projekt ${project.id}:`, error);
      dealObjectToAdd = {
        id: project.id,
        dealId: project.deal_ids?.[0] || null,
        title: project.title + " (Fehler bei Verarbeitung)",
        region: getRegionNameFromPhaseId(project.phase_id),
        moveDate: project.start_date,
        projectStartDate: project.start_date,
        projectEndDate: project.end_date,
        originAddress: '',
        destinationAddress: '',
        schlaileType: null,
        status: 'error',
        organization: '',
        person_name: '',
        phone: '',
        email: '',
        notes: '',
        value: 0,
        currency: 'EUR',
        originFloor: '',
        destinationFloor: '',
        [PIANO_FLOOR_COUNT_FIELD_KEY]: 0,
        [SCHLAILE_DELIVERY_FLOOR_FIELD_KEY]: '',
      };
    }

    if (dealObjectToAdd) {
      resultArray.push(dealObjectToAdd);
    }
  }

  return resultArray;
};

// Hauptfunktion zum Laden der Deals (exakt aus TourPlanner.js)
export const fetchDeals = async (selectedRegion = 'all') => {
  const apiToken = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;
  if (!apiToken) {
    console.error("Pipedrive API Token nicht gefunden!");
    throw new Error("Pipedrive API Token nicht konfiguriert");
  }

  const cacheKeyBase = `projects_tourplanner_v2`;
  const cacheKey = `${cacheKeyBase}_${selectedRegion}`;
  const cachedProjects = localStorage.getItem(cacheKey);
  const cacheDuration = 15 * 60 * 1000; // 15 Minuten

  // Cache prüfen
  if (cachedProjects) {
    const { data, timestamp } = JSON.parse(cachedProjects);
    if (Date.now() - timestamp < cacheDuration) {
      console.log(`[Pipedrive Service] Verwende Cache für Region ${selectedRegion}`);
      return data;
    } else {
      localStorage.removeItem(cacheKey);
    }
  }

  console.log(`[Pipedrive Service] Lade Daten für Region ${selectedRegion}`);
  let allProjectsWithDetails = [];

  const regionsToFetch = selectedRegion === 'all'
    ? REGIONS.filter(r => r.id !== 'all' && r.phase_id !== null)
    : REGIONS.filter(r => r.id === selectedRegion && r.phase_id !== null);

  if (regionsToFetch.length === 0 && selectedRegion !== 'all') {
    console.warn(`Keine gültige Phase ID für Region ${selectedRegion} gefunden.`);
    return [];
  }

  for (const region of regionsToFetch) {
    try {
      console.log(`[Pipedrive Service] Lade Projekte für Region ${region.name} (Phase ${region.phase_id})`);
      const projectsUrl = `https://api.pipedrive.com/v1/projects?status=open&phase_id=${region.phase_id}&api_token=${apiToken}&limit=100`;
      const projectsResponse = await fetch(projectsUrl);
      
      if (!projectsResponse.ok) {
        throw new Error(`API request failed with status ${projectsResponse.status}`);
      }
      
      const projectsData = await projectsResponse.json();

      if (projectsData.success && Array.isArray(projectsData.data) && projectsData.data.length > 0) {
        console.log(`[Pipedrive Service] Verarbeite ${projectsData.data.length} Projekte für Region ${region.name}`);
        await processProjects(projectsData.data, allProjectsWithDetails, apiToken);
      } else if (!projectsData.success) {
        console.warn(`API-Anfrage für Region ${region.name} nicht erfolgreich:`, projectsData.error || 'Unbekannter Fehler');
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Fehler beim Laden der Projekte für Region ${region.name}:`, error);
    }
  }

  // Cache speichern
  localStorage.setItem(cacheKey, JSON.stringify({ data: allProjectsWithDetails, timestamp: Date.now() }));
  
  console.log(`[Pipedrive Service] ${allProjectsWithDetails.length} Projekte geladen und gecacht`);
  return allProjectsWithDetails;
};

// Hilfsfunktionen für Datenverarbeitung
export const filterDeals = (dealsToFilter, searchQuery = '', statusFilter = 'all') => {
  if (!Array.isArray(dealsToFilter)) {
    return [];
  }
  
  let filtered = [...dealsToFilter];
  
  // Nach Status filtern
  if (statusFilter !== 'all') {
    filtered = filtered.filter(deal => {
      if (!deal) return false;
      const dealStatus = deal.status || 'unknown';
      return dealStatus === statusFilter;
    });
  }
  
  // Nach Suchbegriff filtern
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    filtered = filtered.filter(deal =>
      deal && (
        deal.title?.toLowerCase().includes(lowerQuery) ||
        deal.organization?.toLowerCase().includes(lowerQuery) ||
        deal.originAddress?.toLowerCase().includes(lowerQuery) ||
        deal.destinationAddress?.toLowerCase().includes(lowerQuery) ||
        deal.dealId?.toString().includes(lowerQuery) ||
        deal.person_name?.toLowerCase().includes(lowerQuery)
      )
    );
  }
  
  return filtered;
};
