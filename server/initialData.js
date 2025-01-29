const INITIAL_ROOMS_AND_ITEMS = {
  rooms: [
    {
      id: 'Wohnzimmer',
      name: 'Wohnzimmer',
      items: [
        { id: 'sofa2', name: 'Sofa 2-Sitzer', volume: 1.5, width: 160, length: 90, height: 85 },
        { id: 'sofa3', name: 'Sofa 3-Sitzer', volume: 2, width: 220, length: 90, height: 85 },
        { id: 'sofatisch', name: 'Sofatisch', volume: 0.5, width: 120, length: 80, height: 45 },
        { id: 'schrank2', name: 'Schrank 2-türig', volume: 1.5, width: 100, length: 60, height: 200 },
        { id: 'schrank3', name: 'Schrank 3-türig', volume: 2, width: 150, length: 60, height: 200 },
        { id: 'tisch', name: 'Tisch', volume: 1, width: 160, length: 90, height: 75 },
        { id: 'stuehle', name: 'Stühle', volume: 0.3, width: 45, length: 45, height: 95 },
        { id: 'tvbank', name: 'TV-Bank', volume: 0.8, width: 180, length: 45, height: 50 },
        { id: 'sessel', name: 'Sessel', volume: 0.8, width: 85, length: 85, height: 100 }
      ]
    },
    {
      id: 'Schlafzimmer',
      name: 'Schlafzimmer',
      items: [
        { id: 'doppelbett', name: 'Doppelbett', volume: 2.5, width: 180, length: 200, height: 40 },
        { id: 'einzelbett', name: 'Einzelbett', volume: 1.5, width: 90, length: 200, height: 40 },
        { id: 'schrank2sz', name: 'Schrank 2-türig', volume: 1.5, width: 100, length: 60, height: 200 },
        { id: 'schrank3sz', name: 'Schrank 3-türig', volume: 2, width: 150, length: 60, height: 200 },
        { id: 'schrank4', name: 'Schrank 4-türig', volume: 2.5, width: 200, length: 60, height: 200 },
        { id: 'nachtisch', name: 'Nachtisch', volume: 0.3, width: 45, length: 40, height: 50 },
        { id: 'kommode', name: 'Kommode', volume: 1, width: 100, length: 45, height: 90 }
      ]
    },
    {
      id: 'Küche',
      name: 'Küche',
      items: [
        { id: 'unterschrank', name: 'Unterschrank', volume: 0.8, width: 60, length: 60, height: 85 },
        { id: 'oberschrank', name: 'Oberschrank', volume: 0.6, width: 60, length: 35, height: 70 },
        { id: 'hochschrank', name: 'Hochschrank', volume: 1.2, width: 60, length: 60, height: 200 },
        { id: 'kuehlschrank', name: 'Kühlschrank', volume: 1, width: 60, length: 65, height: 170 },
        { id: 'amikuehlschrank', name: 'Amerikanischer Kühlschrank', volume: 1.5, width: 90, length: 70, height: 180 }
      ]
    },
    {
      id: 'Badezimmer',
      name: 'Badezimmer',
      items: [
        { id: 'waschmaschine', name: 'Waschmaschine / Trockner', volume: 0.8, width: 60, length: 60, height: 85 },
        { id: 'regalbad', name: 'Regal', volume: 0.5, width: 60, length: 35, height: 180 }
      ]
    },
    {
      id: 'Arbeitszimmer',
      name: 'Arbeitszimmer',
      items: [
        { id: 'schreibtisch', name: 'Schreibtisch', volume: 1, width: 160, length: 80, height: 75 },
        { id: 'schreibtischstuhl', name: 'Schreibtischstuhl', volume: 0.4, width: 65, length: 65, height: 120 },
        { id: 'regalaz', name: 'Regal', volume: 0.8, width: 80, length: 40, height: 180 },
        { id: 'schrank2az', name: 'Schrank 2-türig', volume: 1.5, width: 100, length: 60, height: 200 },
        { id: 'schrank3az', name: 'Schrank 3-türig', volume: 2, width: 150, length: 60, height: 200 }
      ]
    }
  ]
};

module.exports = INITIAL_ROOMS_AND_ITEMS;