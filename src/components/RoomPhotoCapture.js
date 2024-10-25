import React, { useState, useEffect } from 'react';
import photoStorage from '../utils/photoStorage';

const RoomPhotoCapture = ({ roomName }) => {
  const [photos, setPhotos] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [videoElement, setVideoElement] = useState(null);

  // Load photos when component mounts or roomName changes
  useEffect(() => {
    const loadPhotos = async () => {
      console.log('Loading photos for room:', roomName);
      const roomPhotos = await photoStorage.getPhotos(roomName);
      console.log('Loaded photos:', roomPhotos);
      setPhotos(roomPhotos);
    };
    loadPhotos();
  }, [roomName]);

  // Cleanup stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for video element to be available
      setTimeout(() => {
        const video = document.querySelector('#camera-video');
        if (video) {
          video.srcObject = mediaStream;
          setVideoElement(video);
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Kamera konnte nicht gestartet werden');
    }
  };

  const handleCapture = async () => {
    if (!videoElement || !stream) {
      console.error('Video element or stream not ready');
      return;
    }

    try {
      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(videoTrack);
      const blob = await imageCapture.takePhoto();
      
      // Save photo to IndexedDB
      const photoId = await photoStorage.savePhoto(roomName, blob);
      
      // Reload photos from storage
      const roomPhotos = await photoStorage.getPhotos(roomName);
      setPhotos(roomPhotos);
      
      // Cleanup camera
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setShowCamera(false);
      setVideoElement(null);
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Fehler beim Aufnehmen des Fotos');
    }
  };

  const handleDeletePhoto = async (id) => {
    try {
      await photoStorage.deletePhoto(id);
      const roomPhotos = await photoStorage.getPhotos(roomName);
      setPhotos(roomPhotos);
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Fehler beim Löschen des Fotos');
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{roomName} - Fotos ({photos.length})</h3>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          disabled={showCamera}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Foto aufnehmen
        </button>
      </div>

      {showCamera && (
        <div className="mb-4">
          <video
            id="camera-video"
            autoPlay
            playsInline
            className="w-full max-w-md mx-auto rounded-lg"
          />
          <button
            onClick={handleCapture}
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
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
  );
};

export default RoomPhotoCapture;