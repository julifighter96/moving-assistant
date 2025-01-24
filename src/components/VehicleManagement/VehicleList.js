import React from 'react';
import { Truck, Wrench, Calendar } from 'lucide-react';

const VehicleList = ({ vehicles, onVehicleSelect }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in_use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Verfügbar';
      case 'in_use':
        return 'Im Einsatz';
      case 'maintenance':
        return 'In Wartung';
      default:
        return status;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicles.map(vehicle => (
        <div 
          key={vehicle.id}
          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
          onClick={() => onVehicleSelect(vehicle)}
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {vehicle.license_plate}
                </h3>
                <p className="text-sm text-gray-600">{vehicle.type}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                {getStatusText(vehicle.status)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Truck className="w-4 h-4 mr-2" />
                <span>{vehicle.loading_capacity} m³ Ladekapazität</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Wrench className="w-4 h-4 mr-2" />
                <span>{vehicle.max_weight} kg max. Gewicht</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {vehicle.length}x{vehicle.width}x{vehicle.height} cm
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VehicleList; 