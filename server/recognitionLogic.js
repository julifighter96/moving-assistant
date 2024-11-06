// server/recognitionLogic.js

class RecognitionImprover {
    constructor(db) {
      this.db = db;
    }
  
    // Berechnet Ähnlichkeitsmetrik zwischen zwei Möbelstücken
    calculateSimilarity(item1, item2) {
      let score = 0;
      
      // Namensähnlichkeit (50% Gewichtung)
      const name1 = item1.name.toLowerCase();
      const name2 = item2.name.toLowerCase();
      const nameWords1 = name1.split(' ');
      const nameWords2 = name2.split(' ');
      const commonWords = nameWords1.filter(word => nameWords2.includes(word));
      score += (commonWords.length / Math.max(nameWords1.length, nameWords2.length)) * 50;
  
      // Volumenähnlichkeit (30% Gewichtung)
      if (item1.volume && item2.volume) {
        const volumeDiff = Math.abs(item1.volume - item2.volume);
        const volumeScore = Math.max(0, 30 - (volumeDiff / Math.max(item1.volume, item2.volume)) * 30);
        score += volumeScore;
      }
  
      // Dimensionsähnlichkeit (20% Gewichtung)
      if (item1.dimensions && item2.dimensions) {
        const dim1 = this.parseDimensions(item1.dimensions);
        const dim2 = this.parseDimensions(item2.dimensions);
        if (dim1 && dim2) {
          const dimensionScore = this.calculateDimensionScore(dim1, dim2);
          score += dimensionScore * 20;
        }
      }
  
      return score; // 0-100 Score
    }
  
    // Parst Dimensionsstrings wie "200 x 100 x 75"
    parseDimensions(dimString) {
      const dims = dimString.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/);
      if (dims) {
        return {
          length: parseInt(dims[1]),
          width: parseInt(dims[2]),
          height: parseInt(dims[3])
        };
      }
      return null;
    }
  
    // Vergleicht Dimensionen unter Berücksichtigung verschiedener Orientierungen
    calculateDimensionScore(dim1, dim2) {
      // Sortiere Dimensionen (außer Höhe) für orientierungsunabhängigen Vergleich
      const d1 = [dim1.length, dim1.width].sort((a, b) => b - a);
      const d2 = [dim2.length, dim2.width].sort((a, b) => b - a);
      
      // Berechne prozentuale Unterschiede
      const lengthDiff = Math.abs(d1[0] - d2[0]) / Math.max(d1[0], d2[0]);
      const widthDiff = Math.abs(d1[1] - d2[1]) / Math.max(d1[1], d2[1]);
      const heightDiff = Math.abs(dim1.height - dim2.height) / Math.max(dim1.height, dim2.height);
      
      // Gewichteter Durchschnitt der Ähnlichkeiten
      return 1 - ((lengthDiff + widthDiff + heightDiff) / 3);
    }
  
    // Verbessert Erkennungsergebnisse basierend auf historischen Daten
    async improveResults(analysisResults, roomName, companyId) {
      const { items } = analysisResults;
      const improvedItems = [];
  
      // Hole historische Korrekturen
      const recognitions = await this.getHistoricalRecognitions(roomName, companyId);
      const misrecognitions = await this.getHistoricalMisrecognitions(roomName, companyId);
  
      for (const item of items) {
        let improvedItem = { ...item };
        
        // 1. Prüfe auf bekannte Fehlerkennungen
        const similarMisrecognitions = misrecognitions
          .filter(m => this.calculateSimilarity(m, item) > 85)
          .sort((a, b) => b.frequency - a.frequency);
  
        if (similarMisrecognitions.length > 0) {
          improvedItem.potentialMisrecognition = true;
          improvedItem.suggestedNames = similarMisrecognitions
            .map(m => m.actualName)
            .slice(0, 3); // Top 3 Vorschläge
        }
  
        // 2. Prüfe auf Korrekturen mit hoher Konfidenz
        const similarCorrections = recognitions
          .filter(r => this.calculateSimilarity(r, item) > 90)
          .sort((a, b) => {
            // Sortiere nach Konfidenz und Aktualität
            const confidenceA = this.calculateSimilarity(a, item) * (1 + a.frequency * 0.1);
            const confidenceB = this.calculateSimilarity(b, item) * (1 + b.frequency * 0.1);
            return confidenceB - confidenceA;
          });
  
        if (similarCorrections.length > 0) {
          const bestMatch = similarCorrections[0];
          const similarity = this.calculateSimilarity(bestMatch, item);
          
          if (similarity > 95) {
            // Automatische Korrektur bei sehr hoher Ähnlichkeit
            improvedItem = {
              ...improvedItem,
              name: bestMatch.correctedName,
              volume: bestMatch.correctedVolume,
              dimensions: bestMatch.correctedDimensions,
              confidence: similarity
            };
          } else {
            // Vorschlag bei mittlerer Ähnlichkeit
            improvedItem.suggestions = {
              name: bestMatch.correctedName,
              volume: bestMatch.correctedVolume,
              dimensions: bestMatch.correctedDimensions,
              confidence: similarity
            };
          }
        }
  
        improvedItems.push(improvedItem);
      }
  
      // Aktualisiere Gesamtvolumen
      const totalVolume = improvedItems.reduce((sum, item) => 
        sum + (item.volume * (item.count || 1)), 0);
  
      return {
        ...analysisResults,
        items: improvedItems,
        totalVolume,
        improved: true
      };
    }
  
    async getHistoricalRecognitions(roomName, companyId) {
      return new Promise((resolve, reject) => {
        this.db.all(
          `SELECT originalName, correctedName, correctedVolume, correctedDimensions,
           COUNT(*) as frequency
           FROM recognitions 
           WHERE companyId = ? AND roomName = ?
           GROUP BY originalName, correctedName, correctedVolume, correctedDimensions
           ORDER BY frequency DESC`,
          [companyId, roomName],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
    }
  
    async getHistoricalMisrecognitions(roomName, companyId) {
      return new Promise((resolve, reject) => {
        this.db.all(
          `SELECT originalName, actualName, COUNT(*) as frequency
           FROM misrecognitions 
           WHERE companyId = ? AND roomName = ?
           GROUP BY originalName, actualName
           ORDER BY frequency DESC`,
          [companyId, roomName],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
    }
  }
  
  module.exports = RecognitionImprover;