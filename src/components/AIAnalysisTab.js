// src/components/AIAnalysisTab.js
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Loader, X } from 'lucide-react';
import { analyzeRoomImages } from '../services/roomAnalysisService';
import AIFeedbackDisplay from './AIFeedbackDisplay';


const AnalysisResults = ({ results, onApplyResults }) => {
    const [editableResults, setEditableResults] = useState(results);
    const [editingItem, setEditingItem] = useState(null);
  
    // Aktualisiert das Gesamtvolumen basierend auf allen Items
    const updateTotalVolume = (items) => {
      const newTotal = items.reduce((sum, item) => sum + (item.volume * (item.count || 1)), 0);
      setEditableResults(prev => ({
        ...prev,
        totalVolume: newTotal,
        items: items
      }));
    };
  
    const handleItemUpdate = (index, updates) => {
      const newItems = [...editableResults.items];
      newItems[index] = {
        ...newItems[index],
        ...updates
      };
      updateTotalVolume(newItems);
    };
  
    const handleDeleteItem = (index) => {
      const newItems = editableResults.items.filter((_, i) => i !== index);
      updateTotalVolume(newItems);
    };
  
    // Parst die Maße aus dem String und berechnet das Volumen
    const calculateVolume = (dimensions) => {
      const matches = dimensions.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/);
      if (matches) {
        const [_, length, width, height] = matches;
        return (length * width * height) / 1000000; // cm³ to m³
      }
      return 0;
    };
  
    const ItemEditor = ({ item, index, onSave, onCancel }) => {
        const [editedItem, setEditedItem] = useState({ ...item });
      
        const handleChange = (updates) => {
            setEditedItem(prev => ({
              ...prev,
              ...updates
            }));
          };
      
        const handleSaveChanges = () => {
          onSave(editedItem);
          onCancel();
        };
      
        const calculateVolume = (dimensions) => {
          const matches = dimensions.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/);
          if (matches) {
            const [_, length, width, height] = matches;
            return (length * width * height) / 1000000; // cm³ to m³
          }
          return 0;
        };
      
        return (
          <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-primary">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editedItem.name}
                  onChange={(e) => handleChange({ name: e.target.value })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
      
              {/* Maße */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maße (L x B x H in cm)
                </label>
                <input
                  type="text"
                  value={editedItem.dimensions}
                  onChange={(e) => {
                    const newDimensions = e.target.value;
                    const newVolume = calculateVolume(newDimensions);
                    handleChange({ 
                      dimensions: newDimensions,
                      volume: newVolume
                    });
                  }}
                  placeholder="z.B. 200 x 100 x 75"
                  className="w-full p-2 border rounded-md"
                />
              </div>
      
              {/* Anzahl */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl</label>
                <input
                  type="number"
                  min="1"
                  value={editedItem.count || 1}
                  onChange={(e) => handleChange({ count: parseInt(e.target.value) || 1 })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
      
              {/* Beschreibung */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                <textarea
                  value={editedItem.description}
                  onChange={(e) => handleChange({ description: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows="2"
                />
              </div>
      
              <div className="flex gap-2">
                <button
                  onClick={handleSaveChanges}
                  className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-primary-dark"
                >
                  Speichern
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-md hover:bg-gray-200"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        );
      };
  
      const ItemDisplay = ({ item, onEdit, onDelete }) => {
        if (!item) return null;
      
        return (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-lg">
                    {item.count > 1 ? `${item.count}x ${item.name}` : item.name}
                  </h4>
                  {item.confidence && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      {Math.round(item.confidence)}% Konfidenz
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-1">{item.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">{item.dimensions}</div>
                <div className="text-sm font-medium">
                  {item.volume.toFixed(2)} m³
                </div>
              </div>
            </div>
      
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => onEdit && onEdit(item)}  // Prüfe ob onEdit existiert
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md 
                         transition-colors text-gray-700"
              >
                Bearbeiten
              </button>
              <button
                onClick={() => onDelete && onDelete(item)}  // Prüfe ob onDelete existiert
                className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 rounded-md 
                         transition-colors text-red-700"
              >
                Entfernen
              </button>
            </div>
          </div>
        );
      };
      
      
  
    if (!editableResults) return null;
  
    return (
      <div className="mt-6 space-y-6">
        {/* Zusammenfassung */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Zusammenfassung</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{editableResults.summary}</p>
        </div>
  
        {/* Erkannte Gegenstände */}
        <div>
          <h3 className="text-lg font-medium mb-3">Erkannte Gegenstände</h3>
          <div className="grid gap-4">
            {editableResults.items.map((item, index) => (
              editingItem === index ? (
                <ItemEditor
                  key={index}
                  item={item}
                  index={index}
                  onSave={(updates) => handleItemUpdate(index, updates)}
                  onCancel={() => setEditingItem(null)}
                />
              ) : (
                <ItemDisplay
                  key={index}
                  item={item}
                  index={index}
                  onEdit={() => setEditingItem(index)}
                  onDelete={() => handleDeleteItem(index)}
                />
              )
            ))}
          </div>
        </div>
  
        {/* Umzugsempfehlungen */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Umzugsempfehlungen</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{editableResults.movingTips}</p>
        </div>
  
        {/* Gesamtvolumen */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Gesamtvolumen:</span>
            <span className="text-lg font-bold">{editableResults.totalVolume.toFixed(2)} m³</span>
          </div>
        </div>
  
        {/* Übernehmen Button */}
        {onApplyResults && (
          <button
            onClick={() => onApplyResults(editableResults)}
            className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Analyseergebnisse in Standardansicht übernehmen
          </button>
        )}
      </div>
    );
  };

const AIAnalysisTab = ({ roomName, onAnalysisComplete }) => {
  const [files, setFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeInput, setActiveInput] = useState('upload');
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  // Cleanup function for stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const [customPrompt, setCustomPrompt] = useState(
    `Analysiere diese Bilder eines ${roomName}s und identifiziere alle Möbelstücke. 
  Für jeden Gegenstand gib an:
  1. Name auf Deutsch
  2. Geschätzte Maße (L x B x H in cm)
  3. Geschätztes Volumen in m³
  4. Kurze Beschreibung (Material, Farbe, Zustand)
  
  Berechne auch das Gesamtvolumen aller Möbel.
  Gib auch Umzugshinweise und Besonderheiten an.
  
  Format als JSON:
  {
    "items": [{
      "name": string,        // Name des Möbelstücks
      "dimensions": string,  // Maße in cm (z.B. "200 x 100 x 75")
      "volume": number,      // Volumen in m³
      "description": string  // Beschreibung
    }],
    "totalVolume": number,   // Gesamtvolumen in m³
    "summary": string,       // Zusammenfassung des Raums
    "movingTips": string    // Umzugshinweise
  }`
  );
  
  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleDelete = (itemToDelete) => {
    if (analysisResults && analysisResults.items) {
      const newItems = analysisResults.items.filter(item => item !== itemToDelete);
      const newTotalVolume = newItems.reduce((sum, item) => 
        sum + (item.volume * (item.count || 1)), 0
      );
      
      setAnalysisResults({
        ...analysisResults,
        items: newItems,
        totalVolume: newTotalVolume
      });
    }
  };

  // Füge diese UI-Komponente vor dem Analysis Button ein:
  {/* Prompt Editor */}
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium text-gray-700">Analyse-Prompt anpassen</label>
      <button
        onClick={() => setCustomPrompt(`Analysiere diese Bilder eines ${roomName}s und identifiziere alle Möbelstücke. 
  Für jeden Gegenstand gib an:
  1. Name auf Deutsch
  2. Geschätzte Maße (L x B x H in cm)
  3. Geschätztes Volumen in m³
  4. Kurze Beschreibung (Material, Farbe, Zustand)
  
  Berechne auch das Gesamtvolumen aller Möbel.
  Gib auch Umzugshinweise und Besonderheiten an.
  
  Format als JSON:
  {
    "items": [{
      "name": string,
      "dimensions": string,
      "volume": number,
      "description": string
    }],
    "totalVolume": number,
    "summary": string,
    "movingTips": string
  }`)}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        Zurücksetzen
      </button>
    </div>
    <div className="relative">
      <textarea
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        className="w-full h-48 p-3 border rounded-lg font-mono text-sm resize-y"
        placeholder="Geben Sie hier Ihren angepassten Prompt ein..."
      />
    </div>
    <p className="text-xs text-gray-500">
      Tipp: Passen Sie den Prompt an, um spezifischere oder andere Informationen zu erhalten. 
      Behalten Sie das JSON-Format bei.
    </p>
  </div>

  const handleFileUpload = (event) => {
    try {
      const selectedFiles = Array.from(event.target.files).filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
        return isValidType && isValidSize;
      });

      if (selectedFiles.length === 0) {
        setError('Bitte nur Bilddateien bis 10MB auswählen');
        return;
      }

      setFiles(prev => [
        ...prev,
        ...selectedFiles.map(file => ({
          id: Date.now() + Math.random(),
          file,
          preview: URL.createObjectURL(file)
        }))
      ]);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Dateien');
    }
  };

  const handleCameraCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setActiveInput('camera');
      setError(null);
    } catch (err) {
      setError('Kamera konnte nicht gestartet werden');
    }
  };

  const handleCapture = async () => {
    if (!stream || !videoRef.current) return;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(videoTrack);
      const blob = await imageCapture.takePhoto();
      const file = new File([blob], `${roomName}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      setFiles(prev => [...prev, {
        id: Date.now(),
        file,
        preview: URL.createObjectURL(blob)
      }]);

      stopCamera();
      setError(null);
    } catch (err) {
      setError('Fehler beim Aufnehmen des Fotos');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setActiveInput('upload');
  };

  const removeFile = (fileId) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      prev
        .filter(f => f.id === fileId)
        .forEach(f => URL.revokeObjectURL(f.preview));
      return newFiles;
    });
  };

  const clearAllFiles = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError('Bitte mindestens ein Foto hochladen');
      return;
    }
  
    setIsAnalyzing(true);
    setError(null);
  
    try {
      // Wandle Files in Base64 um
      const imagePromises = files.map(async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file.file);
        });
      });
  
      const base64Images = await Promise.all(imagePromises);
      
      console.log('Sending request with:', {  // Debug log
        imagesCount: base64Images.length,
        customPrompt: customPrompt,
        roomName
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: base64Images,
          roomName,
          customPrompt
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const responseData = await response.json();
      // Prüfe ob die Response ein Array ist und nehme das erste Element
      const content = Array.isArray(responseData) ? responseData[0].text : responseData;
      
      // Parse das JSON aus dem Text
      const analysisResults = typeof content === 'string' ? JSON.parse(content) : content;
  
      if (!analysisResults || !analysisResults.items) {
        throw new Error('Ungültiges Antwortformat von der API');
      }
  
      setAnalysisResults(analysisResults);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Fehler bei der Analyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Selection */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveInput('upload')}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
            activeInput === 'upload' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Upload className="w-5 h-5" />
          Upload
        </button>
        <button
          onClick={handleCameraCapture}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
            activeInput === 'camera' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Camera className="w-5 h-5" />
          Kamera
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center">
          <X className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Camera View */}
      {activeInput === 'camera' && stream && (
        <div className="relative rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-[400px] object-cover"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <button
              onClick={handleCapture}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
            >
              Foto aufnehmen
            </button>
            <button
              onClick={stopCamera}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {activeInput === 'upload' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer block text-center"
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Klicken zum Hochladen oder Dateien hierher ziehen
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Maximal 10MB pro Bild
            </p>
          </label>
        </div>
      )}

      {/* Preview Area */}
      {/* Im AIAnalysisTab, ersetzen Sie den Preview-Bereich */}
     
{/* Preview Area */}
{files.length > 0 && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-medium">
        Hochgeladene Fotos ({files.length})
      </h3>
      <button
        onClick={clearAllFiles}
        className="text-red-500 text-sm hover:text-red-700"
      >
        Alle löschen
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {files.map(file => (
        <div key={file.id} className="relative group min-h-[300px] max-h-[400px] w-full">
          <img
            src={file.preview}
            alt="Vorschau"
            className="w-full h-full object-contain bg-gray-100 rounded-lg"
            onClick={() => setSelectedImage(file)}
          />
          <button
            onClick={() => removeFile(file.id)}
            className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  </div>
)}

{/* Modal für Vollbild-Ansicht */}
{selectedImage && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
    onClick={() => setSelectedImage(null)}
  >
    <div className="relative max-w-full max-h-full">
      <img
        src={selectedImage.preview}
        alt="Vollbild Vorschau"
        className="max-h-[90vh] w-auto max-w-[90vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={() => setSelectedImage(null)}
        className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  </div>
)}

<div className="space-y-2">
  <div className="flex justify-between items-center">
    <label className="text-sm font-medium text-gray-700">Analyse-Prompt anpassen</label>
    <button
      onClick={() => setCustomPrompt(`Analysiere diese Bilder eines ${roomName}s und identifiziere alle Möbelstücke. 
Für jeden Gegenstand gib an:
1. Name auf Deutsch
2. Geschätzte Maße (L x B x H in cm)
3. Geschätztes Volumen in m³
4. Kurze Beschreibung (Material, Farbe, Zustand)

Berechne auch das Gesamtvolumen aller Möbel.
Gib auch Umzugshinweise und Besonderheiten an.

Format als JSON:
{
  "items": [{
    "name": string,
    "dimensions": string,
    "volume": number,
    "description": string
  }],
  "totalVolume": number,
  "summary": string,
  "movingTips": string
}`)}
      className="text-sm text-blue-600 hover:text-blue-800"
    >
      Zurücksetzen
    </button>
  </div>
  <div className="relative">
    <textarea
      value={customPrompt}
      onChange={(e) => setCustomPrompt(e.target.value)}
      className="w-full h-48 p-3 border rounded-lg font-mono text-sm resize-y"
      placeholder="Gebe hier den angepassten Prompt ein..."
    />
  </div>
  <p className="text-xs text-gray-500">
    
    Behalte immer das JSON-Format bei.
  </p>
</div>

      {/* Analysis Button */}
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || files.length === 0}
        className="w-full bg-primary text-white py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isAnalyzing ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Analysiere mit Claude AI...
          </>
        ) : (
          'KI-Analyse starten'
        )}
      </button>

      {/* Analysis Results - Jetzt mit onApplyResults */}
      {analysisResults && (
        <AnalysisResults 
          results={analysisResults} 
          onApplyResults={onAnalysisComplete} 
        />
      )}
    </div>
  );
};

export default AIAnalysisTab;