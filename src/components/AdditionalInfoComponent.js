import React, { useState } from 'react';

const ADDITIONAL_INFO = [
  { name: 'HVZ', apiKey: '78050c086c106b0e9f655eb0b92ceb1ae1825378', options: ['B', 'E', 'Z'], value: [] },
  { name: 'Möbellift', apiKey: '705d07fa2683d46703fdaa8a8dea0b82dcc48e47', options: ['B', 'E', 'Z'], value: [] },
  { name: 'Matratzenhüllen', apiKey: '1e9d250dbc5cfea31a5129feb1b777dcb7937a9d', options: [
    '1 x 90 * 200', '2 x 90 * 200', '3 x 90 * 200', '4 x 90 * 200',
    '1 x 140 * 200', '2 x 140 * 200', '3 x 140 * 200', '4 x 140 * 200',
    '1 x 160 * 200', '2 x 160 * 200', '3 x 160 * 200', '4 x 160 * 200',
    '1 x 180 * 200', '2 x 180 * 200', '3 x 180 * 200', '4 x 180 * 200',
    '1 x 200 * 200', '2 x 200 * 200', '3 x 200 * 200', '4 x 200 * 200'
  ], value: '' },
  { name: 'Packseide', apiKey: '1df9741aa7e79a4aba3673706875c4f9ba458e86', options: ['Ja'], value: false },
  { name: 'Gegebenheiten Entladestelle', apiKey: 'b0f5f0e08c73cbea321ec0e96aea9ebb0a95af8c', options: ['Aufzug', 'Maisonette', 'Garage', 'Keller'], value: [] },
  { name: 'Gegebenheiten Beladestelle', apiKey: '0d48a438be3fd78057e0b900b2e476d7d47f5a86', options: ['Aufzug', 'Maisonette', 'Garage', 'Keller'], value: [] },
  { name: 'Auspackservice', apiKey: '0085f40bb50ba7748922f9723a9ac4e91e1149cf', options: ['Ja'], value: false },
  { name: 'Einpackservice', apiKey: '05ab4ce4f91858459aad9bf20644e99b5d0619b1', options: ['Ja'], value: false },
];

const AdditionalInfoComponent = ({ onComplete }) => {
  const [additionalInfo, setAdditionalInfo] = useState(ADDITIONAL_INFO);

  const handleInfoChange = (index, newValue) => {
    setAdditionalInfo(prevInfo => {
      const newInfo = [...prevInfo];
      newInfo[index] = { ...newInfo[index], value: newValue };
      return newInfo;
    });
  };

  const handleSubmit = () => {
    console.log('Submitting additional info:', additionalInfo);
    onComplete(additionalInfo);
  };

  const renderSelect = (info, index) => (
    <div className="mb-4">
      <label htmlFor={info.name} className="block mb-2 text-sm font-medium text-gray-900">
        {info.name}
      </label>
      <select
        id={info.name}
        multiple={info.name === 'HVZ' || info.name === 'Möbellift' || info.name === 'Gegebenheiten Entladestelle' || info.name === 'Gegebenheiten Beladestelle'}
        value={info.value}
        onChange={(e) => handleInfoChange(index, info.name === 'Matratzenhüllen' ? e.target.value : Array.from(e.target.selectedOptions, option => option.value))}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
      >
        {info.options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  const renderCheckbox = (info, index) => (
    <div className="flex items-center mb-4">
      <input
        id={info.name}
        type="checkbox"
        checked={info.value}
        onChange={(e) => handleInfoChange(index, e.target.checked)}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
      />
      <label htmlFor={info.name} className="ml-2 text-sm font-medium text-gray-900">
        {info.name}
      </label>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Zusätzliche Informationen</h2>
      {additionalInfo.map((info, index) => (
        <div key={info.name}>
          {info.options.length === 1 ? renderCheckbox(info, index) : renderSelect(info, index)}
        </div>
      ))}
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition duration-300 mt-6"
      >
        Informationen speichern und fortfahren
      </button>
    </div>
  );
};

export default AdditionalInfoComponent;