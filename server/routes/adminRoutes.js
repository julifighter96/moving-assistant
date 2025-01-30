console.log('Loading adminRoutes...');

const express = require('express');
const router = express.Router();
const db = require('../db');
const INITIAL_ROOMS_AND_ITEMS = require('../initialData');

console.log('Initial rooms and items:', INITIAL_ROOMS_AND_ITEMS);

// Initialize admin_rooms table
db.serialize(() => {
  console.log('Starting admin_rooms table initialization...');
  
  // Create admin_rooms table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS admin_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    items TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating admin_rooms table:', err);
      return;
    }
    console.log('admin_rooms table created or already exists');

    // Check if admin_rooms table is empty
    db.get('SELECT COUNT(*) as count FROM admin_rooms', [], (err, row) => {
      if (err) {
        console.error('Error checking admin_rooms count:', err);
        return;
      }

      console.log('Current admin_rooms count:', row.count);

      if (row.count === 0) {
        console.log('Initializing admin_rooms with default data...');
        
        // Insert default rooms
        const stmt = db.prepare(
          'INSERT INTO admin_rooms (name, items) VALUES (?, ?)'
        );

        INITIAL_ROOMS_AND_ITEMS.rooms.forEach(room => {
          console.log('Inserting room:', room.name);
          const itemsJson = JSON.stringify(room.items || []);
          stmt.run([room.name, itemsJson], (err) => {
            if (err) console.error('Error inserting room:', room.name, err);
            else console.log('Successfully inserted room:', room.name);
          });
        });

        stmt.finalize(() => {
          console.log('All rooms inserted');
          // Verify the insertion
          db.all('SELECT * FROM admin_rooms', [], (err, rows) => {
            if (err) console.error('Error verifying rooms:', err);
            else console.log('All rooms in database:', rows);
          });
        });
      }
    });
  });
});

// GET /api/admin/rooms
router.get('/rooms', async (req, res) => {
  console.log('GET /api/admin/rooms called');
  try {
    const rooms = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM admin_rooms ORDER BY name', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log('Rooms from database:', rooms);
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/rooms (single room)
router.post('/rooms', (req, res) => {
  console.log('POST /api/admin/rooms (single) called with:', req.body);
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Room name is required' });
  }

  db.run(
    'INSERT INTO admin_rooms (name, items) VALUES (?, ?)',
    [name, '[]'],
    function(err) {
      if (err) {
        console.error('Error creating room:', err);
        return res.status(500).json({ error: err.message });
      }

      const newRoom = {
        id: this.lastID,
        name,
        items: []
      };

      console.log('Created new room:', newRoom);
      res.status(201).json(newRoom);
    }
  );
});

// POST /api/admin/rooms (bulk update - rename to make distinction clear)
router.post('/rooms/bulk', (req, res) => {
  console.log('POST /api/admin/rooms/bulk called');
  console.log('Request body:', req.body);
  
  const { rooms } = req.body;
  
  if (!Array.isArray(rooms)) {
    console.error('Invalid rooms data received:', rooms);
    return res.status(400).json({ error: 'Invalid rooms data' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    try {
      console.log('Starting transaction');
      
      // Clear existing rooms
      db.run('DELETE FROM admin_rooms', [], (err) => {
        if (err) {
          console.error('Error clearing rooms:', err);
          throw err;
        }
        
        console.log('Existing rooms cleared');
        
        // Insert new rooms
        rooms.forEach((room, index) => {
          console.log(`Processing room ${index + 1}/${rooms.length}:`, room);
          
          const itemsJson = JSON.stringify(room.items || []);
          db.run(
            'INSERT INTO admin_rooms (name, items) VALUES (?, ?)',
            [room.name, itemsJson],
            function(err) {
              if (err) {
                console.error(`Error inserting room ${room.name}:`, err);
                throw err;
              }
              console.log(`Room ${room.name} inserted with ID:`, this.lastID);
            }
          );
        });

        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err);
            throw err;
          }
          console.log('Transaction committed successfully');
          res.json({ success: true, rooms });
        });
      });
    } catch (error) {
      console.error('Error in transaction:', error);
      db.run('ROLLBACK');
      res.status(500).json({ error: error.message });
    }
  });
});

// GET /api/admin/prices
router.get('/prices', (req, res) => {
  console.log('GET /api/admin/prices called');
  
  db.all('SELECT * FROM prices ORDER BY id', [], (err, rows) => {
    if (err) {
      console.error('Database error when fetching prices:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Found prices:', rows);
    res.json(rows || []);
  });
});

// PUT /api/admin/prices/:id
router.put('/prices/:id', (req, res) => {
  console.log('PUT /api/admin/prices/:id called');
  const { id } = req.params;
  const { price } = req.body;

  if (typeof price !== 'number') {
    return res.status(400).json({ error: 'Price must be a number' });
  }

  db.run(
    'UPDATE prices SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [price, id],
    function(err) {
      if (err) {
        console.error('Error updating price:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Price not found' });
      }
      
      res.json({ id, price });
    }
  );
});

// Make sure the items table exists
db.serialize(() => {
  console.log('Starting items table initialization...');
  
  // Create items table
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    room TEXT NOT NULL,
    volume REAL DEFAULT 0,
    width REAL DEFAULT 0,
    length REAL DEFAULT 0,
    height REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating items table:', err);
      return;
    }
    console.log('Items table created or already exists');

    // Check if items table is empty
    db.get('SELECT COUNT(*) as count FROM items', [], (err, row) => {
      if (err) {
        console.error('Error checking items count:', err);
        return;
      }

      console.log('Current items count:', row.count);

      if (row.count === 0) {
        console.log('Initializing items table with default data...');
        console.log('INITIAL_ROOMS_AND_ITEMS:', INITIAL_ROOMS_AND_ITEMS);
        
        // Convert the INITIAL_ROOMS_AND_ITEMS data to flat items array
        const items = INITIAL_ROOMS_AND_ITEMS.rooms.flatMap(room => {
          console.log('Processing room:', room.name);
          return room.items.map(item => {
            console.log('Processing item:', item.name, 'for room:', room.name);
            return {
              ...item,
              room: room.name
            };
          });
        });

        console.log('Flattened items:', items);

        // Insert items
        const stmt = db.prepare(`
          INSERT INTO items (name, room, volume, width, length, height)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        items.forEach(item => {
          console.log('Inserting item:', item);
          stmt.run([
            item.name,
            item.room,
            item.volume || 0,
            item.width || 0,
            item.length || 0,
            item.height || 0
          ], (err) => {
            if (err) console.error('Error inserting item:', item, err);
            else console.log('Successfully inserted item:', item.name);
          });
        });

        stmt.finalize(() => {
          console.log('All items inserted');
          // Verify the insertion
          db.all('SELECT * FROM items', [], (err, rows) => {
            if (err) console.error('Error verifying items:', err);
            else console.log('All items in database:', rows);
          });
        });
      }
    });
  });
});

// GET /api/admin/items/:room
router.get('/items/:room', (req, res) => {
  const { room } = req.params;
  console.log('GET /api/admin/items/:room called for room:', room);

  // Get room with items
  db.get('SELECT items FROM admin_rooms WHERE name = ?', [room], (err, result) => {
    if (err) {
      console.error('Error checking room:', err);
      return res.status(500).json({ error: err.message });
    }

    console.log('Found room data:', result);

    if (!result) {
      return res.json([]);
    }

    try {
      const items = JSON.parse(result.items);
      console.log('Parsed items for room:', room, items);
      res.json(items || []);
    } catch (e) {
      console.error('Error parsing items JSON:', e);
      res.status(500).json({ error: 'Invalid items data' });
    }
  });
});

// POST /api/admin/items
router.post('/items', (req, res) => {
  console.log('POST /api/admin/items called with:', req.body);
  const { name, room, volume, width, length, height } = req.body;

  if (!name || !room) {
    return res.status(400).json({ error: 'Name and room are required' });
  }

  db.run(
    `INSERT INTO items (name, room, volume, width, length, height)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, room, volume || 0, width || 0, length || 0, height || 0],
    function(err) {
      if (err) {
        console.error('Error creating item:', err);
        return res.status(500).json({ error: err.message });
      }
      
      const newItem = {
        id: this.lastID,
        name,
        room,
        volume: volume || 0,
        width: width || 0,
        length: length || 0,
        height: height || 0
      };
      
      console.log('Created new item:', newItem);
      res.status(201).json(newItem);
    }
  );
});

// PUT /api/admin/items/:id
router.put('/items/:id', (req, res) => {
  console.log('PUT /api/admin/items/:id called with:', req.params.id, req.body);
  const { id } = req.params;
  const { name, volume, width, length, height } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  db.run(
    `UPDATE items 
     SET name = ?, volume = ?, width = ?, length = ?, height = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, volume || 0, width || 0, length || 0, height || 0, id],
    function(err) {
      if (err) {
        console.error('Error updating item:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      const updatedItem = {
        id: parseInt(id),
        name,
        volume: volume || 0,
        width: width || 0,
        length: length || 0,
        height: height || 0
      };
      
      console.log('Updated item:', updatedItem);
      res.json(updatedItem);
    }
  );
});

// GET /api/admin/material-assignments
router.get('/material-assignments', async (req, res) => {
  try {
    const assignments = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM material_assignments', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching material assignments:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/material-statistics
router.get('/material-statistics', async (req, res) => {
  try {
    const statistics = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          m.name,
          COUNT(ma.id) as usage_count,
          SUM(ma.quantity) as total_quantity
        FROM materials m
        LEFT JOIN material_assignments ma ON m.id = ma.material_id
        GROUP BY m.id, m.name
        ORDER BY m.name
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching material statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log all routes when the module is loaded
console.log('Registered routes in adminRoutes:', 
  router.stack.map(r => r.route?.path).filter(Boolean)
);

module.exports = router; 