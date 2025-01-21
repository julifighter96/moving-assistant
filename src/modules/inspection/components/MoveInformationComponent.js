import React, { useState, useEffect } from 'react';
import { updateDealDirectly } from '../utils/dealUpdateFunctions';
import { getDeal } from '../services/pipedriveService';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { de } from 'date-fns/locale';

const MOVE_INFO_FIELDS = [
   { name: 'Wunschdatum', apiKey: 'b9d01d5dcd86c878a57cb0febd336e4d390af900', type: 'date' },
   { name: 'Auszugsadresse', apiKey: '07c3da8804f7b96210e45474fba35b8691211ddd', type: 'text' },
   { name: 'Etage(n) Beladestelle', apiKey: '72cfdc30fa0621d1d6947cf408409e44c6bb40d6', type: 'number' },
   { name: 'Einzugsadresse', apiKey: '9cb4de1018ec8404feeaaaf7ee9b293c78c44281', type: 'text' },
   { name: 'Etage(n) Entladestelle', apiKey: '9e4e07bce884e21671546529b564da98ceb4765a', type: 'number' },
];

const MoveInformationComponent = ({ dealData, onComplete }) => {
 const [moveInfo, setMoveInfo] = useState({});
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [dealInfo, setDealInfo] = useState(null);

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
     try {
       // Nur laden wenn eine dealId vorhanden ist
       if (!dealData?.id) {
         console.log('No deal ID provided');
         setLoading(false);
         return;
       }

       console.log('Fetching deal data for ID:', dealData.id);
       const data = await getDeal(dealData.id);
       setDealInfo(data);
     } catch (error) {
       console.error('Error fetching deal data:', error);
       setError('Fehler beim Laden der Deal-Informationen');
     } finally {
       setLoading(false);
     }
   };

   fetchDealData();
 }, [dealData]);

 const handleInputChange = (apiKey, value, type) => {
   setMoveInfo(prevInfo => ({
     ...prevInfo,
     [apiKey]: type === 'number' ? (value === '' ? '' : parseInt(value, 10)) : value
   }));
 };

 const handleSubmit = async () => {
   try {
     const dataToUpdate = {};
     MOVE_INFO_FIELDS.forEach(field => {
       if (field.type === 'date' && moveInfo[field.apiKey] instanceof Date) {
         dataToUpdate[field.apiKey] = moveInfo[field.apiKey].toISOString().split('T')[0];
       } else if (field.type === 'number') {
         dataToUpdate[field.apiKey] = moveInfo[field.apiKey] === '' ? null : moveInfo[field.apiKey];
       } else {
         dataToUpdate[field.apiKey] = moveInfo[field.apiKey] || '';
       }
     });
     
     console.log('Sending data to update:', dataToUpdate);
     await updateDealDirectly(dealData.id, dataToUpdate);
     onComplete(dataToUpdate);
   } catch (error) {
     console.error('Fehler beim Aktualisieren der Umzugsinformationen:', error);
     alert(`Es gab einen Fehler beim Aktualisieren der Umzugsinformationen: ${error.message}`);
   }
 };

 if (loading) {
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
     <div className="flex items-center justify-between">
       <button
         className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
         type="button"
         onClick={handleSubmit}
       >
         Informationen speichern und fortfahren
       </button>
     </div>
   </div>
 );
};

export default MoveInformationComponent;