import React, { useState, useEffect } from 'react';
import { Package, Check } from 'lucide-react';

const MaterialAssignment = ({ materials }) => {
  const [deals, setDeals] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/deals');
      if (!response.ok) throw new Error('Fehler beim Laden der Umzüge');
      const data = await response.json();
      setDeals(data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const fetchAssignments = async (dealId) => {
    try {
      const response = await fetch(`/api/deals/${dealId}/materials`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Fehler beim Laden der Materialzuweisungen');
      }
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      // Optional: Zeige eine Benutzerbenachrichtigung
      // alert(error.message);
    }
  };

  const handleAssignMaterial = async (materialId, quantity) => {
    if (!selectedDeal) return;

    try {
      const response = await fetch(`/api/deals/${selectedDeal.id}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId,
          plannedQuantity: parseInt(quantity, 10)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Fehler bei der Materialzuweisung');
      }
      
      // Aktualisiere die Zuweisungen
      await fetchAssignments(selectedDeal.id);
    } catch (error) {
      console.error('Error assigning material:', error);
      alert(error.message);
    }
  };

  const handleRemoveAssignment = async (materialId) => {
    if (!selectedDeal) return;

    try {
      const response = await fetch(`/api/deals/${selectedDeal.id}/materials/${materialId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Fehler beim Entfernen der Materialzuweisung');
      }

      // Aktualisiere die Zuweisungen
      await fetchAssignments(selectedDeal.id);
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert(error.message);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Materialzuweisung</h2>
        
        {/* Umzugsauswahl */}
        <select
          value={selectedDeal?.id || ''}
          onChange={(e) => {
            const deal = deals.find(d => d.id === e.target.value);
            setSelectedDeal(deal);
            if (deal) fetchAssignments(deal.id);
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        >
          <option value="">Umzug auswählen...</option>
          {deals.map(deal => (
            <option key={deal.id} value={deal.id}>
              {deal.title} - {new Date(deal.move_date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {selectedDeal && (
        <div className="space-y-6">
          {/* Materialauswahl */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map(material => (
              <div key={material.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium">{material.name}</h3>
                    <p className="text-sm text-gray-500">
                      Verfügbar: {material.current_stock} {material.unit}
                    </p>
                  </div>
                  <Package className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max={material.current_stock}
                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    placeholder="Menge"
                  />
                  <button
                    onClick={(e) => handleAssignMaterial(material.id, e.target.previousSibling.value)}
                    className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark"
                  >
                    Zuweisen
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Zugewiesene Materialien */}
          {assignments.length > 0 && (
            <div className="mt-8">
              <h3 className="font-medium mb-4">Zugewiesene Materialien</h3>
              <div className="space-y-2">
                {assignments.map(assignment => {
                  const material = materials.find(m => m.id === assignment.material_id);
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{material?.name}</span>
                      <span>{assignment.planned_quantity} {material?.unit}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MaterialAssignment; 