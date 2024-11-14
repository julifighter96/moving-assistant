import React, { useMemo } from 'react';
import { Package, Truck, Calculator, ClipboardList, FileText } from 'lucide-react';
import { updateDealForOffer } from '../utils/dealUpdateFunctions';
import { addNoteToDeal } from '../services/pipedriveService';

const OfferComponent = ({ inspectionData, dealId, onComplete }) => {
  const { furnitureCost, materialCost, totalCost, combinedData } = useMemo(() => {
    const combinedData = {
      items: {},
      packMaterials: {},
      totalVolume: 0,
      estimatedWeight: 0,
      demontageCount: 0,
      duebelarbeitenCount: 0
    };

    // Combine data from rooms
    Object.values(inspectionData.rooms || {}).forEach(room => {
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

    // Calculate costs
    const furnitureCost = combinedData.totalVolume * 50; // Base rate per m³
    const materialCost = Object.entries(combinedData.packMaterials).reduce((total, [name, quantity]) => {
      const prices = {
        'Umzugskartons (Standard)': 2,
        'Bücherkartons (Bücher&Geschirr)': 5,
        'Kleiderkisten': 3,
      };
      return total + (prices[name] || 0) * quantity;
    }, 0);

    return {
      furnitureCost,
      materialCost,
      totalCost: furnitureCost + materialCost,
      combinedData
    };
  }, [inspectionData]);

  // Filter out items with quantity 0
  const activeItems = Object.entries(combinedData.items || {})
    .filter(([_, item]) => item.quantity > 0);
  
  const activePackMaterials = Object.entries(combinedData.packMaterials || {})
    .filter(([_, quantity]) => quantity > 0);

  const handleAcceptOffer = async () => {
    try {
      console.log('Starting offer acceptance with inspection data:', inspectionData);
      
      const offerDetails = {
        rooms: inspectionData.rooms,
        additionalInfo: inspectionData.additionalInfo,
        combinedData: combinedData,
        moveInfo: inspectionData.moveInfo
      };

      await updateDealForOffer(dealId, offerDetails);

      // Create detailed note content
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
          .filter(([_, item]) => item.quantity > 0)
          .map(([name, item]) => 
            `${name}: ${item.quantity} (Demontiert: ${item.demontiert ? 'Ja' : 'Nein'}, ` +
            `Dübelarbeiten: ${item.duebelarbeiten ? 'Ja' : 'Nein'})`)
          .join('\n')}\n\n` +
        
        `Packmaterialien:\n${Object.entries(combinedData.packMaterials)
          .filter(([_, quantity]) => quantity > 0)
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">Gesamtvolumen</div>
                <div className="text-xl font-bold text-blue-900">
                  {combinedData.totalVolume.toFixed(2)} m³
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500">Geschätztes Gewicht</div>
                <div className="text-xl font-bold text-blue-900">
                  {Math.round(combinedData.estimatedWeight)} kg
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
                        <div className="text-sm text-gray-500">{item.volume} m³</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Notes Section */}
          {Object.entries(inspectionData.rooms)
            .some(([_, roomData]) => roomData.notes && roomData.notes.trim()) && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Raum Notizen</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(inspectionData.rooms)
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

          {/* Submit Button */}
          <button
            onClick={handleAcceptOffer}
            className="w-full mt-6 bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Angebot akzeptieren und Deal aktualisieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferComponent;