# Tour Planning Integration - Moving Assistant

Diese Dokumentation beschreibt die Integration der HERE Routing API und Traccar API in das Moving Assistant Projekt für das neue "Tourenplanung v2" Modul.

## 🚀 Übersicht

Die Tour Planning Integration erweitert das Moving Assistant um folgende Funktionen:

- **HERE Routing API**: Berechnung optimaler Routen für Umzugsfahrzeuge
- **HERE Tour Planning API**: Professionelle Tourenoptimierung für mehrere Aufträge
- **Traccar Integration**: GPS-Tracking und Flottenmanagement (optional)

## 📁 Dateistruktur

```
server/
├── services/
│   ├── hereRoutingService.js          # HERE Routing API v8 Service
│   ├── hereTourPlanningService.js     # HERE Tour Planning API v3 Service
│   ├── traccarService.js              # Traccar API Service
│   └── tourPlanningIntegrationService.js  # Haupt-Integrationsdienst
├── routes/
│   └── tourPlanningRoutes.js          # API Endpunkte
├── config/
│   └── tourPlanningConfig.js          # Konfigurationsverwaltung
└── env.example                        # Umgebungsvariablen-Vorlage

src/
└── services/
    └── tourPlanningService.js         # Frontend Service Wrapper
```

## ⚙️ Installation und Konfiguration

### 1. Backend Dependencies installieren

```bash
cd server
npm install axios
```

### 2. Umgebungsvariablen konfigurieren

Kopieren Sie `server/env.example` nach `server/.env` und füllen Sie die Werte aus:

```env
# HERE Maps API (ERFORDERLICH)
HERE_API_KEY=ihr_here_api_key

# Traccar API (OPTIONAL)
TRACCAR_BASE_URL=https://ihre-traccar-instanz.com/api
TRACCAR_API_KEY=ihr_traccar_api_key
```

### 3. HERE API Key einrichten

1. Besuchen Sie [developer.here.com](https://developer.here.com)
2. Erstellen Sie ein kostenloses Konto
3. Erstellen Sie ein neues Projekt
4. Generieren Sie einen API Key für:
   - **Routing API v8** (für Routenberechnung)
   - **Tour Planning API v3** (für Tourenoptimierung)
5. Kopieren Sie den Key in die `.env` Datei

### 4. Traccar einrichten (optional)

Traccar ist optional und ermöglicht GPS-Tracking. Ohne Traccar funktionieren Routing und Tourenoptimierung trotzdem.

1. Installieren Sie Traccar oder verwenden Sie eine bestehende Instanz
2. Generieren Sie einen API Key oder verwenden Sie Username/Password
3. Konfigurieren Sie die Traccar-Einstellungen in der `.env` Datei

## 🔧 API Endpunkte

### Service Status

```http
GET /api/tour-planning/status
```

Gibt Status und verfügbare Features zurück.

### Route berechnen

```http
POST /api/tour-planning/calculate-route
Content-Type: application/json

{
  "movingJob": {
    "pickupAddress": "Alexanderplatz, Berlin",
    "deliveryAddress": "Potsdamer Platz, Berlin",
    "truckSpecs": {
      "height": 350,
      "width": 245,
      "length": 750,
      "weight": 7500
    }
  },
  "options": {
    "avoidTolls": true,
    "departureTime": "2025-01-01T08:00:00Z"
  }
}
```

### Touren optimieren

```http
POST /api/tour-planning/optimize-tours
Content-Type: application/json

{
  "movingJobs": [
    {
      "id": "job1",
      "pickupAddress": "Alexanderplatz, Berlin",
      "deliveryAddress": "Potsdamer Platz, Berlin",
      "priority": 3
    }
  ],
  "depot": {
    "lat": 52.5200,
    "lng": 13.4050,
    "address": "Firmen-Depot"
  },
  "options": {
    "startTime": "2025-01-01T07:00:00Z",
    "endTime": "2025-01-01T19:00:00Z",
    "maxDistance": 300000
  }
}
```

### GPS-Tracking (nur mit Traccar)

```http
GET /api/tour-planning/trucks/status
GET /api/tour-planning/trucks/{truckId}/history?date=2025-01-01
```

### Integration testen

```http
POST /api/tour-planning/test
```

### Simulation

```http
POST /api/tour-planning/simulate-optimization
Content-Type: application/json

{
  "jobCount": 5,
  "depot": {
    "lat": 52.5200,
    "lng": 13.4050
  }
}
```

## 💻 Frontend Integration

### Service verwenden

```javascript
import tourPlanningService from '../services/tourPlanningService';

// Status prüfen
const status = await tourPlanningService.getStatus();

// Route für Deal berechnen
const route = await tourPlanningService.calculateRouteForDeal(deal);

// Touren für mehrere Deals optimieren
const optimizedTours = await tourPlanningService.optimizeToursForDeals(
  deals, 
  companyDepot
);

// Features prüfen
const availability = await tourPlanningService.checkFeatureAvailability();
```

### Beispiel-Integration im Frontend

```javascript
// In der TourPlanningV2 Komponente
const handleOptimizeRoute = async () => {
  try {
    const result = await tourPlanningService.simulateOptimization(5);
    console.log('Optimized tour:', result);
    setTourData(result);
  } catch (error) {
    console.error('Optimization failed:', error);
  }
};
```

## 🧪 Testing

### Backend Service testen

```bash
# Server starten
cd server
npm start

# Test-Endpoint aufrufen
curl -X POST http://localhost:5000/api/tour-planning/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Integration testen

1. Starten Sie den Server: `npm start`
2. Melden Sie sich in der App an
3. Navigieren Sie zu "Routen" → "Tourenplanung v2"
4. Die Komponente sollte automatisch die Service-Verfügbarkeit prüfen

## 🔐 Sicherheit

- Alle API-Endpunkte erfordern Authentifizierung
- API-Schlüssel werden nur im Backend gespeichert
- Sensible Daten werden nicht an das Frontend weitergegeben

## 📊 Funktionen

### Verfügbare Features

- ✅ **Routenberechnung**: Optimale Routen für Umzugsfahrzeuge
- ✅ **Tourenoptimierung**: Mehrere Aufträge in effizienten Touren
- ✅ **Kostenberechnung**: Geschätzte Kosten basierend auf Distanz und Zeit
- ✅ **LKW-spezifisch**: Berücksichtigung von Fahrzeugdimensionen
- ✅ **Zeitfenster**: Pickup- und Delivery-Zeitfenster
- ✅ **Simulation**: Test mit Beispieldaten
- 🔧 **GPS-Tracking**: Echtzeit-Verfolgung (mit Traccar)
- 🔧 **Historische Daten**: Analyse vergangener Routen (mit Traccar)

### Erweiterte Optionen

- Vermeidung von Mautstraßen
- Berücksichtigung von Verkehrsdaten
- Fahrzeugspezifische Beschränkungen
- Prioritäten und Zeitfenster
- Multi-Fahrzeug-Optimierung

## 🐛 Fehlerbehebung

### Häufige Probleme

1. **"HERE_API_KEY ist erforderlich"**
   - Überprüfen Sie die .env Datei
   - Stellen Sie sicher, dass der API Key gültig ist

2. **"Tour optimization failed"**
   - Überprüfen Sie HERE Tour Planning API Berechtigung
   - Stellen Sie sicher, dass mindestens 2 Jobs vorhanden sind

3. **"Traccar authentication failed"**
   - Überprüfen Sie Traccar URL und Credentials
   - Traccar ist optional - andere Features funktionieren trotzdem

### Debug-Modus

Setzen Sie `DEBUG=true` in der .env Datei für detaillierte Logs.

## 📈 Performance

- Caching von API-Anfragen
- Batch-Verarbeitung für mehrere Routen
- Optimierte Algorithmen für große Datensätze
- Timeout-Konfiguration für API-Calls

## 🔄 Updates

Die Integration ist modular aufgebaut und kann einfach erweitert werden:

- Neue HERE API Features
- Zusätzliche Tracking-Systeme
- Weitere Optimierungsalgorithmen
- Custom Business Logic

## 📞 Support

Bei Problemen oder Fragen zur Integration:

1. Überprüfen Sie die Logs im Debug-Modus
2. Testen Sie die Integration mit `/api/tour-planning/test`
3. Verwenden Sie die Simulation für erste Tests
4. Konsultieren Sie die HERE API Dokumentation
