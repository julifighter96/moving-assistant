import React, { useState, useEffect } from 'react';
import { updateDealDirectly } from '../utils/dealUpdateFunctions';
import { getDeal } from '../services/pipedriveService';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { de } from 'date-fns/locale';
import { Truck, ExternalLink } from 'lucide-react';
import MovingPriceCalculator from './MovingPriceCalculator';
import axios from 'axios';
import Toast from './Toast';

const MOVE_INFO_FIELDS = [
   { name: 'Wunschdatum', apiKey: 'b9d01d5dcd86c878a57cb0febd336e4d390af900', type: 'date' },
   { name: 'Auszugsadresse', apiKey: '07c3da8804f7b96210e45474fba35b8691211ddd', type: 'text' },
   { name: 'Etage(n) Beladestelle', apiKey: '72cfdc30fa0621d1d6947cf408409e44c6bb40d6', type: 'number' },
   { name: 'Einzugsadresse', apiKey: '9cb4de1018ec8404feeaaaf7ee9b293c78c44281', type: 'text' },
   { name: 'Etage(n) Entladestelle', apiKey: '9e4e07bce884e21671546529b564da98ceb4765a', type: 'number' },
   { name: 'HVZ', apiKey: '78050c086c106b0e9f655eb0b92ceb1ae1825378', type: 'multiselect', options: ['B', 'E', 'Z'], value: [] },
];

const MoveInformationComponent = ({ dealId, onComplete }) => {
 const [moveInfo, setMoveInfo] = useState({});
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState(null);
 const [showPriceCalculator, setShowPriceCalculator] = useState(false);
 const [transportCost, setTransportCost] = useState(0);
 const [toast, setToast] = useState(null);
 const [calculatedRoute, setCalculatedRoute] = useState(null);

 useEffect(() => {
   // Load Google Maps Script
   if (!window.google) {
     const script = document.createElement('script');
     script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
     script.async = true;
     document.body.appendChild(script);

     return () => {
       document.body.removeChild(script);
     };
   }
 }, []);

 useEffect(() => {
   const fetchDealData = async () => {
     setIsLoading(true);
     setError(null);
     try {
       const dealData = await getDeal(dealId);
       const initialInfo = {};
       MOVE_INFO_FIELDS.forEach(field => {
         if (field.type === 'date' && dealData[field.apiKey]) {
           initialInfo[field.apiKey] = new Date(dealData[field.apiKey]);
         } else if (field.type === 'number' && dealData[field.apiKey]) {
           initialInfo[field.apiKey] = parseInt(dealData[field.apiKey], 10);
         } else if (field.type === 'multiselect') {
           initialInfo[field.apiKey] = Array.isArray(dealData[field.apiKey]) ? dealData[field.apiKey] : [];
         } else {
           initialInfo[field.apiKey] = dealData[field.apiKey] || '';
         }
       });
       setMoveInfo(initialInfo);
       
       // Speichere Adressen im SessionStorage für andere Komponenten
       const pickupAddress = dealData['07c3da8804f7b96210e45474fba35b8691211ddd'];
       const deliveryAddress = dealData['9cb4de1018ec8404feeaaaf7ee9b293c78c44281'];
       
       if (pickupAddress || deliveryAddress) {
         try {
           console.log("Speichere Adressen im SessionStorage:", { origin: pickupAddress, destination: deliveryAddress });
           sessionStorage.setItem('movingAddresses', JSON.stringify({
             origin: pickupAddress || '',
             destination: deliveryAddress || ''
           }));
         } catch (e) {
           console.error("Fehler beim Speichern der Adressen im SessionStorage:", e);
         }
       }
     } catch (err) {
       console.error('Error fetching deal data:', err);
       setError('Fehler beim Laden der Daten. Bitte versuchen Sie es erneut.');
     } finally {
       setIsLoading(false);
     }
   };

   fetchDealData();
 }, [dealId]);

 const handleInputChange = (apiKey, value, type) => {
   setMoveInfo(prevInfo => ({
     ...prevInfo,
     [apiKey]: type === 'number' ? (value === '' ? '' : parseInt(value, 10)) : value
   }));
 };

 const handleMultiSelectChange = (apiKey, option) => {
   setMoveInfo(prevInfo => {
     const currentValues = Array.isArray(prevInfo[apiKey]) ? prevInfo[apiKey] : [];
     const newValues = currentValues.includes(option)
       ? currentValues.filter(v => v !== option)
       : [...currentValues, option];
     return {
       ...prevInfo,
       [apiKey]: newValues
     };
   });
 };

 const showToast = (message, type = 'error') => {
   setToast({ message, type });
 };

 const handleSubmit = async () => {
   try {
     const dataToUpdate = {};
     MOVE_INFO_FIELDS.forEach(field => {
       if (field.type === 'date' && moveInfo[field.apiKey] instanceof Date) {
         dataToUpdate[field.apiKey] = moveInfo[field.apiKey].toISOString().split('T')[0];
       } else if (field.type === 'number') {
         dataToUpdate[field.apiKey] = moveInfo[field.apiKey] === '' ? null : moveInfo[field.apiKey];
       } else if (field.type === 'multiselect') {
         // Ensure multiselect fields are properly formatted as arrays
         dataToUpdate[field.apiKey] = Array.isArray(moveInfo[field.apiKey]) ? moveInfo[field.apiKey] : [];
       } else {
         dataToUpdate[field.apiKey] = moveInfo[field.apiKey] || '';
       }
     });
     
     // Add transport cost to the data if it exists
     if (transportCost) {
       dataToUpdate.transportCost = transportCost;
     }

     console.log('Sending data to Pipedrive:', dataToUpdate);
     
     const response = await updateDealDirectly(dealId, dataToUpdate);
     console.log('Response from Pipedrive:', response);

     if (!response || response.success === false) {
       throw new Error(response?.message || 'Failed to update deal');
     }

     // Speichere aktuelle Adressen im SessionStorage
     const pickupAddress = moveInfo['07c3da8804f7b96210e45474fba35b8691211ddd'];
     const deliveryAddress = moveInfo['9cb4de1018ec8404feeaaaf7ee9b293c78c44281'];
     
     if (pickupAddress || deliveryAddress) {
       console.log("Aktualisiere Adressen im SessionStorage:", { origin: pickupAddress, destination: deliveryAddress });
       sessionStorage.setItem('movingAddresses', JSON.stringify({
         origin: pickupAddress || '',
         destination: deliveryAddress || ''
       }));
     }

     onComplete(response);
     showToast('Umzugsinformationen wurden erfolgreich aktualisiert', 'success');
   } catch (error) {
     console.error('API Error Details:', {
       message: error.message,
       status: error.response?.status,
       statusText: error.response?.statusText,
       data: error.response?.data,
       url: error.config?.url,
       method: error.config?.method,
       headers: error.config?.headers,
       requestData: error.config?.data
     });
     showToast(`Es gab einen Fehler beim Aktualisieren der Umzugsinformationen: ${error.message}`);
   }
 };

 const openInGoogleMaps = () => {
   if (calculatedRoute && calculatedRoute.origin && calculatedRoute.destination) {
     const origin = encodeURIComponent(calculatedRoute.origin);
     const destination = encodeURIComponent(calculatedRoute.destination);
     const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
     window.open(url, '_blank');
   } else {
     showToast('Bitte berechnen Sie zuerst die Route', 'error');
   }
 };

 if (isLoading) {
   return <div className="text-center py-4">Lade Umzugsinformationen...</div>;
 }

 if (error) {
   return <div className="text-center py-4 text-red-500">{error}</div>;
 }

 return (
   <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
     <h2 className="text-2xl font-bold mb-6 text-center">Umzugsinformationen</h2>
     {MOVE_INFO_FIELDS.map(field => (
       <div key={field.apiKey} className="mb-4">
         <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={field.apiKey}>
           {field.name}
         </label>
         
         {field.type === 'date' ? (
           <DatePicker
             selected={moveInfo[field.apiKey]}
             onChange={(date) => handleInputChange(field.apiKey, date, field.type)}
             dateFormat="dd.MM.yyyy"
             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
             locale={de}
           />
         ) : field.name.includes('adresse') ? (
           <input
             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
             id={field.apiKey}
             type="text"
             value={moveInfo[field.apiKey] || ''}
             onChange={(e) => handleInputChange(field.apiKey, e.target.value, field.type)}
             ref={(input) => {
               if (input && !input.getAttribute('data-autocomplete-initialized') && window.google) {
                 const autocomplete = new window.google.maps.places.Autocomplete(input, {
                   types: ['address'],
                   componentRestrictions: { country: 'de' }
                 });
                 autocomplete.addListener('place_changed', () => {
                   const place = autocomplete.getPlace();
                   if (place.formatted_address) {
                     handleInputChange(field.apiKey, place.formatted_address, field.type);
                   }
                 });
                 input.setAttribute('data-autocomplete-initialized', 'true');
               }
             }}
           />
         ) : field.type === 'multiselect' ? (
           <div className="flex flex-wrap gap-2">
             {field.options.map(option => (
               <label key={option} className="inline-flex items-center">
                 <input
                   type="checkbox"
                   checked={Array.isArray(moveInfo[field.apiKey]) && moveInfo[field.apiKey].includes(option)}
                   onChange={() => handleMultiSelectChange(field.apiKey, option)}
                   className="form-checkbox h-5 w-5 text-primary"
                 />
                 <span className="ml-2">
                   {option === 'B' ? 'Beginn (6-10 Uhr)' : 
                    option === 'E' ? 'Ende (15-19 Uhr)' : 
                    option === 'Z' ? 'Zwischen (10-15 Uhr)' : option}
                 </span>
               </label>
             ))}
           </div>
         ) : (
           <input
             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
             id={field.apiKey}
             type={field.type}
             value={moveInfo[field.apiKey] || ''}
             onChange={(e) => handleInputChange(field.apiKey, e.target.value, field.type)}
           />
         )}
       </div>
     ))}

     {/* Route Calculation Section */}
     <div className="mt-6 bg-gray-50 rounded-xl p-6">
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
         <div className="relative">
           <div className="h-[70vh] w-full mb-4" style={{ minHeight: '500px' }}>
             <MovingPriceCalculator 
               defaultOrigin={moveInfo['07c3da8804f7b96210e45474fba35b8691211ddd']}
               defaultDestination={moveInfo['9cb4de1018ec8404feeaaaf7ee9b293c78c44281']}
               onPriceCalculated={(calculatedPrice) => {
                 setTransportCost(parseFloat(calculatedPrice));
               }}
               onRouteCalculated={(route) => {
                 setCalculatedRoute(route);
               }}
             />
           </div>
           <div className="flex justify-end">
             <button
               onClick={openInGoogleMaps}
               className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium bg-white px-4 py-2 rounded-lg shadow-sm"
               disabled={!calculatedRoute}
             >
               <ExternalLink className="w-4 h-4" />
               In Google Maps öffnen
             </button>
           </div>
         </div>
       )}
     </div>

     {/* Submit button */}
     <div className="flex items-center justify-between mt-6">
       <button
         className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
         type="button"
         onClick={handleSubmit}
       >
         Informationen speichern und fortfahren
       </button>
     </div>

     {toast && (
       <Toast
         message={toast.message}
         type={toast.type}
         onClose={() => setToast(null)}
       />
     )}
   </div>
 );
};

export default MoveInformationComponent;