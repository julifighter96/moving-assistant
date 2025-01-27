import React from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const ActiveMovesList = ({ moves, onMoveSelect }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moves.map((move, index) => (
          <div 
            key={move.id || move.deal_id || `move-${index}`}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium">{move.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${move.status === 'in_progress' 
                    ? 'bg-green-100 text-green-800'
                    : move.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {move.status === 'in_progress' ? 'Aktiv' 
                    : move.status === 'paused' ? 'Pausiert' 
                    : 'Ausstehend'}
                </span>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(move.move_date), 'dd. MMMM yyyy', { locale: de })}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-green-600" />
                  {move.origin_address}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-red-600" />
                  {move.destination_address}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => onMoveSelect(move)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  Details anzeigen
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {moves.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">Keine aktiven Umzüge vorhanden</p>
        </div>
      )}
    </div>
  );
};

export default ActiveMovesList; 