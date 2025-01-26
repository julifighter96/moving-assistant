import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, List, AlertTriangle, ArrowLeft } from 'lucide-react';
import MaterialList from './components/MaterialList';
import MaterialAssignment from './components/MaterialAssignment';
import MaterialStatistics from './components/MaterialStatistics';
import { useNavigate } from 'react-router-dom';

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/moving-assistant/api/materials');
      if (!response.ok) throw new Error('Fehler beim Laden der Materialien');
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    {
      id: 'list',
      name: 'Materialübersicht',
      icon: List,
      component: MaterialList,
      badge: materials.filter(m => m.current_stock <= m.min_stock).length || null
    },
    {
      id: 'assignment',
      name: 'Materialzuweisung',
      icon: Package,
      component: MaterialAssignment
    },
    {
      id: 'statistics',
      name: 'Statistiken',
      icon: TrendingUp,
      component: MaterialStatistics
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Materialwirtschaft</h1>
            <p className="text-gray-500">Verwalten Sie Ihre Materialbestände und Zuweisungen</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück zum Hauptmenü
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                  {tab.badge && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Lade Materialien...</p>
            </div>
          ) : (
            tabs.map(tab => {
              const Component = tab.component;
              return activeTab === tab.id && (
                <Component 
                  key={tab.id}
                  materials={materials}
                  onUpdate={fetchMaterials}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement; 