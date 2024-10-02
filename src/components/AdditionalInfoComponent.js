import React, { useState, useCallback } from 'react';

const INITIAL_ADDITIONAL_INFO = [
  {
    category: 'Umzugstechnische Details',
    fields: [
      { name: 'HVZ', apiKey: '78050c086c106b0e9f655eb0b92ceb1ae1825378', options: ['B', 'E', 'Z'], value: [], multiple: true },
      { name: 'Möbellift', apiKey: '705d07fa2683d46703fdaa8a8dea0b82dcc48e47', options: ['B', 'E', 'Z'], value: [], multiple: true },
    ]
  },
  {
    category: 'Packmaterialien',
    fields: [
      { name: 'Matratzenhüllen', apiKey: '1e9d250dbc5cfea31a5129feb1b777dcb7937a9d', options: [
        '1 x 90 * 200', '2 x 90 * 200', '3 x 90 * 200', '4 x 90 * 200',
        '1 x 140 * 200', '2 x 140 * 200', '3 x 140 * 200', '4 x 140 * 200',
        '1 x 160 * 200', '2 x 160 * 200', '3 x 160 * 200', '4 x 160 * 200',
        '1 x 180 * 200', '2 x 180 * 200', '3 x 180 * 200', '4 x 180 * 200',
        '1 x 200 * 200', '2 x 200 * 200', '3 x 200 * 200', '4 x 200 * 200'
      ], value: [], multiple: true },
      { name: 'Packseide', apiKey: '1df9741aa7e79a4aba3673706875c4f9ba458e86', options: ['Ja'], value: false },
    ]
  },
  {
    category: 'Umgebungsbedingungen',
    fields: [
      { name: 'Gegebenheiten Entladestelle', apiKey: 'b0f5f0e08c73cbea321ec0e96aea9ebb0a95af8c', options: ['Aufzug', 'Maisonette', 'Garage', 'Keller'], value: [], multiple: true },
      { name: 'Gegebenheiten Beladestelle', apiKey: '0d48a438be3fd78057e0b900b2e476d7d47f5a86', options: ['Aufzug', 'Maisonette', 'Garage', 'Keller'], value: [], multiple: true },
    ]
  },
  {
    category: 'Zusätzliche Dienstleistungen',
    fields: [
      { name: 'Auspackservice', apiKey: '0085f40bb50ba7748922f9723a9ac4cf1e1149cf', options: ['Ja'], value: false },
      { name: 'Einpackservice', apiKey: '05ab4ce4f91858459aad9bf20644e99b5d0619b1', options: ['Ja'], value: false },
    ]
  }
];

const AdditionalInfoComponent = ({ onComplete }) => {
  const [additionalInfo, setAdditionalInfo] = useState(INITIAL_ADDITIONAL_INFO);

  const handleInfoChange = useCallback((categoryIndex, fieldIndex, newValue) => {
    setAdditionalInfo(prevInfo => 
      prevInfo.map((category, cIndex) => 
        cIndex === categoryIndex ? {
          ...category,
          fields: category.fields.map((field, fIndex) => 
            fIndex === fieldIndex ? { ...field, value: newValue } : field
          )
        } : category
      )
    );
  }, []);

  const handleMultipleChoiceChange = useCallback((categoryIndex, fieldIndex, option) => {
    setAdditionalInfo(prevInfo => 
      prevInfo.map((category, cIndex) => 
        cIndex === categoryIndex ? {
          ...category,
          fields: category.fields.map((field, fIndex) => {
            if (fIndex === fieldIndex) {
              const currentValue = Array.isArray(field.value) ? field.value : [];
              const newValue = currentValue.includes(option)
                ? currentValue.filter(item => item !== option)
                : [...currentValue, option];
              return { ...field, value: newValue };
            }
            return field;
          })
        } : category
      )
    );
  }, []);

  const handleSubmit = useCallback(() => {
    const flattenedInfo = additionalInfo.flatMap(category => category.fields);
    console.log('Submitting additional info:', flattenedInfo);
    onComplete(flattenedInfo);
  }, [additionalInfo, onComplete]);

  const renderMultipleChoice = useCallback((field, categoryIndex, fieldIndex) => (
    <div className="mb-4">
      <label className="block mb-2 text-sm font-medium text-gray-900">
        {field.name}
      </label>
      <div className="space-y-2">
        {field.options.map(option => (
          <label key={option} className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={Array.isArray(field.value) && field.value.includes(option)}
              onChange={() => handleMultipleChoiceChange(categoryIndex, fieldIndex, option)}
              className="mr-2 cursor-pointer"
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
    </div>
  ), [handleMultipleChoiceChange]);

  const renderCheckbox = useCallback((field, categoryIndex, fieldIndex) => (
    <div className="flex items-center mb-4">
      <input
        id={field.name}
        type="checkbox"
        checked={field.value}
        onChange={(e) => handleInfoChange(categoryIndex, fieldIndex, e.target.checked)}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
      />
      <label htmlFor={field.name} className="ml-2 text-sm font-medium text-gray-900 cursor-pointer">
        {field.name}
      </label>
    </div>
  ), [handleInfoChange]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Zusätzliche Informationen</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {additionalInfo.map((category, categoryIndex) => (
          <div key={category.category} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">{category.category}</h3>
            {category.fields.map((field, fieldIndex) => (
              <div key={field.name}>
                {field.multiple ? 
                  renderMultipleChoice(field, categoryIndex, fieldIndex) :
                  renderCheckbox(field, categoryIndex, fieldIndex)
                }
              </div>
            ))}
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-300 mt-6 cursor-pointer"
      >
        Informationen speichern und fortfahren
      </button>
    </div>
  );
};

export default AdditionalInfoComponent;