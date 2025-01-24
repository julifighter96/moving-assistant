const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { authenticateToken } = require('../middleware/auth');

// Alle Fahrzeuge abrufen
router.get('/', authenticateToken, async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Einzelnes Fahrzeug abrufen
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Fahrzeug nicht gefunden' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verfügbarkeit prüfen
router.post('/check-availability', authenticateToken, async (req, res) => {
  const { startDate, endDate, volume, weight } = req.body;
  
  try {
    const availableVehicles = await Vehicle.find({
      'bookings': {
        $not: {
          $elemMatch: {
            $or: [
              {
                startDate: { $lte: new Date(endDate) },
                endDate: { $gte: new Date(startDate) }
              }
            ]
          }
        }
      },
      'loadingCapacity': { $gte: volume },
      'maxWeight': { $gte: weight },
      'status': 'available'
    });
    
    res.json(availableVehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fahrzeug buchen
router.post('/:id/book', authenticateToken, async (req, res) => {
  const { dealId, startDate, endDate, volume, weight } = req.body;
  
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    // Prüfen ob Fahrzeug verfügbar ist
    const hasConflict = vehicle.bookings.some(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      const requestStart = new Date(startDate);
      const requestEnd = new Date(endDate);
      
      return (requestStart <= bookingEnd && requestEnd >= bookingStart);
    });
    
    if (hasConflict) {
      return res.status(400).json({ message: 'Fahrzeug ist im gewünschten Zeitraum bereits gebucht' });
    }
    
    // Kapazitätsprüfung
    if (volume > vehicle.loadingCapacity) {
      return res.status(400).json({ message: 'Umzugsvolumen übersteigt Fahrzeugkapazität' });
    }
    
    if (weight > vehicle.maxWeight) {
      return res.status(400).json({ message: 'Gewicht übersteigt zulässiges Gesamtgewicht' });
    }
    
    vehicle.bookings.push({
      dealId,
      startDate,
      endDate,
      volume,
      weight
    });
    
    await vehicle.save();
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fahrzeug erstellen
router.post('/', authenticateToken, async (req, res) => {
  const vehicle = new Vehicle(req.body);
  try {
    const newVehicle = await vehicle.save();
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Fahrzeug aktualisieren
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Fahrzeug nicht gefunden' });
    }
    
    Object.assign(vehicle, req.body);
    const updatedVehicle = await vehicle.save();
    res.json(updatedVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Fahrzeug löschen
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Fahrzeug nicht gefunden' });
    }
    
    await vehicle.remove();
    res.json({ message: 'Fahrzeug gelöscht' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 