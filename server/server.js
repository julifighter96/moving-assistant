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

// Am Anfang der Datei nach den Imports
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// SQLite Setup
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
      
      // Nach der trucks Tabellenerstellung
      db.run(`CREATE TABLE IF NOT EXISTS trucks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_plate TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        loading_capacity REAL NOT NULL,
        length REAL NOT NULL,
        width REAL NOT NULL,
        height REAL NOT NULL,
        max_weight REAL NOT NULL,
        status TEXT CHECK(status IN ('available', 'booked', 'maintenance')) DEFAULT 'available',
        current_order_id INTEGER,
        current_order_start DATETIME,
        current_order_end DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(current_order_id) REFERENCES inspections(id)
      )`);

      // Test-LKWs erstellen
      db.get('SELECT COUNT(*) as count FROM trucks', [], (err, row) => {
        if (err) {
          console.error('Error checking trucks:', err);
          return;
        }
        
        if (row.count === 0) {
          console.log('Inserting test trucks...');
          const testTrucks = [
            {
              license_plate: 'B-MT-1234',
              type: '7.5t Koffer',
              loading_capacity: 7500,
              length: 650,
              width: 240,
              height: 260,
              max_weight: 7500
            },
            {
              license_plate: 'B-MT-5678',
              type: '12t Koffer',
              loading_capacity: 12000,
              length: 820,
              width: 245,
              height: 270,
              max_weight: 12000
            },
            {
              license_plate: 'B-MT-9012',
              type: '3.5t Sprinter',
              loading_capacity: 3500,
              length: 430,
              width: 180,
              height: 200,
              max_weight: 3500
            }
          ];

          testTrucks.forEach(truck => {
            db.run(`
              INSERT INTO trucks (
                license_plate, type, loading_capacity,
                length, width, height, max_weight
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              truck.license_plate,
              truck.type,
              truck.loading_capacity,
              truck.length,
              truck.width,
              truck.height,
              truck.max_weight
            ], function(err) {
    if (err) {
                console.error('Error inserting test truck:', err);
              } else {
                console.log('Successfully inserted test truck:', truck.license_plate);
    }
  });
});
        } else {
          console.log('Trucks already exist, skipping test data insertion');
        }
      });
    
      // Erstelle assignments Tabelle
      db.run(`CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(inspection_id) REFERENCES inspections(id),
        FOREIGN KEY(employee_id) REFERENCES employees(id),
        UNIQUE(inspection_id, employee_id)
      )`);
    
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
      colorHistogram: [],
      edges: [],
      shapes: []
    }
  };
}

// API Routen
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

// ... Ihre anderen API-Routen ...

// Neuer Endpunkt zum Synchronisieren der Pipedrive-Deals
app.post('/moving-assistant/api/sync-deals', async (req, res) => {
  const { deals } = req.body;
  
  try {
    for (const deal of deals) {
      const existingInspection = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM inspections WHERE deal_id = ?', [deal.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!existingInspection) {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO inspections (
              deal_id, customer_name, address, moving_date, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            deal.id,
            deal.title,
            deal['07c3da8804f7b96210e45474fba35b8691211ddd'],
            deal['949696aa9d99044db90383a758a74675587ed893'],
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

// Verfügbare LKWs für einen bestimmten Zeitraum abrufen
app.get('/moving-assistant/api/trucks/available', async (req, res) => {
  const { date } = req.query;
  console.log('Fetching available trucks for date:', date);

  try {
    const trucks = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM trucks 
        WHERE status = 'available'
        AND id NOT IN (
          SELECT t.id 
          FROM trucks t
          JOIN inspections i ON t.current_order_id = i.id
          WHERE i.moving_date = ?
        )
        ORDER BY loading_capacity ASC
      `, [date], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('Available trucks:', trucks);
    res.json(trucks || []);
  } catch (error) {
    console.error('Error fetching available trucks:', error);
    res.status(500).json({ error: error.message });
  }
});

// LKW einem Umzug zuweisen
app.post('/moving-assistant/api/trucks/:truckId/assign', async (req, res) => {
  const { truckId } = req.params;
  const { inspectionId } = req.body;
  console.log('Assigning truck:', { truckId, inspectionId });

  try {
    // Hole das Umzugsdatum
    const inspection = await new Promise((resolve, reject) => {
      db.get('SELECT moving_date FROM inspections WHERE id = ?', [inspectionId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!inspection) {
      return res.status(404).json({ error: 'Umzug nicht gefunden' });
    }

    // Aktualisiere den LKW-Status
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE trucks 
        SET status = 'booked',
            current_order_id = ?
        WHERE id = ?
      `, [inspectionId, truckId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error assigning truck:', error);
    res.status(500).json({ error: error.message });
  }
});

// LKW-Routen
app.get('/moving-assistant/api/trucks', (req, res) => {
  console.log('Fetching trucks...');
  db.all('SELECT * FROM trucks ORDER BY license_plate', [], (err, rows) => {
    if (err) {
      console.error('Error fetching trucks:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Found trucks:', rows);
    res.json(rows || []);
  });
});

// GET einzelner LKW
app.get('/moving-assistant/api/trucks/:id', (req, res) => {
  const { id } = req.params;
  console.log('Fetching truck details for ID:', id);
  
  db.get('SELECT * FROM trucks WHERE id = ?', [id], (err, truck) => {
    if (err) {
      console.error('Error fetching truck:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    
    // Hole auch die Buchungshistorie
    db.all(`
      SELECT i.moving_date, i.customer_name, i.address
      FROM trucks t
      JOIN inspections i ON t.current_order_id = i.id
      WHERE t.id = ?
      ORDER BY i.moving_date DESC
    `, [id], (err, bookings) => {
      if (err) {
        console.error('Error fetching bookings:', err);
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ 
        ...truck,
        bookingHistory: bookings || []
      });
    });
  });
});

// PUT LKW Status ändern
app.put('/moving-assistant/api/trucks/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, orderId, startDate, endDate } = req.body;

  db.run(`
    UPDATE trucks 
    SET status = ?,
        current_order_id = ?,
        current_order_start = ?,
        current_order_end = ?
    WHERE id = ?
  `, [status, orderId, startDate, endDate, id], function(err) {
      if (err) {
      console.error('Error updating truck status:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    res.json({
      id: parseInt(id),
      status,
      current_order_id: orderId,
      current_order_start: startDate,
      current_order_end: endDate
    });
  });
});

// LKW von einem Umzug entfernen
app.post('/moving-assistant/api/trucks/:truckId/unassign', async (req, res) => {
  const { truckId } = req.params;

  try {
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE trucks 
        SET status = 'available',
            current_order_id = NULL,
            current_order_start = NULL,
            current_order_end = NULL
        WHERE id = ?
      `, [truckId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error unassigning truck:', error);
    res.status(500).json({ error: error.message });
  }
});

// In server.js - Fügen Sie diese Route hinzu oder aktualisieren Sie sie
app.get('/moving-assistant/api/admin/inspections', (req, res) => {
  console.log('Fetching inspections from database');
  
  db.all(`
    SELECT * FROM inspections 
    WHERE moving_date IS NOT NULL 
    ORDER BY moving_date ASC
  `, [], (err, rows) => {
      if (err) {
      console.error('Database error:', err);
        return res.status(500).json({ error: err.message });
      }
    
    // Konvertiere das Datum in ein ISO-Format
    const formattedRows = rows.map(row => ({
      ...row,
      moving_date: new Date(row.moving_date).toISOString().split('T')[0]
    }));
    
    console.log('Found inspections:', formattedRows);
    return res.json(formattedRows || []);
  });
});

// Mitarbeiter-Routen
app.get('/moving-assistant/api/employees', (req, res) => {
  console.log('Fetching employees...');
  
  db.all(`
    SELECT * FROM employees 
    ORDER BY last_name, first_name
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Found employees:', rows);
    res.json(rows || []);
  });
});

// Stelle sicher, dass die employees Tabelle existiert
db.serialize(() => {
  // ... andere Tabellen ...

  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Füge Test-Mitarbeiter hinzu, wenn die Tabelle leer ist
  db.get('SELECT COUNT(*) as count FROM employees', [], (err, row) => {
      if (err) {
      console.error('Error checking employees:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('Inserting test employees...');
      const testEmployees = [
        {
          first_name: 'Max',
          last_name: 'Mustermann',
          email: 'max.mustermann@example.com',
          phone: '+49 123 456789',
          status: 'active'
        },
        {
          first_name: 'Anna',
          last_name: 'Schmidt',
          email: 'anna.schmidt@example.com',
          phone: '+49 987 654321',
          status: 'active'
        }
      ];

      testEmployees.forEach(employee => {
        db.run(`
          INSERT INTO employees (
            first_name, last_name, email, phone, status
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          employee.first_name,
          employee.last_name,
          employee.email,
          employee.phone,
          employee.status
        ], function(err) {
      if (err) {
            console.error('Error inserting test employee:', err);
          } else {
            console.log('Successfully inserted test employee:', employee.first_name);
          }
        });
      });
    }
  });
});

// 2. API Router Setup
const apiRouter = express.Router();

// Moves API
apiRouter.get('/moves/schedule', (req, res) => {
  console.log('[Moves API] Fetching move schedule...');
  
  db.all(`
    SELECT 
      i.id,
      i.customer_name,
      i.address,
      i.moving_date,
      i.status,
      GROUP_CONCAT(e.first_name || ' ' || e.last_name) as assigned_employees
    FROM inspections i
    LEFT JOIN assignments a ON i.id = a.inspection_id
    LEFT JOIN employees e ON a.employee_id = e.id
    WHERE i.moving_date IS NOT NULL
    GROUP BY i.id
    ORDER BY i.moving_date ASC
  `, [], (err, rows) => {
    if (err) {
      console.error('[Moves API] Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const formattedRows = rows.map(row => ({
      ...row,
      moving_date: new Date(row.moving_date).toISOString().split('T')[0],
      assigned_employees: row.assigned_employees ? row.assigned_employees.split(',') : []
    }));
    
    res.json(formattedRows || []);
  });
});

// Assignments API
apiRouter.get('/assignments', (req, res) => {
  console.log('[Assignments API] Fetching assignments...');
  
  db.all(`
    SELECT 
      a.*,
      e.first_name,
      e.last_name,
      i.moving_date,
      i.customer_name
    FROM assignments a
    JOIN employees e ON a.employee_id = e.id
    JOIN inspections i ON a.inspection_id = i.id
    ORDER BY i.moving_date ASC
  `, [], (err, rows) => {
    if (err) {
      console.error('[Assignments API] Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Employees API
apiRouter.get('/employees', (req, res) => {
  console.log('[Employees API] Fetching employees...');
  
  db.all(`
    SELECT * FROM employees 
    ORDER BY last_name, first_name
  `, [], (err, rows) => {
    if (err) {
      console.error('[Employees API] Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Assignment Management
apiRouter.post('/moves/:moveId/assign', async (req, res) => {
  const { moveId } = req.params;
  const { employeeIds } = req.body;

  try {
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM assignments WHERE inspection_id = ?', [moveId], (err) => {
          if (err) reject(err);
        else resolve();
        });
      });

    for (const employeeId of employeeIds) {
        await new Promise((resolve, reject) => {
          db.run(`
          INSERT INTO assignments (inspection_id, employee_id)
          VALUES (?, ?)
        `, [moveId, employeeId], (err) => {
            if (err) reject(err);
          else resolve();
          });
        });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Assignment API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Mount API Router (BEFORE static files)
app.use('/moving-assistant/api', apiRouter);

// 4. Static Files (AFTER API routes)
app.use('/moving-assistant', (req, res, next) => {
  console.log('[Static] Serving static file:', req.url);
  next();
}, express.static(path.join(__dirname, '..', 'build')));

// 5. Catch-all Route (LAST)
app.get('*', (req, res) => {
  console.log('[Catch-all] Request URL:', req.url);
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Server starten
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database location: ${path.join(__dirname, 'recognition.db')}`);
});