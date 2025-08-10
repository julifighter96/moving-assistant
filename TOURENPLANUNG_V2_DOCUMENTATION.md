# Tourenplanung v2 - Moving Assistant

## 🚀 Übersicht

Das **Tourenplanung v2** Modul ist eine erweiterte Version der bestehenden Tourenplanung mit vollständiger Integration der HERE Maps API, Traccar GPS-Tracking und professioneller Routenoptimierung. Es bietet eine moderne, interaktive Benutzeroberfläche für die effiziente Planung und Verwaltung von Umzugstouren.

## ✨ Neue Features

### 🗺️ HERE Maps Integration
- **Interaktive Karte** mit HERE Maps API v3
- **Echtzeit-Routenberechnung** mit HERE Routing API v8
- **Professionelle Tourenoptimierung** mit HERE Tour Planning API v3
- **Geocoding** für automatische Adressauflösung
- **Verschiedene Kartenebenen** (Normal, Satellit, Terrain)

### 📍 GPS-Tracking (Traccar Integration)
- **Echtzeit-Fahrzeugverfolgung** über Traccar API
- **Flottenmanagement** mit Fahrzeugstatus
- **Live-Positionierung** auf der Karte
- **Fahrzeug-Historie** und Routen-Tracking

### 🚚 Erweiterte Tourenoptimierung
- **Multi-Fahrzeug-Planung** für komplexe Touren
- **Zeitfenster-Optimierung** mit Arbeitszeiten
- **Kapazitätsbeschränkungen** nach Fahrzeugtyp
- **Service-Zeit-Kalkulation** pro Stopp
- **Kosten-Optimierung** mit Distanz- und Zeitfaktoren

### 📊 Intelligente Datenintegration
- **Pipedrive-Integration** mit echten Auftragsdaten
- **Automatisches Caching** für bessere Performance
- **Demo-Modus** mit Beispieldaten
- **Echtzeit-Synchronisation** zwischen Karte und Daten

## 🏗️ Architektur

### Frontend-Komponenten

```
src/components/
├── TourPlanningV2.js           # Haupt-Komponente
├── HereMapComponent.js         # HERE Maps Integration
├── RouteDisplayPanel.js        # Route-Anzeige und Details
└── services/
    └── tourPlanningService.js  # Frontend API Service
```

### Backend-Services

```
server/
├── services/
│   ├── hereRoutingService.js              # HERE Routing API
│   ├── hereTourPlanningService.js         # HERE Tour Planning API
│   ├── traccarService.js                  # Traccar GPS Integration
│   └── tourPlanningIntegrationService.js  # Haupt-Integration
├── routes/
│   └── tourPlanningRoutes.js              # API Endpunkte
└── config/
    └── tourPlanningConfig.js              # Konfiguration
```

### API-Endpunkte

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/tour-planning/status` | GET | Service-Status prüfen |
| `/api/tour-planning/calculate-route` | POST | Route berechnen |
| `/api/tour-planning/optimize-tour` | POST | Tour optimieren |
| `/api/tour-planning/trucks` | GET | GPS-Fahrzeuge abrufen |
| `/api/tour-planning/test` | GET | Integration testen |

## 🔧 Konfiguration

### Umgebungsvariablen (Backend)

```env
# HERE Maps API
HERE_API_KEY=your_here_api_key_here

# Traccar API (optional)
TRACCAR_BASE_URL=https://demo.traccar.org/api
TRACCAR_API_KEY=your_traccar_api_key
# OR
TRACCAR_USERNAME=your_username
TRACCAR_PASSWORD=your_password

# Allgemeine Konfiguration
DEBUG=false
API_TIMEOUT=10000
```

### Umgebungsvariablen (Frontend)

```env
# HERE Maps API
REACT_APP_HERE_API_KEY=your_here_api_key_here

# Pipedrive Integration (bestehend)
REACT_APP_PIPEDRIVE_API_TOKEN=your_pipedrive_token

# Standardeinstellungen
REACT_APP_DEFAULT_DEPOT_LAT=49.0069
REACT_APP_DEFAULT_DEPOT_LNG=8.4037
REACT_APP_DEFAULT_DEPOT_ADDRESS=Greschbachstraße 29, 76229 Karlsruhe
```

## 📋 Installation & Setup

### 1. Backend-Setup

```bash
cd server
npm install axios dotenv

# Umgebungsvariablen konfigurieren
cp env.example .env
# .env bearbeiten und API-Keys eintragen
```

### 2. Frontend-Setup

```bash
cd ../
npm install react-dnd react-dnd-html5-backend date-fns

# Umgebungsvariablen konfigurieren
cp env.example.frontend .env
# .env bearbeiten und API-Keys eintragen
```

### 3. HERE API Key beantragen

1. Besuchen Sie [developer.here.com](https://developer.here.com)
2. Kostenloses Konto erstellen
3. Neues Projekt anlegen
4. API Key generieren für:
   - HERE Routing API v8
   - HERE Tour Planning API v3
   - HERE Geocoding API v1

### 4. Traccar Setup (optional)

1. Traccar Server installieren oder hosted service nutzen
2. API-Zugang konfigurieren
3. GPS-Geräte hinzufügen und konfigurieren

## 🎯 Verwendung

### 1. Modul aufrufen

1. Navigieren Sie zu **Routen** in der Hauptnavigation
2. Klicken Sie auf **Tourenplanung v2**
3. Das Modul öffnet sich mit der interaktiven Oberfläche

### 2. Aufträge auswählen

1. **Region auswählen** aus dem Dropdown-Menü
2. **Aufträge suchen** mit der Suchfunktion
3. **Drag & Drop** Aufträge in die Tour-Planungszone
4. **Depot setzen** für Start-/Endpunkt der Tour

### 3. Tour optimieren

1. **Fahrzeugtyp** auswählen (PKW, LKW, Transporter)
2. **Service-Zeit** pro Stopp definieren
3. **Arbeitszeiten** festlegen
4. **Optimierung starten** mit dem "Optimieren" Button

### 4. Ergebnisse anzeigen

1. **Karte** zeigt optimierte Route mit Markern
2. **Route-Panel** zeigt Details zu Distanz, Zeit, Kosten
3. **Tour-Liste** mit allen Stopps in optimaler Reihenfolge
4. **Export** oder **In Maps öffnen** für weitere Verwendung

## 🔍 Features im Detail

### Interaktive Karte

- **HERE Maps** mit professioneller Kartenqualität
- **Marker** für Abholungen (blau) und Lieferungen (rot)
- **Depot-Marker** (grün) für Start-/Endpunkt
- **GPS-Fahrzeuge** (orange) mit Live-Status
- **Routenlinien** mit verschiedenen Farben pro Tour
- **Zoom-Funktionen** und automatische Kartenanpassung

### Routenoptimierung

- **Travelling Salesman Problem (TSP)** Algorithmus
- **Vehicle Routing Problem (VRP)** für mehrere Fahrzeuge
- **Zeitfenster-Berücksichtigung** für Termine
- **Kapazitätsbeschränkungen** nach Fahrzeugtyp
- **Verkehrsdaten-Integration** für realistische Zeiten
- **Kosten-Optimierung** basierend auf Distanz und Zeit

### Service-Status-Monitoring

- **HERE Routing** Status-Anzeige
- **HERE Tour Planning** Verfügbarkeit
- **GPS Tracking** Verbindungsstatus
- **Automatische Tests** der Service-Verbindungen
- **Fehlerbehandlung** mit Fallback-Optionen

## 🚨 Troubleshooting

### Häufige Probleme

#### Karte lädt nicht
- **HERE API Key** überprüfen
- **Netzwerkverbindung** testen
- **Browser-Konsole** auf Fehler prüfen
- **CORS-Einstellungen** überprüfen

#### Keine Pipedrive-Daten
- **API Token** validieren
- **Feldmapping** in der Konfiguration prüfen
- **Demo-Modus** wird automatisch aktiviert

#### Routenoptimierung schlägt fehl
- **HERE Tour Planning API** Limits überprüfen
- **Zu viele Stopps** reduzieren (Max. 100)
- **Service-Status** im Panel überprüfen

#### GPS-Tracking funktioniert nicht
- **Traccar-Server** Erreichbarkeit testen
- **API-Credentials** überprüfen
- **Fahrzeuge** in Traccar konfigurieren

### Debug-Modus

```env
# Backend
DEBUG=true

# Frontend  
REACT_APP_DEBUG_MODE=true
```

Im Debug-Modus werden zusätzliche Logs ausgegeben und detaillierte Fehlermeldungen angezeigt.

## 📈 Performance-Optimierungen

### Caching-Strategien

- **Pipedrive-Daten**: 15 Minuten Cache
- **HERE API Responses**: Session-basiert
- **Karten-Tiles**: Browser-Cache
- **GPS-Positionen**: 30 Sekunden Cache

### API-Rate-Limits

- **HERE API**: 250.000 Requests/Monat (Free Tier)
- **Pipedrive API**: 100 Requests/10 Sekunden
- **Traccar API**: Unbegrenzt (eigener Server)

### Optimierung-Tipps

1. **Regionen-Filter** verwenden für weniger Daten
2. **Cache-Zeit** anpassen je nach Bedarf
3. **Batch-Requests** für mehrere Operationen
4. **Lazy Loading** für große Datensätze

## 🔮 Zukunftige Erweiterungen

### Geplante Features

- **Machine Learning** für bessere Routenvorhersagen
- **Echtzeit-Verkehrsdaten** Integration
- **Mobile App** für Fahrer
- **Automatische Benachrichtigungen** bei Verspätungen
- **Integration mit Telematik-Systemen**
- **Erweiterte Reporting-Funktionen**
- **Multi-Mandanten-Fähigkeit**

### API-Erweiterungen

- **Webhook-Support** für Echtzeit-Updates
- **GraphQL-Schnittstelle** für flexible Queries
- **Bulk-Operations** für große Datenmengen
- **Erweiterte Filter** und Sortier-Optionen

## 📞 Support

Bei Problemen oder Fragen zur Tourenplanung v2:

1. **Dokumentation** durchlesen
2. **Debug-Logs** überprüfen
3. **Service-Status** im Panel kontrollieren
4. **GitHub Issues** für Bug-Reports
5. **HERE Developer Support** für API-Probleme

## 📄 Lizenz

Dieses Modul verwendet folgende APIs und Services:

- **HERE Maps APIs**: Kommerzielle Lizenz erforderlich
- **Traccar**: Apache 2.0 License
- **React & Dependencies**: MIT License

Stellen Sie sicher, dass alle Lizenzbedingungen eingehalten werden.
