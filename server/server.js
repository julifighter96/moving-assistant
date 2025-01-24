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

const db = new sqlite3.Database(path.join(__dirname, 'recognition.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Tabellen erstellen
db.serialize(() => {
  // 1. Basis-Tabellen zuerst
  console.log('Creating base tables...');
  
  // Admin Rooms Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS admin_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

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
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
  )`);

  // 2. Abhängige Tabellen
  console.log('Creating dependent tables...');

  // Inspektionen-Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    inspector_id INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    notes TEXT,
    status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES admin_rooms(id),
    FOREIGN KEY(inspector_id) REFERENCES employees(id)
  )`);

  // Zuweisungen-Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    date DATE NOT NULL,
    task_type TEXT NOT NULL,
    notes TEXT,
    status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES employees(id),
    FOREIGN KEY(room_id) REFERENCES admin_rooms(id)
  )`);

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
            INSERT INTO inspections (room_id, inspector_id, scheduled_date, notes)
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
           r.name as room_name,
           e.first_name || ' ' || e.last_name as inspector_name
    FROM inspections i
    LEFT JOIN admin_rooms r ON i.room_id = r.id
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
  const { room_id, inspector_id, scheduled_date, notes, status } = req.body;
  
  db.run(`
    INSERT INTO inspections (
      room_id, inspector_id, scheduled_date, notes, status
    ) VALUES (?, ?, ?, ?, ?)
  `, [room_id, inspector_id, scheduled_date, notes, status || 'pending'], function(err) {
    if (err) {
      console.error('Error creating inspection:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      room_id,
      inspector_id,
      scheduled_date,
      notes,
      status: status || 'pending'
    });
  });
});

// Zuweisungen-API-Routen
app.get('/moving-assistant/api/assignments', (req, res) => {
  console.log('GET /moving-assistant/api/assignments called');
  
  db.all(`
    SELECT a.*,
           e.first_name || ' ' || e.last_name as employee_name,
           r.name as room_name
    FROM assignments a
    LEFT JOIN employees e ON a.employee_id = e.id
    LEFT JOIN admin_rooms r ON a.room_id = r.id
    ORDER BY a.date DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Database error when fetching assignments:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.post('/moving-assistant/api/assignments', (req, res) => {
  const { employee_id, room_id, date, task_type, notes } = req.body;
  
  db.run(`
    INSERT INTO assignments (
      employee_id, room_id, date, task_type, notes
    ) VALUES (?, ?, ?, ?, ?)
  `, [employee_id, room_id, date, task_type, notes], function(err) {
    if (err) {
      console.error('Error creating assignment:', err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      employee_id,
      room_id,
      date,
      task_type,
      notes
    });
  });
});

// Server starten
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database location: ${path.join(__dirname, 'recognition.db')}`);
});