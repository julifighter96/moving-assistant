import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';

const MovingPriceCalculator = ({ defaultOrigin, defaultDestination }) => {
  const [locations, setLocations] = useState({
    origin: defaultOrigin || '',
    destination: defaultDestination || ''
  });
  const [routeDetails, setRouteDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [autocomplete, setAutocomplete] = useState({
    origin: null,
    destination: null
  });

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
    const mapInstance = new window.google.maps.Map(document.getElementById('map'), {
      zoom: 6,
      center: { lat: 51.1657, lng: 10.4515 },
    });
    setMap(mapInstance);

    const directionsServiceInstance = new window.google.maps.DirectionsService();
    const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: false,
      suppressInfoWindows: true
    });

    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);

    // Autocomplete für beide Input-Felder
    const originAutocomplete = new window.google.maps.places.Autocomplete(
      document.getElementById('origin-input'),
      { types: ['address'], componentRestrictions: { country: 'de' } }
    );

    const destinationAutocomplete = new window.google.maps.places.Autocomplete(
      document.getElementById('destination-input'),
      { types: ['address'], componentRestrictions: { country: 'de' } }
    );

    originAutocomplete.addListener('place_changed', () => {
      const place = originAutocomplete.getPlace();
      if (place.formatted_address) {
        setLocations(prev => ({...prev, origin: place.formatted_address}));
      }
    });

    destinationAutocomplete.addListener('place_changed', () => {
      const place = destinationAutocomplete.getPlace();
      if (place.formatted_address) {
        setLocations(prev => ({...prev, destination: place.formatted_address}));
      }
    });

    setAutocomplete({ origin: originAutocomplete, destination: destinationAutocomplete });
  };

  const calculateRoute = () => {
    if (!directionsService || !directionsRenderer) return;

    setIsLoading(true);
    const request = {
      origin: locations.origin,
      destination: locations.destination,
      travelMode: 'DRIVING',
      avoidHighways: false,
      avoidTolls: false
    };

    directionsService.route(request, (result, status) => {
      setIsLoading(false);
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        const route = result.routes[0];
        setRouteDetails({
          distance: route.legs[0].distance.text,
          duration: route.legs[0].duration.text,
          estimatedPrice: calculatePrice(route.legs[0].distance.value / 1000)
        });
      } else {
        alert('Keine Route gefunden');
      }
    });
  };

  const calculatePrice = (distance) => {
    const BASE_PRICE = 500;
    const PRICE_PER_KM = 2.5;
    return (BASE_PRICE + (distance * PRICE_PER_KM)).toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start-Adresse
            </label>
            <input
              id="origin-input"
              type="text"
              defaultValue={defaultOrigin}
              className="w-full p-2 border rounded-md"
              placeholder="Von..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ziel-Adresse
            </label>
            <input
              id="destination-input"
              type="text"
              defaultValue={defaultDestination}
              className="w-full p-2 border rounded-md"
              placeholder="Nach..."
            />
          </div>

          <button
            onClick={calculateRoute}
            disabled={isLoading || !locations.origin || !locations.destination}
            className="w-full bg-primary text-white p-3 rounded-md disabled:bg-gray-300 
                     disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin mr-2" />
                Berechne Route...
              </>
            ) : (
              'Route berechnen'
            )}
          </button>

          {routeDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Routendetails:</h3>
              <div className="space-y-2 text-sm">
                <p>Entfernung: {routeDetails.distance}</p>
                <p>Fahrzeit: {routeDetails.duration}</p>
                <p className="text-lg font-medium text-primary">
                  Geschätzte Fahrtkosten: {routeDetails.estimatedPrice}€
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="h-[400px] bg-gray-100 rounded-lg">
          <div id="map" className="w-full h-full rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default MovingPriceCalculator;