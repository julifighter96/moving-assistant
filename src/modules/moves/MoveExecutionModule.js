import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, StopCircle, ArrowLeft } from 'lucide-react';
import ActiveMovesList from './components/ActiveMovesList';
import MoveExecution from './components/MoveExecution';
import { moveService } from '../../services/moveService';

const MoveExecutionModule = () => {
  const [activeMove, setActiveMove] = useState(null);
  const [activeMoves, setActiveMoves] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveMoves();
  }, []);

  const fetchActiveMoves = async () => {
    try {
      const response = await fetch('/api/moves/active');
      if (!response.ok) throw new Error('Fehler beim Laden der aktiven Umzüge');
      const data = await response.json();
      setActiveMoves(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Umzugsdurchführung
            </h1>
            <p className="text-gray-500">
              Verwalten Sie aktive Umzüge und deren Durchführung
            </p>
            {activeMoves.length === 0 && (
              <p className="text-gray-500 mt-2">
                Keine aktiven Umzüge verfügbar
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zurück zum Hauptmenü
          </button>
        </div>

        {activeMove ? (
          <MoveExecution
            move={activeMove}
            onBack={() => {
              setActiveMove(null);
              fetchActiveMoves();
            }}
          />
        ) : (
          <ActiveMovesList
            moves={activeMoves}
            onMoveSelect={setActiveMove}
            onUpdate={fetchActiveMoves}
          />
        )}
      </div>
    </div>
  );
};

export default MoveExecutionModule; 