// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
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
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

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

      // Erst alle abhängigen Tabellen löschen
      db.run('DROP TABLE IF EXISTS assignments');
      db.run('DROP TABLE IF EXISTS inspection_photos');
      db.run('DROP TABLE IF EXISTS inspections');

      // Dann die Haupttabelle erstellen
      db.run(`CREATE TABLE IF NOT EXISTS inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deal_id TEXT UNIQUE,
        customer_name TEXT,
        address TEXT,
        moving_date DATE,
        status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Dann die abhängigen Tabellen erstellen
      db.run(`CREATE TABLE IF NOT EXISTS inspection_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id INTEGER,
        room_name TEXT,
        photo_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(inspection_id) REFERENCES inspections(id)
      )`);

      // Assignments-Tabelle mit employee_id
      db.run(`CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        inspection_id INTEGER NOT NULL,
        start_datetime DATETIME NOT NULL,
        end_datetime DATETIME NOT NULL,
        status TEXT CHECK(status IN ('planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inspection_id) REFERENCES inspections(id),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )`);

      // Test-Daten einfügen
      db.get('SELECT COUNT(*) as count FROM inspections', [], (err, row) => {
        if (err) {
          console.error('Error checking inspections:', err);
          return;
        }
        
        if (row.count === 0) {
          console.log('Inserting test inspections...');
          const testInspections = [
            {
              deal_id: 'DEAL001',
              customer_name: 'Max Mustermann',
              address: 'Musterstraße 1, 12345 Berlin',
              moving_date: '2024-04-01',
              status: 'pending',
              notes: 'Großer Umzug mit vielen Möbeln'
            },
            {
              deal_id: 'DEAL002',
              customer_name: 'Erika Musterfrau',
              address: 'Beispielweg 2, 12345 Berlin',
              moving_date: '2024-04-15',
              status: 'pending',
              notes: 'Kleiner Umzug, hauptsächlich Kartons'
            }
          ];

          testInspections.forEach(inspection => {
            db.run(`
              INSERT INTO inspections (
                deal_id, customer_name, address, moving_date, status, notes
              ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
              inspection.deal_id,
              inspection.customer_name,
              inspection.address,
              inspection.moving_date,
              inspection.status,
              inspection.notes
            ], (err) => {
              if (err) {
                console.error('Error inserting test inspection:', err);
              } else {
                console.log('Successfully inserted test inspection:', inspection.deal_id);
              }
            });
          });
        } else {
          console.log('Inspections already exist, skipping test data insertion');
        }
      });
    
      // Demo-Daten für den 27. Januar 2025
      const demo_inspections = [
        {
          deal_id: 'DEAL003',
          customer_name: 'Familie Schmidt',
          address: 'Karlstraße 123, 76133 Karlsruhe',
          moving_date: '2025-01-27',
          status: 'pending',
          notes: '4-Zimmer Wohnung, 2. Stock mit Aufzug'
        },
        {
          deal_id: 'DEAL004',
          customer_name: 'Peter Wagner',
          address: 'Sophienstraße 45, 76135 Karlsruhe',
          moving_date: '2025-01-27',
          status: 'pending',
          notes: '3-Zimmer Wohnung, Erdgeschoss'
        },
        {
          deal_id: 'DEAL005',
          customer_name: 'Maria Becker',
          address: 'Waldstraße 78, 76137 Karlsruhe',
          moving_date: '2025-01-27',
          status: 'pending',
          notes: '2-Zimmer Wohnung, 3. Stock ohne Aufzug'
        }
      ];

      // Füge die Demo-Daten ein
      demo_inspections.forEach(inspection => {
        db.run(`
          INSERT OR REPLACE INTO inspections (
            deal_id, customer_name, address, moving_date, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          inspection.deal_id,
          inspection.customer_name,
          inspection.address,
          inspection.moving_date,
          inspection.status,
          inspection.notes
        ], (err) => {
          if (err) {
            console.error('Error inserting demo inspection:', err);
          } else {
            console.log('Successfully inserted demo inspection:', inspection.deal_id);
          }
        });
      });
    
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
  
      // Mitarbeiter-Tabelle
      db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        address TEXT,
        birth_date DATE,
        hire_date DATE NOT NULL,
        status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Qualifikationen-Tabelle
      db.run(`CREATE TABLE IF NOT EXISTS qualifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Mitarbeiter-Qualifikationen (Verknüpfungstabelle)
      db.run(`CREATE TABLE IF NOT EXISTS employee_qualifications (
        employee_id INTEGER,
        qualification_id INTEGER,
        acquired_date DATE NOT NULL,
        expiry_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (employee_id, qualification_id),
        FOREIGN KEY (employee_id) REFERENCES employees(id),
        FOREIGN KEY (qualification_id) REFERENCES qualifications(id)
      )`);

      // Verfügbarkeiten-Tabelle
      db.run(`CREATE TABLE IF NOT EXISTS availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        type TEXT CHECK(type IN ('work', 'vacation', 'sick', 'other')) NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )`);

      // Teams-Tabelle
      db.run(`CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Team-Mitglieder (Verknüpfungstabelle)
      db.run(`CREATE TABLE IF NOT EXISTS team_members (
        team_id INTEGER,
        employee_id INTEGER,
        role TEXT CHECK(role IN ('leader', 'member')) DEFAULT 'member',
        start_date DATE NOT NULL,
        end_date DATE,
        PRIMARY KEY (team_id, employee_id),
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )`);

      // Test-Teams erstellen
      db.get('SELECT COUNT(*) as count FROM teams', [], (err, row) => {
        if (err) {
          console.error('Error checking teams:', err);
          return;
        }
        
        if (row.count === 0) {
          console.log('Inserting test teams...');
          const testTeams = [
            {
              name: 'Team A',
              description: 'Hauptteam für große Umzüge'
            },
            {
              name: 'Team B',
              description: 'Team für mittlere Umzüge'
            },
            {
              name: 'Team C',
              description: 'Team für kleine Umzüge'
            }
          ];

          testTeams.forEach(team => {
            db.run(`
              INSERT INTO teams (name, description)
              VALUES (?, ?)
            `, [team.name, team.description], function(err) {
              if (err) {
                console.error('Error inserting test team:', err);
              } else {
                console.log('Successfully inserted test team:', team.name);
                
                // Erstelle Assignments für die Demo-Inspektionen
                if (team.name === 'Team A') {
                  db.get('SELECT id FROM inspections WHERE deal_id = ?', ['DEAL003'], (err, inspection) => {
                    if (err || !inspection) return;
                    db.run(`
                      INSERT INTO assignments (
                        employee_id,
                        inspection_id,
                        start_datetime,
                        end_datetime,
                        status
                      ) VALUES (?, ?, ?, ?, 'planned')
                    `, [
                      inspection.id,
                      inspection.id,
                      '2025-01-27 08:00:00',
                      '2025-01-27 16:00:00',
                      'planned'
                    ]);
                  });
                } else if (team.name === 'Team B') {
                  db.get('SELECT id FROM inspections WHERE deal_id = ?', ['DEAL004'], (err, inspection) => {
                    if (err || !inspection) return;
                    db.run(`
                      INSERT INTO assignments (
                        employee_id,
                        inspection_id,
                        start_datetime,
                        end_datetime,
                        status
                      ) VALUES (?, ?, ?, ?, 'planned')
                    `, [
                      inspection.id,
                      inspection.id,
                      '2025-01-27 09:00:00',
                      '2025-01-27 15:00:00',
                      'planned'
                    ]);
                  });
                }
              }
            });
          });
        } else {
          console.log('Teams already exist, skipping test data insertion');
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
  {
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
    console.log('Prompt:', customPrompt); // Prompt-Log
    const textContent = message.content[0].text;
    let initialResults;
try {
  // Versuche den JSON-Teil aus der Antwort zu extrahieren
  const text = message.content[0].text;
  console.log('Raw Claude response:', text); // Debug-Log
  
  const jsonMatch = text.match(/{[\s\S]*}/);
  if (!jsonMatch) {
    console.error('No JSON found in response');
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

    // Berechne neues Gesamtvolumen
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


app.get('/moving-assistant/api/admin/rooms', (req, res) => {
  db.all('SELECT * FROM admin_rooms ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching rooms:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.get('/moving-assistant/api/admin/items', (req, res) => {
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

app.post('/moving-assistant/api/admin/items', async (req, res) => {
  const { name, width, length, height, volume, room } = req.body;
  
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

app.put('/moving-assistant/api/admin/items/:id', (req, res) => {
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

app.get('/moving-assistant/api/admin/prices', (req, res) => {
  db.all('SELECT * FROM admin_prices ORDER BY created_at ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching prices:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Preis aktualisieren
app.put('/moving-assistant/api/admin/prices/:id', (req, res) => {
  const { id } = req.params;
  const { price } = req.body;
  
  if (price === undefined) {
    return res.status(400).json({ error: 'Price is required' });
  }

  db.run(
    'UPDATE admin_prices SET price = ? WHERE id = ?',
    [price, id],
    function(err) {
      if (err) {
        console.error('Error updating price:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Price not found' });
      }
      res.json({ id: parseInt(id), price });
    }
  );
});

// Statistik-Endpoint (optional)
app.get('/moving-assistant/api/stats', async (req, res) => {
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

// GET Mitarbeiter
app.get('/moving-assistant/api/employees', (req, res) => {
  console.log('Fetching employees...');
  db.all('SELECT * FROM employees ORDER BY last_name, first_name', [], (err, rows) => {
    if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Found employees:', rows);
    res.json(rows || []);
  });
});

// GET einzelner Mitarbeiter
app.get('/moving-assistant/api/employees/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM employees WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching employee:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(row);
  });
});

// POST neuer Mitarbeiter
app.post('/moving-assistant/api/employees', (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    birthDate,
    hireDate,
    status = 'active'
  } = req.body;

  db.run(
    `INSERT INTO employees (
      first_name, last_name, email, phone, address, birth_date, hire_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, email, phone, address, birthDate, hireDate, status],
    function(err) {
      if (err) {
        console.error('Error creating employee:', err);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ 
        id: this.lastID,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        address,
        birth_date: birthDate,
        hire_date: hireDate,
        status
      });
    }
  );
});

// PUT Mitarbeiter aktualisieren
app.put('/moving-assistant/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    birthDate,
    hireDate,
    status
  } = req.body;

  db.run(
    `UPDATE employees SET 
      first_name = ?, 
      last_name = ?, 
      email = ?, 
      phone = ?, 
      address = ?, 
      birth_date = ?, 
      hire_date = ?, 
      status = ?
    WHERE id = ?`,
    [firstName, lastName, email, phone, address, birthDate, hireDate, status, id],
    function(err) {
      if (err) {
        console.error('Error updating employee:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json({ 
        id: parseInt(id),
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        address,
        birth_date: birthDate,
        hire_date: hireDate,
        status
      });
    }
  );
});

// Qualifikationen abrufen
app.get('/moving-assistant/api/qualifications', (req, res) => {
  db.all('SELECT * FROM qualifications ORDER BY name', [], (err, rows) => {
    if (err) {
      console.error('Error fetching qualifications:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Mitarbeiter-Qualifikationen abrufen
app.get('/moving-assistant/api/employee-qualifications/:id', (req, res) => {
  const { id } = req.params;
  db.all(`
    SELECT 
      eq.*,
      q.name,
      q.description
    FROM employee_qualifications eq
    JOIN qualifications q ON eq.qualification_id = q.id
    WHERE eq.employee_id = ?
    ORDER BY eq.acquired_date DESC
  `, [id], (err, rows) => {
    if (err) {
      console.error('Error fetching employee qualifications:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Neue Qualifikation hinzufügen
app.post('/moving-assistant/api/employee-qualifications', (req, res) => {
  const { employeeId, qualificationId, acquiredDate, expiryDate, notes } = req.body;

  db.run(`
    INSERT INTO employee_qualifications (
      employee_id, qualification_id, acquired_date, expiry_date, notes
    ) VALUES (?, ?, ?, ?, ?)
  `, [employeeId, qualificationId, acquiredDate, expiryDate, notes], function(err) {
    if (err) {
      console.error('Error adding qualification:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      id: this.lastID,
      employee_id: employeeId,
      qualification_id: qualificationId,
      acquired_date: acquiredDate,
      expiry_date: expiryDate,
      notes
    });
  });
});

// Teams abrufen
app.get('/moving-assistant/api/teams', (req, res) => {
  db.all('SELECT * FROM teams ORDER BY name', [], (err, rows) => {
    if (err) {
      console.error('Error fetching teams:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Einsätze abrufen
app.get('/moving-assistant/api/assignments', (req, res) => {
  db.all(`
    SELECT 
      a.*,
      e.first_name,
      e.last_name,
      i.customer_name,
      i.address
    FROM assignments a
    LEFT JOIN employees e ON a.employee_id = e.id
    LEFT JOIN inspections i ON a.inspection_id = i.id
    ORDER BY a.start_datetime
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching assignments:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Einsatz erstellen
app.post('/moving-assistant/api/assignments', (req, res) => {
  const {
    employeeId,
    inspectionId,
    startDate,
    endDate
  } = req.body;

  // Prüfe zuerst, ob der Mitarbeiter bereits einen Einsatz in diesem Zeitraum hat
  db.all(`
    SELECT * FROM assignments 
    WHERE employee_id = ? 
    AND (
      (start_datetime <= ? AND end_datetime >= ?) OR
      (start_datetime <= ? AND end_datetime >= ?) OR
      (start_datetime >= ? AND end_datetime <= ?)
    )
  `, [
    employeeId,
    startDate, startDate,
    endDate, endDate,
    startDate, endDate
  ], (err, existingAssignments) => {
    if (err) {
      console.error('Error checking existing assignments:', err);
      return res.status(500).json({ error: err.message });
    }

    if (existingAssignments.length > 0) {
      return res.status(409).json({ 
        error: 'Mitarbeiter ist in diesem Zeitraum bereits einem anderen Umzug zugewiesen' 
      });
    }

    // Wenn keine Konflikte gefunden wurden, erstelle den neuen Einsatz
    db.run(`
      INSERT INTO assignments (
        employee_id,
        inspection_id,
        start_datetime,
        end_datetime,
        status
      ) VALUES (?, ?, ?, ?, 'planned')
    `, [employeeId, inspectionId, startDate, endDate], function(err) {
      if (err) {
        console.error('Error creating assignment:', err);
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        employee_id: employeeId,
        inspection_id: inspectionId,
        start_datetime: startDate,
        end_datetime: endDate,
        status: 'planned'
      });
    });
  });
});

// Mitarbeiter aus Einsatz entfernen
app.delete('/moving-assistant/api/assignments/:assignmentId/employees/:employeeId', (req, res) => {
  const { assignmentId, employeeId } = req.params;

  db.run(`
    DELETE FROM team_members
    WHERE team_id IN (
      SELECT team_id FROM assignments WHERE id = ?
    )
    AND employee_id = ?
  `, [assignmentId, employeeId], (err) => {
    if (err) {
      console.error('Error removing team member:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(204).send();
  });
});

// Inspektionen abrufen
app.get('/moving-assistant/api/inspections', (req, res) => {
  db.all('SELECT * FROM inspections ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching inspections:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Route für die Routenplanung
app.get('/moving-assistant/api/inspections/route', (req, res) => {
  // Hole alle Inspektionen mit Adressen für die Routenplanung
  db.all(`
    SELECT 
      id,
      customer_name,
      address,
      moving_date,
      status,
      notes
    FROM inspections 
    WHERE moving_date IS NOT NULL 
    ORDER BY moving_date ASC
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching route data:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Neuer Endpunkt zum Synchronisieren der Pipedrive-Deals mit lokalen Inspektionen
app.post('/moving-assistant/api/sync-deals', async (req, res) => {
  const { deals } = req.body;
  
  try {
    // Für jeden Deal
    for (const deal of deals) {
      // Prüfe ob bereits eine Inspektion für diesen Deal existiert
      const existingInspection = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM inspections WHERE deal_id = ?', [deal.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!existingInspection) {
        // Erstelle neue Inspektion
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO inspections (
              deal_id,
              customer_name,
              address,
              moving_date,
              status,
              notes
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            deal.id,
            deal.title,
            deal['07c3da8804f7b96210e45474fba35b8691211ddd'], // originAddress
            deal['949696aa9d99044db90383a758a74675587ed893'], // moveDate
            'pending',
            `Umzug von ${deal['07c3da8804f7b96210e45474fba35b8691211ddd']} nach ${deal['9cb4de1018ec8404feeaaaf7ee9b293c78c44281']}`
          ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });
      }
    }
    
    res.json({ success: true, message: 'Deals synchronized successfully' });
  } catch (error) {
    console.error('Error syncing deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assignment löschen
app.delete('/moving-assistant/api/assignments/:id', (req, res) => {
  const { id } = req.params;

  console.log('Deleting assignment:', id); // Debug-Log

  db.run('DELETE FROM assignments WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting assignment:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    console.log('Successfully deleted assignment:', id); // Debug-Log
    res.status(204).send();
  });
});

// 2. API Routes (ALLE API-Routen müssen VOR den statischen Routen kommen)
const apiRouter = express.Router();

// Admin Routes
apiRouter.get('/admin/rooms', (req, res) => {
  db.all('SELECT * FROM admin_rooms ORDER BY name', [], (err, rows) => {
    if (err) {
      console.error('Error fetching rooms:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

apiRouter.get('/admin/items/:room', (req, res) => {
  const { room } = req.params;
  db.all('SELECT * FROM admin_items WHERE room = ? ORDER BY name', [room], (err, rows) => {
    if (err) {
      console.error('Error fetching items:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Inspections Routes
apiRouter.get('/inspections', (req, res) => {
  db.all('SELECT * FROM inspections ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching inspections:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

apiRouter.get('/inspections/route', (req, res) => {
  db.all(`
    SELECT 
      id,
      customer_name,
      address,
      moving_date,
      status,
      notes
    FROM inspections 
    WHERE moving_date IS NOT NULL 
    ORDER BY moving_date ASC
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching route data:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Mount API Router mit Präfix
app.use('/moving-assistant/api', apiRouter);

// 3. Statische Dateien (NACH den API-Routen)
app.use('/moving-assistant', express.static(path.join(__dirname, '..', 'build')));

// 4. Client-Route Handler (NACH den statischen Dateien)
app.get('/moving-assistant/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// 5. Catch-all Route (GANZ AM ENDE)
app.get('*', (req, res) => {
  res.redirect('/moving-assistant');
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database location: ${path.join(__dirname, 'recognition.db')}`);
});