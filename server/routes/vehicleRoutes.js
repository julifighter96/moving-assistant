const express = require('express');
const router = express.Router();
const db = require('../db');

// Alle Fahrzeuge abrufen
router.get('/', (req, res) => {
  db.all('SELECT * FROM vehicles ORDER BY license_plate', [], (err, rows) => {
    if (err) {
      console.error('Database error when fetching vehicles:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Einzelnes Fahrzeug abrufen
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM vehicles WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: 'Fahrzeug nicht gefunden' });
    }
    res.json(row);
  });
});

// Fahrzeug erstellen
router.post('/', (req, res) => {
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

// Fahrzeug buchen
router.post('/:id/book', (req, res) => {
  const { deal_id, start_date, end_date, volume, weight } = req.body;
  const vehicle_id = req.params.id;
  
  db.serialize(() => {
    // Prüfe ob Fahrzeug verfügbar ist
    db.get(`
      SELECT * FROM vehicle_bookings 
      WHERE vehicle_id = ? 
      AND (
        (start_date <= ? AND end_date >= ?) OR
        (start_date <= ? AND end_date >= ?)
      )
    `, [vehicle_id, end_date, start_date, end_date, start_date], (err, booking) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (booking) {
        return res.status(400).json({ message: 'Fahrzeug ist im gewünschten Zeitraum bereits gebucht' });
      }
      
      // Prüfe Kapazität
      db.get('SELECT * FROM vehicles WHERE id = ?', [vehicle_id], (err, vehicle) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (volume > vehicle.loading_capacity) {
          return res.status(400).json({ message: 'Umzugsvolumen übersteigt Fahrzeugkapazität' });
        }
        
        if (weight > vehicle.max_weight) {
          return res.status(400).json({ message: 'Gewicht übersteigt zulässiges Gesamtgewicht' });
        }
        
        // Erstelle Buchung
        db.run(`
          INSERT INTO vehicle_bookings (
            vehicle_id, deal_id, start_date, end_date, volume, weight
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [vehicle_id, deal_id, start_date, end_date, volume, weight], function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.status(201).json({
            id: this.lastID,
            vehicle_id,
            deal_id,
            start_date,
            end_date,
            volume,
            weight
          });
        });
      });
    });
  });
});

// Fahrzeug aktualisieren
router.patch('/:id', (req, res) => {
  const updates = req.body;
  const updateFields = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = [...Object.values(updates), req.params.id];

  db.run(
    `UPDATE vehicles SET ${updateFields} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Fahrzeug nicht gefunden' });
      }
      res.json({ id: req.params.id, ...updates });
    }
  );
});

// Fahrzeug löschen
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM vehicles WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Fahrzeug nicht gefunden' });
    }
    res.json({ message: 'Fahrzeug gelöscht' });
  });
});

// POST /api/vehicles/bookings
router.post('/bookings', async (req, res) => {
  const { vehicle_id, deal_id, start_date, end_date } = req.body;
  
  console.log('Received booking request:', {
    vehicle_id,
    deal_id,
    start_date,
    end_date
  });

  try {
    // Prüfe ob das Fahrzeug existiert
    const vehicle = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM vehicles WHERE id = ?', [vehicle_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!vehicle) {
      console.log('Vehicle not found:', vehicle_id);
      return res.status(400).json({ error: 'Fahrzeug nicht gefunden' });
    }

    // Prüfe ob der Deal existiert
    const deal = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM deals WHERE id = ?', [deal_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!deal) {
      console.log('Deal not found:', deal_id);
      return res.status(400).json({ error: 'Umzug nicht gefunden' });
    }

    // Prüfe auf bestehende Buchungen mit überlappenden Zeiträumen
    const existingBooking = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id 
        FROM vehicle_bookings 
        WHERE vehicle_id = ? 
        AND (
          (date(start_date) <= date(?) AND date(end_date) >= date(?))
          OR
          (date(start_date) >= date(?) AND date(start_date) <= date(?))
        )
      `, [vehicle_id, end_date, start_date, end_date, start_date], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingBooking) {
      console.log('Existing booking found:', existingBooking);
      return res.status(400).json({ 
        error: 'Fahrzeug ist an diesem Tag bereits gebucht' 
      });
    }

    // Füge neue Buchung hinzu
    const result = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO vehicle_bookings (
          vehicle_id, 
          deal_id, 
          start_date, 
          end_date
        ) VALUES (?, ?, date(?), date(?))
      `, [vehicle_id, deal_id, start_date, end_date], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    console.log('Booking created:', result);

    // Hole aktualisierte Buchungen
    const bookings = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          vb.*,
          v.license_plate,
          v.type as vehicle_type,
          d.title as deal_title
        FROM vehicle_bookings vb
        LEFT JOIN vehicles v ON v.id = vb.vehicle_id
        LEFT JOIN deals d ON d.id = vb.deal_id
        WHERE vb.vehicle_id = ?
        ORDER BY vb.start_date ASC
      `, [vehicle_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('Returning updated bookings:', bookings);
    res.json(bookings);
  } catch (error) {
    console.error('Error creating vehicle booking:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/vehicles/bookings/:id
router.delete('/bookings/:id', async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM vehicle_bookings WHERE id = ?', 
        [req.params.id], (err) => {
          if (err) reject(err);
          else resolve();
      });
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle booking:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vehicles/:id/bookings
router.get('/:id/bookings', async (req, res) => {
  try {
    const bookings = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          vb.*,
          v.license_plate,
          v.type as vehicle_type,
          d.title as deal_title
        FROM vehicle_bookings vb
        LEFT JOIN vehicles v ON v.id = vb.vehicle_id
        LEFT JOIN deals d ON d.id = vb.deal_id
        WHERE vb.vehicle_id = ?
        ORDER BY vb.start_date ASC
      `, [req.params.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching vehicle bookings:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 