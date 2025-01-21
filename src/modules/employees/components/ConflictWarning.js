import React from 'react';

const ConflictWarning = ({ warning, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <div className="flex">
        <div className="py-1">
          <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="font-bold">{warning.type === 'qualification' ? 'Qualifikationskonflikt' : 'Verfügbarkeitskonflikt'}</p>
          <p className="text-sm">{warning.message}</p>
        </div>
        <button onClick={onClose} className="ml-auto">
          <span className="text-red-500 hover:text-red-700">✕</span>
        </button>
      </div>
    </div>
  );
};

export default ConflictWarning; 