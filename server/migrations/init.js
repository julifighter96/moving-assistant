const db = require('../db');

console.log('Führe Migrationen aus...');

// Umzugsdurchführungen
db.serialize(() => {
  // Lösche existierende Tabellen in der richtigen Reihenfolge
  db.run('DROP TABLE IF EXISTS move_material_usage');
  db.run('DROP TABLE IF EXISTS time_records');
  db.run('DROP TABLE IF EXISTS move_executions');
  db.run('DROP TABLE IF EXISTS employees');

  // Erstelle employees Tabelle neu
  db.run(`
    CREATE TABLE employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      birth_date DATE,
      hire_date DATE,
      role TEXT CHECK(role IN ('mover', 'driver', 'team_lead', 'admin')) NOT NULL,
      status TEXT CHECK(status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Füge Testdaten wieder ein
  db.run(`
    INSERT INTO employees (first_name, last_name, email, role, status)
    VALUES 
      ('Max', 'Mustermann', 'max@example.com', 'team_lead', 'active'),
      ('Anna', 'Schmidt', 'anna@example.com', 'driver', 'active'),
      ('Tom', 'Weber', 'tom@example.com', 'mover', 'active')
  `);

  // Erstelle die Umzugsdurchführungs-Tabellen
  db.run(`
    CREATE TABLE IF NOT EXISTS move_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending', 'in_progress', 'paused', 'completed')) NOT NULL DEFAULT 'pending',
      start_time DATETIME,
      end_time DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES deals(id)
    )
  `, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen der move_executions Tabelle:', err);
    } else {
      console.log('move_executions Tabelle erstellt/existiert');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS time_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      execution_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      break_start DATETIME,
      break_end DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (execution_id) REFERENCES move_executions(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen der time_records Tabelle:', err);
    } else {
      console.log('time_records Tabelle erstellt/existiert');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS move_material_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      execution_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (execution_id) REFERENCES move_executions(id),
      FOREIGN KEY (material_id) REFERENCES materials(id)
    )
  `, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen der move_material_usage Tabelle:', err);
    } else {
      console.log('move_material_usage Tabelle erstellt/existiert');
    }
  });
}); 