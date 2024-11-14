// PriceConfiguration.js
import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const PriceConfiguration = () => {
 const [prices, setPrices] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [editingPrice, setEditingPrice] = useState(null);

 const loadPrices = async () => {
   try {
     setLoading(true);
     const loadedPrices = await adminService.getPrices();
     
     // Sicherstellen dass wir ein Array haben
     setPrices(Array.isArray(loadedPrices) ? loadedPrices : []);
     setError(null);
   } catch (err) {
     console.error('Error loading prices:', err);
     setError('Fehler beim Laden der Preise');
     setPrices([]); // Leeres Array im Fehlerfall
   } finally {
     setLoading(false);
   }
 };

 useEffect(() => {
   loadPrices();
 }, []);

 const handleUpdatePrice = async (price) => {
   try {
     setLoading(true);
     await adminService.updatePrice(price.id, price.price);
     setEditingPrice(null);
     await loadPrices();
   } catch (err) {
     setError('Fehler beim Aktualisieren des Preises');
     console.error(err);
   } finally {
     setLoading(false);
   }
 };

 if (loading && !prices.length) {
   return <div>Lädt...</div>;
 }

 return (
   <div className="space-y-4">
     {error && (
       <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
         <div className="flex">
           <div className="flex-shrink-0">
             <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
             </svg>
           </div>
           <div className="ml-3">
             <p className="text-sm text-red-700">{error}</p>
           </div>
         </div>
       </div>
     )}

     <div className="space-y-2">
       {Array.isArray(prices) && prices.length > 0 ? (
         prices.map((price) => price && (
           <div
             key={price.id || Math.random()}
             className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
           >
             {editingPrice?.id === price.id ? (
               <div className="flex w-full gap-4">
                 <div className="flex-1">
                   <span className="font-medium">{price.name}</span>
                 </div>
                 <div className="flex items-center gap-4">
                   <input
                     type="number"
                     value={editingPrice.price}
                     onChange={(e) => setEditingPrice({
                       ...editingPrice,
                       price: parseFloat(e.target.value) || 0
                     })}
                     className="w-32 rounded-md border-gray-300 px-3 py-2"
                     step="0.1"
                     min="0"
                   />
                   <span className="text-gray-500">€</span>
                   <button
                     onClick={() => handleUpdatePrice(editingPrice)}
                     className="px-4 py-2 bg-green-500 text-white rounded-md"
                   >
                     Speichern
                   </button>
                   <button
                     onClick={() => setEditingPrice(null)}
                     className="px-4 py-2 bg-gray-500 text-white rounded-md"
                   >
                     Abbrechen
                   </button>
                 </div>
               </div>
             ) : (
               <>
                 <span className="font-medium">{price.name || 'Unbenannt'}</span>
                 <div className="flex items-center gap-4">
                   <span className="text-gray-600">
                     {typeof price.price === 'number' ? `${price.price.toFixed(2)} €` : '0,00 €'}
                   </span>
                   <button
                     onClick={() => setEditingPrice(price)}
                     className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md"
                   >
                     Bearbeiten
                   </button>
                 </div>
               </>
             )}
           </div>
         ))
       ) : (
         <div className="text-center py-8 text-gray-500">
           Keine Preise verfügbar
         </div>
       )}
     </div>
   </div>
 );
};

export default PriceConfiguration;