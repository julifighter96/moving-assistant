const express = require('express');
const router = express.Router();
const db = require('../db');

// Alle Mitarbeiter abrufen
router.get('/', async (req, res) => {
  try {
    const employees = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM employees 
        WHERE status = 'active'
        ORDER BY first_name, last_name
      `, [], (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
    
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
});

// Einzelnen Mitarbeiter abrufen
router.get('/:id', async (req, res) => {
  try {
    const employee = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          id,
          first_name,
          last_name,
          email,
          phone,
          role,
          status
        FROM employees 
        WHERE id = ?
      `, [req.params.id], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else if (!row) {
          reject(new Error('Mitarbeiter nicht gefunden'));
        } else {
          // Füge leere Werte für die fehlenden Felder hinzu
          resolve({
            ...row,
            address: null,
            birth_date: null,
            hire_date: null
          });
        }
      });
    });
    
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(404).json({ error: error.message });
  }
});

// Mitarbeiter aktualisieren
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    firstName, 
    lastName, 
    email, 
    phone,
    status 
  } = req.body;

  try {
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE employees 
        SET 
          first_name = ?,
          last_name = ?,
          email = ?,
          phone = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        firstName,
        lastName,
        email,
        phone,
        status,
        id
      ], function(err) {
        if (err) reject(err);
        else if (this.changes === 0) reject(new Error('Mitarbeiter nicht gefunden'));
        else resolve();
      });
    });

    const updatedEmployee = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM employees WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else if (!row) reject(new Error('Mitarbeiter nicht gefunden'));
        else {
          // Füge leere Werte für die fehlenden Felder hinzu
          resolve({
            ...row,
            address: null,
            birth_date: null,
            hire_date: null
          });
        }
      });
    });

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(error.message.includes('nicht gefunden') ? 404 : 500)
      .json({ error: error.message });
  }
});

module.exports = router; 