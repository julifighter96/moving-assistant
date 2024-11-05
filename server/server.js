// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // Import path module
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { images, roomName } = req.body;

    const message = await client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `Analysiere diese Bilder des ${roomName}s sehr detailliert und identifiziere ALLE sichtbaren Möbelstücke. 
            
            WICHTIG:
            - Zähle identische oder ähnliche Möbelstücke EINZELN
            - Beispiel: "3x Bürostuhl" oder drei separate Einträge für jeden Stuhl
            - Erfasse auch Möbel im Hintergrund
            - Liste ALLE Möbel auf, auch wenn sie sich auf verschiedenen Bildern wiederholen
            - Fokussiere dich nur auf die Möbel und ignoriere andere Gegenstände wie Dekoration oder Pflanzen
            - Es ist extrem wichtig, dass jedes Möbelstück, das im Fokus des Bildes ist, erkannt wird
            
            Für die Analyse:
            1. Liste jeden einzelnen Gegenstand mit:
               - Genauem Namen (z.B. "Bürostuhl mit Armlehnen" statt nur "Stuhl")
               - Detaillierten Maßen (Länge x Breite x Höhe in cm, möglichst genau)
               - Berechnetem Volumen in m³
               - Kurzer Beschreibung inkl. Material, Farbe und Besonderheiten
               - Bei mehreren gleichen Möbeln: separate Einträge für jedes Stück
            
            2. Erstelle eine präzise Zusammenfassung:
               - Gesamteindruck des Raums
               - Auflistung aller Möbelgruppen mit Anzahl
               - Besondere Merkmale oder Anordnungen
               - Gesamtvolumen aller Möbel
            
            3. Spezifische Umzugshinweise:
               - Notwendige Demontage
               - Besondere Vorsichtsmaßnahmen
               - Transportreihenfolge
               - Benötigte Hilfsmittel
            
            Formatiere die Antwort als JSON:
            {
              "items": [{
                "name": string,        // Präziser Name mit Details
                "dimensions": string,  // Exakte Maße in cm
                "volume": number,      // Volumen in m³
                "count": number,       // Anzahl gleicher Möbel (falls mehrere)
                "description": string  // Detaillierte Beschreibung
              }],
              "totalVolume": number,   // Gesamtvolumen in m³
              "summary": string,       // Detaillierte Zusammenfassung
              "movingTips": string    // Spezifische Umzugshinweise
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

    res.json(message.content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from the build directory
app.use('/moving-assistant', express.static(path.join(__dirname, '..', 'build')));

// Catch-all handler for any requests to return index.html from the build folder
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Start the server
app.listen(3001, '0.0.0.0', () => {
  console.log('Server running on port 3001');
});
