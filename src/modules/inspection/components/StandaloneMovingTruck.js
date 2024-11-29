// Fügen Sie diese Konstanten am Anfang der Datei hinzu
export const TRUCK_DIMENSIONS = {
    width: 2.25,  // Breite in Metern
    length: 6.7,  // Länge in Metern
    height: 3.3   // Höhe in Metern
  };
  
  // Aktualisierte TruckContainer Komponente
  const TruckContainer = () => (
    <group>
      {/* Boden */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[TRUCK_DIMENSIONS.width, 0.1, TRUCK_DIMENSIONS.length]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      
      {/* Linke Wand */}
      <mesh position={[TRUCK_DIMENSIONS.width/2, TRUCK_DIMENSIONS.height/2, 0]}>
        <boxGeometry args={[0.1, TRUCK_DIMENSIONS.height, TRUCK_DIMENSIONS.length]} />
        <meshStandardMaterial color="#64748b" transparent opacity={0.3} />
      </mesh>
      
      {/* Rechte Wand */}
      <mesh position={[-TRUCK_DIMENSIONS.width/2, TRUCK_DIMENSIONS.height/2, 0]}>
        <boxGeometry args={[0.1, TRUCK_DIMENSIONS.height, TRUCK_DIMENSIONS.length]} />
        <meshStandardMaterial color="#64748b" transparent opacity={0.3} />
      </mesh>
      
      {/* Rückwand */}
      <mesh position={[0, TRUCK_DIMENSIONS.height/2, TRUCK_DIMENSIONS.length/2]}>
        <boxGeometry args={[TRUCK_DIMENSIONS.width, TRUCK_DIMENSIONS.height, 0.1]} />
        <meshStandardMaterial color="#64748b" transparent opacity={0.3} />
      </mesh>
  
      {/* Maximalhöhen-Markierung */}
      <mesh position={[TRUCK_DIMENSIONS.width/2 + 0.05, TRUCK_DIMENSIONS.height, 0]}>
        <boxGeometry args={[0.05, 0.1, TRUCK_DIMENSIONS.length]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
  
      {/* Maßangaben */}
      <Text
        position={[0, TRUCK_DIMENSIONS.height + 0.2, 0]}
        rotation={[0, 0, 0]}
        fontSize={0.2}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {`${TRUCK_DIMENSIONS.height}m`}
      </Text>
      <Text
        position={[0, 0.2, TRUCK_DIMENSIONS.length/2 + 0.2]}
        rotation={[0, 0, 0]}
        fontSize={0.2}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {`${TRUCK_DIMENSIONS.length}m`}
      </Text>
      <Text
        position={[TRUCK_DIMENSIONS.width/2 + 0.2, 0.2, 0]}
        rotation={[0, 0, 0]}
        fontSize={0.2}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {`${TRUCK_DIMENSIONS.width}m`}
      </Text>
    </group>
  );
  
  // Aktualisierte GridFloor Komponente
  const GridFloor = () => (
    <>
      <group position={[0, 0.002, 0]}>
        <gridHelper 
          args={[TRUCK_DIMENSIONS.width, Math.floor(TRUCK_DIMENSIONS.width/GRID_SIZE)]} 
          rotation={[0, 0, 0]} 
        />
      </group>
      <group position={[0, 0.001, 0]}>
        <gridHelper 
          args={[TRUCK_DIMENSIONS.length, Math.floor(TRUCK_DIMENSIONS.length/GRID_SIZE)]} 
          rotation={[0, Math.PI/2, 0]} 
        />
      </group>
    </>
  );
  
  // Aktualisieren Sie auch die findBestPosition Funktion
  const findBestPosition = (item, placedItems, truckDimensions) => {
    const { size } = item;
    const [width, height, depth] = size;
    
    let bestPosition = null;
    let bestScore = -Infinity;
    
    for (let z = truckDimensions.length/2 - depth/2; z >= -truckDimensions.length/2 + depth/2; z -= GRID_SIZE) {
      for (let x = -truckDimensions.width/2 + width/2; x <= truckDimensions.width/2 - width/2; x += GRID_SIZE) {
        let canPlace = true;
        let maxHeightAtPosition = 0;
  
        placedItems.forEach(placedItem => {
          const [px, py, pz] = placedItem.position;
          const [pWidth, pHeight, pDepth] = placedItem.size;
  
          if (Math.abs(x - px) < (width + pWidth) / 2 &&
              Math.abs(z - pz) < (depth + pDepth) / 2) {
            maxHeightAtPosition = Math.max(maxHeightAtPosition, py + pHeight/2);
            if (maxHeightAtPosition + height > TRUCK_DIMENSIONS.height) {
              canPlace = false;
            }
          }
        });
  
        if (canPlace) {
          const y = maxHeightAtPosition + height/2;
          // Präferiere Positionen hinten und unten
          const score = z + (TRUCK_DIMENSIONS.height - y); 
          
          if (score > bestScore) {
            bestScore = score;
            bestPosition = [x, y, z];
          }
        }
      }
    }
    
    return bestPosition || [0, height/2, 0];
  };