import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Search, Filter, Download } from 'lucide-react';

const InspectionOverview = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchInspections();
  }, []);

 // In InspectionOverview.js
// In InspectionOverview.js
// In InspectionOverview.js
const fetchInspections = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/inspections`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Handle empty data properly
    setInspections(Array.isArray(data) ? data : []);
    
  } catch (error) {
    console.error('Fetch error:', error);
    // Set empty array on error
    setInspections([]);
  } finally {
    setLoading(false);
  }
};
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Besichtigungen</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Suchen..."
                className="pl-10 pr-4 py-2 border rounded-lg"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Download className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deal/Kunde
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volumen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Räume
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Umzugstermin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inspections.map((inspection) => (
              <tr key={inspection.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(inspection.timestamp), 'dd.MM.yyyy', { locale: de })}
                </td>
                <td className="px-6 py-4">
                  {inspection.dealTitle}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    inspection.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {inspection.status === 'completed' ? 'Abgeschlossen' : 'In Bearbeitung'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {inspection.totalVolume?.toFixed(2)} m³
                </td>
                <td className="px-6 py-4">
                  {inspection.totalRooms}
                </td>
                <td className="px-6 py-4">
                  {inspection.moveDate 
                    ? format(new Date(inspection.moveDate), 'dd.MM.yyyy', { locale: de })
                    : '-'}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => window.location.href = `/inspection/${inspection.id}`}
                    className="text-primary hover:text-primary-dark"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InspectionOverview;