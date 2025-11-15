import React, { useState } from 'react';
import { Share2, Copy, Check, Link as LinkIcon, Loader, Download } from 'lucide-react';
import { offlineStorage } from '../services/offlineStorage';

const ShareLinkButton = ({ dealId, onImportData }) => {
  const [shareLink, setShareLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Helper function to create correct API URL
  const createApiUrl = (endpoint) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    // Remove trailing slashes from baseUrl
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    // Remove leading slashes from endpoint
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    
    // Check if baseUrl already contains /api, if so, don't add it again
    if (cleanBaseUrl.endsWith('/api')) {
      // If endpoint starts with 'api/', remove it
      const endpointWithoutApi = cleanEndpoint.replace(/^api\//, '');
      return `${cleanBaseUrl}/${endpointWithoutApi}`;
    }
    
    // Otherwise, add endpoint as is
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  };

  const generateShareLink = async () => {
    if (!dealId) {
      setError('Kein Deal ausgewählt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, ensure inspection data is saved to server
      // Load from IndexedDB and sync to server before generating link
      try {
        const savedState = await offlineStorage.loadInspectionState(dealId);
        if (savedState && savedState.roomsData) {
          // Save inspection data to server
          const token = localStorage.getItem('token');
          const saveUrl = createApiUrl(`api/moves/${dealId}`);
          const saveResponse = await fetch(saveUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(savedState),
          });
          
          if (saveResponse.ok) {
            console.log('✅ Inspection data synced to server before generating link');
          } else {
            console.warn('⚠️ Could not sync inspection data, but continuing...');
          }
        } else {
          console.warn('⚠️ No roomsData found in saved state');
        }
      } catch (syncErr) {
        console.warn('Could not sync inspection data before generating link:', syncErr);
        // Continue anyway - maybe data is already on server
      }

      const token = localStorage.getItem('token');
      const url = createApiUrl(`api/inspections/${dealId}/share`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Generieren des Links');
      }

      const data = await response.json();
      setShareLink(data.url);
    } catch (err) {
      console.error('Error generating share link:', err);
      setError('Fehler beim Generieren des Links');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const importCustomerData = async () => {
    if (!dealId || !shareLink) {
      setError('Bitte erstellen Sie zuerst einen Link');
      return;
    }

    setImporting(true);
    setError(null);
    setImportSuccess(false);

    try {
      // Extract token from share link
      const token = shareLink.split('/customer-inventory/')[1] || shareLink.split('token=')[1];
      
      const url = createApiUrl(`api/inspections/shared/${token}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Kundendaten');
      }

      const data = await response.json();
      console.log('Imported customer data:', data);
      console.log('roomsData:', data.roomsData);
      console.log('roomsData keys:', data.roomsData ? Object.keys(data.roomsData) : 'none');
      
      if (onImportData && data.roomsData) {
        // Ensure roomsData is properly formatted
        const roomsDataToImport = data.roomsData && typeof data.roomsData === 'object' ? data.roomsData : {};
        console.log('Calling onImportData with:', roomsDataToImport);
        onImportData(roomsDataToImport);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        console.warn('No roomsData in imported data or onImportData not provided');
        setError('Keine Daten zum Importieren gefunden');
      }
    } catch (err) {
      console.error('Error importing customer data:', err);
      setError('Fehler beim Importieren der Daten');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Kundenlink</h3>
        </div>
        {!shareLink && (
          <button
            onClick={generateShareLink}
            disabled={loading || !dealId}
            className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 ${
              loading || !dealId
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {loading ? (
              <>
                <Loader className="h-3 w-3 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Share2 className="h-3 w-3" />
                Link erstellen
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-800 text-xs rounded-md">
          {error}
        </div>
      )}

      {shareLink && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700"
            />
            <button
              onClick={copyToClipboard}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="In Zwischenablage kopieren"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
          
          {onImportData && (
            <button
              onClick={importCustomerData}
              disabled={importing}
              className={`w-full px-3 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-2 ${
                importing
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white transition-colors`}
            >
              {importing ? (
                <>
                  <Loader className="h-3 w-3 animate-spin" />
                  Importiere...
                </>
              ) : (
                <>
                  <Download className="h-3 w-3" />
                  Kundendaten importieren
                </>
              )}
            </button>
          )}

          {importSuccess && (
            <div className="p-2 bg-green-50 text-green-800 text-xs rounded-md flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Daten erfolgreich importiert!</span>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Teilen Sie diesen Link mit dem Kunden, damit er die Umzugsgutliste bearbeiten kann.
          </p>
        </div>
      )}

      {!shareLink && !loading && dealId && (
        <p className="text-xs text-gray-500">
          Klicken Sie auf "Link erstellen", um einen Teilungslink zu generieren.
        </p>
      )}

      {!dealId && (
        <p className="text-xs text-gray-500">
          Bitte wählen Sie zuerst einen Deal aus.
        </p>
      )}
    </div>
  );
};

export default ShareLinkButton;

