import React, { useMemo } from 'react';
import { getDeal, addNoteToDeal } from '../services/pipedriveService';
import { updateDealForOffer } from '../utils/dealUpdateFunctions';

const PRICE_MAP = {
  'furniture': 50,
  'Umzugskartons (Standard)': 2,
  'Bücherkartons (Bücher&Geschirr)': 5,
  'Kleiderkisten': 3,
};

const OfferComponent = ({ inspectionData, dealId, onComplete }) => {
  const combinedData = useMemo(() => {
    const items = {};
    const packMaterials = {};
    let totalVolume = 0;
    let estimatedWeight = 0;
    let demontageCount = 0;
    let duebelarbeitenCount = 0;

    Object.values(inspectionData.rooms).forEach(room => {
      room.items.forEach(item => {
        if (!items[item.name]) {
          items[item.name] = { ...item, quantity: 0 };
        }
        items[item.name].quantity += item.quantity;
        if (item.demontiert) demontageCount += item.quantity;
        if (item.duebelarbeiten) duebelarbeitenCount += item.quantity;
      });

      room.packMaterials.forEach(material => {
        packMaterials[material.name] = (packMaterials[material.name] || 0) + material.quantity;
      });

      totalVolume += room.totalVolume;
      estimatedWeight += room.estimatedWeight;
    });

    return { items, packMaterials, totalVolume, estimatedWeight, demontageCount, duebelarbeitenCount };
  }, [inspectionData]);

  const { furnitureCost, materialCost, totalCost } = useMemo(() => {
    const furnitureCost = combinedData.totalVolume * PRICE_MAP.furniture;
    const materialCost = Object.entries(combinedData.packMaterials).reduce((total, [name, quantity]) => {
      return total + (PRICE_MAP[name] || 0) * quantity;
    }, 0);
    return {
      furnitureCost,
      materialCost,
      totalCost: furnitureCost + materialCost
    };
  }, [combinedData]);

  const handleAcceptOffer = async () => {
    try {
      const offerDetails = {
        additionalInfo: inspectionData.additionalInfo,
        packMaterials: combinedData.packMaterials,
        totalVolume: combinedData.totalVolume,
        estimatedWeight: combinedData.estimatedWeight,
        // Include other necessary fields here
      };

      console.log('Offer details before sending:', offerDetails);
      await updateDealForOffer(dealId, offerDetails);
  
      // Prepare note content
      const noteContent = `Angebot Details:
  Gesamtvolumen: ${combinedData.totalVolume.toFixed(2)} m³
  Geschätztes Gewicht: ${Math.round(combinedData.estimatedWeight)} kg
  Möbelkosten: ${furnitureCost.toFixed(2)} €
  Materialkosten: ${materialCost.toFixed(2)} €
  Gesamtkosten: ${totalCost.toFixed(2)} €
  
  Möbel:
  ${Object.entries(combinedData.items).map(([name, item]) => 
    `${name}: ${item.quantity} (Demontiert: ${item.demontiert ? 'Ja' : 'Nein'}, Dübelarbeiten: ${item.duebelarbeiten ? 'Ja' : 'Nein'})`
  ).join('\n')}
  
  Packmaterialien:
  ${Object.entries(combinedData.packMaterials).map(([name, quantity]) => `${name}: ${quantity}`).join('\n')}
  
  Zusätzliche Informationen:
  ${inspectionData.additionalInfo ? inspectionData.additionalInfo.map(info => `${info.name}: ${Array.isArray(info.value) ? info.value.join(', ') : info.value}`).join('\n') : 'Keine'}`;
  
      // Add the note to the deal
      await addNoteToDeal(dealId, noteContent);
  
      onComplete();
    } catch (error) {
      console.error('Fehler beim Verarbeiten des Angebots:', error);
      alert(`Es gab einen Fehler beim Verarbeiten des Angebots: ${error.message}`);
    }
  };

  const renderItems = () => (
    <ul>
      {Object.entries(combinedData.items).map(([name, item]) => (
        <li key={name}>
          {name}: {item.quantity} (Volumen: {item.volume} m³)
        </li>
      ))}
    </ul>
  );

  const renderPackMaterials = () => (
    <ul>
      {Object.entries(combinedData.packMaterials).map(([name, quantity]) => (
        <li key={name}>{name}: {quantity}</li>
      ))}
    </ul>
  );

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
        {renderItems()}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Packmaterialien</h3>
        {renderPackMaterials()}
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