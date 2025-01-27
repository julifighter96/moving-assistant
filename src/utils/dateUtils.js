export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Überprüfe ob das Datum gültig ist
  if (isNaN(date.getTime())) return '';

  // Formatiere das Datum als DD.MM.YYYY
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Überprüfe ob das Datum gültig ist
  if (isNaN(date.getTime())) return '';

  // Formatiere das Datum als DD.MM.YYYY HH:mm
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Überprüfe ob das Datum gültig ist
  if (isNaN(date.getTime())) return '';

  // Formatiere die Zeit als HH:mm
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Überprüfe ob die Daten gültig sind
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

  const diffInMinutes = Math.floor((end - start) / (1000 * 60));
  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;

  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

export const isDateInPast = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Überprüfe ob das Datum gültig ist
  if (isNaN(date.getTime())) return false;

  return date < now;
};

export const isDateInFuture = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Überprüfe ob das Datum gültig ist
  if (isNaN(date.getTime())) return false;

  return date > now;
};

export const isToday = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Überprüfe ob das Datum gültig ist
  if (isNaN(date.getTime())) return false;

  return date.toDateString() === now.toDateString();
}; 