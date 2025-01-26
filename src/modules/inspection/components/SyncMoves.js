import React, { useState, useEffect } from 'react';
import { RefreshCw, MapPin, Calendar, Building2, CreditCard } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const SyncMoves = () => {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [deals, setDeals] = useState([]);

  // Lade die synchronisierten Deals beim Komponenten-Mount
  useEffect(() => {
    fetchSyncedDeals();
  }, [lastSync]); // Aktualisiere wenn lastSync sich ändert

  const fetchSyncedDeals = async () => {
    try {
      const response = await fetch('/moving-assistant/api/deals');
      if (!response.ok) throw new Error('Fehler beim Laden der Aufträge');
      const data = await response.json();
      setDeals(data);
    } catch (error) {
      console.error('Fehler beim Laden der synchronisierten Aufträge:', error);
    }
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

  const syncDeals = async () => {
    setLoading(true);
    setSyncStatus(null);
    try {
      let allDeals = [];
      let start = 0;
      let moreItemsExist = true;

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

        allDeals = [...allDeals, ...response.data.data];
        moreItemsExist = response.data.additional_data?.pagination.more_items_in_collection || false;
        start += 100;
      }

      const syncResponse = await fetch('/moving-assistant/api/sync-deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deals: allDeals })
      });

      if (!syncResponse.ok) {
        throw new Error('Synchronisierung fehlgeschlagen');
      }

      const result = await syncResponse.json();
      setLastSync(new Date());
      setSyncStatus({
        success: true,
        message: `${allDeals.length} Umzüge erfolgreich synchronisiert`
      });
      
      // Lade die aktualisierten Deals
      await fetchSyncedDeals();
    } catch (error) {
      console.error('Fehler bei der Synchronisierung:', error);
      setSyncStatus({
        success: false,
        message: 'Fehler bei der Synchronisierung. Bitte versuchen Sie es erneut.'
      });
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Umzüge synchronisieren</h2>
            <p className="text-gray-500 mt-1">
              Synchronisiert alle Umzüge mit der Datenbank für Kalenderplanung
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4 mb-8">
          <button
            onClick={syncDeals}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-colors
              ${loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary-dark'}`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
          </button>

          {syncStatus && (
            <div className={`p-4 rounded-lg w-full max-w-md text-center
              ${syncStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {syncStatus.message}
            </div>
          )}

          {lastSync && (
            <p className="text-sm text-gray-500">
              Letzte Synchronisierung: {lastSync.toLocaleString('de-DE')}
            </p>
          )}
        </div>

        {/* Liste der synchronisierten Aufträge */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg border-b pb-2">
            Synchronisierte Aufträge
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {deals.map((deal) => (
              <div key={deal.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">{deal.title}</h4>
                  <span className="text-primary font-medium">
                    {formatCurrency(deal.value, deal.currency)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {deal.move_date 
                        ? format(new Date(deal.move_date), 'dd. MMMM yyyy', { locale: de })
                        : 'Kein Datum'}
                    </span>
                  </div>
                  
                  {deal.org_name && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span>{deal.org_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span>{deal.origin_address || 'Keine Adresse'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span>{deal.destination_address || 'Keine Adresse'}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {!deals.length && (
              <div className="text-center py-8 text-gray-500">
                Keine synchronisierten Aufträge gefunden
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncMoves; 