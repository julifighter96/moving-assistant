import React, { useMemo, useEffect, useState } from 'react';
import { updateDealForOffer } from '../utils/dealUpdateFunctions';
import { addNoteToDeal } from '../services/pipedriveService';
import { adminService } from '../services/adminService';

const PRICE_MAP = {
  'furniture': 50,
  'Umzugskartons (Standard)': 2,
  'Bücherkartons (Bücher&Geschirr)': 5,
  'Kleiderkisten': 3,
};

const OfferComponent = ({ inspectionData, dealId, onComplete }) => {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPrices = async () => {
      try {
        const loadedPrices = await adminService.getPrices();
        setPrices(loadedPrices.reduce((acc, price) => {
          acc[price.name] = price.price;
          return acc;
        }, {}));
        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Preise');
        console.error(err);
      }
    };
    loadPrices();
  }, []);

  const { furnitureCost, materialCost, totalCost, combinedData } = useMemo(() => {
    if (!prices) return { 
      furnitureCost: 0, 
      materialCost: 0, 
      totalCost: 0,
      combinedData: {
        items: {},
        packMaterials: {},
        totalVolume: 0,
        estimatedWeight: 0,
        demontageCount: 0,
        duebelarbeitenCount: 0
      }
    };

    const combinedData = {
      items: {},
      packMaterials: {},
      totalVolume: 0,
      estimatedWeight: 0,
      demontageCount: 0,
      duebelarbeitenCount: 0
    };

    // Daten aus den Räumen kombinieren
    Object.values(inspectionData.rooms).forEach(room => {
      room.items.forEach(item => {
        if (!combinedData.items[item.name]) {
          combinedData.items[item.name] = { ...item, quantity: 0 };
        }
        combinedData.items[item.name].quantity += item.quantity;
        if (item.demontiert) combinedData.demontageCount += item.quantity;
        if (item.duebelarbeiten) combinedData.duebelarbeitenCount += item.quantity;
      });

      room.packMaterials.forEach(material => {
        combinedData.packMaterials[material.name] = 
          (combinedData.packMaterials[material.name] || 0) + material.quantity;
      });

      combinedData.totalVolume += room.totalVolume;
      combinedData.estimatedWeight += room.estimatedWeight;
    });

    // Kosten berechnen mit Preisen aus der Datenbank
    const furnitureCost = combinedData.totalVolume * (prices.furniture || 0);
    const materialCost = Object.entries(combinedData.packMaterials).reduce((total, [name, quantity]) => {
      return total + (prices[name] || 0) * quantity;
    }, 0);

    return {
      furnitureCost,
      materialCost,
      totalCost: furnitureCost + materialCost,
      combinedData
    };
  }, [inspectionData, prices]);

  if (loading) {
    return <div>Lade Preise...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  const handleAcceptOffer = async () => {
    try {
      console.log('Starting offer acceptance with inspection data:', inspectionData);
      
      // Create offer details with the complete room data
      const offerDetails = {
        rooms: inspectionData.rooms,
        additionalInfo: inspectionData.additionalInfo,
        combinedData: combinedData, // This includes all the calculated totals
        moveInfo: inspectionData.moveInfo
      };

      console.log('Sending offer details to updateDealForOffer:', offerDetails);
      await updateDealForOffer(dealId, offerDetails);

      const roomNotesSection = Object.entries(inspectionData.rooms)
      .filter(([_, roomData]) => roomData.notes && roomData.notes.trim())
      .map(([roomName, roomData]) => `\n\nNotizen ${roomName}:\n${roomData.notes}`)
      .join('\n');


      const noteContent = `Gesamtvolumen: ${combinedData.totalVolume.toFixed(2)} m³\n` +
      `Geschätztes Gewicht: ${Math.round(combinedData.estimatedWeight)} kg\n` +
      `Möbelkosten: ${furnitureCost.toFixed(2)} €\n` +
      `Materialkosten: ${materialCost.toFixed(2)} €\n` +
      `Gesamtkosten: ${totalCost.toFixed(2)} €\n\n` +
      
      `Möbel:\n${Object.entries(combinedData.items)
        .map(([name, item]) => `${name}: ${item.quantity} (Demontiert: ${item.demontiert ? 'Ja' : 'Nein'}, Dübelarbeiten: ${item.duebelarbeiten ? 'Ja' : 'Nein'})`)
        .join('\n')}\n\n` +
      
      `Packmaterialien:\n${Object.entries(combinedData.packMaterials)
        .map(([name, quantity]) => `${name}: ${quantity}`)
        .join('\n')}` +
      roomNotesSection;

    await addNoteToDeal(dealId, noteContent);
      onComplete();
    } catch (error) {
      console.error('Fehler beim Verarbeiten des Angebots:', error);
      alert(`Es gab einen Fehler beim Verarbeiten des Angebots: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Umzugsangebot</h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Zusammenfassung</h3>
        <p>Gesamtvolumen: {combinedData.totalVolume.toFixed(2)} m³</p>
        <p>Geschätztes Gewicht: {Math.round(combinedData.estimatedWeight)} kg</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Möbel</h3>
        <ul>
          {Object.entries(combinedData.items).map(([name, item]) => (
            <li key={name}>
              {name}: {item.quantity} (Volumen: {item.volume} m³)
            </li>
          ))}
        </ul>
      </div>

            <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Raum Notizen</h3>
        {Object.entries(inspectionData.rooms)
          .filter(([_, roomData]) => roomData.notes && roomData.notes.trim())
          .map(([roomName, roomData]) => (
            <div key={roomName} className="mb-4">
              <h4 className="font-medium">{roomName}</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{roomData.notes}</p>
            </div>
          ))}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Packmaterialien</h3>
        <ul>
          {Object.entries(combinedData.packMaterials).map(([name, quantity]) => (
            <li key={name}>{name}: {quantity}</li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Kostenaufstellung</h3>
        <p>Möbeltransport: {furnitureCost.toFixed(2)} €</p>
        <p>Packmaterialien: {materialCost.toFixed(2)} €</p>
        <p className="font-bold">Gesamtkosten: {totalCost.toFixed(2)} €</p>
      </div>

      <button 
        onClick={handleAcceptOffer}
        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition duration-200"
      >
        Angebot akzeptieren und Deal aktualisieren
      </button>
    </div>
  );
};

export default OfferComponent;