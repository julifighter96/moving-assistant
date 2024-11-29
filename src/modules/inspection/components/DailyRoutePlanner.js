import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';

const DailyRoutePlanner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = initializeMap;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeMap = () => {
    const mapInstance = new window.google.maps.Map(document.getElementById('daily-route-map'), {
      zoom: 7,
      center: { lat: 51.1657, lng: 10.4515 },
    });
    
    const directionsServiceInstance = new window.google.maps.DirectionsService();
    const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
      map: mapInstance,
    });

    setMap(mapInstance);
    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);
  };

  useEffect(() => {
    fetchDeals();
  }, [selectedDate]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      let allDeals = [];
      let start = 0;
      let moreItemsExist = true;
  
      console.log('Starting to fetch all deals...');
  
      while (moreItemsExist) {
        const response = await axios.get(`${process.env.REACT_APP_PIPEDRIVE_API_URL}/deals`, {
          params: {
            status: 'won',
            api_token: process.env.REACT_APP_PIPEDRIVE_API_TOKEN,
            sort: 'id ASC',
            start: start,
            limit: 100
          }
        });
  
        console.log(`Fetched batch starting at ${start}, got ${response.data.data.length} deals`);
        
        allDeals = [...allDeals, ...response.data.data];
        moreItemsExist = response.data.additional_data?.pagination.more_items_in_collection || false;
        start += 100;
      }
  
      console.log(`Total deals fetched: ${allDeals.length}`);
      console.log('Checking all deals sorted by ID:');
      allDeals.forEach(deal => {
        console.log(`Deal ID ${deal.id} - ${deal.title}: Move date = ${deal['949696aa9d99044db90383a758a74675587ed893']}`);
      });
  
      // Use allDeals instead of response.data.data for the rest of your logic
      const filteredDeals = allDeals
        .filter(deal => {
          const moveDate = deal['949696aa9d99044db90383a758a74675587ed893'];
          return moveDate && isSameDay(new Date(moveDate), selectedDate);
        })
        .map(deal => ({
          id: deal.id,
          title: deal.title,
          organization: deal.org_name,
          moveDate: deal['949696aa9d99044db90383a758a74675587ed893'],
          originAddress: deal['07c3da8804f7b96210e45474fba35b8691211ddd'],
          destinationAddress: deal['9cb4de1018ec8404feeaaaf7ee9b293c78c44281'],
          value: deal.value,
          currency: deal.currency
        }));
  
      setDeals(filteredDeals);
      
      if (filteredDeals.length > 0) {
        calculateRoute(filteredDeals);
      } else if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
        setOptimizedRoute(null);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
    setLoading(false);
  };
  const calculateRoute = async (currentDeals) => {
    if (!directionsService || !currentDeals.length) {
      console.log('No directions service or deals');
      return;
    }
   
    const OFFICE_ADDRESS = "Greschbachstraße 29, 76229 Karlsruhe";
    const KARLSRUHE_REGION = "76";
   
    const regionCluster = (deals) => {
      // Group by first 2 digits of postal code
      const clusters = deals.reduce((acc, deal) => {
        const originPostal = deal.originAddress.match(/\b\d{5}\b/)?.[0]?.substring(0, 2);
        if (!originPostal) {
          console.log('Could not extract postal code from:', deal.originAddress);
          return acc;
        }
        
        if (!acc[originPostal]) {
          acc[originPostal] = [];
        }
        acc[originPostal].push(deal);
        return acc;
      }, {});
   
      console.log('Created regional clusters:', clusters);
      return clusters;
    };
   
    const clusters = regionCluster(currentDeals);
    
    // Sort regions by distance from Karlsruhe
    const sortedRegions = Object.keys(clusters).sort((a, b) => {
      if (a === KARLSRUHE_REGION) return -1;
      if (b === KARLSRUHE_REGION) return 1;
      return Math.abs(Number(a) - Number(KARLSRUHE_REGION.substring(0, 2))) - 
             Math.abs(Number(b) - Number(KARLSRUHE_REGION.substring(0, 2)));
    });
   
    console.log('Regions sorted by distance from Karlsruhe:', sortedRegions);
   
    // Create ordered waypoints by region
    const orderedLocations = sortedRegions.flatMap(region => {
      console.log(`Processing region ${region} with ${clusters[region].length} deals`);
      return clusters[region].flatMap(deal => [
        { 
          location: deal.originAddress,
          stopover: true
        },
        { 
          location: deal.destinationAddress,
          stopover: true
        }
      ]);
    });
   
    console.log('Final ordered locations:', orderedLocations);
   
    if (orderedLocations.length < 1) {
      console.log('No valid locations to route');
      return;
    }
   
    const request = {
      origin: OFFICE_ADDRESS,
      destination: OFFICE_ADDRESS,
      waypoints: orderedLocations,
      optimizeWaypoints: false, // Keep false to maintain pickup-delivery order within regions
      travelMode: 'DRIVING'
    };
   
    try {
      const result = await new Promise((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`Route calculation failed with status: ${status}`));
          }
        });
      });
   
      directionsRenderer.setDirections(result);
      setOptimizedRoute(result.routes[0]);
   
      // Calculate and log total distance and duration
      const route = result.routes[0];
      const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000;
      const totalDuration = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 3600;
   
      console.log(`Route calculated successfully:
        Total Distance: ${totalDistance.toFixed(1)} km
        Total Duration: ${totalDuration.toFixed(1)} hours
        Number of stops: ${orderedLocations.length}
      `);
   
    } catch (error) {
      console.error('Error calculating route:', error);
    }
   };

  const navigateDate = (days) => {
    setSelectedDate(current => addDays(current, days));
  };

  const formatCurrency = (value, currency) => {
    if (!value) return '0,00 €';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Tagesroute</h2>
            <p className="text-gray-500 mt-1">Optimierte Route für alle Aufträge des Tages</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <DatePicker
              selected={selectedDate}
              onChange={date => setSelectedDate(date)}
              dateFormat="dd.MM.yyyy"
              locale={de}
              className="p-2 border rounded-lg text-center"
            />
            <button
              onClick={() => navigateDate(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              Aufträge am {format(selectedDate, 'dd. MMMM yyyy', { locale: de })}
            </h3>
            <span className="bg-primary-light text-primary px-3 py-1 rounded-full text-sm">
              {deals.length} Aufträge
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {deals.map((deal, index) => (
              <div key={deal.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{deal.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <span className="font-medium text-primary">
                        {formatCurrency(deal.value, deal.currency)}
                      </span>
                      {deal.organization && (
                        <span className="text-gray-500">• {deal.organization}</span>
                      )}
                    </div>
                  </div>
                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
                    Stop {index + 1}
                  </span>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 mt-1 text-green-600" />
                    <div>
                      <p>{deal.originAddress}</p>
                      {deal.originFloor && (
                        <p className="text-gray-500">Etage: {deal.originFloor}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 mt-1 text-red-600" />
                    <div>
                      <p>{deal.destinationAddress}</p>
                      {deal.destinationFloor && (
                        <p className="text-gray-500">Etage: {deal.destinationFloor}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-2">Lade Aufträge...</p>
              </div>
            )}
            
            {!loading && !deals.length && (
              <div className="text-center py-8 text-gray-500">
                Keine Aufträge für diesen Tag gefunden
              </div>
            )}
          </div>
          
          {optimizedRoute && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Routendetails</h4>
              </div>
              <div className="text-sm text-blue-800">
                <p>Gesamtdistanz: {(optimizedRoute.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000).toFixed(1)} km</p>
                <p>Geschätzte Fahrzeit: {Math.round(optimizedRoute.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 3600)} Stunden</p>
              </div>
            </div>
          )}
        </div>

        <div className="h-[600px] bg-gray-100 rounded-lg">
          <div id="daily-route-map" className="w-full h-full rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default DailyRoutePlanner;