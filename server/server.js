// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const crypto = require('crypto');
const INITIAL_ROOMS_AND_ITEMS = require('./initialData');
require('dotenv').config({ path: __dirname + '/.env' });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Logging für Debugging
console.log('ENV check:', {
  envPath: require.resolve('dotenv'),
  anthropicKey: process.env.ANTHROPIC_API_KEY ? 'Key exists' : 'No key found',
  dbPath: path.join(__dirname, 'recognition.db')
});

// Add this at the top level, after the imports
let db; // Global database connection

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(path.join(__dirname, 'recognition.db'), (err) => {
      if (err) {
        console.error('Database connection error:', err);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');
      
      const tables = [
        `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS admin_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS admin_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          width REAL DEFAULT 0,
          length REAL DEFAULT 0,
          height REAL DEFAULT 0,
          volume REAL NOT NULL,
          room TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(name, room)
        )`,

        `CREATE TABLE IF NOT EXISTS recognitions (
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
        )`,
        
        `CREATE TABLE IF NOT EXISTS inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deal_id TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT CHECK(status IN ('draft', 'completed')) DEFAULT 'draft',
          move_date DATE,
          total_volume REAL,
          total_rooms INTEGER,
          origin_address TEXT,
          origin_floor INTEGER,
          origin_has_elevator BOOLEAN,
          destination_address TEXT,
          destination_floor INTEGER,
          destination_has_elevator BOOLEAN,
          packing_service BOOLEAN DEFAULT FALSE,
          unpacking_service BOOLEAN DEFAULT FALSE,
          lift_loading BOOLEAN DEFAULT FALSE,
          lift_unloading BOOLEAN DEFAULT FALSE,
          furniture_cost REAL,
          materials_cost REAL,
          total_cost REAL,
    notes TEXT,
          data JSON
        )`,
        
        `CREATE TABLE IF NOT EXISTS inspection_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
          inspection_id INTEGER,
          room_name TEXT,
          photo_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(inspection_id) REFERENCES inspections(id)
        )`,

        `CREATE TABLE IF NOT EXISTS image_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
          imageHash TEXT NOT NULL,
          roomName TEXT NOT NULL,
          objectType TEXT NOT NULL,
          featureVector TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(imageHash, objectType)
        )`,
        
        `CREATE TABLE IF NOT EXISTS admin_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          price REAL NOT NULL,
          width REAL DEFAULT 0,
          length REAL DEFAULT 0,
          height REAL DEFAULT 0,
          type TEXT DEFAULT 'material',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ];
      
      db.serialize(() => {
        tables.forEach(table => {
          db.run(table, err => {
            if (err) {
              console.error('Error creating table:', err);
            }
          });
        });
        
        // Create indexes
        db.run('CREATE INDEX IF NOT EXISTS idx_inspections_deal ON inspections(deal_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_inspection_photos ON inspection_photos(inspection_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_recognitions_hash ON recognitions(imageHash)');
        db.run('CREATE INDEX IF NOT EXISTS idx_features_hash ON image_features(imageHash)');
        
        resolve(db);
      });
    });
  });
};

const startServer = async () => {
  try {
    const db = await initializeDatabase();
    
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    
    // Logging middleware
    app.use((req, res, next) => {
      console.log('Request received:', {
        method: req.method,
        path: req.path,
        body: req.body
      });
      next();
    });

    // Authentication Middleware
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
          return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
      });
    };

    // Auth Routes
    app.post('/api/register', async (req, res) => {
      const { username, password, email } = req.body;

      try {
        // Check if user already exists
        db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, user) => {
    if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (user) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insert new user
          db.run(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email],
            function(err) {
    if (err) {
                return res.status(500).json({ error: 'Error creating user' });
              }

              const token = jwt.sign(
                { id: this.lastID, username, role: 'user' },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
              );

              res.json({ token, user: { id: this.lastID, username, email, role: 'user' } });
            }
          );
        });
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.post('/api/login', async (req, res) => {
      const { username, password } = req.body;

      try {
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          const validPassword = await bcrypt.compare(password, user.password);
          if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.json({
            token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role
            }
  });
});
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.get('/api/verify-token', authenticateToken, (req, res) => {
      res.json({ user: req.user });
    });

    // Protect routes that require authentication
    app.use('/api/deals', authenticateToken);
    app.use('/api/rooms', authenticateToken);
    app.use('/api/items', authenticateToken);

    // Analysis Routes
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
          hasCustomPrompt: !!customPrompt,
          promptLength: customPrompt?.length || 0
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

        console.log('Received response from Claude:', {
          status: 'success',
          contentLength: message.content?.length || 0
        });

        // Parse und validiere Claude's Antwort
        if (!message.content || !Array.isArray(message.content) || !message.content[0] || !message.content[0].text) {
          console.error('Invalid Claude response structure:', message);
          throw new Error('Invalid response format from Claude');
        }
     
        let initialResults;
        try {
          // Versuche den JSON-Teil aus der Antwort zu extrahieren
          const text = message.content[0].text;
          console.log('Raw Claude response text length:', text.length);
          
          // Clean the response text to ensure valid JSON
          const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
          console.log('Cleaned response text:', cleanedText.substring(0, 200) + '...');
          
          const jsonMatch = cleanedText.match(/{[\s\S]*}/);
          if (!jsonMatch) {
            console.error('No JSON found in response:', cleanedText);
            throw new Error('No JSON found in response');
          }
          
          const jsonText = jsonMatch[0];
          console.log('Extracted JSON text:', jsonText.substring(0, 200) + '...');
          
          initialResults = JSON.parse(jsonText);
          
          if (!initialResults.items || !Array.isArray(initialResults.items)) {
            console.error('Invalid JSON structure:', initialResults);
            throw new Error('Invalid JSON structure');
          }

          console.log('Successfully parsed results:', {
            itemsCount: initialResults.items.length,
            hasSummary: !!initialResults.summary,
            hasMovingTips: !!initialResults.movingTips
          });
        } catch (parseError) {
          console.error('Error parsing Claude response:', {
            error: parseError.message,
            type: parseError.name,
            stack: parseError.stack
          });
          throw new Error(`Failed to parse AI response: ${parseError.message}`);
        }

        // Verbessere mit gelernten Erkennungen
        try {
          const imageFeatures = await Promise.all(
            images.map(image => extractImageFeatures(image))
          );

          const improvedItems = await Promise.all(initialResults.items.map(async (item) => {
            try {
              const similarItems = await findSimilarItems(imageFeatures[0], item.name, roomName);
              
              if (similarItems && similarItems.length > 0) {
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
            } catch (error) {
              console.error('Error processing item:', error);
              return { ...item, confidence: 85 }; // Return original item on error
            }
          }));

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
          // If database enhancement fails, return the original results
          console.error('Error enhancing results with database:', error);
          const totalVolume = initialResults.items.reduce((sum, item) => 
            sum + (item.volume * (item.count || 1)), 0
          );
          
          res.json({
            ...initialResults,
            items: initialResults.items.map(item => ({ ...item, confidence: 85 })),
            totalVolume,
            improved: false
          });
        }

  } catch (error) {
        console.error('Analysis error:', error);
    res.status(500).json({ 
          error: 'Error during image analysis',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

    // Voice Analysis Route
    app.post(['/api/analyze-voice', '/api/analyze-voice/'], async (req, res) => {
      console.log('Voice analyze endpoint hit', { body: req.body });
      try {
        const { text, roomName, customPrompt } = req.body;

        if (!text) {
          return res.status(400).json({ error: 'No text provided' });
        }

        console.log('Request data:', { 
          roomName, 
          textLength: text.length,
          hasCustomPrompt: !!customPrompt
        });

        // Process with Claude
        const message = await client.messages.create({
          model: "claude-3-sonnet-20240229",
          max_tokens: 1500,
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: `Du bist ein Experte für Umzüge und Möbel. Analysiere die folgende Sprachbeschreibung eines ${roomName}s und extrahiere alle genannten Möbelstücke mit ihren Eigenschaften.

Sprachbeschreibung:
${text}

Für jeden genannten Gegenstand bestimme:
1. Den genauen Namen auf Deutsch
2. Realistische Standardmaße (L x B x H in cm)
3. Das entsprechende Volumen in m³
4. Eine kurze Beschreibung mit typischen Eigenschaften

Berücksichtige dabei:
- Verwende realistische Standardmaße für typische Möbelstücke dieser Art
- Berechne das Volumen in m³ basierend auf den Maßen
- Füge eine passende Beschreibung hinzu, auch wenn sie nicht explizit genannt wurde
- Berechne das Gesamtvolumen aller Möbel

Antworte im folgenden JSON-Format:
{
  "items": [{
    "name": string,
    "length": number,
    "width": number,
    "height": number,
    "volume": number,
    "description": string
  }],
  "totalVolume": number,
  "summary": string,
  "movingTips": string
}`
              }
            ]
          }]
        });

        let analysisResults;
        try {
          const content = message.content[0].text;
          analysisResults = JSON.parse(content);
        } catch (parseError) {
          console.error('Error parsing Claude response:', parseError);
          return res.status(500).json({ error: 'Error parsing analysis results' });
        }

        // Calculate total volume
        const totalVolume = analysisResults.items.reduce((sum, item) => 
          sum + (item.volume * (item.count || 1)), 0
        );

        const finalResults = {
          ...analysisResults,
          totalVolume,
          improved: true
        };

        res.json(finalResults);

      } catch (error) {
        console.error('Voice analysis error:', error);
        res.status(500).json({ 
          error: 'Error during voice analysis',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
      }
    });

    // Recognition Routes
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
    app.get('/api/admin/rooms', (req, res) => {
      db.all('SELECT * FROM admin_rooms ORDER BY name ASC', [], (err, rows) => {
    if (err) {
          console.error('Error fetching rooms:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

    app.post('/api/admin/rooms', async (req, res) => {
      const { name } = req.body;
      
      try {
        const sql = 'INSERT INTO admin_rooms (name) VALUES (?) RETURNING *';
        const result = await db.run(sql, [name]);
        res.json({ id: result.lastID, name });
      } catch (error) {
        console.error('Error saving room:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/api/admin/items', (req, res) => {
      const { room } = req.query;
      
      if (!room) {
        return res.status(400).json({ error: 'Room parameter is required' });
      }
      
      db.all('SELECT * FROM admin_items WHERE room = ? ORDER BY name', [room], (err, rows) => {
        if (err) {
          console.error('Error fetching items:', err);
          return res.status(500).json({ error: err.message });
        }
        
        // Convert snake_case column names to camelCase for frontend
        const formattedRows = rows.map(row => ({
          id: row.id,
          name: row.name,
          width: row.width,
          length: row.length,
          height: row.height,
          volume: row.volume,
          room: row.room,
          setupTime: row.setup_time || 0,  // Konvertierung von setup_time zu setupTime
          dismantleTime: row.dismantle_time || 0  // Konvertierung von dismantle_time zu dismantleTime
        }));
        
        res.json(formattedRows);
      });
    });

    app.post('/api/admin/items', async (req, res) => {
      console.log('Received item data:', req.body);
      const { name, width, length, height, room, setupTime, dismantleTime } = req.body;
      const volume = (width * length * height) / 1000000; // Convert from cm³ to m³
      
      db.run(
        'INSERT INTO admin_items (name, width, length, height, volume, room, setup_time, dismantle_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, width || 0, length || 0, height || 0, volume || 0, room, setupTime || 0, dismantleTime || 0],
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
            room,
            setupTime: setupTime || 0,
            dismantleTime: dismantleTime || 0
          });
        }
      );
    });

    app.put('/api/admin/items/:id', (req, res) => {
  const { id } = req.params;
      const { name, width, length, height, volume, setupTime, dismantleTime } = req.body;

  db.run(
        'UPDATE admin_items SET name = ?, width = ?, length = ?, height = ?, volume = ?, setup_time = ?, dismantle_time = ? WHERE id = ?',
        [name, width || 0, length || 0, height || 0, volume || 0, setupTime || 0, dismantleTime || 0, id],
    function(err) {
      if (err) {
            console.error('Error updating item:', err);
            return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
            return res.status(404).json({ error: 'Item not found' });
      }
          res.json({ 
      id: parseInt(id),
      name,
      width: width || 0,
      length: length || 0,
      height: height || 0,
      volume: volume || 0,
      setupTime: setupTime || 0,
      dismantleTime: dismantleTime || 0
    });
    }
  );
});

    // Check if a price with a specific name exists
    app.get('/api/admin/prices/check', authenticateToken, (req, res) => {
      const { name } = req.query;
      
      if (!name) {
        return res.status(400).json({ error: 'Name parameter is required' });
      }
      
      db.get('SELECT id FROM admin_prices WHERE name = ?', [name], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ exists: !!row });
      });
    });

    // Die allgemeine Route für alle Preise
    app.get('/api/admin/prices', (req, res) => {
      db.all('SELECT * FROM admin_prices ORDER BY created_at ASC', [], (err, rows) => {
    if (err) {
          console.error('Error fetching prices:', err);
      return res.status(500).json({ error: err.message });
    }
        res.json(rows);
  });
});

    // Preis aktualisieren
    app.put('/api/admin/prices/:id', (req, res) => {
  const { id } = req.params;
      const { price, width, length, height } = req.body;

      db.run(
        'UPDATE admin_prices SET price = ?, width = ?, length = ?, height = ? WHERE id = ?',
        [price, width, length, height, id],
        function(err) {
      if (err) {
            console.error('Error updating price:', err);
        return res.status(500).json({ error: err.message });
      }
          res.json({ id: parseInt(id), price, width, length, height });
        }
      );
    });

    // Statistik-Endpoint (optional)
    app.get('/api/stats', async (req, res) => {
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

    // Admin User Management Routes
    app.get('/api/admin/users', authenticateToken, (req, res) => {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      db.all('SELECT id, username, email, role, created_at FROM users', [], (err, rows) => {
    if (err) {
          console.error('Error fetching users:', err);
          return res.status(500).json({ error: 'Database error' });
    }
        res.json(rows);
  });
});

    // Add new endpoint for creating users
    app.post('/api/admin/users', authenticateToken, async (req, res) => {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { username, email, password, role } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Alle Felder müssen ausgefüllt werden' });
      }

      // Validate role
      if (role && !['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Ungültige Rolle' });
      }

      try {
        // Check if user already exists
        const existingUser = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (existingUser) {
          return res.status(400).json({ error: 'Benutzername oder E-Mail existiert bereits' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const result = await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role || 'user'],
            function(err) {
              if (err) reject(err);
              else resolve(this);
            }
          );
        });

        res.status(201).json({
          id: result.lastID,
          username,
          email,
          role: role || 'user'
        });
      } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Fehler beim Erstellen des Benutzers' });
      }
    });

    app.put('/api/admin/users/:id/password', authenticateToken, async (req, res) => {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { password } = req.body;

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, id],
          function(err) {
    if (err) {
              console.error('Error updating password:', err);
              return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
              return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: 'Password updated successfully' });
          }
        );
      } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.put('/api/admin/users/:id/role', authenticateToken, (req, res) => {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      db.run(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, id],
        function(err) {
    if (err) {
            console.error('Error updating role:', err);
            return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
          }
          res.json({ message: 'Role updated successfully' });
        }
      );
    });

    // Delete user endpoint
    app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
      console.log('Delete user request received:', {
        userId: req.params.id,
        userRole: req.user.role
      });

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

      // Prevent self-deletion
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Sie können Ihren eigenen Account nicht löschen' });
      }

      try {
        // Check if this would delete the last admin
        const adminCount = await new Promise((resolve, reject) => {
          db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin'], (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
          });
        });

        const userToDelete = await new Promise((resolve, reject) => {
          db.get('SELECT role FROM users WHERE id = ?', [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (adminCount <= 1 && userToDelete?.role === 'admin') {
          return res.status(400).json({ error: 'Der letzte Administrator kann nicht gelöscht werden' });
        }

        // Delete the user
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
            if (err) reject(err);
            else resolve(this);
          });
        });

        res.json({ message: 'Benutzer erfolgreich gelöscht' });
      } catch (error) {
        console.error('Error in delete user endpoint:', error);
        res.status(500).json({ error: 'Serverfehler beim Löschen des Benutzers' });
      }
    });

    // Moves Routes
    app.put('/api/moves/:dealId', authenticateToken, async (req, res) => {
      const { dealId } = req.params;
      const moveData = req.body;
      
      try {
        // Check if inspection exists
        db.get('SELECT * FROM inspections WHERE deal_id = ?', [dealId], async (err, inspection) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          if (!inspection) {
            // Create new inspection
            const stmt = db.prepare(`
              INSERT INTO inspections (
                deal_id, 
                move_date, 
                origin_address, 
                origin_floor, 
                destination_address, 
                destination_floor,
                data
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
              dealId,
              moveData.b9d01d5dcd86c878a57cb0febd336e4d390af900, // move_date
              moveData['07c3da8804f7b96210e45474fba35b8691211ddd'], // origin_address
              moveData['72cfdc30fa0621d1d6947cf408409e44c6bb40d6'], // origin_floor
              moveData['9cb4de1018ec8404feeaaaf7ee9b293c78c44281'], // destination_address
              moveData['9e4e07bce884e21671546529b564da98ceb4765a'], // destination_floor
              JSON.stringify(moveData)
            );

            return res.json({ message: 'Move information created successfully', data: moveData });
          } else {
            // Update existing inspection
            const stmt = db.prepare(`
              UPDATE inspections SET 
                move_date = ?,
                origin_address = ?,
                origin_floor = ?,
                destination_address = ?,
                destination_floor = ?,
                data = ?
              WHERE deal_id = ?
            `);

            stmt.run(
              moveData.b9d01d5dcd86c878a57cb0febd336e4d390af900,
              moveData['07c3da8804f7b96210e45474fba35b8691211ddd'],
              moveData['72cfdc30fa0621d1d6947cf408409e44c6bb40d6'],
              moveData['9cb4de1018ec8404feeaaaf7ee9b293c78c44281'],
              moveData['9e4e07bce884e21671546529b564da98ceb4765a'],
              JSON.stringify(moveData),
              dealId
            );

            return res.json({ message: 'Move information updated successfully', data: moveData });
          }
        });
      } catch (error) {
        console.error('Error handling move information:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Serve static files
    app.use('/moving-assistant', express.static(path.join(__dirname, '..', 'build')));

    // Catch-all handler
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
    });

    // Update the service worker endpoint to properly serve the file
    app.get('/service-worker.js', (req, res) => {
      res.set('Content-Type', 'application/javascript');
      res.set('Service-Worker-Allowed', '/');
      res.sendFile(path.join(__dirname, '..', 'build', 'service-worker.js'));
    });

    // Similarly for manifest.json
    app.get('/manifest.json', (req, res) => {
      res.set('Content-Type', 'application/manifest+json');
      res.sendFile(path.join(__dirname, '..', 'build', 'manifest.json'));
    });

    // Update the admin_prices table to include type field
    db.run(`
      ALTER TABLE admin_prices ADD COLUMN type TEXT DEFAULT 'material'
    `, (err) => {
      // If the column already exists, this will error but we can ignore it
      console.log('Added type column to admin_prices table or it already exists');
    });

    // Add new price
    app.post('/api/admin/prices', authenticateToken, (req, res) => {
      const { name, price, width, length, height, type } = req.body;

      db.run(
        'INSERT INTO admin_prices (name, price, width, length, height, type) VALUES (?, ?, ?, ?, ?, ?)',
        [name, price, width || 0, length || 0, height || 0, type || 'material'],
        function(err) {
          if (err) {
            console.error('Error inserting price:', err);
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({ 
            id: this.lastID,
            name,
            price,
            width: width || 0,
            length: length || 0,
            height: height || 0,
            type: type || 'material'
          });
        }
      );
    });

    // Alter table to add setup_time and dismantle_time columns
    db.run(`
      ALTER TABLE admin_items ADD COLUMN setup_time INTEGER DEFAULT 0
    `, (err) => {
      // If the column already exists, this will error but we can ignore it
      console.log('Added setup_time column to admin_items table or it already exists');
    });

    db.run(`
      ALTER TABLE admin_items ADD COLUMN dismantle_time INTEGER DEFAULT 0
    `, (err) => {
      // If the column already exists, this will error but we can ignore it
      console.log('Added dismantle_time column to admin_items table or it already exists');
    });

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database location: ${path.join(__dirname, 'recognition.db')}`);
});
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

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
  if (!db) {
    console.error('Database connection not initialized');
    return []; // Return empty array instead of failing
  }

  return new Promise((resolve, reject) => {
    db.all(`
      SELECT r.*, f.featureVector
      FROM recognitions r
      LEFT JOIN image_features f ON r.imageHash = f.imageHash
      WHERE r.roomName = ? AND (r.originalName = ? OR r.correctedName = ?)
      ORDER BY r.timestamp DESC
      LIMIT 5
    `, [roomName, itemName, itemName], (err, rows) => {
      if (err) {
        console.error('Database query error:', err);
        resolve([]); // Return empty array on error instead of rejecting
      } else {
        try {
          const itemsWithScores = rows.map(row => ({
            ...row,
            similarityScore: calculateSimilarity(imageFeatures.features, 
              JSON.parse(row.featureVector || '{}'))
          }));
          resolve(itemsWithScores);
        } catch (error) {
          console.error('Error processing similarity scores:', error);
          resolve([]); // Return empty array on processing error
        }
      }
    });
  });
}

function calculateSimilarity(features1, features2) {
  // Vereinfachte Version - könnte durch ML-basierte Ähnlichkeitsberechnung ersetzt werden
  return 0.85;
}