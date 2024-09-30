import React, { useMemo } from 'react';
import { updateDeal } from '../utils/dealUpdateFunctions';

const PRICE_MAP = {
  'furniture': 50,
  'Umzugskartons (Standard)': 2,
  'Bücherkartons (Bücher&Geschirr)': 5,
  'Kleiderkisten': 3,
};


const OfferComponent = ({ inspectionData, dealId, onSubmit }) => {
  const combinedData = useMemo(() => {
    const items = {};
    const packMaterials = {};
    let totalVolume = 0;
    let estimatedWeight = 0;

    Object.values(inspectionData.rooms).forEach(room => {
      room.items.forEach(item => {
        items[item.name] = (items[item.name] || 0) + item.quantity;
      });

      room.packMaterials.forEach(material => {
        packMaterials[material.name] = (packMaterials[material.name] || 0) + material.quantity;
      });

      totalVolume += room.totalVolume;
      estimatedWeight += room.estimatedWeight;
    });

    return { items, packMaterials, totalVolume, estimatedWeight };
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

  const renderAdditionalInfo = () => {
    if (!inspectionData.additionalInfo) return null;

    return (
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Zusätzliche Informationen</h3>
        <ul>
          {inspectionData.additionalInfo.map((info, index) => (
            <li key={index} className="flex justify-between">
              <span>{info.name}</span>
              <span>{Array.isArray(info.value) ? info.value.join(', ') : info.value.toString()}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const handleAcceptOffer = async () => {
    try {
      await updateDeal(dealId, {
        ...combinedData,
        additionalInfo: inspectionData.additionalInfo,
        furnitureCost,
        materialCost,
        totalCost
      });
      alert('Angebot wurde erfolgreich akzeptiert und der Deal aktualisiert.');
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Deals:', error);
      alert('Es gab einen Fehler beim Aktualisieren des Deals. Bitte versuchen Sie es erneut.');
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
          {Object.entries(combinedData.items).map(([name, quantity]) => (
            <li key={name} className="flex justify-between">
              <span>{name}</span>
              <span>{quantity} Stück</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Packmaterialien</h3>
        <ul>
          {Object.entries(combinedData.packMaterials).map(([name, quantity]) => (
            <li key={name} className="flex justify-between">
              <span>{name}</span>
              <span>{quantity} Stück</span>
            </li>
          ))}
        </ul>
      </div>

      {renderAdditionalInfo()}

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