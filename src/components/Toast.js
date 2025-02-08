import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center p-4 rounded-lg shadow-lg ${
        type === 'success' 
          ? 'bg-green-50 text-green-800 border border-green-200' 
          : 'bg-red-50 text-red-800 border border-red-200'
      }`}>
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="ml-3 mr-8 text-sm font-medium">
          {message}
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center ${
            type === 'success' 
              ? 'text-green-500 hover:bg-green-100' 
              : 'text-red-500 hover:bg-red-100'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast; 