import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

const MAX_HEIGHT = 2.4;
const GRID_SIZE = 0.5;

export const TRUCK_DIMENSIONS = {
  width: 2.25,   // Breite in Metern
  length: 6.7,   // Länge in Metern
  height: 3.3    // Höhe in Metern
};


// Auto-Pack Funktionen
const calculateVolume = (item) => item.size[0] * item.size[1] * item.size[2];

const findBestPosition = (item, placedItems, truckDimensions) => {
  const { size } = item;
  const [width, height, depth] = size;
  
  let bestPosition = null;
  let bestScore = -Infinity;
  
  // Suche von hinten nach vorne und von unten nach oben
  for (let z = truckDimensions.length/2 - depth/2; z >= -truckDimensions.length/2 + depth/2; z -= GRID_SIZE) {
    for (let x = -truckDimensions.width/2 + width/2; x <= truckDimensions.width/2 - width/2; x += GRID_SIZE) {
      let canPlace = true;
      let maxHeightAtPosition = 0;

      // Prüfe Kollisionen mit bereits platzierten Items
      placedItems.forEach(placedItem => {
        const [px, py, pz] = placedItem.position;
        const [pWidth, pHeight, pDepth] = placedItem.size;

        if (Math.abs(x - px) < (width + pWidth) / 2 &&
            Math.abs(z - pz) < (depth + pDepth) / 2) {
          maxHeightAtPosition = Math.max(maxHeightAtPosition, py + pHeight/2);
          if (maxHeightAtPosition + height > MAX_HEIGHT) {
            canPlace = false;
          }
        }
      });

      if (canPlace) {
        const y = maxHeightAtPosition + height/2;
        const score = z + (MAX_HEIGHT - y); // Präferiere Positionen hinten und unten
        
        if (score > bestScore) {
          bestScore = score;
          bestPosition = [x, y, z];
        }
      }
    }
  }
  
  return bestPosition || [0, height/2, 0];
};

export const autoPackItems = (itemsToPlace, dimensions) => {
  // Sort by volume (largest first)
  const sortedItems = [...itemsToPlace].sort((a, b) => {
    const volumeA = a.size[0] * a.size[1] * a.size[2];
    const volumeB = b.size[0] * b.size[1] * b.size[2];
    return volumeB - volumeA;
  });

  const placedItems = [];

  // Check if position is valid and doesn't overlap
  const isValidPosition = (item, pos) => {
    // Check truck boundaries
    if (pos[0] - item.size[0]/2 < -dimensions.width/2 || 
        pos[0] + item.size[0]/2 > dimensions.width/2 || 
        pos[2] - item.size[2]/2 < -dimensions.length/2 || 
        pos[2] + item.size[2]/2 > dimensions.length/2 || 
        pos[1] + item.size[1] > dimensions.height) {
      return false;
    }

    // Check collision with other items
    return !placedItems.some(placedItem => {
      const xOverlap = Math.abs(pos[0] - placedItem.position[0]) < 
        (item.size[0] + placedItem.size[0])/2;
      const zOverlap = Math.abs(pos[2] - placedItem.position[2]) < 
        (item.size[2] + placedItem.size[2])/2;
      const yOverlap = Math.abs(pos[1] - placedItem.position[1]) < 
        (item.size[1] + placedItem.size[1])/2;
      return xOverlap && yOverlap && zOverlap;
    });
  };

  // Place each item
  sortedItems.forEach(item => {
    let bestPosition = null;
    let bestScore = -Infinity;

    // Try positions from back to front
    for (let z = -dimensions.length/2 + item.size[2]/2; 
         z <= dimensions.length/2 - item.size[2]/2; 
         z += 0.5) {
      
      // Try positions from left to right
      for (let x = -dimensions.width/2 + item.size[0]/2; 
           x <= dimensions.width/2 - item.size[0]/2; 
           x += 0.5) {
        
        // Find the height at this position (stack items)
        let y = item.size[1]/2; // Start at ground level
        placedItems.forEach(placedItem => {
          // Check if this position overlaps with placed item horizontally
          const xOverlap = Math.abs(x - placedItem.position[0]) < 
            (item.size[0] + placedItem.size[0])/2;
          const zOverlap = Math.abs(z - placedItem.position[2]) < 
            (item.size[2] + placedItem.size[2])/2;
          
          if (xOverlap && zOverlap) {
            // Stack on top of this item
            y = Math.max(y, placedItem.position[1] + 
              placedItem.size[1]/2 + item.size[1]/2);
          }
        });

        const position = [x, y, z];
        
        if (isValidPosition(item, position)) {
          // Score based on:
          // - How far back in the truck (prefer back)
          // - How low to the ground (prefer lower)
          // - How close to walls (prefer walls)
          const score = 
            (-z * 10) + // Prefer back positions
            (-y * 5) +  // Prefer lower positions
            (Math.min(
              Math.abs(x + dimensions.width/2), 
              Math.abs(x - dimensions.width/2)
            )); // Prefer wall positions

          if (score > bestScore) {
            bestScore = score;
            bestPosition = position;
          }
        }
      }
    }

    if (bestPosition) {
      placedItems.push({
        ...item,
        position: bestPosition
      });
    } else {
      console.warn('Could not place item:', item.name);
    }
  });

  return placedItems;
};

// UI Komponenten
const HeightWarning = ({ isVisible, itemName }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg animate-bounce">
      <p className="font-bold">Höhenwarnung!</p>
      <p>{itemName} überschreitet die maximale Höhe von {MAX_HEIGHT}m</p>
    </div>
  );
};

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
  </group>
);

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

const DraggableItem = ({ position, size, name, color, onDragStart, onDragEnd, onHeightWarning, onPositionUpdate }) => {
  const meshRef = useRef();
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, gl, scene } = useThree();
  const dragHeight = useRef(position[1]);

  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  const findStackHeight = (x, z) => {
    const raycaster = new THREE.Raycaster();
    const origin = new THREE.Vector3(x, 10, z);
    const direction = new THREE.Vector3(0, -1, 0);
    raycaster.set(origin, direction);

    const meshes = [];
    scene.traverse((object) => {
      if (object.isMesh && object !== meshRef.current) {
        meshes.push(object);
      }
    });

    const intersects = raycaster.intersectObjects(meshes);
    if (intersects.length > 0) {
      const maxHeight = Math.max(...intersects.map(hit => hit.point.y));
      return maxHeight > 0.1 ? maxHeight : 0;
    }
    return 0;
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    gl.domElement.style.cursor = 'grabbing';
    dragHeight.current = currentPosition[1];
    onDragStart();
  };

  const handleDragEnd = () => {
    if (isDragging) {
      const snappedX = snapToGrid(currentPosition[0]);
      const snappedZ = snapToGrid(currentPosition[2]);
      const stackHeight = findStackHeight(snappedX, snappedZ);
      
      const newPosition = [
        snappedX,
        stackHeight + size[1]/2,
        snappedZ
      ];

      setCurrentPosition(newPosition);
      onPositionUpdate(newPosition);
      setIsDragging(false);
      gl.domElement.style.cursor = 'grab';
      onDragEnd();
    }
  };

  const handleDrag = (e) => {
    if (isDragging) {
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const raycaster = new THREE.Raycaster();
      const bounds = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
      const y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1;
      
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersectionPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectionPoint);

      const newX = Math.max(
        -TRUCK_DIMENSIONS.width/2 + size[0]/2, 
        Math.min(TRUCK_DIMENSIONS.width/2 - size[0]/2, intersectionPoint.x)
      );
      const newZ = Math.max(
        -TRUCK_DIMENSIONS.length/2 + size[2]/2, 
        Math.min(TRUCK_DIMENSIONS.length/2 - size[2]/2, intersectionPoint.z)
      );

      setCurrentPosition([newX, dragHeight.current, newZ]);
    }
  };

  return (
    <group position={currentPosition}>
      <mesh
        ref={meshRef}
        onPointerDown={handleDragStart}
        onPointerUp={handleDragEnd}
        onPointerMove={handleDrag}
        onPointerLeave={handleDragEnd}
        castShadow
        receiveShadow
      >
        <boxGeometry args={size} />
        <meshStandardMaterial 
          color={color} 
          transparent
          opacity={isDragging ? 0.6 : 1}
        />
      </mesh>
      <Text
        position={[0, size[1] + 0.1, 0]}
        fontSize={0.2}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {`${name} `}
      </Text>
    </group>
  );
};

const MovingTruckSimulator = ({ items, setItems }) => { 
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraLocked, setIsCameraLocked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningItemName, setWarningItemName] = useState('');
  const controlsRef = useRef();

  const handleHeightWarning = (show, itemName) => {
    setShowWarning(show);
    setWarningItemName(itemName);
  };

  const handleAutoPack = () => {
    const packedItems = autoPackItems(items, TRUCK_DIMENSIONS);
    setItems(packedItems); // Aktualisiere alle Items
  };

  const updateItemPosition = (id, newPosition) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, position: newPosition } : item
      )
    );
  };

  const getInitialItemPositions = (currentItems) => {
    return currentItems.map((item, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return {
        ...item,
        position: [
          -TRUCK_DIMENSIONS.width/3 + col * (TRUCK_DIMENSIONS.width/3),
          item.size[1]/2,
          -TRUCK_DIMENSIONS.length/2 + 1 + row * 2
        ]
      };
    });
  };

  const calculateUsedCapacity = () => {
    const totalVolume = items.reduce((sum, item) => {
      return sum + (item.size[0] * item.size[1] * item.size[2]);
    }, 0);
    const truckVolume = TRUCK_DIMENSIONS.width * TRUCK_DIMENSIONS.height * TRUCK_DIMENSIONS.length;
    const percentageUsed = (totalVolume / truckVolume) * 100;
    return {
      used: totalVolume.toFixed(2),
      total: truckVolume.toFixed(2),
      percentage: percentageUsed.toFixed(1)
    };
  };

  return (
    <div className="h-screen relative">
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg space-y-4 z-10 w-80">
        <h2 className="text-lg font-bold">Ladekapazität</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Genutztes Volumen:</span>
            <span className="font-medium">{calculateUsedCapacity().used}m³</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Gesamtvolumen:</span>
            <span className="font-medium">{calculateUsedCapacity().total}m³</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${Math.min(calculateUsedCapacity().percentage, 100)}%` }}
            />
          </div>
          <div className="text-sm text-center text-blue-500">
            {calculateUsedCapacity().percentage}% genutzt
          </div>
        </div>
  
        <div className="space-y-2">
          <h3 className="font-medium">Möbel Liste</h3>
          <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-2 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.name}</span>
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.size[0].toFixed(2)}m × {item.size[1].toFixed(2)}m × {item.size[2].toFixed(2)}m
                  <span className="ml-2">({(item.size[0] * item.size[1] * item.size[2]).toFixed(2)}m³)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
  
        <div className="space-y-2">
          <h3 className="font-medium">Kamera Steuerung</h3>
          <button
            onClick={() => setIsCameraLocked(!isCameraLocked)}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {isCameraLocked ? 'Kamera entsperren' : 'Kamera sperren'}
          </button>
          <button
            onClick={() => controlsRef.current?.reset()}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Kamera zurücksetzen
          </button>
        </div>
  
        <div className="space-y-2">
          <h3 className="font-medium">Beladung</h3>
          <button
            onClick={handleAutoPack}
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
          >
            Automatisch beladen
          </button>
          <button
            onClick={() => setItems(getInitialItemPositions(items))}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Positionen zurücksetzen
          </button>
        </div>
  
        <div className="flex items-center gap-2 mt-4 p-2 bg-red-50 rounded-lg">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <p className="text-sm text-red-700">Max. Ladehöhe: {MAX_HEIGHT}m</p>
        </div>
      </div>
  
      <Canvas shadows camera={{ position: [8, 12, 12], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <OrbitControls 
          ref={controlsRef}
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2}
          enableDamping={false}
          enabled={!isDragging && !isCameraLocked}
        />
        <TruckContainer />
        {items.map((item) => (
          <DraggableItem 
            key={item.id} 
            {...item} 
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            onHeightWarning={handleHeightWarning}
            onPositionUpdate={(newPosition) => updateItemPosition(item.id, newPosition)}
          />
        ))}
      </Canvas>
  
      <HeightWarning 
        isVisible={showWarning}
        itemName={warningItemName}
      />
    </div>
  );
};

export default MovingTruckSimulator;