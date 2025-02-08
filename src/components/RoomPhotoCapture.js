import React, { useState, useEffect, useRef, useCallback } from 'react';
import photoStorage from '../utils/photoStorage';
import Webcam from 'react-webcam';
import { Camera, X } from 'lucide-react';
import Toast from './Toast';

const RoomPhotoCapture = ({ roomName, onPhotoCapture, existingPhotos = [] }) => {
  const [photos, setPhotos] = useState(existingPhotos);
  const [showCamera, setShowCamera] = useState(false);
  const [toast, setToast] = useState(null);
  const webcamRef = useRef(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const startCamera = () => {
    setShowCamera(true);
  };

  const capturePhoto = useCallback(async () => {
    try {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          // Convert base64 to blob
          const response = await fetch(imageSrc);
          const blob = await response.blob();
          
          // Save photo to storage
          await photoStorage.savePhoto(roomName, blob);
          
          // Reload photos from storage
          const roomPhotos = await photoStorage.getPhotos(roomName);
          setPhotos(roomPhotos);
          onPhotoCapture(roomPhotos);
          setShowCamera(false);
        }
      }
    } catch (error) {
      console.error('Fehler beim Aufnehmen des Fotos:', error);
      showToast('Fehler beim Aufnehmen des Fotos');
    }
  }, [roomName, onPhotoCapture]);

  const handleDeletePhoto = async (id) => {
    try {
      await photoStorage.deletePhoto(id);
      const roomPhotos = await photoStorage.getPhotos(roomName);
      setPhotos(roomPhotos);
      onPhotoCapture(roomPhotos);
    } catch (error) {
      console.error('Fehler beim Löschen des Fotos:', error);
      showToast('Fehler beim Löschen des Fotos');
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="p-4 border rounded-lg bg-white shadow-sm mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{roomName} - Fotos ({photos.length})</h3>
          <button
            onClick={startCamera}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            disabled={showCamera}
          >
            <Camera className="h-5 w-5" />
            Foto aufnehmen
          </button>
        </div>

        {showCamera && (
          <div className="mb-4">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full max-w-md mx-auto rounded-lg"
            />
            <button
              onClick={capturePhoto}
              className="mt-2 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
            >
              Aufnehmen
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.length > 0 ? (
            photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.data}
                  alt={`Room photo`}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500">
              <p>Keine Fotos vorhanden</p>
              <p className="text-sm text-gray-400">Nehmen Sie Fotos von wichtigen Details des Raums auf</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPhotoCapture;