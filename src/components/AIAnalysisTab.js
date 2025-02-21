// src/components/AIAnalysisTab.js
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Loader, X, Video, Mic } from 'lucide-react';
import { recognitionService } from '../services/recognitionService';
import AIFeedbackDisplay from './AIFeedbackDisplay';


const AnalysisResults = ({ results, onApplyResults }) => {
    const [editableResults, setEditableResults] = useState(results);
    const [editingItem, setEditingItem] = useState(null);
  
    // Update editableResults when results prop changes
    useEffect(() => {
      setEditableResults(results);
    }, [results]);

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
                <div className="text-sm text-gray-500">
                  {item.length}x{item.width}x{item.height} cm
                </div>
                <div className="text-sm font-medium">
                  {item.volume.toFixed(2)} m³
                </div>
              </div>
            </div>
      
            <AIFeedbackDisplay 
              item={item}
              onApplySuggestion={(suggestion) => onEdit({ ...item, ...suggestion })}
            />
      
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => onEdit(item)}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md 
                         transition-colors text-gray-700"
              >
                Bearbeiten
              </button>
              <button
                onClick={() => onDelete(item)}
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
            {editableResults.items && editableResults.items.map((item, index) => (
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
        <button
          onClick={() => onApplyResults(editableResults)}
          className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Analyseergebnisse in Standardansicht übernehmen
        </button>
      </div>
    );
  };

const AIAnalysisTab = ({ roomName, onAnalysisComplete }) => {
  const [files, setFiles] = useState([]);
  const [activeMode, setActiveMode] = useState('photo');
  const [mediaType, setMediaType] = useState('photo');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeInput, setActiveInput] = useState('upload');
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState(null);
  const recognitionRef = useRef(null);

  // Cleanup function for stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;  // Changed to true to keep recording
      recognition.interimResults = true;
      recognition.lang = 'de-DE';

      let recordingTimeout;  // Timer für automatisches Stoppen

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setSpeechError(null);
        setTranscript('');
        
        // Stoppe die Aufnahme nach 2 Minuten
        recordingTimeout = setTimeout(() => {
          if (recognition) {
            console.log('Stopping recording after timeout');
            recognition.stop();
          }
        }, 120000); // 2 Minuten = 120000ms
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setSpeechError(`Fehler bei der Spracherkennung: ${event.error}`);
        setIsListening(false);
        clearTimeout(recordingTimeout);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        clearTimeout(recordingTimeout);
      };

      recognition.onresult = (event) => {
        console.log('Speech recognition result:', event);
        let finalTranscript = '';
        let lastResultTimestamp = Date.now();
        
        // Sammle alle finalen Ergebnisse
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        
        // Aktualisiere das aktuelle Transkript mit dem letzten Zwischenergebnis
        const lastResult = event.results[event.results.length - 1];
        const currentTranscript = lastResult[0].transcript;
        
        console.log('Current transcript:', currentTranscript);
        setTranscript(currentTranscript);

        // Wenn wir ein finales Ergebnis haben
        if (lastResult.isFinal) {
          // Starte einen Timer, der nach 1 Sekunde ohne neue Ergebnisse die Aufnahme stoppt
          setTimeout(() => {
            const timeSinceLastResult = Date.now() - lastResultTimestamp;
            if (timeSinceLastResult >= 1000) {
              console.log('No new results for 1 second, stopping recording');
              recognitionRef.current?.stop();
              processVoiceInput(finalTranscript.trim());
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Spracherkennung wird von Ihrem Browser nicht unterstützt');
      return;
    }

    if (isListening) {
      setTranscript(''); // Reset transcript when starting new recording
      recognitionRef.current.start();
    } else {
      recognitionRef.current.start();
    }
  };

  const processVoiceInput = async (text) => {
    try {
      console.log('Starting voice input processing with text:', text);
      setIsAnalyzing(true);

      const requestData = {
        text,
        roomName,
        customPrompt: `Analysiere diese Sprachbeschreibung eines ${roomName}s und identifiziere alle genannten Möbelstücke.
Für jeden genannten Gegenstand gib an:
1. Name auf Deutsch
2. Geschätzte Maße (L x B x H in cm)
3. Geschätztes Volumen in m³
4. Standard-Beschreibung

Format als JSON:
{
  "items": [{
    "name": string,
    "length": number,
    "width": number,
    "height": number,
    "volume": number,
    "description": string
  }],
  "totalVolume": number,
  "summary": string,
  "movingTips": string
}`
      };

      console.log('Sending request to API with data:', requestData);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/analyze-voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API Error: ${errorText}`);
      }

      const newResults = await response.json();
      console.log('Received new results from API:', newResults);
      
      setAnalysisResults(prevResults => {
        console.log('Previous results:', prevResults);
        
        if (prevResults) {
          // Merge items and avoid duplicates
          const existingItems = prevResults.items || [];
          const newItems = newResults.items || [];
          
          console.log('Existing items:', existingItems);
          console.log('New items to add:', newItems);
          
          // Combine items arrays
          const mergedItems = [...existingItems, ...newItems];
          console.log('Merged items:', mergedItems);
          
          // Calculate new total volume
          const totalVolume = mergedItems.reduce((sum, item) => 
            sum + (item.volume * (item.count || 1)), 0
          );
          console.log('New total volume:', totalVolume);

          // Combine summaries and tips
          const summary = prevResults.summary 
            ? `${prevResults.summary}\n${newResults.summary}` 
            : newResults.summary;
            
          const movingTips = prevResults.movingTips 
            ? `${prevResults.movingTips}\n${newResults.movingTips}` 
            : newResults.movingTips;

          const result = {
            items: mergedItems,
            totalVolume,
            summary,
            movingTips
          };
          
          console.log('Returning merged results:', result);
          return result;
        }
        
        console.log('No previous results, returning new results:', newResults);
        return newResults;
      });

    } catch (err) {
      console.error('Error in processVoiceInput:', err);
      setError(err.message || 'Fehler bei der Analyse der Spracherkennung');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [customPrompt, setCustomPrompt] = useState(
    `Analysiere diese Bilder eines ${roomName}s und identifiziere alle Möbelstücke. 
  Für jeden Gegenstand gib an:
  1. Name auf Deutsch
  2. Geschätzte Maße (L x B x H in cm)
  3. Geschätztes Volumen in m³
  4. Kurze Beschreibung (Material, Farbe, Zustand)
  
  Berechne auch das Gesamtvolumen aller Möbel.
  Gib auch Umzugshinweise und Besonderheiten an.
  

  Das Format der gegenstände muss in cm sein also bei 1m 100cm, aber das Volumen in m³.
  Format als JSON:
  {
    "items": [{
      "name": string, 
      "length": number, 
      "width": number, 
      "height": number,
      "volume": number,
      "description": string
    }],
    "totalVolume": number,   // Gesamtvolumen in m³
    "summary": string,       // Zusammenfassung des Raums
    "movingTips": string    // Umzugshinweise
  }`
  );
  
  const handleEdit = (item) => {
    // Formatiere die Maße in das richtige Format für das Eingabefeld
    const dimensions = `${item.length || 0} x ${item.width || 0} x ${item.height || 0}`;
    setEditingItem({
      ...item,
      dimensions: dimensions
    });
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

  const handleFileUpload = (event) => {
    try {
      const selectedFiles = Array.from(event.target.files).filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB for images
        return isValidType && isValidSize;
      });

      if (selectedFiles.length === 0) {
        setError('Bitte nur Bilder bis 10MB auswählen');
        return;
      }

      setFiles(prev => [
        ...prev,
        ...selectedFiles.map(file => ({
          id: Date.now() + Math.random(),
          file,
          preview: URL.createObjectURL(file),
          type: 'photo'
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
    let mediaData = [];
    setIsAnalyzing(true);
    setError(null); // Clear previous errors
    
    try {
      // Validate files before processing
      if (files.length === 0) {
        throw new Error('Bitte wählen Sie mindestens ein Bild aus.');
      }

      console.log('Starting analysis with files:', {
        count: files.length,
        types: files.map(f => f.type),
        sizes: files.map(f => f.file.size)
      });

      const mediaPromises = files.map(async (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({
            type: file.type === 'photo' ? 'image' : 'video',
            data: reader.result,
            size: file.file.size
          });
          reader.readAsDataURL(file.file);
        });
      });
  
      mediaData = await Promise.all(mediaPromises);
      
      const requestData = {
        images: mediaData.filter(m => m.type === 'image').map(m => m.data),
        videos: mediaData.filter(m => m.type === 'video').map(m => m.data),
        roomName,
        customPrompt: customPrompt || ''
      };

      console.log('Prepared analysis request:', {
        imageCount: requestData.images.length,
        videoCount: requestData.videos.length,
        roomName: requestData.roomName,
        promptLength: requestData.customPrompt.length,
        totalDataSize: mediaData.reduce((sum, m) => sum + m.size, 0)
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      let errorData;
      const responseText = await response.text();
      
      console.log('Received response:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        responseLength: responseText.length
      });
      
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', {
          error: e.message,
          responseText: responseText.substring(0, 200) + '...'
        });
        errorData = { error: responseText || 'Keine Details verfügbar' };
      }

      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          headers: Object.fromEntries(response.headers)
        });

        // Benutzerfreundliche Fehlermeldungen basierend auf Status und Fehlerdetails
        let errorMessage;
        switch (response.status) {
          case 500:
            if (errorData.details?.includes('db is not defined')) {
              errorMessage = 'Datenbankverbindung fehlgeschlagen. Bitte kontaktieren Sie den Support.';
            } else if (errorData.details?.includes('Failed to parse AI response')) {
              errorMessage = 'Die KI-Analyse konnte nicht verarbeitet werden. Bitte versuchen Sie es mit einem anderen Bild.';
            } else {
              errorMessage = 'Server-Fehler: ' + (errorData.details || 'Bitte versuchen Sie es später erneut.');
            }
            break;
          case 413:
            errorMessage = 'Die Bilder sind zu groß. Bitte verwenden Sie kleinere Dateien.';
            break;
          case 401:
            errorMessage = 'Authentifizierungsfehler. Bitte melden Sie sich erneut an.';
            break;
          default:
            errorMessage = errorData.error || errorData.details || 'Ein unerwarteter Fehler ist aufgetreten';
        }
        throw new Error(errorMessage);
      }

      // Validate the response data structure
      if (!errorData || typeof errorData !== 'object') {
        console.error('Invalid response data structure:', errorData);
        throw new Error('Ungültiges Antwortformat vom Server');
      }

      if (!Array.isArray(errorData.items)) {
        console.error('Missing or invalid items array in response:', errorData);
        throw new Error('Keine Gegenstände in der Analyse gefunden');
      }

      setAnalysisResults(errorData);
      setError(null);
      
    } catch (err) {
      console.error('Analysis error details:', {
        message: err.message,
        mediaTypes: mediaData.map(m => m.type),
        apiUrl: process.env.REACT_APP_API_URL,
        stack: err.stack
      });
      
      // Benutzerfreundliche Fehlermeldung setzen
      setError(err.message || 'Fehler bei der Analyse. Bitte versuchen Sie es später erneut.');
      setAnalysisResults(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Selection with Voice Button */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => {
            setActiveMode('photo');
            setMediaType('photo');
          }}
          className={`flex-1 py-2 px-4 rounded-lg ${
            activeMode === 'photo' ? 'bg-primary text-white' : 'bg-gray-100'
          }`}
        >
          <Camera className="w-4 h-4 inline mr-2" />
          Fotos
        </button>
        <button
          onClick={() => {
            setActiveMode('voice');
            toggleListening();
          }}
          className={`flex-1 py-2 px-4 rounded-lg ${
            activeMode === 'voice' ? 'bg-red-500 text-white' : 'bg-gray-100'
          }`}
        >
          <Mic className={`w-4 h-4 inline mr-2 ${isListening ? 'animate-pulse' : ''}`} />
          {isListening ? 'Aufnahme stoppen' : 'Spracherkennung'}
        </button>
      </div>

      {/* Voice Recognition Status */}
      {activeMode === 'voice' && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            {isAnalyzing ? (
              <span className="flex items-center">
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Analysiere Sprachaufnahme...
              </span>
            ) : (
              `Spracherkennung ${isListening ? 'aktiv' : 'gestoppt'}`
            )}
          </h3>
          <p className="text-blue-700">
            {isAnalyzing ? (
              'Ihre Sprachaufnahme wird gerade analysiert...'
            ) : isListening ? (
              transcript || 'Sprechen Sie jetzt...'
            ) : (
              'Klicken Sie auf Spracherkennung um fortzufahren'
            )}
          </p>
        </div>
      )}

      {/* Speech Error Display */}
      {speechError && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center">
          <X className="w-5 h-5 mr-2" />
          {speechError}
        </div>
      )}

      {/* Only show upload and preview area when in photo mode */}
      {activeMode === 'photo' && (
        <>
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
                  Klicken zum Hochladen oder Bilder hierher ziehen
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Maximal 10MB pro Bild
                </p>
              </label>
            </div>
          )}

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

          {/* Analysis Prompt Editor */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Analyse-Prompt anpassen</label>
              <button
                onClick={() => setCustomPrompt(`Analysiere diese Bilder eines ${roomName}s und identifiziere alle Möbelstücke. 
    Für jeden Gegenstand gib an:
    1. Name auf Deutsch
    2. Exakte Maße in Zentimetern:
         - Länge (L)
         - Breite (B) 
         - Höhe (H)
      3. Geschätztes Volumen in m³
      4. Kurze Beschreibung (Material, Farbe, Zustand)
      
      Berechne auch das Gesamtvolumen aller Möbel.
      Gib auch Umzugshinweise und Besonderheiten an.
      
      Format als JSON:
      {
        "items": [{
          "name": string, 
          "length": number, 
          "width": number, 
          "height": number,
          "volume": number,
          "description": string
        }],
        "totalVolume": number,   // Gesamtvolumen in m³
        "summary": string,       // Zusammenfassung des Raums
        "movingTips": string    // Umzugshinweise
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
            disabled={isAnalyzing || files.length === 0}
            className="w-full bg-primary text-white py-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={handleAnalyze}
          >
            {isAnalyzing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analysiere mit Open AI...
              </>
            ) : (
              'KI-Analyse starten'
            )}
          </button>
        </>
      )}

      {/* Analysis Results */}
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