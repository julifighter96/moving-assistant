import React, { useState, useEffect } from 'react';

const EMPLOYEE_TYPES = {
  'Helfer': { hourlyRate: 25 },
  'Fachkraft': { hourlyRate: 35 },
  'Teamleiter': { hourlyRate: 45 }
};

// Basiszeitwerte in Minuten
const BASE_TIMES = {
  BASE_TIME: 30,        // Grundzeit pro m³
  FLOOR_TIME: 5,        // Zeit pro Stockwerk
  ELEVATOR_TIME: 3,     // Zeit für Aufzug
  DISTANCE_TIME: 0.5,   // Zeit pro Meter Trageweg
  INCLINED_LIFT: 8      // Zeit für Schrägaufzug
};

const CostCalculation = ({ onComplete, volumeData }) => {
  const [calculationData, setCalculationData] = useState({
    carryingDistance: 0,    // Trageweg in Metern
    floors: 0,              // Anzahl Stockwerke
    hasElevator: false,     // Aufzug vorhanden
    hasInclinedLift: false, // Schrägaufzug vorhanden
    employees: [
      { type: 'Helfer', count: 2 },
      { type: 'Fachkraft', count: 1 },
      { type: 'Teamleiter', count: 0 }
    ]
  });

  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  // Berechne die Gesamtstunden basierend auf den Eingaben
  const calculateTotalHours = () => {
    const volume = volumeData?.totalVolume || 0;
    console.log('Berechne Zeit für Volumen:', volume, 'm³');

    // Grundzeit basierend auf Volumen
    let totalMinutes = volume * BASE_TIMES.BASE_TIME;
    console.log('Grundzeit:', totalMinutes, 'Minuten');

    // Zusätzliche Zeit für Trageweg
    const distanceTime = calculationData.carryingDistance * BASE_TIMES.DISTANCE_TIME;
    totalMinutes += distanceTime;
    console.log('Zeit nach Trageweg:', totalMinutes, 'Minuten');

    // Zeit für Stockwerke
    const floorTime = calculationData.floors * 
      (calculationData.hasElevator ? BASE_TIMES.ELEVATOR_TIME : BASE_TIMES.FLOOR_TIME);
    totalMinutes += floorTime;
    console.log('Zeit nach Stockwerken:', totalMinutes, 'Minuten');

    // Zusätzliche Zeit für Schrägaufzug
    if (calculationData.hasInclinedLift) {
      const inclinedLiftTime = calculationData.floors * BASE_TIMES.INCLINED_LIFT;
      totalMinutes += inclinedLiftTime;
      console.log('Zeit nach Schrägaufzug:', totalMinutes, 'Minuten');
    }

    // Behalte die exakten Minuten
    return totalMinutes;
  };

  // Berechne die Gesamtkosten
  const calculateTotalCost = (minutes) => {
    // Multipliziere die Minuten mit der Anzahl der Mitarbeiter und ihren jeweiligen Stundensätzen
    return calculationData.employees.reduce((total, emp) => {
      const hourlyRate = EMPLOYEE_TYPES[emp.type].hourlyRate;
      return total + (hourlyRate * emp.count * (minutes / 60)); // Jeder Mitarbeiter arbeitet die vollen Stunden
    }, 0);
  };

  useEffect(() => {
    const minutes = calculateTotalHours();
    setTotalMinutes(minutes);
    setTotalCost(calculateTotalCost(minutes));
  }, [calculationData, volumeData]);

  const handleInputChange = (field, value) => {
    setCalculationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmployeeChange = (type, count) => {
    setCalculationData(prev => ({
      ...prev,
      employees: prev.employees.map(emp => 
        emp.type === type ? { ...emp, count: parseInt(count) } : emp
      )
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Detaillierte Kostenkalkulation</h2>
          <p className="text-gray-500 mt-1">
            Berechnen Sie die Arbeitszeit und Kosten basierend auf den spezifischen Gegebenheiten
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Trageweg und Stockwerke */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Trageweg (in Metern)
              </label>
              <input
                type="number"
                min="0"
                value={calculationData.carryingDistance}
                onChange={(e) => handleInputChange('carryingDistance', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Stockwerke
              </label>
              <input
                type="number"
                min="0"
                value={calculationData.floors}
                onChange={(e) => handleInputChange('floors', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Aufzug und Schrägaufzug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={calculationData.hasElevator}
                onChange={(e) => handleInputChange('hasElevator', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Aufzug vorhanden
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={calculationData.hasInclinedLift}
                onChange={(e) => handleInputChange('hasInclinedLift', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Schrägaufzug erforderlich
              </label>
            </div>
          </div>

          {/* Mitarbeiter Auswahl */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mitarbeiter</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {calculationData.employees.map((emp) => (
                <div key={emp.type} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {emp.type} ({EMPLOYEE_TYPES[emp.type].hourlyRate}€/h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={emp.count}
                    onChange={(e) => handleEmployeeChange(emp.type, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ergebnisse */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Geschätzte Arbeitszeit</h4>
                <p className="text-2xl font-bold">
                  {Math.floor(totalMinutes / 60) > 0 ? `${Math.floor(totalMinutes / 60)} Stunden ` : ''}
                  {Math.round(totalMinutes % 60) > 0 ? `${Math.round(totalMinutes % 60)} Minuten` : ''}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Geschätzte Gesamtkosten</h4>
                <p className="text-2xl font-bold">
                  {(totalCost).toFixed(2)}€
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => onComplete({ totalMinutes, totalCost, ...calculationData })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Weiter zum Angebot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostCalculation; 