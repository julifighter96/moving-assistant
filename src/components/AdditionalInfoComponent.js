import React, { useState, useCallback } from 'react';
import { Package, Truck, Home, Clock, MapPin } from 'lucide-react';

const INITIAL_ADDITIONAL_INFO = [
  {
    category: 'Adressinformationen',
    fields: [
      {
        name: 'Abholadresse',
        apiKey: 'pickupAddress',
        type: 'text',
        value: ''
      },
      {
        name: 'Lieferadresse',
        apiKey: 'deliveryAddress',
        type: 'text',
        value: ''
      }
    ]
  },
  {
    category: 'Umzugstechnische Details',
    fields: [
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
      { 
        name: 'Einpackservice', 
        apiKey: '05ab4ce4f91858459aad9bf20644e99b5d0619b1', 
        type: 'select',
        options: ['Ja (Gesamt)', 'Ja (Glas + Porzellan)', 'Nein'],
        value: 'Nein'
      },
      { 
        name: 'Auspackservice', 
        apiKey: '0085f40bb50ba7748922f9723a9ac4cf1e1149cf', 
        type: 'select',
        options: ['Ja (Gesamt)', 'Ja (Glas + Porzellan)', 'Nein'],
        value: 'Nein'
      },
      {
        name: 'Anzahl Umzugskartons',
        apiKey: 'umzugskartons_anzahl',
        type: 'number',
        value: 0,
        min: 0
      },
      {
        name: 'Anzahl Porzellankartons',
        apiKey: 'porzellankartons_anzahl',
        type: 'number',
        value: 0,
        min: 0
      }
    ]
  }
];

const CategoryIcons = {
  'Adressinformationen': MapPin,
  'Umzugstechnische Details': Truck,
  'Packmaterialien': Package,
  'Umgebungsbedingungen': Home,
  'Zusätzliche Dienstleistungen': Clock
};

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
    
    const pickupAddressField = flattenedInfo.find(field => field.apiKey === 'pickupAddress');
    const deliveryAddressField = flattenedInfo.find(field => field.apiKey === 'deliveryAddress');
    
    console.log("Adressdaten werden gespeichert:", {
      pickupAddress: pickupAddressField?.value || '',
      deliveryAddress: deliveryAddressField?.value || ''
    });
    
    onComplete(flattenedInfo);
  }, [additionalInfo, onComplete]);

  const renderField = useCallback((field, categoryIndex, fieldIndex) => {
    if (field.type === 'text') {
      return (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            {field.name}
          </label>
          <input
            type="text"
            value={field.value}
            onChange={(e) => handleInfoChange(categoryIndex, fieldIndex, e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            placeholder={field.name}
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            {field.name}
          </label>
          <select
            value={field.value}
            onChange={(e) => handleInfoChange(categoryIndex, fieldIndex, e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          >
            {field.options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'number') {
      return (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            {field.name}
          </label>
          <input
            type="number"
            value={field.value}
            min={field.min || 0}
            onChange={(e) => handleInfoChange(categoryIndex, fieldIndex, parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
      );
    }

    if (field.multiple) {
      return (
        <div className="mb-6">
          <label className="block mb-3 font-medium text-gray-700">
            {field.name}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field.options.map(option => (
              <label key={option} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group">
                <input
                  type="checkbox"
                  checked={Array.isArray(field.value) && field.value.includes(option)}
                  onChange={() => handleMultipleChoiceChange(categoryIndex, fieldIndex, option)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary transition-colors"
                />
                <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <label className="flex items-center p-3 mb-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group">
        <input
          type="checkbox"
          checked={field.value}
          onChange={(e) => handleInfoChange(categoryIndex, fieldIndex, e.target.checked)}
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary transition-colors"
        />
        <span className="ml-3 font-medium text-gray-600 group-hover:text-gray-900">
          {field.name}
        </span>
      </label>
    );
  }, [handleInfoChange, handleMultipleChoiceChange]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Zusätzliche Informationen
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {additionalInfo.map((category, categoryIndex) => {
              const IconComponent = CategoryIcons[category.category];
              return (
                <div key={category.category} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    {IconComponent && <IconComponent className="w-5 h-5 text-primary" />}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.category}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {category.fields.map((field, fieldIndex) => (
                      <div key={field.name}>
                        {renderField(field, categoryIndex, fieldIndex)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <button
              onClick={handleSubmit}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              Informationen speichern und fortfahren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoComponent;