import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, AlertTriangle } from 'lucide-react';

const MaterialStatistics = () => {
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/materials/statistics');
      if (!response.ok) throw new Error('Fehler beim Laden der Statistiken');
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-6">Materialstatistiken</h2>

      {statistics ? (
        <div className="space-y-8">
          {/* Verbrauchsübersicht */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Gesamtverbrauch</h3>
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {statistics.reduce((sum, stat) => sum + (stat.total_usage || 0), 0)}
              </p>
              <p className="text-sm text-blue-600">Letzte 30 Tage</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Durchschnitt pro Umzug</h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {(statistics.reduce((sum, stat) => sum + (stat.avg_usage_per_move || 0), 0) / statistics.length).toFixed(2)}
              </p>
              <p className="text-sm text-green-600">Einheiten</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Materialien unter Mindestbestand</h3>
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {statistics.filter(stat => stat.current_stock <= stat.min_stock).length}
              </p>
              <p className="text-sm text-yellow-600">Materialien</p>
            </div>
          </div>

          {/* Detaillierte Statistiken */}
          <div>
            <h3 className="font-medium mb-4">Materialdetails</h3>
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Anzahl Umzüge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gesamtverbrauch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durchschnitt/Umzug
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statistics.map(stat => (
                    <tr key={stat.name}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{stat.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{stat.number_of_moves}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{stat.total_usage || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {stat.avg_usage_per_move?.toFixed(2) || '0'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Lade Statistiken...</p>
        </div>
      )}
    </div>
  );
};

export default MaterialStatistics; 