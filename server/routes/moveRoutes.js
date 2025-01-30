const express = require('express');
const router = express.Router();
const db = require('../db');

// Test-Daten einfügen
router.get('/init-test-data', async (req, res) => {
  try {
    // Erst prüfen ob schon Daten existieren
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM move_executions', [], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    if (existing === 0) {
      // Füge Test-Deal ein falls nötig
      await new Promise((resolve, reject) => {
        db.run(`INSERT INTO deals (
          id, title, origin_address, destination_address, move_date
        ) VALUES (
          1, 
          'Test Umzug', 
          'Teststraße 1, Berlin', 
          'Neustraße 2, Berlin',
          date('now')
        )`, [], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Füge Test-Umzug ein
      await new Promise((resolve, reject) => {
        db.run(`INSERT INTO move_executions (
          deal_id, status, start_time
        ) VALUES (
          1,
          'pending',
          datetime('now')
        )`, [], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    res.json({ message: 'Test data initialized' });
  } catch (error) {
    console.error('Error initializing test data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Aktive Umzüge abrufen
router.get('/active', async (req, res) => {
  try {
    const moves = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          m.*,
          d.id as deal_id,
          d.title,
          d.origin_address,
          d.destination_address,
          d.move_date
        FROM move_executions m
        RIGHT JOIN deals d ON m.deal_id = d.id
        WHERE (
          m.status IN ('pending', 'in_progress', 'paused')
          OR m.id IS NULL
        )
        AND date(d.move_date) BETWEEN date('now') 
        AND date('now', '+7 days')
        ORDER BY d.move_date ASC
      `, [], (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
    
    res.json(moves);
  } catch (error) {
    console.error('Error fetching active moves:', error);
    res.status(500).json({ error: error.message });
  }
});

// Umzug starten
router.post('/:dealId/start', async (req, res) => {
  const { dealId } = req.params;
  const { team } = req.body;

  try {
    await db.run('BEGIN TRANSACTION');

    // Erstelle Umzugsdurchführung
    const execution = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO move_executions (deal_id, status, start_time)
        VALUES (?, 'in_progress', CURRENT_TIMESTAMP)
      `, [dealId], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Erstelle Zeiterfassungen für Team
    const timeRecordStmt = db.prepare(`
      INSERT INTO time_records (execution_id, employee_id, start_time)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

    for (const employeeId of team) {
      await new Promise((resolve, reject) => {
        timeRecordStmt.run([execution, employeeId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    timeRecordStmt.finalize();
    await db.run('COMMIT');

    res.json({ id: execution, status: 'in_progress' });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error starting move:', error);
    res.status(500).json({ error: error.message });
  }
});

// Umzug pausieren/fortsetzen
router.post('/:executionId/toggle-pause', async (req, res) => {
  const { executionId } = req.params;
  const { action } = req.body; // 'pause' oder 'resume'

  try {
    await db.run('BEGIN TRANSACTION');

    const newStatus = action === 'pause' ? 'paused' : 'in_progress';
    
    // Update Umzugsstatus
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE move_executions 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newStatus, executionId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Update Zeiterfassungen
    if (action === 'pause') {
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE time_records 
          SET break_start = CURRENT_TIMESTAMP
          WHERE execution_id = ? AND end_time IS NULL
        `, [executionId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } else {
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE time_records 
          SET break_end = CURRENT_TIMESTAMP
          WHERE execution_id = ? AND break_start IS NOT NULL AND break_end IS NULL
        `, [executionId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    await db.run('COMMIT');
    res.json({ status: newStatus });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error toggling move pause:', error);
    res.status(500).json({ error: error.message });
  }
});

// Zeiterfassung abrufen
router.get('/:executionId/time-records', async (req, res) => {
  try {
    const records = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          t.*,
          e.first_name || ' ' || e.last_name as employee_name
        FROM time_records t
        JOIN employees e ON t.employee_id = e.id
        WHERE t.execution_id = ?
        ORDER BY t.start_time DESC
      `, [req.params.executionId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching time records:', error);
    res.status(500).json({ error: error.message });
  }
});

// Umzug abschließen
router.post('/:executionId/complete', async (req, res) => {
  const { executionId } = req.params;
  const { materialUsage, notes } = req.body;

  try {
    await db.run('BEGIN TRANSACTION');

    // Update Umzugsstatus
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE move_executions 
        SET status = 'completed', 
            end_time = CURRENT_TIMESTAMP,
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [notes, executionId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Beende Zeiterfassungen
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE time_records 
        SET end_time = CURRENT_TIMESTAMP
        WHERE execution_id = ? AND end_time IS NULL
      `, [executionId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Erfasse Materialverbrauch
    const materialStmt = db.prepare(`
      INSERT INTO move_material_usage (execution_id, material_id, quantity)
      VALUES (?, ?, ?)
    `);

    for (const { materialId, quantity } of materialUsage) {
      await new Promise((resolve, reject) => {
        materialStmt.run([executionId, materialId, quantity], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Aktualisiere Materialbestand
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE materials
          SET current_stock = current_stock - ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [quantity, materialId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    materialStmt.finalize();
    await db.run('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error completing move:', error);
    res.status(500).json({ error: error.message });
  }
});

// Team eines Umzugs abrufen
router.get('/:executionId/team', async (req, res) => {
  try {
    const team = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          e.*,
          tr.start_time,
          tr.end_time,
          tr.break_start,
          tr.break_end
        FROM time_records tr
        JOIN employees e ON tr.employee_id = e.id
        WHERE tr.execution_id = ?
        ORDER BY e.first_name, e.last_name
      `, [req.params.executionId], (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
    
    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: error.message });
  }
});

// Team aktualisieren
router.put('/:executionId/team', async (req, res) => {
  const { executionId } = req.params;
  const { team } = req.body;

  try {
    await db.run('BEGIN TRANSACTION');

    // Lösche bestehende Zeiterfassungen
    await new Promise((resolve, reject) => {
      db.run(`
        DELETE FROM time_records 
        WHERE execution_id = ? AND end_time IS NULL
      `, [executionId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Erstelle neue Zeiterfassungen für Team
    const timeRecordStmt = db.prepare(`
      INSERT INTO time_records (execution_id, employee_id, start_time)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

    for (const employeeId of team) {
      await new Promise((resolve, reject) => {
        timeRecordStmt.run([executionId, employeeId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    timeRecordStmt.finalize();
    await db.run('COMMIT');

    // Hole aktualisiertes Team
    const updatedTeam = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          e.*,
          tr.start_time,
          tr.end_time,
          tr.break_start,
          tr.break_end
        FROM time_records tr
        JOIN employees e ON tr.employee_id = e.id
        WHERE tr.execution_id = ?
        ORDER BY e.first_name, e.last_name
      `, [executionId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json(updatedTeam);
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('Error updating team:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug-Endpunkt
router.get('/debug-dates', async (req, res) => {
  try {
    const dates = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id,
          title,
          move_date,
          date('now') as today,
          date('now', '+7 days') as next_week,
          CASE 
            WHEN date(move_date) BETWEEN date('now') AND date('now', '+7 days')
            THEN 'yes' 
            ELSE 'no' 
          END as in_range
        FROM deals
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 