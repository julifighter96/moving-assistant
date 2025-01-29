// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const Anthropic = require('@anthropic-ai/sdk');
const crypto = require('crypto');
const INITIAL_ROOMS_AND_ITEMS = require('./initialData');
require('dotenv').config({ path: __dirname + '/.env' });
const vehicleRoutes = require('./routes/vehicleRoutes');
const moveRoutes = require('./routes/moveRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

// Logging für Debugging
console.log('ENV check:', {
  envPath: require.resolve('dotenv'),
  anthropicKey: process.env.ANTHROPIC_API_KEY ? 'Key exists' : 'No key found',
  dbPath: path.join(__dirname, 'recognition.db')
});

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: ['http://localhost:3000', 'https://movingmanager.lolworlds.online'],
  credentials: true
}));

// Datenbankverbindung wird jetzt aus db.js importiert
const db = require('./db');

// Führe Migrationen aus
require('./migrations/init');

// Tabellen erstellen
db.serialize(() => {
  // Lösche existierende Tabellen
  console.log('Dropping existing tables...');
  db.run('DROP TABLE IF EXISTS assignments');
  db.run('DROP TABLE IF EXISTS inspections');
  db.run('DROP TABLE IF EXISTS vehicle_bookings');
  db.run('DROP TABLE IF EXISTS vehicle_maintenance');
  db.run('DROP TABLE IF EXISTS vehicles');
  db.run('DROP TABLE IF EXISTS employees');
  db.run('DROP TABLE IF EXISTS admin_rooms');
  db.run('DROP TABLE IF EXISTS deals');

  // 1. Basis-Tabellen zuerst
  console.log('Creating base tables...');

  // Mitarbeiter-Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Deals Tabelle (vor den abhängigen Tabellen)
  db.run(`CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    org_name TEXT,
    move_date DATE,
    origin_address TEXT,
    destination_address TEXT,
    value REAL,
    currency TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Fahrzeug-Tabellen
  db.run(`CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_plate TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    loading_capacity REAL NOT NULL,
    length REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    max_weight REAL NOT NULL,
    status TEXT CHECK(status IN ('available', 'in_use', 'maintenance')) DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Wartungshistorie
  db.run(`CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    cost REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  )`);

  // Fahrzeugbuchungen
  db.run(`CREATE TABLE IF NOT EXISTS vehicle_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    deal_id TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    volume REAL,
    weight REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY(deal_id) REFERENCES deals(id)
  )`);

  // 2. Abhängige Tabellen
  console.log('Creating dependent tables...');

  // Inspektionen-Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deal_id TEXT NOT NULL,
    inspector_id INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    notes TEXT,
    status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(inspector_id) REFERENCES employees(id),
    FOREIGN KEY(deal_id) REFERENCES deals(id)
  )`);

  // Zuweisungen-Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    deal_id TEXT NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    task_type TEXT NOT NULL,
    notes TEXT,
    status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES employees(id),
    FOREIGN KEY(deal_id) REFERENCES deals(id)
  )`);

  // Materialtabelle
  db.run(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      current_stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL,
      order_quantity INTEGER NOT NULL,
      unit TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Warenbewegungen
  db.run(`
    CREATE TABLE IF NOT EXISTS material_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('in', 'out')),
      quantity INTEGER NOT NULL,
      deal_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials (id),
      FOREIGN KEY (deal_id) REFERENCES deals (id)
    )
  `);

  // Materialzuweisung zu Umzügen
  db.run(`
    CREATE TABLE IF NOT EXISTS deal_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      planned_quantity INTEGER NOT NULL,
      actual_quantity INTEGER,
      status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'assigned', 'used')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals (id),
      FOREIGN KEY (material_id) REFERENCES materials (id)
    )
  `);

  // 3. Test-Daten einfügen
  console.log('Inserting test data...');

  // Test-Räume
  db.get('SELECT COUNT(*) as count FROM admin_rooms', [], (err, row) => {
    if (err || row.count > 0) return;
    
    db.run(`INSERT INTO admin_rooms (name) VALUES (?)`, ['Testraum 1']);
  });

  // Test-Mitarbeiter
  db.get('SELECT COUNT(*) as count FROM employees', [], (err, row) => {
    if (err || row.count > 0) return;
    
    const testEmployees = [
      {
        first_name: 'Max',
        last_name: 'Mustermann',
        email: 'max.mustermann@example.com',
        phone: '+49123456789',
        role: 'driver'
      },
      {
        first_name: 'Anna',
        last_name: 'Schmidt',
        email: 'anna.schmidt@example.com',
        phone: '+49987654321',
        role: 'manager'
      }
    ];

    testEmployees.forEach(employee => {
      db.run(`
        INSERT INTO employees (first_name, last_name, email, phone, role)
        VALUES (?, ?, ?, ?, ?)
      `, [
        employee.first_name,
        employee.last_name,
        employee.email,
        employee.phone,
        employee.role
      ]);
    });
  });

  // Test-Inspektionen
  db.get('SELECT COUNT(*) as count FROM inspections', [], (err, row) => {
    if (err || row.count > 0) return;
    
    setTimeout(() => {
      db.get('SELECT id FROM admin_rooms LIMIT 1', [], (err, room) => {
        if (err || !room) return;
        
        db.get('SELECT id FROM employees LIMIT 1', [], (err, employee) => {
          if (err || !employee) return;
          
          db.run(`
            INSERT INTO inspections (deal_id, inspector_id, scheduled_date, notes)
            VALUES (?, ?, ?, ?)
          `, [
            room.id,
            employee.id,
            new Date().toISOString().split('T')[0],
            'Erste Test-Inspektion'
          ]);
        });
      });
    }, 1000); // Kleine Verzögerung, um sicherzustellen, dass die anderen Tabellen gefüllt sind
  });

  // Test-Assignments
  db.get('SELECT COUNT(*) as count FROM assignments', [], (err, row) => {
    if (err || row.count > 0) return;
    
    setTimeout(() => {
      // Hole einen Mitarbeiter und einen Deal für das Test-Assignment
      db.get('SELECT id FROM employees LIMIT 1', [], (err, employee) => {
        if (err || !employee) return;
        
        db.get('SELECT id FROM deals LIMIT 1', [], (err, deal) => {
          if (err || !deal) return;
          
          // Erstelle ein Test-Assignment für heute
          const today = new Date();
          const startTime = new Date(today.setHours(9, 0, 0));
          const endTime = new Date(today.setHours(17, 0, 0));
          
          db.run(`
            INSERT INTO assignments (
              employee_id,
              deal_id,
              start_datetime,
              end_datetime,
              task_type,
              notes
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            employee.id,
            deal.id,
            startTime.toISOString(),
            endTime.toISOString(),
            'moving',
            'Test-Zuweisung'
          ], function(err) {
            if (err) {
              console.error('Error creating test assignment:', err);
            } else {
              console.log('Created test assignment');
            }
          });
        });
      });
    }, 2000); // Warte 2 Sekunden, um sicherzustellen, dass Mitarbeiter und Deals existieren
  });

  // Test-Teams
  db.get('SELECT COUNT(*) as count FROM teams', [], (err, row) => {
    if (err || row.count > 0) return;
    
    // Erstelle Teams-Tabelle, falls sie noch nicht existiert
    db.run(`CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Füge Test-Team ein
    db.run(`
      INSERT INTO teams (name) VALUES (?)
    `, ['Team A'], function(err) {
      if (err) {
        console.error('Error creating test team:', err);
      } else {
        console.log('Created test team');
      }
    });
  });

  // Beispiel-Materialien einfügen
  db.get('SELECT COUNT(*) as count FROM materials', [], (err, row) => {
    if (err || row.count > 0) return;
    
    const defaultMaterials = [
      {
        name: 'Umzugskartons Standard',
        type: 'Verpackung',
        current_stock: 500,
        min_stock: 200,
        order_quantity: 300,
        unit: 'Stück'
      },
      {
        name: 'Luftpolsterfolie',
        type: 'Verpackung',
        current_stock: 1000,
        min_stock: 300,
        order_quantity: 500,
        unit: 'Meter'
      },
      {
        name: 'Klebeband',
        type: 'Verpackung',
        current_stock: 200,
        min_stock: 50,
        order_quantity: 100,
        unit: 'Rollen'
      },
      {
        name: 'Möbeldecken',
        type: 'Schutz',
        current_stock: 150,
        min_stock: 50,
        order_quantity: 50,
        unit: 'Stück'
      }
    ];

    defaultMaterials.forEach(material => {
      db.run(`
        INSERT INTO materials (
          name, type, current_stock, min_stock, order_quantity, unit
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        material.name,
        material.type,
        material.current_stock,
        material.min_stock,
        material.order_quantity,
        material.unit
      ]);
    });
  });
});

// API-Routen
app.get('/moving-assistant/api/vehicles', (req, res) => {
  console.log('GET /moving-assistant/api/vehicles called');
  
  db.all('SELECT * FROM vehicles ORDER BY license_plate', [], (err, rows) => {
    if (err) {
      console.error('Database error when fetching vehicles:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Found vehicles:', rows);
    res.json(rows || []);
  });
});

// Fahrzeug erstellen
app.post('/moving-assistant/api/vehicles', (req, res) => {
  const { license_plate, type, loading_capacity, length, width, height, max_weight, status } = req.body;
  
  db.run(`
    INSERT INTO vehicles (
      license_plate, type, loading_capacity, 
      length, width, height, max_weight, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    license_plate,
    type,
    loading_capacity,
    length,
    width,
    height,
    max_weight,
    status || 'available'
  ], function(err) {
    if (err) {
      console.error('Error creating vehicle:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      id: this.lastID,
      license_plate,
      type,
      loading_capacity,
      length,
      width,
      height,
      max_weight,
      status: status || 'available'
    });
  });
});

// Fahrzeugbuchungen abrufen
app.get('/moving-assistant/api/vehicles/:id/bookings', (req, res) => {
  const vehicleId = req.params.id;
  
  db.all(`
    SELECT * FROM vehicle_bookings 
    WHERE vehicle_id = ? 
    AND end_date >= date('now')
    ORDER BY start_date
  `, [vehicleId], (err, rows) => {
    if (err) {
      console.error('Error fetching vehicle bookings:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Fahrzeugbuchung erstellen
app.post('/moving-assistant/api/vehicles/:id/bookings', (req, res) => {
  const vehicleId = req.params.id;
  const { deal_id, start_date, end_date, volume, weight } = req.body;
  
  db.run(`
    INSERT INTO vehicle_bookings (
      vehicle_id, deal_id, start_date, end_date, volume, weight
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [vehicleId, deal_id, start_date, end_date, volume, weight], function(err) {
    if (err) {
      console.error('Error creating booking:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      vehicle_id: vehicleId,
      deal_id,
      start_date,
      end_date,
      volume,
      weight
    });
  });
});

// Mitarbeiter-API-Routen
app.get('/moving-assistant/api/employees', (req, res) => {
  console.log('GET /moving-assistant/api/employees called');
  
  db.all('SELECT * FROM employees ORDER BY last_name, first_name', [], (err, rows) => {
    if (err) {
      console.error('Database error when fetching employees:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Found employees:', rows);
    res.json(rows || []);
  });
});

app.post('/moving-assistant/api/employees', (req, res) => {
  const { first_name, last_name, email, phone, role } = req.body;
  
  db.run(`
    INSERT INTO employees (
      first_name, last_name, email, phone, role
    ) VALUES (?, ?, ?, ?, ?)
  `, [first_name, last_name, email, phone, role], function(err) {
    if (err) {
      console.error('Error creating employee:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      first_name,
      last_name,
      email,
      phone,
      role
    });
  });
});

app.put('/moving-assistant/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, role } = req.body;
  
  db.run(`
    UPDATE employees 
    SET first_name = ?, last_name = ?, email = ?, phone = ?, role = ?
    WHERE id = ?
  `, [first_name, last_name, email, phone, role, id], function(err) {
    if (err) {
      console.error('Error updating employee:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({
      id,
      first_name,
      last_name,
      email,
      phone,
      role
    });
  });
});

app.delete('/moving-assistant/api/employees/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM employees WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting employee:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(204).send();
  });
});

// Inspektionen-API-Routen
app.get('/moving-assistant/api/inspections', (req, res) => {
  console.log('GET /moving-assistant/api/inspections called');
  
  db.all(`
    SELECT i.*, 
           d.title as deal_title,
           e.first_name || ' ' || e.last_name as inspector_name
    FROM inspections i
    LEFT JOIN deals d ON i.deal_id = d.id
    LEFT JOIN employees e ON i.inspector_id = e.id
    ORDER BY i.scheduled_date DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Database error when fetching inspections:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.post('/moving-assistant/api/inspections', (req, res) => {
  const { deal_id, inspector_id, scheduled_date, notes, status } = req.body;
  
  db.run(`
    INSERT INTO inspections (
      deal_id, inspector_id, scheduled_date, notes, status
    ) VALUES (?, ?, ?, ?, ?)
  `, [deal_id, inspector_id, scheduled_date, notes, status || 'pending'], function(err) {
    if (err) {
      console.error('Error creating inspection:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      deal_id,
      inspector_id,
      scheduled_date,
      notes,
      status: status || 'pending'
    });
  });
});

// Zuweisungen-API-Routen
app.get('/moving-assistant/api/assignments', (req, res) => {
  console.log('Fetching assignments...');
  
  const query = `
    SELECT 
      a.*,
           e.first_name || ' ' || e.last_name as employee_name,
      d.title as deal_title
    FROM assignments a
    LEFT JOIN employees e ON a.employee_id = e.id
    LEFT JOIN deals d ON a.deal_id = d.id
    WHERE a.start_datetime >= date('now')
    ORDER BY a.start_datetime ASC
  `;
  
  console.log('Executing assignments query:', query);
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching assignments:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`Found ${rows.length} assignments`);
    res.json(rows);
  });
});

app.post('/moving-assistant/api/assignments', async (req, res) => {
  const { employee_id, deal_id, start_datetime, end_datetime, task_type = 'moving' } = req.body;

  console.log('Creating assignment:', {
    employee_id,
    deal_id,
    start_datetime,
    end_datetime,
    task_type
  });

  try {
    // Validiere die Pflichtfelder
    if (!employee_id || !deal_id || !start_datetime || !end_datetime) {
      return res.status(400).json({ 
        error: 'Alle Pflichtfelder müssen ausgefüllt sein',
        received: { employee_id, deal_id, start_datetime, end_datetime }
      });
    }

    // Prüfe ob der Mitarbeiter existiert
    const employee = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM employees WHERE id = ?', [employee_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!employee) {
      return res.status(400).json({ error: 'Mitarbeiter nicht gefunden' });
    }

    // Prüfe ob der Deal existiert
    const deal = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM deals WHERE id = ?', [deal_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!deal) {
      return res.status(400).json({ error: 'Umzug nicht gefunden' });
    }

    // Prüfe auf Überschneidungen
    const existingAssignment = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id FROM assignments 
        WHERE employee_id = ? 
        AND (
          (datetime(start_datetime) <= datetime(?) AND datetime(end_datetime) >= datetime(?))
          OR
          (datetime(start_datetime) >= datetime(?) AND datetime(start_datetime) <= datetime(?))
        )
      `, [employee_id, end_datetime, start_datetime, start_datetime, end_datetime], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        error: 'Mitarbeiter ist in diesem Zeitraum bereits zugewiesen' 
      });
    }

    // Erstelle die Zuweisung
    const result = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO assignments (
          employee_id,
          deal_id,
          start_datetime,
          end_datetime,
          task_type,
          status
        ) VALUES (?, ?, datetime(?), datetime(?), ?, 'pending')
      `, [employee_id, deal_id, start_datetime, end_datetime, task_type], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    // Hole die erstellte Zuweisung mit allen Details
    const assignment = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          a.*,
          e.first_name || ' ' || e.last_name as employee_name,
          d.title as deal_title
        FROM assignments a
        LEFT JOIN employees e ON a.employee_id = e.id
        LEFT JOIN deals d ON a.deal_id = d.id
        WHERE a.id = ?
      `, [result.lastID], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    console.log('Assignment created:', assignment);
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync Deals API
app.post('/moving-assistant/api/sync-deals', async (req, res) => {
  const { deals } = req.body;
  console.log('Received deals for sync:', deals);
  
  if (!Array.isArray(deals)) {
    return res.status(400).json({ error: 'Deals must be an array' });
  }

  try {
    // Beginne eine Transaktion
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Aktualisiere oder füge jeden Deal ein
    for (const deal of deals) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO deals (
            id, title, org_name, move_date, 
            origin_address, destination_address, 
            value, currency, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          deal.id,
          deal.title,
          deal.org_name,
          deal['949696aa9d99044db90383a758a74675587ed893'], // move_date
          deal['07c3da8804f7b96210e45474fba35b8691211ddd'], // origin_address
          deal['9cb4de1018ec8404feeaaaf7ee9b293c78c44281'], // destination_address
          deal.value,
          deal.currency
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Commit die Transaktion
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ 
      success: true, 
      message: `Successfully synchronized ${deals.length} deals` 
    });

  } catch (error) {
    // Rollback bei Fehler
    await new Promise((resolve) => {
      db.run('ROLLBACK', resolve);
    });

    console.error('Error syncing deals:', error);
    res.status(500).json({ 
      error: 'Failed to sync deals', 
      details: error.message 
    });
  }
});

// Ersetze die bestehende /api/deals Route mit dieser Version:
app.get('/moving-assistant/api/deals', (req, res) => {
  console.log('Fetching future deals from database...');
  
  const query = `
    SELECT 
      id,
      title,
      org_name,
      move_date,
      origin_address,
      destination_address,
      value,
      currency,
      created_at,
      updated_at
    FROM deals 
    WHERE move_date >= date('now')
    ORDER BY move_date ASC
  `;
  
  console.log('Executing query:', query);
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching deals from database:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Raw deals from database:', rows);
    
    const processedRows = rows.map(row => {
      // Ensure move_date is in YYYY-MM-DD format
      const moveDate = new Date(row.move_date);
      return {
        ...row,
        move_date: moveDate.toISOString().split('T')[0],
        value: parseFloat(row.value || 0),
        created_at: new Date(row.created_at).toISOString(),
        updated_at: new Date(row.updated_at).toISOString()
      };
    });
    
    console.log('Sending processed deals to client:', processedRows);
    res.json(processedRows);
  });
});

// Debug-Endpunkt für direkte Datenbankinspektion
app.get('/moving-assistant/api/debug/deals', (req, res) => {
  db.all(`
    SELECT 
      'Alle Deals' as info, 
      COUNT(*) as count 
    FROM deals
    UNION ALL
    SELECT 
      'Zukünftige Deals' as info, 
      COUNT(*) as count 
    FROM deals 
    WHERE move_date >= date('now')
    UNION ALL
    SELECT 
      'Deals pro Monat' as info,
      COUNT(*) || ' Deals im ' || strftime('%m-%Y', move_date) as count
    FROM deals 
    WHERE move_date >= date('now')
    GROUP BY strftime('%Y-%m', move_date)
    ORDER BY move_date
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Teams API-Route
app.get('/moving-assistant/api/teams', (req, res) => {
  db.all('SELECT * FROM teams', [], (err, rows) => {
    if (err) {
      console.error('Error fetching teams:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// API-Routen für das Materialwirtschaftssystem

// Alle Materialien abrufen
app.get('/moving-assistant/api/materials', (req, res) => {
  db.all(`
    SELECT 
      m.*,
      (SELECT COUNT(*) FROM material_movements 
       WHERE material_id = m.id AND movement_type = 'out'
       AND created_at >= date('now', '-30 days')) as monthly_usage
    FROM materials m
    ORDER BY 
      CASE WHEN current_stock <= min_stock THEN 0 ELSE 1 END,
      name
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching materials:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Material einem Umzug zuweisen
app.post('/moving-assistant/api/deals/:dealId/materials', (req, res) => {
  const { dealId } = req.params;
  const { materialId, plannedQuantity } = req.body;

  db.run(`
    INSERT INTO deal_materials (
      deal_id, material_id, planned_quantity, status
    ) VALUES (?, ?, ?, 'planned')
  `, [dealId, materialId, plannedQuantity], function(err) {
    if (err) {
      console.error('Error assigning material to deal:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      deal_id: dealId,
      material_id: materialId,
      planned_quantity: plannedQuantity,
      status: 'planned'
    });
  });
});

// Materialverbrauch für einen Umzug erfassen
app.post('/moving-assistant/api/deals/:dealId/materials/:materialId/usage', (req, res) => {
  const { dealId, materialId } = req.params;
  const { actualQuantity } = req.body;

  db.serialize(() => {
    // Beginne Transaktion
    db.run('BEGIN TRANSACTION');

    // Aktualisiere den tatsächlichen Verbrauch
    db.run(`
      UPDATE deal_materials 
      SET actual_quantity = ?, status = 'used', updated_at = CURRENT_TIMESTAMP
      WHERE deal_id = ? AND material_id = ?
    `, [actualQuantity, dealId, materialId]);

    // Erstelle Warenbewegung
    db.run(`
      INSERT INTO material_movements (
        material_id, movement_type, quantity, deal_id
      ) VALUES (?, 'out', ?, ?)
    `, [materialId, actualQuantity, dealId]);

    // Aktualisiere Materialbestand
    db.run(`
      UPDATE materials 
      SET current_stock = current_stock - ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [actualQuantity, materialId]);

    // Commit Transaktion
    db.run('COMMIT', err => {
      if (err) {
        console.error('Error recording material usage:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  });
});

// Materialstatistiken abrufen
app.get('/moving-assistant/api/materials/statistics', (req, res) => {
  db.all(`
    SELECT 
      m.name,
      m.current_stock,
      COUNT(DISTINCT mm.deal_id) as number_of_moves,
      SUM(CASE WHEN mm.movement_type = 'out' THEN mm.quantity ELSE 0 END) as total_usage,
      AVG(CASE WHEN mm.movement_type = 'out' THEN mm.quantity ELSE NULL END) as avg_usage_per_move
    FROM materials m
    LEFT JOIN material_movements mm ON m.id = mm.material_id
    WHERE mm.created_at >= date('now', '-30 days')
    GROUP BY m.id
    ORDER BY total_usage DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching material statistics:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Material erstellen
app.post('/moving-assistant/api/materials', (req, res) => {
  const { name, type, current_stock, min_stock, order_quantity, unit } = req.body;
  
  db.run(`
    INSERT INTO materials (
      name, type, current_stock, min_stock, order_quantity, unit
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [
    name,
    type,
    current_stock,
    min_stock,
    order_quantity,
    unit
  ], function(err) {
    if (err) {
      console.error('Error creating material:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      name,
      type,
      current_stock,
      min_stock,
      order_quantity,
      unit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });
});

// Material aktualisieren
app.patch('/moving-assistant/api/materials/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updateFields = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = [...Object.values(updates), id];

  db.run(
    `UPDATE materials SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Material nicht gefunden' });
      }
      res.json({ id, ...updates });
    }
  );
});

// Material löschen
app.delete('/moving-assistant/api/materials/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM materials WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Material nicht gefunden' });
    }
    res.json({ message: 'Material erfolgreich gelöscht' });
  });
});

// Materialbestand aktualisieren
app.post('/moving-assistant/api/materials/:id/stock', (req, res) => {
  const { id } = req.params;
  const { quantity, movement_type, notes } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Aktualisiere den Materialbestand
    db.run(`
      UPDATE materials 
      SET current_stock = current_stock ${movement_type === 'in' ? '+' : '-'} ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [quantity, id]);

    // Erstelle einen Bewegungseintrag
    db.run(`
      INSERT INTO material_movements (
        material_id, movement_type, quantity, notes
      ) VALUES (?, ?, ?, ?)
    `, [id, movement_type, quantity, notes]);

    db.run('COMMIT', err => {
      if (err) {
        console.error('Error updating stock:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  });
});

// Materialzuweisungen für einen Umzug abrufen
app.get('/moving-assistant/api/deals/:dealId/materials', (req, res) => {
  const { dealId } = req.params;

  db.all(`
    SELECT 
      dm.*,
      m.name as material_name,
      m.type as material_type,
      m.unit
    FROM deal_materials dm
    LEFT JOIN materials m ON dm.material_id = m.id
    WHERE dm.deal_id = ?
    ORDER BY dm.created_at DESC
  `, [dealId], (err, rows) => {
    if (err) {
      console.error('Error fetching deal materials:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Materialzuweisung für einen Umzug aktualisieren
app.put('/moving-assistant/api/deals/:dealId/materials/:materialId', (req, res) => {
  const { dealId, materialId } = req.params;
  const { planned_quantity, actual_quantity, status } = req.body;

  db.run(`
    UPDATE deal_materials 
    SET 
      planned_quantity = COALESCE(?, planned_quantity),
      actual_quantity = COALESCE(?, actual_quantity),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE deal_id = ? AND material_id = ?
  `, [planned_quantity, actual_quantity, status, dealId, materialId], function(err) {
    if (err) {
      console.error('Error updating deal material:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Materialzuweisung nicht gefunden' });
    }
    res.json({ success: true });
  });
});

// Materialzuweisung für einen Umzug löschen
app.delete('/moving-assistant/api/deals/:dealId/materials/:materialId', (req, res) => {
  const { dealId, materialId } = req.params;

  db.run(`
    DELETE FROM deal_materials 
    WHERE deal_id = ? AND material_id = ?
  `, [dealId, materialId], function(err) {
    if (err) {
      console.error('Error deleting deal material:', err);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Materialzuweisung nicht gefunden' });
    }
    res.json({ success: true });
  });
});

// Routen einbinden
app.use('/moving-assistant/api/vehicles', vehicleRoutes);
app.use('/moving-assistant/api/employees', employeeRoutes);
app.use('/moving-assistant/api/moves', moveRoutes);

// Server starten
const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database location: ${path.join(__dirname, 'recognition.db')}`);
});