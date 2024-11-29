// src/modules/inspection/constants.js

export const APP_VERSION = 'v1.0.1';

export const INITIAL_ROOMS = ['Wohnzimmer', 'Schlafzimmer', 'Küche', 'Badezimmer', 'Arbeitszimmer'];

export const DEFAULT_ROOM_INVENTORY = {
  'Wohnzimmer': [
    { name: 'Sofa 2-Sitzer', quantity: 0, volume: 1.5 },
    { name: 'Sofa 3-Sitzer', quantity: 0, volume: 2 },
    { name: 'Sofatisch', quantity: 0, volume: 0.5 },
    { name: 'Schrank 2-türig', quantity: 0, volume: 1.5 },
    { name: 'Schrank 3-türig', quantity: 0, volume: 2 },
    { name: 'Tisch', quantity: 0, volume: 1 },
    { name: 'Stühle', quantity: 0, volume: 0.3 },
    { name: 'TV-Bank', quantity: 0, volume: 0.8 },
    { name: 'Sessel', quantity: 0, volume: 0.8 },
  ],
  'Schlafzimmer': [
    { name: 'Doppelbett', quantity: 0, volume: 2.5 },
    { name: 'Einzelbett', quantity: 0, volume: 1.5 },
    { name: 'Schrank 2-türig', quantity: 0, volume: 1.5 },
    { name: 'Schrank 3-türig', quantity: 0, volume: 2 },
    { name: 'Schrank 4-türig', quantity: 0, volume: 2.5 },
    { name: 'Nachtisch', quantity: 0, volume: 0.3 },
    { name: 'Kommode', quantity: 0, volume: 1 },
  ],
  'Küche': [
    { name: 'Unterschrank', quantity: 0, volume: 0.8 },
    { name: 'Oberschrank', quantity: 0, volume: 0.6 },
    { name: 'Hochschrank', quantity: 0, volume: 1.2 },
    { name: 'Kühlschrank', quantity: 0, volume: 1 },
    { name: 'Amerikanischer Kühlschrank', quantity: 0, volume: 1.5 },
  ],
  'Badezimmer': [
    { name: 'Waschmaschine / Trockner', quantity: 0, volume: 0.8 },
    { name: 'Regal', quantity: 0, volume: 0.5 },
  ],
  'Arbeitszimmer': [
    { name: 'Schreibtisch', quantity: 0, volume: 1 },
    { name: 'Schreibtischstuhl', quantity: 0, volume: 0.4 },
    { name: 'Regal', quantity: 0, volume: 0.8 },
    { name: 'Schrank 2-türig', quantity: 0, volume: 1.5 },
    { name: 'Schrank 3-türig', quantity: 0, volume: 2 },
  ],
};

export const DEFAULT_PACK_MATERIALS = [
  { name: 'Umzugskartons (Standard)', quantity: 0 },
  { name: 'Bücherkartons (Bücher&Geschirr)', quantity: 0 },
  { name: 'Kleiderkisten', quantity: 0 },
  { name: 'Packseide', quantity: 0, incrementBy: 10 }
];

export const STEPS = [
  { label: 'Deal auswählen', status: 'pending' },
  { label: 'Umzugsinformationen', status: 'pending' },
  { label: 'Räume & Gegenstände', status: 'pending' },
  { label: 'Zusätzliche Details', status: 'pending' },
  { label: 'Angebot erstellen', status: 'pending' },
  { label: 'Beladungssimulation', status: 'pending' },
  { label: 'Administration', status: 'pending', id: 'admin' }
];