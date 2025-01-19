// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const crypto = require('crypto');
const INITIAL_ROOMS_AND_ITEMS = require('./initialData');
require('dotenv').config({ path: __dirname + '/.env' });

// Logging für Debugging
console.log('ENV check:', {
  envPath: require.resolve('dotenv'),
  anthropicKey: process.env.ANTHROPIC_API_KEY ? 'Key exists' : 'No key found',
  dbPath: path.join(__dirname, 'recognition.db')
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  console.log('Request received:', {
    method: req.method,
    path: req.path,
    body: req.body
  });
  next();
});

// SQLite Setup mit erweitertem Schema
const db = new sqlite3.Database(path.join(__dirname, 'recognition.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    
    db.serialize(() => {

      db.run(`CREATE TABLE IF NOT EXISTS admin_rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS admin_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        width REAL DEFAULT 0,
        length REAL DEFAULT 0,
        height REAL DEFAULT 0,
        volume REAL NOT NULL,
        room TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, room)
      )`);
      // Haupt-Erkennungstabelle
      db.run(`CREATE TABLE IF NOT EXISTS recognitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roomName TEXT NOT NULL,
        originalName TEXT NOT NULL,
        correctedName TEXT NOT NULL,
        originalVolume REAL,
        correctedVolume REAL,
        originalDimensions TEXT,
        correctedDimensions TEXT,
        imageHash TEXT,
        imageCrop TEXT,
        imageFeatures TEXT,
        similarityScore REAL,
        confidence REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deal_id TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT CHECK(status IN ('draft', 'completed')) DEFAULT 'draft',
        move_date DATE,
        total_volume REAL,
        total_rooms INTEGER,
        
        origin_address TEXT,
        origin_floor INTEGER,
        origin_has_elevator BOOLEAN,
        
        destination_address TEXT,
        destination_floor INTEGER,
        destination_has_elevator BOOLEAN,
        
        packing_service BOOLEAN DEFAULT FALSE,
        unpacking_service BOOLEAN DEFAULT FALSE,
        lift_loading BOOLEAN DEFAULT FALSE,
        lift_unloading BOOLEAN DEFAULT FALSE,
        
        furniture_cost REAL,
        materials_cost REAL,
        total_cost REAL,
        
        notes TEXT,
        data JSON
      )`);
    
      db.run(`CREATE TABLE IF NOT EXISTS inspection_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id INTEGER,
        room_name TEXT,
        photo_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(inspection_id) REFERENCES inspections(id)
      )`);
    
      // Indizes für bessere Performance
      db.run('CREATE INDEX IF NOT EXISTS idx_inspections_deal ON inspections(deal_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_inspection_photos ON inspection_photos(inspection_id)');

      
      // Bildmerkmale-Tabelle
      db.run(`CREATE TABLE IF NOT EXISTS image_features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imageHash TEXT NOT NULL,
        roomName TEXT NOT NULL,
        objectType TEXT NOT NULL,
        featureVector TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(imageHash, objectType)
      )`);

      
      db.run(`CREATE TABLE IF NOT EXISTS admin_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating admin_prices table:', err);
        } else {
          console.log('admin_prices table created successfully');
          
          // Prüfe und füge initiale Preise ein
          db.get('SELECT COUNT(*) as count FROM admin_prices', [], (err, row) => {
            if (err) {
              console.error('Error checking prices:', err);
              return;
            }
    
            if (row.count === 0) {
              console.log('Inserting initial prices...');
              const initialPrices = [
                { name: 'Preis pro m³', price: 50 },
                { name: 'Umzugskartons (Standard)', price: 2 },
                { name: 'Bücherkartons (Bücher&Geschirr)', price: 5 },
                { name: 'Kleiderkisten', price: 3 }
              ];
    
              initialPrices.forEach(price => {
                db.run(
                  'INSERT INTO admin_prices (name, price) VALUES (?, ?)',
                  [price.name, price.price],
                  function(err) {
                    if (err) {
                      console.error(`Error inserting price ${price.name}:`, err);
                    } else {
                      console.log(`Successfully inserted price: ${price.name} = ${price.price}`);
                    }
                  }
                );
              });
            } else {
              console.log('Prices already exist, skipping initialization');
            }
          });
        }
      });

      db.all("PRAGMA table_info(admin_prices);", [], (err, rows) => {
        if (err) {
          console.error('Error checking admin_prices columns:', err);
          return;
        }
      
        const columns = rows.map(row => row.name);
        
        if (!columns.includes('width')) {
          db.run("ALTER TABLE admin_prices ADD COLUMN width REAL DEFAULT 0;");
        }
        if (!columns.includes('length')) {
          db.run("ALTER TABLE admin_prices ADD COLUMN length REAL DEFAULT 0;");
        }
        if (!columns.includes('height')) {
          db.run("ALTER TABLE admin_prices ADD COLUMN height REAL DEFAULT 0;");
        }
      
        // Aktualisiere Standardwerte für existierende Einträge
        db.run(`UPDATE admin_prices SET width = 60, length = 40, height = 40 
                WHERE name = 'Umzugskartons (Standard)' AND width = 0;`);
        db.run(`UPDATE admin_prices SET width = 50, length = 35, height = 35 
                WHERE name = 'Bücherkartons (Bücher&Geschirr)' AND width = 0;`);
        db.run(`UPDATE admin_prices SET width = 100, length = 50, height = 50 
                WHERE name = 'Kleiderkisten' AND width = 0;`);
      });

      // Indizes für bessere Performance
      db.run('CREATE INDEX IF NOT EXISTS idx_recognitions_hash ON recognitions(imageHash)');
      db.run('CREATE INDEX IF NOT EXISTS idx_features_hash ON image_features(imageHash)');
      db.run("PRAGMA foreign_keys=off;");
      db.run("BEGIN TRANSACTION;");
      
      db.all("PRAGMA table_info(admin_items);", [], (err, rows) => {
        if (err) {
          console.error('Error checking columns:', err);
          return;
        }
    
        const columns = rows.map(row => row.name);
        
        if (!columns.includes('width')) {
          db.run("ALTER TABLE admin_items ADD COLUMN width REAL DEFAULT 0;");
        }
        if (!columns.includes('length')) {
          db.run("ALTER TABLE admin_items ADD COLUMN length REAL DEFAULT 0;");
        }
        if (!columns.includes('height')) {
          db.run("ALTER TABLE admin_items ADD COLUMN height REAL DEFAULT 0;");
        }
      });
      
      db.run("COMMIT;");
      db.run("PRAGMA foreign_keys=on;");
      db.get('SELECT COUNT(*) as count FROM admin_rooms', [], (err, row) => {
        if (err) {
          console.error('Error checking rooms:', err);
          return;
        }
        console.log('Rooms count:', row.count);
        // Wenn keine Räume existieren, füge die initialen Daten ein
        if (row.count === 0) {
          console.log('Inserting initial data...');
          
          Object.entries(INITIAL_ROOMS_AND_ITEMS).forEach(([roomName, items]) => {
            db.run('INSERT INTO admin_rooms (name) VALUES (?)', [roomName], function(err) {
              if (err) {
                console.error('Error inserting room:', err);
                return;
              }
              console.log(`Inserted room: ${roomName}`);
    
              // Füge Items für diesen Raum ein
              items.forEach(item => {
                db.run(
                  'INSERT INTO admin_items (name, volume, room) VALUES (?, ?, ?)',
                  [item.name, item.volume, roomName],
                  (err) => {
                    if (err) {
                      console.error(`Error inserting item ${item.name}:`, err);
                    } else {
                      console.log(`Inserted item: ${item.name} for room ${roomName}`);
                    }
                  }
                );
              });
            });
          });
          
          console.log('Initial data insertion started');
        } else {
          console.log('Data already exists, skipping initial insert');
        }
      });
  
      
    });
    app.get('/api/admin/inspections', (req, res) => {
      console.log('Fetching inspections from database');
      
      db.all('SELECT * FROM inspections', [], (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: err.message });
        }
        
        // Always return an array, even if empty
        console.log('Found inspections:', rows);
        return res.json(rows || []);
      });
    });

// In server.js bei den anderen API-Endpunkten
app.get('/api/debug/tables', (req, res) => {
  db.all(`
    SELECT name 
    FROM sqlite_master 
    WHERE type='table'
  `, [], (err, tables) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(tables);
  });
});

// Zusätzlich für die Struktur der inspections Tabelle
app.get('/moving-assistant/api/debug/inspections-schema', (req, res) => {
  db.all(`
    SELECT sql 
    FROM sqlite_master 
    WHERE type='table' 
    AND name='inspections'
  `, [], (err, schema) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(schema);
  });
});
    
    // POST-Endpunkt für neue Inspektion
    app.post('/moving-assistant/api/inspections', async (req, res) => {
      const {
        dealId,
        moveDate,
        totalVolume,
        totalRooms,
        originAddress,
        originFloor,
        originHasElevator,
        destinationAddress,
        destinationFloor,
        destinationHasElevator,
        packingService,
        unpackingService,
        liftLoading,
        liftUnloading,
        furnitureCost,
        materialsCost,
        totalCost,
        notes,
        data
      } = req.body;
    
      try {
        const result = await db.run(`
          INSERT INTO inspections (
            deal_id, move_date, total_volume, total_rooms,
            origin_address, origin_floor, origin_has_elevator,
            destination_address, destination_floor, destination_has_elevator,
            packing_service, unpacking_service,
            lift_loading, lift_unloading,
            furniture_cost, materials_cost, total_cost,
            notes, data
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          dealId, moveDate, totalVolume, totalRooms,
          originAddress, originFloor, originHasElevator,
          destinationAddress, destinationFloor, destinationHasElevator,
          packingService, unpackingService,
          liftLoading, liftUnloading,
          furnitureCost, materialsCost, totalCost,
          notes, JSON.stringify(data)
        ]);
    
        res.json({ id: result.lastID });
      } catch (error) {
        console.error('Error creating inspection:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    
  }
});

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Hilfsfunktionen
async function generateImageHash(imageData) {
  return crypto
    .createHash('sha256')
    .update(imageData)
    .digest('hex');
}

async function extractImageFeatures(imageData) {
  const hash = await generateImageHash(imageData);
  return {
    hash,
    features: {
      // Hier könnten in Zukunft echte Bildmerkmale extrahiert werden
      colorHistogram: [],
      edges: [],
      shapes: []
    }
  };
}

async function findSimilarItems(imageFeatures, itemName, roomName) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT r.*, f.featureVector
      FROM recognitions r
      JOIN image_features f ON r.imageHash = f.imageHash
      WHERE r.roomName = ? AND (r.originalName = ? OR r.correctedName = ?)
      ORDER BY r.timestamp DESC
      LIMIT 5
    `, [roomName, itemName, itemName], (err, rows) => {
      if (err) reject(err);
      else {
        const itemsWithScores = rows.map(row => ({
          ...row,
          similarityScore: calculateSimilarity(imageFeatures.features, 
            JSON.parse(row.featureVector || '{}'))
        }));
        resolve(itemsWithScores);
      }
    });
  });
}

function calculateSimilarity(features1, features2) {
  // Vereinfachte Version - könnte durch ML-basierte Ähnlichkeitsberechnung ersetzt werden
  return 0.85;
}

// Hauptendpunkte
app.post(['/api/analyze', '/api/analyze/'], async (req, res) => {
  console.log('Analyze endpoint hit', { body: req.body });
  try {
    const { images, roomName, customPrompt } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    console.log('Request data:', { 
      roomName, 
      imagesCount: images.length,
      hasCustomPrompt: !!customPrompt  // Debug log
    });

    console.log(`Starting analysis for ${roomName} with ${images.length} images`);

    // Initial Claude Analysis
    const message = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: customPrompt || `Analysiere diese Bilder eines ${roomName}s und identifiziere alle Möbelstücke. 
  Für jeden Gegenstand gib an:
  1. Name auf Deutsch
  2. Geschätzte Maße (L x B x H in cm)
  3. Geschätztes Volumen in m³
  4. Kurze Beschreibung (Material, Farbe, Zustand)
  
  Berechne auch das Gesamtvolumen aller Möbel.
  Gib auch Umzugshinweise und Besonderheiten an.
  
  Format als JSON:
  {F
    "items": [{
      "name": string,
      "dimensions": string,
      "volume": number,
      "description": string
    }],
    "totalVolume": number,
    "summary": string,
    "movingTips": string
  }`
          },
          ...images.map(image => ({
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: image.split(',')[1]
            }
          }))
        ]
      }]
    });

    // Parse und validiere Claude's Antwort
    if (!message.content || !Array.isArray(message.content) || !message.content[0] || !message.content[0].text) {
      throw new Error('Invalid response format from Claude');
    }
 
    let initialResults;
try {
  // Versuche den JSON-Teil aus der Antwort zu extrahieren
  const text = message.content[0].text;
  console.log('Raw Claude response:', text); // Debug-Log
  
  const jsonMatch = text.match(/{[\s\S]*}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  
  initialResults = JSON.parse(jsonMatch[0]);
  
  if (!initialResults.items || !Array.isArray(initialResults.items)) {
    throw new Error('Invalid JSON structure');
  }

  console.log('Parsed results:', initialResults); // Debug-Log
} catch (parseError) {
  console.error('Error parsing Claude response:', parseError);
  throw new Error('Failed to parse AI response');
}

    // Verbessere mit gelernten Erkennungen
    const imageFeatures = await Promise.all(
      images.map(image => extractImageFeatures(image))
    );

    const improvedItems = await Promise.all(initialResults.items.map(async (item) => {
      const similarItems = await findSimilarItems(imageFeatures[0], item.name, roomName);
      
      if (similarItems.length > 0) {
        const bestMatch = similarItems.sort((a, b) => b.similarityScore - a.similarityScore)[0];
        
        if (bestMatch.similarityScore > 0.8) {
          return {
            ...item,
            name: bestMatch.correctedName,
            volume: bestMatch.correctedVolume,
            dimensions: bestMatch.correctedDimensions,
            confidence: bestMatch.similarityScore * 100,
            matched: true
          };
        }
      }
      
      return { ...item, confidence: 85 };
    }));

    const totalVolume = improvedItems.reduce((sum, item) => 
      sum + (item.volume * (item.count || 1)), 0
    );

    const finalResults = {
      ...initialResults,
      items: improvedItems,
      totalVolume,
      improved: true
    };

    res.json(finalResults);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Error during image analysis',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

app.post('/api/recognition/feedback', async (req, res) => {
  try {
    const { 
      originalItem, 
      correctedItem, 
      imageData,
      roomName,
      isMisrecognition 
    } = req.body;

    const imageFeatures = await extractImageFeatures(imageData);

    if (isMisrecognition) {
      // Speichere Fehlerkennungen für zukünftiges Lernen
      db.run(
        `INSERT INTO recognitions 
         (roomName, originalName, correctedName, imageHash, confidence)
         VALUES (?, ?, ?, ?, ?)`,
        [roomName, originalItem.name, correctedItem.name, imageFeatures.hash, 0],
        async (err) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Speichere Bildmerkmale
          await db.run(
            `INSERT INTO image_features 
             (imageHash, roomName, objectType, featureVector)
             VALUES (?, ?, ?, ?)`,
            [
              imageFeatures.hash,
              roomName,
              correctedItem.name,
              JSON.stringify(imageFeatures.features)
            ]
          );

          res.json({ success: true, type: 'misrecognition' });
        }
      );
    } else {
      // Speichere erfolgreiche Korrekturen
      db.run(
        `INSERT INTO recognitions 
         (roomName, originalName, correctedName, 
          originalVolume, correctedVolume, originalDimensions, 
          correctedDimensions, imageHash, confidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          roomName,
          originalItem.name,
          correctedItem.name,
          originalItem.volume,
          correctedItem.volume,
          originalItem.dimensions,
          correctedItem.dimensions,
          imageFeatures.hash,
          95
        ],
        async (err) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Speichere Bildmerkmale
          await db.run(
            `INSERT INTO image_features 
             (imageHash, roomName, objectType, featureVector)
             VALUES (?, ?, ?, ?)`,
            [
              imageFeatures.hash,
              roomName,
              correctedItem.name,
              JSON.stringify(imageFeatures.features)
            ]
          );

          res.json({ success: true, type: 'correction' });
        }
      );
    }
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes


app.get('/api/admin/rooms', (req, res) => {
  db.all('SELECT * FROM admin_rooms ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching rooms:', err);
      return res.status(500).json({ error: err.message });
    }
    // Ensure we always return an array
    res.json(rows || []);
  });
});

app.post('/api/admin/rooms', async (req, res) => {
  const { name } = req.body;
  
  try {
    const sql = 'INSERT INTO admin_rooms (name) VALUES (?) RETURNING *';
    const result = await db.run(sql, [name]);
    res.json({ id: result.lastID, name });
  } catch (error) {
    console.error('Error saving room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/items', (req, res) => {
  const { room } = req.query;
  console.log('GET /api/admin/items called with room:', room);

  if (!room) {
    console.log('No room parameter provided');
    return res.status(400).json([]);
  }

  const query = 'SELECT * FROM admin_items WHERE room = ?';
  console.log('Executing query:', query, 'with room:', room);

  db.all(query, [room], (err, rows) => {
    if (err) {
      console.error('Database error fetching items:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`Found ${rows?.length || 0} items for room ${room}:`, rows);
    res.json(rows || []);
  });
});

app.post('/api/admin/items', async (req, res) => {
  console.log('Received item data:', req.body);
  const { name, width, length, height, room } = req.body;
  const volume = (width * length * height) / 1000000; // Convert from cm³ to m³
  
  db.run(
    'INSERT INTO admin_items (name, width, length, height, volume, room) VALUES (?, ?, ?, ?, ?, ?)',
    [name, width, length, height, volume, room],
    function(err) {
      if (err) {
        console.error('Error inserting item:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        id: this.lastID, 
        name, 
        width, 
        length, 
        height,
        volume,
        room 
      });
    }
  );
});

app.put('/api/admin/items/:id', (req, res) => {
  const { id } = req.params;
  const { name, width, length, height, volume } = req.body;
  
  db.run(
    'UPDATE admin_items SET name = ?, width = ?, length = ?, height = ?, volume = ? WHERE id = ?',
    [name, width, length, height, volume, id],
    function(err) {
      if (err) {
        console.error('Error updating item:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json({ id: parseInt(id), name, width, length, height, volume });
    }
  );
});

app.get('/api/admin/prices', (req, res) => {
  db.all('SELECT * FROM admin_prices ORDER BY created_at ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching prices:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Preis aktualisieren
app.put('/api/admin/prices/:id', (req, res) => {
  const { id } = req.params;
  const { price, width, length, height } = req.body;

  db.run(
    'UPDATE admin_prices SET price = ?, width = ?, length = ?, height = ? WHERE id = ?',
    [price, width, length, height, id],
    function(err) {
      if (err) {
        console.error('Error updating price:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: parseInt(id), price, width, length, height });
    }
  );
});

// Statistik-Endpoint (optional)
app.get('/api/stats', async (req, res) => {
  try {
    db.all(`
      SELECT 
        COUNT(*) as total_recognitions,
        COUNT(DISTINCT roomName) as unique_rooms,
        COUNT(DISTINCT originalName) as unique_items,
        AVG(confidence) as avg_confidence
      FROM recognitions
    `, [], (err, stats) => {
      if (err) throw err;
      res.json(stats[0]);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use('/moving-assistant', express.static(path.join(__dirname, '..', 'build')));

// Catch-all handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database location: ${path.join(__dirname, 'recognition.db')}`);
});