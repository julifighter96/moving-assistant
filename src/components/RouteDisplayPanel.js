/**
 * Route Display Panel for Tour Planning v2
 * Shows optimized route details, statistics, and export options
 */

import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Navigation, 
  Truck, 
  Download, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Building,
  Home,
  Target,
  MapPin as RouteIcon,
  DollarSign,
  Fuel
} from 'lucide-react';

const RouteDisplayPanel = ({ 
  optimizedTour, 
  isLoading, 
  onExportRoute,
  onOpenInMaps,
  selectedDeals 
}) => {
  const [expandedTour, setExpandedTour] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <span className="text-gray-600">Route wird optimiert...</span>
        </div>
      </div>
    );
  }

  if (!optimizedTour || !optimizedTour.optimizedTour) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <RouteIcon className="mr-2 h-5 w-5 text-primary" />
          Optimierte Route
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Navigation className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Keine optimierte Route verfügbar</p>
          <p className="text-sm mt-1">Wählen Sie Aufträge aus und starten Sie die Optimierung</p>
        </div>
      </div>
    );
  }

  const { optimizedTour: tour, summary } = optimizedTour;

  const formatDistance = (distance) => {
    if (typeof distance === 'string' && distance.includes('km')) {
      return distance;
    }
    if (typeof distance === 'number') {
      return `${(distance / 1000).toFixed(1)} km`;
    }
    return distance || 'N/A';
  };

  const formatTime = (time) => {
    if (typeof time === 'string' && (time.includes('hour') || time.includes('min'))) {
      return time;
    }
    if (typeof time === 'number') {
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
    }
    return time || 'N/A';
  };

  const formatCost = (cost) => {
    if (typeof cost === 'string' && cost.includes('€')) {
      return cost;
    }
    if (typeof cost === 'number') {
      return `${cost.toFixed(2)}€`;
    }
    return cost || 'N/A';
  };

  const getStopTypeIcon = (stop, index, isFirst, isLast) => {
    if (isFirst || isLast) {
      return <Target className="w-4 h-4 text-green-600" />;
    }
    
    // Try to determine if it's pickup or delivery based on activities
    const hasPickupActivity = stop.activities?.some(activity => 
      activity.type === 'pickup' || activity.jobId?.includes('pickup')
    );
    const hasDeliveryActivity = stop.activities?.some(activity => 
      activity.type === 'delivery' || activity.jobId?.includes('delivery')
    );

    if (hasPickupActivity) {
      return <Building className="w-4 h-4 text-blue-600" />;
    } else if (hasDeliveryActivity) {
      return <Home className="w-4 h-4 text-red-600" />;
    }
    
    return <MapPin className="w-4 h-4 text-gray-600" />;
  };

  const getStopTypeLabel = (stop, index, isFirst, isLast) => {
    if (isFirst) return 'Start';
    if (isLast) return 'Ziel';
    
    const hasPickupActivity = stop.activities?.some(activity => 
      activity.type === 'pickup' || activity.jobId?.includes('pickup')
    );
    const hasDeliveryActivity = stop.activities?.some(activity => 
      activity.type === 'delivery' || activity.jobId?.includes('delivery')
    );

    if (hasPickupActivity) return 'Abholung';
    if (hasDeliveryActivity) return 'Lieferung';
    
    return `Stopp ${index + 1}`;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <RouteIcon className="mr-2 h-5 w-5 text-primary" />
          Optimierte Route
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-500 hover:text-gray-700 p-1"
            title="Details anzeigen"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {onExportRoute && (
            <button
              onClick={onExportRoute}
              className="text-blue-600 hover:text-blue-700 p-1"
              title="Route exportieren"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          
          {onOpenInMaps && (
            <button
              onClick={onOpenInMaps}
              className="text-green-600 hover:text-green-700 p-1"
              title="In Maps öffnen"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <Navigation className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-xs text-blue-600 font-medium">Distanz</span>
          </div>
          <p className="text-sm font-semibold text-blue-800 mt-1">
            {formatDistance(summary?.totalDistance)}
          </p>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-xs text-green-600 font-medium">Zeit</span>
          </div>
          <p className="text-sm font-semibold text-green-800 mt-1">
            {formatTime(summary?.totalTime)}
          </p>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 text-purple-600 mr-2" />
            <span className="text-xs text-purple-600 font-medium">Kosten</span>
          </div>
          <p className="text-sm font-semibold text-purple-800 mt-1">
            {formatCost(summary?.estimatedCost)}
          </p>
        </div>

        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="flex items-center">
            <Truck className="w-4 h-4 text-orange-600 mr-2" />
            <span className="text-xs text-orange-600 font-medium">LKW</span>
          </div>
          <p className="text-sm font-semibold text-orange-800 mt-1">
            {summary?.trucksNeeded || summary?.vehiclesUsed || 1}
          </p>
        </div>
      </div>

      {/* Efficiency Indicator */}
      {summary?.efficiency && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Effizienz</span>
            <span className="text-sm font-semibold text-green-600">{summary.efficiency}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(parseFloat(summary.efficiency) || 0, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Tours List */}
      {tour.tours && tour.tours.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800 flex items-center">
            <Truck className="w-4 h-4 mr-2" />
            Touren ({tour.tours.length})
          </h4>

          {tour.tours.map((singleTour, tourIndex) => (
            <div key={tourIndex} className="border border-gray-200 rounded-lg">
              <div 
                className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedTour(expandedTour === tourIndex ? null : tourIndex)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Truck className="w-4 h-4 text-primary mr-2" />
                    <span className="font-medium text-sm">
                      Tour {tourIndex + 1}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({singleTour.stops?.length || 0} Stopps)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {singleTour.statistics && (
                      <div className="text-xs text-gray-600">
                        {formatDistance(singleTour.statistics.distance)} • {formatTime(singleTour.statistics.duration)}
                      </div>
                    )}
                    {expandedTour === tourIndex ? 
                      <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </div>
              </div>

              {expandedTour === tourIndex && singleTour.stops && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                  <div className="space-y-2">
                    {singleTour.stops.map((stop, stopIndex) => {
                      const isFirst = stopIndex === 0;
                      const isLast = stopIndex === singleTour.stops.length - 1;
                      
                      return (
                        <div key={stopIndex} className="flex items-start space-x-3 p-2 bg-white rounded border">
                          <div className="flex-shrink-0 mt-1">
                            {getStopTypeIcon(stop, stopIndex, isFirst, isLast)}
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-800">
                                {getStopTypeLabel(stop, stopIndex, isFirst, isLast)}
                              </p>
                              {stop.time && (
                                <span className="text-xs text-gray-500">
                                  {new Date(stop.time.arrival).toLocaleTimeString('de-DE', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              )}
                            </div>
                            
                            {stop.location && (
                              <p className="text-xs text-gray-600 mt-1">
                                {stop.location.address || `${stop.location.lat?.toFixed(4)}, ${stop.location.lng?.toFixed(4)}`}
                              </p>
                            )}
                            
                            {stop.activities && stop.activities.length > 0 && (
                              <div className="mt-1">
                                {stop.activities.map((activity, actIndex) => (
                                  <span key={actIndex} className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                                    {activity.type || activity.jobId || 'Aktivität'}
                                  </span>
                                ))}
                              </div>
                            )}

                            {stop.distance !== undefined && (
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistance(stop.distance)} • Beladung: {stop.load?.join(', ') || 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Additional Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">Zusätzliche Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Aufträge geplant:</span>
              <span className="ml-2 font-medium">{summary?.jobsScheduled || selectedDeals?.length || 0}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Fahrzeuge verwendet:</span>
              <span className="ml-2 font-medium">{summary?.vehiclesUsed || 1}</span>
            </div>
            
            {summary?.totalJobs && (
              <div>
                <span className="text-gray-600">Gesamt Aufträge:</span>
                <span className="ml-2 font-medium">{summary.totalJobs}</span>
              </div>
            )}
            
            {tour.summary?.unassignedJobs && tour.summary.unassignedJobs.length > 0 && (
              <div>
                <span className="text-gray-600">Nicht zugeordnet:</span>
                <span className="ml-2 font-medium text-red-600">{tour.summary.unassignedJobs.length}</span>
              </div>
            )}
          </div>

          {/* Unassigned Jobs Warning */}
          {tour.summary?.unassignedJobs && tour.summary.unassignedJobs.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warnung:</strong> {tour.summary.unassignedJobs.length} Aufträge konnten nicht zugeordnet werden.
                Dies kann an Zeitfenster-Konflikten oder Kapazitätsbeschränkungen liegen.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onOpenInMaps}
          className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center text-sm"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          In Maps öffnen
        </button>
        
        {onExportRoute && (
          <button
            onClick={onExportRoute}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportieren
          </button>
        )}
      </div>
    </div>
  );
};

export default RouteDisplayPanel;
