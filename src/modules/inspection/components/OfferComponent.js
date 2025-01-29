import React, { useState, useEffect, useMemo } from 'react';
import { Package, Truck, Calculator, ClipboardList, FileText } from 'lucide-react';
import { updateDealForOffer } from '../utils/dealUpdateFunctions';
import { addNoteToDeal } from '../services/pipedriveService';
import MovingPriceCalculator from './MovingPriceCalculator';

const OfferComponent = ({ moveInfo, roomsData, additionalInfo, dealId, onComplete, setCurrentStep, volumeReductions = {}, onVolumeReductionChange }) => {
 const [showPriceCalculator, setShowPriceCalculator] = useState(false);
 const [totalCost, setTotalCost] = useState(0);

 const { furnitureCost, materialCost, combinedData } = useMemo(() => {
  console.log('Berechne combinedData mit volumeReductions:', volumeReductions);
  
  const combinedData = {
    items: {},
    packMaterials: {},
    totalVolume: 0,
    customWeightTotal: 0,
    volumeBasedWeightTotal: 0,
    itemsWithCustomWeight: 0,
    itemsWithVolumeWeight: 0,
    demontageCount: 0,
    duebelarbeitenCount: 0
  };

  Object.values(roomsData || {}).forEach(room => {
    room.items.forEach(item => {
      if (!combinedData.items[item.name]) {
        combinedData.items[item.name] = { ...item, quantity: 0 };
      }
      combinedData.items[item.name].quantity += item.quantity;
      if (item.demontiert) combinedData.demontageCount += item.quantity;
      if (item.duebelarbeiten) combinedData.duebelarbeitenCount += item.quantity;
      
      // Berechne das Volumen OHNE Reduktion
      const itemVolume = (item.length * item.width * item.height * item.quantity) / 1000000;
      
      console.log('Item Volumen berechnet:', {
        name: item.name,
        dimensions: { length: item.length, width: item.width, height: item.height },
        quantity: item.quantity,
        volume: itemVolume
      });

      if (item.weight) {
        combinedData.customWeightTotal += item.weight * item.quantity;
        combinedData.itemsWithCustomWeight += item.quantity;
      } else {
        // Wende die Reduktion NUR auf das volumeBasedWeight an
        const reductionFactor = volumeReductions[item.name] || 1;
        combinedData.volumeBasedWeightTotal += itemVolume * 200 * reductionFactor;
        combinedData.itemsWithVolumeWeight += item.quantity;
      }
      
      // Wende die Reduktion NUR auf das Gesamtvolumen an
      const reductionFactor = volumeReductions[item.name] || 1;
      combinedData.totalVolume += itemVolume * reductionFactor;
    });

    room.packMaterials.forEach(material => {
      combinedData.packMaterials[material.name] = 
        (combinedData.packMaterials[material.name] || 0) + material.quantity;
    });
  });

  // Calculate estimated weight (200kg per m³)
  combinedData.estimatedWeight = combinedData.customWeightTotal + combinedData.volumeBasedWeightTotal;

  // Calculate costs
  const BASE_RATE = 50; // €/m³
  const furnitureCost = combinedData.totalVolume * BASE_RATE;

  const materialCost = Object.entries(combinedData.packMaterials).reduce((total, [name, quantity]) => {
    const prices = {
      'Umzugskartons (Standard)': 2,
      'Bücherkartons (Bücher&Geschirr)': 5,
      'Kleiderkisten': 3,
    };
    return total + (prices[name] || 0) * quantity;
  }, 0);

  console.log('Berechnete combinedData:', combinedData);
  return {
    furnitureCost,
    materialCost,
    combinedData
  };
}, [roomsData, volumeReductions]);

 useEffect(() => {
   setTotalCost(furnitureCost + materialCost);
 }, [furnitureCost, materialCost]);

  // Filter out items with quantity 0
  const activeItems = Object.entries(combinedData.items || {})
    .filter(([_, item]) => item.quantity > 0);
  
  const activePackMaterials = Object.entries(combinedData.packMaterials || {})
    .filter(([_, quantity]) => quantity > 0);

    const handleAcceptOffer = async () => {
      try {
        const offerDetails = {
          rooms: roomsData,
          additionalInfo: additionalInfo,
          combinedData: combinedData,
          moveInfo: moveInfo
        };
     
        // Hauptinfo
        const summarySection = `Gesamtvolumen: ${combinedData.totalVolume.toFixed(2)} m³
Gewicht Details:
- Manuell eingegebenes Gewicht (${combinedData.itemsWithCustomWeight} Artikel): ${Math.round(combinedData.customWeightTotal)} kg
- Volumenbasiertes Gewicht (${combinedData.itemsWithVolumeWeight} Artikel): ${Math.round(combinedData.volumeBasedWeightTotal)} kg
- Gesamtgewicht: ${Math.round(combinedData.estimatedWeight)} kg
Möbelkosten: ${furnitureCost.toFixed(2)} €
Materialkosten: ${materialCost.toFixed(2)} €
Gesamtkosten: ${totalCost.toFixed(2)} €\n`;
     
        // Packmaterial Sektion
        const packingSection = Object.entries(combinedData.packMaterials)
          .filter(([_, quantity]) => quantity > 0)
          .map(([name, quantity]) => `${name}: ${quantity}`)
          .join('\n');
     
        // Räume mit Möbeln und Notizen
        const roomsSection = Object.entries(roomsData)
  .map(([roomName, roomData]) => {
    const roomItems = roomData.items
      .filter(item => item.quantity > 0)
      .map(item => {
        let itemStr = `  - ${item.name} (${item.quantity}x)`;
        const options = [];
        if (item.demontiert) options.push('Demontiert');
        if (item.duebelarbeiten) options.push('Dübelarbeiten');
        if (item.remontiert) options.push('Remontiert');
        if (item.elektro) options.push('Elektro');

        if (options.length > 0) {
          itemStr += ` [${options.join(', ')}]`;
        }
        return itemStr;
      })
      .join('\n');
     
            const roomNote = roomData.notes ? `\nNotizen:\n${roomData.notes}` : '';
            
            return roomItems || roomNote ? 
              `\n${roomName}:\n${roomItems}${roomNote}` : '';
          })
          .filter(section => section)
          .join('\n');
     
        const noteContent = [
          summarySection,
          '\nPackmaterialien:',
          packingSection,
          roomsSection
        ].join('\n');
     
        await updateDealForOffer(dealId, offerDetails);
        await addNoteToDeal(dealId, noteContent);
        
        onComplete();
      } catch (error) {
        console.error('Fehler beim Verarbeiten des Angebots:', error);
        alert(`Es gab einen Fehler beim Verarbeiten des Angebots: ${error.message}`);
      }
     };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Umzugsangebot
          </h2>
        </div>

        <div className="p-6">
          {/* Summary Card */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
  <div className="flex items-center gap-3 mb-4">
    <ClipboardList className="w-5 h-5 text-blue-600" />
    <h3 className="text-lg font-semibold text-blue-900">Zusammenfassung</h3>
  </div>
  <div className="space-y-4">
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="text-sm text-gray-500">Gesamtvolumen</div>
      <div className="text-xl font-bold text-blue-900">
        {combinedData.totalVolume.toFixed(2)} m³
      </div>
    </div>
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="text-sm text-gray-500 mb-2">Gewicht</div>
      {combinedData.itemsWithCustomWeight > 0 && (
        <div className="flex justify-between text-sm mb-1">
          <span>Manuell eingegeben ({combinedData.itemsWithCustomWeight} Artikel)</span>
          <span>{Math.round(combinedData.customWeightTotal)} kg</span>
        </div>
      )}
      {combinedData.itemsWithVolumeWeight > 0 && (
        <div className="flex justify-between text-sm mb-1">
          <span>Volumenbasiert ({combinedData.itemsWithVolumeWeight} Artikel)</span>
          <span>{Math.round(combinedData.volumeBasedWeightTotal)} kg</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-blue-900 pt-2 border-t">
        <span>Gesamtgewicht</span>
        <span>{Math.round(combinedData.estimatedWeight)} kg</span>
      </div>
    </div>
  </div>
</div>

          {/* Furniture Section */}
          {activeItems.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Möbel</h3>
              </div>
              <div className="space-y-3">
              {activeItems.map(([name, item]) => (
                  <div key={name} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-900">{name}</span>
                        {(item.demontiert || item.duebelarbeiten) && (
                          <div className="mt-1 flex gap-2">
                            {item.demontiert && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Demontiert
                              </span>
                            )}
                            {item.duebelarbeiten && (
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                Dübelarbeiten
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{item.quantity}x</div>
                        <div className="text-sm">
                          <span className="text-gray-600">{item.length}x{item.width}x{item.height}cm</span>
                          <div className="text-gray-500">
                            Original: {((item.length * item.width * item.height) / 1000000).toFixed(2)} m³
                            {volumeReductions[name] !== 1 && (
                              <div>
                                Reduziert: {((item.length * item.width * item.height * (volumeReductions[name] || 1)) / 1000000).toFixed(2)} m³
                              </div>
                            )}
                          </div>
                        </div>
                        <select
                          className="mt-2 text-sm border rounded p-1"
                          value={volumeReductions[name] || 1}
                          onChange={(e) => onVolumeReductionChange(name, parseFloat(e.target.value))}
                        >
                          <option value={1}>100% Volumen</option>
                          <option value={0.75}>75% Volumen</option>
                          <option value={0.5}>50% Volumen</option>
                          <option value={0.25}>25% Volumen</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Notes Section */}
          {Object.entries(roomsData)
            .some(([_, roomData]) => roomData.notes && roomData.notes.trim()) && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Raum Notizen</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(roomsData)
                  .filter(([_, roomData]) => roomData.notes && roomData.notes.trim())
                  .map(([roomName, roomData]) => (
                    <div key={roomName} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="font-medium text-gray-900 mb-2">{roomName}</div>
                      <div className="text-gray-600 whitespace-pre-wrap">{roomData.notes}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Packing Materials Section */}
          {activePackMaterials.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Packmaterialien</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activePackMaterials.map(([name, quantity]) => (
                  <div key={name} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{name}</span>
                      <span className="text-lg font-semibold">{quantity}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Breakdown */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Kostenaufstellung</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Möbeltransport</span>
                  <span className="text-lg font-semibold">{furnitureCost.toFixed(2)} €</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Packmaterialien</span>
                  <span className="text-lg font-semibold">{materialCost.toFixed(2)} €</span>
                </div>
              </div>
              <div className="bg-primary-light rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-primary">Gesamtkosten</span>
                  <span className="text-xl font-bold text-primary">{totalCost.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>


       <div className="bg-gray-50 rounded-xl p-6 mt-6">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <Truck className="w-5 h-5 text-gray-600" />
      <h3 className="text-lg font-semibold text-gray-900">Streckenberechnung</h3>
    </div>
    <button
      onClick={() => setShowPriceCalculator(!showPriceCalculator)}
      className="text-sm text-primary hover:text-primary-dark"
    >
      {showPriceCalculator ? 'Ausblenden' : 'Anzeigen'}
    </button>
  </div>
  {showPriceCalculator && (
  <MovingPriceCalculator 
    defaultOrigin={moveInfo?.['07c3da8804f7b96210e45474fba35b8691211ddd']}
    defaultDestination={moveInfo?.['9cb4de1018ec8404feeaaaf7ee9b293c78c44281']}
    onPriceCalculated={(calculatedPrice) => {
      const transportCost = parseFloat(calculatedPrice);
      setTotalCost(prev => prev + transportCost);
    }}
  />
)}
</div>


          {/* Submit Button */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleAcceptOffer}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Angebot akzeptieren und Deal aktualisieren
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Weiter zum Beladungssimulator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferComponent;