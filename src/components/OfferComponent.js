import React, { useState, useEffect, useMemo } from 'react';
import { Package, Truck, Calculator, ClipboardList, FileText } from 'lucide-react';
import { updateDealForOffer } from '../utils/dealUpdateFunctions';
import { addNoteToDeal } from '../services/pipedriveService';
import MovingPriceCalculator from './MovingPriceCalculator';
import axios from 'axios';
import Toast from './Toast';
import { apiWrapper } from '../services/apiWrapper';

const OfferComponent = ({ inspectionData, dealId, onComplete, setCurrentStep, volumeReductions, onVolumeReductionChange }) => {
 const [showPriceCalculator, setShowPriceCalculator] = useState(false);
 const [totalCost, setTotalCost] = useState(0);
 const [toast, setToast] = useState(null);

 const { furnitureCost, materialCost, combinedData } = useMemo(() => {
  
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

  // Sammle alle Daten aus den rooms (inkl. bereits berechnete Volumina)
  Object.values(inspectionData.rooms || {}).forEach(room => {
    // Verwende die bereits berechneten Werte aus dem RoomItemsSelector
    if (room.totalVolume) {
      combinedData.totalVolume += room.totalVolume;
    }
    
    if (room.estimatedWeight) {
      combinedData.volumeBasedWeightTotal += room.estimatedWeight;
    }

    // Sammle Items für die Anzeige
    room.items.forEach(item => {
      if (!combinedData.items[item.name]) {
        combinedData.items[item.name] = { 
          ...item, 
          quantity: 0,
          demontiert: !!item.demontiert,
          remontiert: !!item.remontiert,
          duebelarbeiten: !!item.duebelarbeiten,
          elektro: !!item.elektro
        };
      } else {
        combinedData.items[item.name].demontiert = combinedData.items[item.name].demontiert || !!item.demontiert;
        combinedData.items[item.name].remontiert = combinedData.items[item.name].remontiert || !!item.remontiert;
        combinedData.items[item.name].duebelarbeiten = combinedData.items[item.name].duebelarbeiten || !!item.duebelarbeiten;
        combinedData.items[item.name].elektro = combinedData.items[item.name].elektro || !!item.elektro;
      }

      combinedData.items[item.name].quantity += item.quantity;
      if (item.demontiert) combinedData.demontageCount += item.quantity;
      if (item.duebelarbeiten) combinedData.duebelarbeitenCount += item.quantity;
      if (item.remontiert) combinedData.remontiertCount = (combinedData.remontiertCount || 0) + item.quantity;
      if (item.elektro) combinedData.elektroCount = (combinedData.elektroCount || 0) + item.quantity;
      
      // Gewichtsberechnung für Items
      if (item.weight) {
        combinedData.customWeightTotal += item.weight * item.quantity;
        combinedData.itemsWithCustomWeight += item.quantity;
      } else {
        // Verwende die bereits berechneten Gewichte aus dem RoomItemsSelector
        const itemVolume = (item.length * item.width * item.height * item.quantity) / 1000000;
        const reductionFactor = volumeReductions[item.name] || 1;
        combinedData.volumeBasedWeightTotal += itemVolume * 200 * reductionFactor;
        combinedData.itemsWithVolumeWeight += item.quantity;
      }
    });

    // Sammle Packmaterialien
    room.packMaterials.forEach(material => {
      combinedData.packMaterials[material.name] = 
        (combinedData.packMaterials[material.name] || 0) + material.quantity;
    });
  });

  // Ersetze automatisch berechnete Karton-Mengen durch manuell eingegebene Werte
  if (inspectionData.additionalInfo) {
    const umzugskartons = inspectionData.additionalInfo.find(
      f => f.name === 'Anzahl Umzugskartons' && f.type === 'number'
    )?.value || 0;
    
    const porzellankartons = inspectionData.additionalInfo.find(
      f => f.name === 'Anzahl Porzellankartons' && f.type === 'number'
    )?.value || 0;

    // Ersetze automatisch berechnete Kartons durch manuell eingegebene Werte
    if (umzugskartons > 0) {
      combinedData.packMaterials['Umzugskartons (Standard)'] = umzugskartons;
      console.log(`Replaced automatic Umzugskartons with manual value: ${umzugskartons}`);
    }
    
    if (porzellankartons > 0) {
      combinedData.packMaterials['Bücherkartons (Bücher&Geschirr)'] = porzellankartons;
      console.log(`Replaced automatic Porzellankartons with manual value: ${porzellankartons}`);
    }

    if (umzugskartons > 0 || porzellankartons > 0) {
      // Standard Umzugskarton: 60x40x40 cm = 0.096 m³
      const umzugskartonVolume = 0.096;
      // Porzellankarton: 50x30x30 cm = 0.045 m³
      const porzellankartonVolume = 0.045;

      const umzugskartonsVolume = umzugskartons * umzugskartonVolume;
      const porzellankartonsVolume = porzellankartons * porzellankartonVolume;

      // Entferne automatisch berechnete Karton-Volumina und ersetze sie durch manuelle Werte
      // Zuerst entfernen wir die automatisch berechneten Karton-Volumina
      Object.values(inspectionData.rooms || {}).forEach(room => {
        if (room.packMaterials && Array.isArray(room.packMaterials)) {
          room.packMaterials.forEach(material => {
            if (['Umzugskartons (Standard)', 'Bücherkartons (Bücher&Geschirr)', 'Kleiderkisten'].includes(material.name) && material.quantity > 0) {
              // Entferne automatisch berechnetes Volumen
              const materialVolume = material.name === 'Umzugskartons (Standard)' ? 0.096 : 
                                   material.name === 'Bücherkartons (Bücher&Geschirr)' ? 0.045 : 0.072;
              combinedData.totalVolume -= materialVolume * material.quantity;
            }
          });
        }
      });

      // Dann füge die manuell eingegebenen Karton-Volumina hinzu
      combinedData.totalVolume += umzugskartonsVolume + porzellankartonsVolume;
      
      // Füge Gewicht hinzu
      const kartonsWeight = (umzugskartonsVolume + porzellankartonsVolume) * 200;
      combinedData.volumeBasedWeightTotal += kartonsWeight;
      combinedData.itemsWithVolumeWeight += umzugskartons + porzellankartons;

      console.log('Replaced automatic carton volumes with manual values:', {
        umzugskartons,
        porzellankartons,
        umzugskartonsVolume: umzugskartonsVolume.toFixed(3),
        porzellankartonsVolume: porzellankartonsVolume.toFixed(3),
        totalManualVolume: (umzugskartonsVolume + porzellankartonsVolume).toFixed(3)
      });
    }
  }

  // Calculate estimated weight
  combinedData.estimatedWeight = combinedData.customWeightTotal + combinedData.volumeBasedWeightTotal;

  // Debug-Ausgabe
  console.log('Volume calculation using RoomItemsSelector values:', {
    totalVolume: combinedData.totalVolume.toFixed(3),
    customWeightTotal: Math.round(combinedData.customWeightTotal),
    volumeBasedWeightTotal: Math.round(combinedData.volumeBasedWeightTotal),
    estimatedWeight: Math.round(combinedData.estimatedWeight)
  });

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

  return {
    furnitureCost,
    materialCost,
    combinedData
  };
}, [inspectionData, volumeReductions]);

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
        console.log('inspectionData:', inspectionData);
        console.log('additionalInfo:', inspectionData.additionalInfo);
        console.log('combinedData:', combinedData);
        console.log('calculationData:', inspectionData.calculationData);
        console.log('pipedriveUpdateData:', inspectionData.calculationData?.pipedriveUpdateData);
        console.log('calculationData keys:', Object.keys(inspectionData.calculationData || {}));
        console.log('calculationData team:', inspectionData.calculationData?.team);
        console.log('calculationData pipedriveUpdateData keys:', Object.keys(inspectionData.calculationData?.pipedriveUpdateData || {}));

        const offerDetails = {
          rooms: inspectionData.rooms,
          additionalInfo: inspectionData.additionalInfo,
          combinedData: combinedData,
          moveInfo: inspectionData.moveInfo,
          pipedriveUpdateData: inspectionData.calculationData?.pipedriveUpdateData || {}
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

        console.log('summarySection:', summarySection);

        // Box quantities section
        let boxSection = '';
        if (inspectionData.additionalInfo) {
          const umzugskartons = inspectionData.additionalInfo.find(
            f => f.name === 'Anzahl Umzugskartons' && f.type === 'number'
          )?.value || 0;
          
          const porzellankartons = inspectionData.additionalInfo.find(
            f => f.name === 'Anzahl Porzellankartons' && f.type === 'number'
          )?.value || 0;
          
          console.log('Found box quantities from additionalInfo:', {
            umzugskartons,
            porzellankartons,
            additionalInfo: inspectionData.additionalInfo
          });
          
          if (umzugskartons > 0 || porzellankartons > 0) {
            boxSection = '\nKartons:\n';
            if (umzugskartons > 0) boxSection += `- Umzugskartons: ${umzugskartons} Stück\n`;
            if (porzellankartons > 0) boxSection += `- Porzellankartons: ${porzellankartons} Stück\n`;
          }
        }

        console.log('Generated boxSection:', boxSection);
        
        // Services section
        const servicesSection = inspectionData.additionalInfo ? `
Zusätzliche Dienstleistungen:
${inspectionData.additionalInfo
  .filter(field => {
    console.log('Processing service field:', field);
    return (field.type === 'select' || (field.type === 'number' && field.name !== 'Anzahl Umzugskartons' && field.name !== 'Anzahl Porzellankartons'));
  })
  .map(field => {
    if (field.type === 'number') {
      return field.value > 0 ? `${field.name}: ${field.value} Stück` : null;
    }
    return field.value !== 'Nein' ? `${field.name}: ${field.value}` : null;
  })
  .filter(Boolean)
  .join('\n')}

Mitarbeiterinformationen:
${inspectionData.additionalInfo
  .filter(field => {
    console.log('Processing staff info field:', field);
    return field.type === 'select' || (field.type === 'number' && field.name !== 'Anzahl Umzugskartons' && field.name !== 'Anzahl Porzellankartons');
  })
  .map(field => {
    if (field.type === 'number' && field.value > 0) {
      return `- ${field.value}x ${field.name}`;
    }
    if (field.value === 'Ja (Gesamt)') {
      return `- ${field.name} komplett`;
    }
    if (field.value === 'Ja (Glas + Porzellan)') {
      return `- ${field.name} nur Glas und Porzellan`;
    }
    return null;
  })
  .filter(Boolean)
  .join('\n')}` : '';

        console.log('Generated servicesSection:', servicesSection);
        
        // Mitarbeiter-Sektion aus MovingCalculation mit Phasen-Aufteilung
        let employeesSection = '';
        if (inspectionData.calculationData?.team?.employees) {
          const selectedEmployees = inspectionData.calculationData.team.employees;
          const employeeTypes = inspectionData.calculationData.team.employeeTypes || [];
          
          const employeeInfoLines = [];
          
          Object.entries(selectedEmployees).forEach(([typeId, phases]) => {
            // Unterstütze sowohl alte Struktur (nur count) als auch neue Struktur (Phasen)
            let loadingCount = 0;
            let travelCount = 0;
            let unloadingCount = 0;
            
            if (typeof phases === 'object' && phases !== null && !Array.isArray(phases)) {
              // Neue Struktur mit Phasen
              loadingCount = phases.loading || 0;
              travelCount = phases.travel || 0;
              unloadingCount = phases.unloading || 0;
            } else if (typeof phases === 'number') {
              // Alte Struktur - nur count (für Rückwärtskompatibilität)
              loadingCount = phases;
            }
            
            // Verwende die maximale Anzahl über alle Phasen (nicht die Summe),
            // da es wahrscheinlich die gleichen Personen sind, die in verschiedenen Phasen arbeiten
            const maxCount = Math.max(loadingCount, travelCount, unloadingCount);
            
            if (maxCount > 0) {
              const employeeType = employeeTypes.find(type => String(type.id) === String(typeId));
              if (employeeType) {
                // Detaillierte Aufteilung nach Phasen
                const phaseDetails = [];
                if (loadingCount > 0) phaseDetails.push(`Beladung: ${loadingCount}`);
                if (travelCount > 0) phaseDetails.push(`Fahrt: ${travelCount}`);
                if (unloadingCount > 0) phaseDetails.push(`Entladung: ${unloadingCount}`);
                
                if (phaseDetails.length > 0) {
                  employeeInfoLines.push(
                    `- ${employeeType.name}: ${maxCount} Personen (${phaseDetails.join(', ')})`
                  );
                } else {
                  employeeInfoLines.push(
                    `- ${employeeType.name}: ${maxCount} Personen`
                  );
                }
              }
            }
          });
          
          if (employeeInfoLines.length > 0) {
            employeesSection = `\nMitarbeiter (aus Kalkulation):\n${employeeInfoLines.join('\n')}`;
          }
        }
        
        console.log('Generated employeesSection:', employeesSection);
     
        // Packmaterial Sektion
        const packMaterialsArray = Object.entries(combinedData.packMaterials)
          .filter(([_, quantity]) => quantity > 0)
          .map(([name, quantity]) => `${name}: ${quantity}`);

        console.log('Pack materials from combinedData:', packMaterialsArray);

        const boxQuantitiesArray = inspectionData.additionalInfo
          ?.filter(field => 
            (field.name === 'Anzahl Umzugskartons' || field.name === 'Anzahl Porzellankartons') && 
            field.type === 'number' &&
            field.value > 0
          )
          .map(field => `${field.name.replace('Anzahl ', '')}: ${field.value} Stück`) || [];

        console.log('Box quantities for packing section:', boxQuantitiesArray);

        const packingSection = [...packMaterialsArray, ...boxQuantitiesArray]
          .filter(Boolean)
          .join('\n');

        console.log('Final packingSection:', packingSection);
     
        // Räume mit Möbeln und Notizen
        const roomsSection = Object.entries(inspectionData.rooms)
          .map(([roomName, roomData]) => {
            console.log(`Processing room: ${roomName}`, roomData);
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

        console.log('Generated roomsSection:', roomsSection);
     
        const noteContent = [
          summarySection,
          servicesSection,
          employeesSection,
          boxSection,
          packingSection ? '\nPackmaterialien:\n' + packingSection : '',
          roomsSection
        ].filter(Boolean).join('\n');

        console.log('All sections before joining:', {
          summarySection,
          servicesSection,
          employeesSection,
          boxSection,
          packingSection,
          roomsSection
        });

        console.log('Final noteContent:', noteContent);
     
        // Nutze apiWrapper für Offline-Support
        const updateResult = await apiWrapper.updateOffer(dealId, offerDetails);
        
        // Versuche Note hinzuzufügen (kann auch offline sein)
        try {
          await addNoteToDeal(dealId, noteContent);
        } catch (error) {
          console.warn('Fehler beim Hinzufügen der Note (wird später synchronisiert):', error);
        }
        
        if (updateResult.offline) {
          showToast('Angebot wird lokal gespeichert und synchronisiert, sobald wieder online', 'success');
        }
        
        onComplete();
      } catch (error) {
        console.error('Fehler beim Verarbeiten des Angebots:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          additionalInfo: inspectionData.additionalInfo,
          combinedData
        });
        showToast(`Es gab einen Fehler beim Verarbeiten des Angebots: ${error.message}`);
      }
     };

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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
      {/* Zeige Kartons-Volumina an, falls vorhanden */}
      {inspectionData.additionalInfo && (() => {
        const umzugskartons = inspectionData.additionalInfo.find(
          f => f.name === 'Anzahl Umzugskartons' && f.type === 'number'
        )?.value || 0;
        
        const porzellankartons = inspectionData.additionalInfo.find(
          f => f.name === 'Anzahl Porzellankartons' && f.type === 'number'
        )?.value || 0;

        if (umzugskartons > 0 || porzellankartons > 0) {
          const umzugskartonsVolume = umzugskartons * 0.096;
          const porzellankartonsVolume = porzellankartons * 0.045;
          const totalBoxVolume = umzugskartonsVolume + porzellankartonsVolume;
          
          return (
            <div className="mt-2 text-sm text-gray-600">
              <div>Davon Kartons (additionalInfo): {totalBoxVolume.toFixed(3)} m³</div>
              {umzugskartons > 0 && <div>• Umzugskartons: {umzugskartons}x ({(umzugskartons * 0.096).toFixed(3)} m³)</div>}
              {porzellankartons > 0 && <div>• Porzellankartons: {porzellankartons}x ({(porzellankartons * 0.045).toFixed(3)} m³)</div>}
            </div>
          );
        }
        return null;
      })()}
      
      {/* Zeige Packmaterialien aus rooms an, falls vorhanden */}
      {(() => {
        const roomPackMaterials = Object.values(inspectionData.rooms || {}).reduce((total, room) => {
          const roomMaterials = room.packMaterials || [];
          roomMaterials.forEach(material => {
            if (['Umzugskartons (Standard)', 'Bücherkartons (Bücher&Geschirr)', 'Kleiderkisten'].includes(material.name)) {
              if (!total[material.name]) total[material.name] = 0;
              total[material.name] += material.quantity;
            }
          });
          return total;
        }, {});

        const hasRoomPackMaterials = Object.values(roomPackMaterials).some(qty => qty > 0);
        
        if (hasRoomPackMaterials) {
          let totalRoomVolume = 0;
          const materialDetails = [];
          
          Object.entries(roomPackMaterials).forEach(([name, quantity]) => {
            if (quantity > 0) {
              let volume = 0.096; // Standard Umzugskarton
              if (name === 'Bücherkartons (Bücher&Geschirr)') volume = 0.045;
              else if (name === 'Kleiderkisten') volume = 0.072;
              
              const totalVolume = volume * quantity;
              totalRoomVolume += totalVolume;
              materialDetails.push(`${name}: ${quantity}x (${totalVolume.toFixed(3)} m³)`);
            }
          });
          
          return (
            <div className="mt-2 text-sm text-gray-600">
              <div>Davon Packmaterialien (rooms): {totalRoomVolume.toFixed(3)} m³</div>
              {materialDetails.map((detail, index) => (
                <div key={index}>• {detail}</div>
              ))}
            </div>
          );
        }
        return null;
      })()}
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
      {/* Zeige Kartons-Gewicht separat an, falls vorhanden */}
      {inspectionData.additionalInfo && (() => {
        const umzugskartons = inspectionData.additionalInfo.find(
          f => f.name === 'Anzahl Umzugskartons' && f.type === 'number'
        )?.value || 0;
        
        const porzellankartons = inspectionData.additionalInfo.find(
          f => f.name === 'Anzahl Porzellankartons' && f.type === 'number'
        )?.value || 0;

        if (umzugskartons > 0 || porzellankartons > 0) {
          const umzugskartonsVolume = umzugskartons * 0.096;
          const porzellankartonsVolume = porzellankartons * 0.045;
          const kartonsWeight = (umzugskartonsVolume + porzellankartonsVolume) * 200;
          
          return (
            <div className="flex justify-between text-sm mb-1 text-blue-600">
              <span>Davon Umzugskartons</span>
              <span>{Math.round(kartonsWeight)} kg</span>
            </div>
          );
        }
        return null;
      })()}
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
                        {(item.demontiert || item.duebelarbeiten || item.remontiert || item.elektro) && (
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
                            {item.remontiert && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Remontiert
                              </span>
                            )}
                            {item.elektro && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                Elektro
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
    defaultOrigin={inspectionData?.moveInfo?.['07c3da8804f7b96210e45474fba35b8691211ddd']} // Auszugsadresse
    defaultDestination={inspectionData?.moveInfo?.['9cb4de1018ec8404feeaaaf7ee9b293c78c44281']} // Einzugsadresse
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