// In der übergeordneten Komponente, wo die beiden Komponenten verbunden werden

// Stellen Sie sicher, dass die onComplete-Funktion die Daten richtig verarbeitet
const handleAdditionalInfoComplete = (flattenedInfo) => {
  // Konvertiere das Format für MovingCalculation
  const processedInfo = {
    pickupAddress: flattenedInfo.find(field => field.apiKey === 'pickupAddress')?.value || '',
    deliveryAddress: flattenedInfo.find(field => field.apiKey === 'deliveryAddress')?.value || '',
    // Andere Felder können hier hinzugefügt werden
  };
  
  console.log("Processed additionalInfo:", processedInfo);
  setAdditionalInfo(processedInfo); // Speichern als Objekt mit direkten Eigenschaften
};

// Dann in der Render-Funktion:
return (
  <div>
    {/* ... */}
    {currentStep === 'additionalInfo' && (
      <AdditionalInfoComponent onComplete={handleAdditionalInfoComplete} />
    )}
    {currentStep === 'calculation' && (
      <MovingCalculation 
        roomsData={roomsData} 
        additionalInfo={additionalInfo} 
        onComplete={handleCalculationComplete} 
      />
    )}
    {/* ... */}
  </div>
); 