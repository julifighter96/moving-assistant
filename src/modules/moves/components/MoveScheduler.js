const fetchData = async () => {
  try {
    console.log('Fetching data from server...');
    
    const [movesRes, assignmentsRes] = await Promise.all([
      fetch('/moving-assistant/api/moves/schedule'),
      fetch('/moving-assistant/api/assignments')
    ]);

    console.log('Move response status:', movesRes.status);
    console.log('Assignments response status:', assignmentsRes.status);

    if (!movesRes.ok || !assignmentsRes.ok) {
      const moveText = await movesRes.text();
      const assignmentText = await assignmentsRes.text();
      console.error('Move response:', moveText);
      console.error('Assignment response:', assignmentText);
      throw new Error('Fehler beim Laden der Daten');
    }

    const [movesData, assignmentsData] = await Promise.all([
      movesRes.json(),
      assignmentsRes.json()
    ]);

    console.log('Fetched moves data:', movesData);
    console.log('Fetched assignments data:', assignmentsData);
    
    setMoves(movesData || []);
    setAssignments(assignmentsData || []);
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    setError('Fehler beim Laden der Daten');
    setMoves([]);
    setAssignments([]);
  } finally {
    setLoading(false);
  }
}; 