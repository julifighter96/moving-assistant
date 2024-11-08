import React from 'react';

const AIFeedbackDisplay = ({ item, onApplySuggestion }) => {
  if (!item) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      {item.potentialMisrecognition && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="font-medium text-yellow-800 mb-2">
            Mögliche Fehlererkennung
          </h4>
          <div className="flex gap-2">
            {item.suggestedNames.map((name, index) => (
              <button
                key={index}
                onClick={() => onApplySuggestion({ ...item, name })}
                className="px-3 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 
                         text-yellow-800 rounded-full transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {item.suggestions && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-800 mb-2">
            Verbesserungsvorschlag ({Math.round(item.suggestions.confidence)}% Übereinstimmung)
          </h4>
          <div className="space-y-2 text-sm">
            <p>Name: <span className="font-medium">{item.suggestions.name}</span></p>
            <p>Volumen: <span className="font-medium">{item.suggestions.volume} m³</span></p>
            <p>Maße: <span className="font-medium">{item.suggestions.dimensions}</span></p>
            <button
              onClick={() => onApplySuggestion(item.suggestions)}
              className="mt-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 
                       text-blue-800 rounded-md transition-colors"
            >
              Vorschlag übernehmen
            </button>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default AIFeedbackDisplay;