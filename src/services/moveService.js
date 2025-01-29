export const moveService = {
  async getActiveMoves() {
    try {
      console.log('Fetching active moves...');
      const response = await fetch('/api/moves/active');
      if (!response.ok) {
        throw new Error('Fehler beim Laden der aktiven Umzüge');
      }
      const data = await response.json();
      console.log('Active moves response:', data);
      return data || [];
    } catch (error) {
      console.error('Error fetching active moves:', error);
      return [];
    }
  }
}; 