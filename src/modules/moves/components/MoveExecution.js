import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, StopCircle, Users, Package, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import TimeTracking from './TimeTracking';
import TeamSelection from './TeamSelection';
import MaterialUsage from './MaterialUsage';

const MoveExecution = ({ move, onBack }) => {
  const [status, setStatus] = useState(move.status || 'pending');
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [team, setTeam] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (move.id) {
      fetchTeam();
    }
  }, [move.id]);

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/moving-assistant/api/moves/${move.id}/team`);
      if (!response.ok) throw new Error('Fehler beim Laden des Teams');
      const data = await response.json();
      setTeam(data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const handleStartMove = async () => {
    if (team.length === 0) {
      setError('Bitte wählen Sie zuerst Teammitglieder aus');
      return;
    }

    try {
      const response = await fetch(`/moving-assistant/api/moves/${move.deal_id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          team: team.map(member => member.id)
        }),
      });

      if (!response.ok) throw new Error('Fehler beim Starten des Umzugs');
      
      const data = await response.json();
      setStatus('in_progress');
      // Aktualisiere die move.id mit der neuen execution_id
      move.id = data.id;
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const handleTogglePause = async () => {
    try {
      const action = status === 'in_progress' ? 'pause' : 'resume';
      const response = await fetch(`/moving-assistant/api/moves/${move.id}/toggle-pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error('Fehler beim Pausieren/Fortsetzen');
      
      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const handleComplete = async (materialUsage) => {
    try {
      const response = await fetch(`/moving-assistant/api/moves/${move.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialUsage,
          notes: '', // Optional: Notizen zum Umzug
        }),
      });

      if (!response.ok) throw new Error('Fehler beim Abschließen des Umzugs');
      
      onBack();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex justify-between items-start">
          <div>
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Übersicht
            </button>
            <h2 className="text-xl font-bold text-gray-900">{move.title}</h2>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {format(new Date(move.move_date), 'dd. MMMM yyyy', { locale: de })}
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-green-600" />
                {move.origin_address}
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-red-600" />
                {move.destination_address}
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowTeamDialog(true)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Users className="w-4 h-4 mr-2" />
              Team bearbeiten
            </button>

            {status === 'pending' ? (
              <button
                onClick={handleStartMove}
                disabled={team.length === 0}
                className={`flex items-center px-4 py-2 rounded-lg
                  ${team.length === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                <Play className="w-4 h-4 mr-2" />
                Umzug starten
              </button>
            ) : (
              <>
                {status === 'in_progress' && (
                  <button
                    onClick={handleTogglePause}
                    className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </button>
                )}
                {status === 'paused' && (
                  <button
                    onClick={handleTogglePause}
                    className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Fortsetzen
                  </button>
                )}
                <button
                  onClick={() => setShowMaterialDialog(true)}
                  className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Abschließen
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {status !== 'pending' && (
          <TimeTracking executionId={move.id} status={status} />
        )}

        {/* Team-Übersicht */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold">Team</h3>
          </div>
          {team.length > 0 ? (
            <div className="space-y-2">
              {team.map(member => (
                <div
                  key={member.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Noch keine Teammitglieder ausgewählt</p>
          )}
        </div>
      </div>

      {/* Dialoge */}
      {showTeamDialog && (
        <TeamSelection
          moveId={move.id}
          currentTeam={team}
          onClose={() => setShowTeamDialog(false)}
          onSave={(newTeam) => {
            setTeam(newTeam);
            setShowTeamDialog(false);
          }}
        />
      )}

      {showMaterialDialog && (
        <MaterialUsage
          moveId={move.id}
          onClose={() => setShowMaterialDialog(false)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
};

export default MoveExecution; 