# Umgebungsvariablen Setup für Tourenplanung v2

## ✅ **Konfiguration prüfen**

Das Backend wurde so konfiguriert, dass es automatisch nach Umgebungsvariablen in folgenden Dateien sucht:
1. `.env.development` (Hauptverzeichnis)
2. `.env` (Hauptverzeichnis)
3. `server/.env` (Server-Verzeichnis)

## 🔍 **Umgebungsvariablen testen**

Führen Sie diesen Befehl aus, um zu prüfen, welche Variablen geladen wurden:

```bash
cd server
node checkEnv.js
```

## 📋 **Erforderliche Variablen**

### **Für Auftragsanzeige (ERFORDERLICH):**
```env
# In .env.development
REACT_APP_PIPEDRIVE_API_TOKEN=your_pipedrive_token
REACT_APP_PIPEDRIVE_API_URL=https://api.pipedrive.com/v1
```

### **Für Routenoptimierung (EMPFOHLEN):**
```env
# Backend (server/)
HERE_API_KEY=your_here_api_key

# Frontend
REACT_APP_HERE_API_KEY=your_here_api_key
```

### **Für GPS-Tracking (OPTIONAL):**
```env
# Traccar Integration
TRACCAR_BASE_URL=https://your-traccar-instance.com/api
TRACCAR_API_KEY=your_traccar_api_key
# ODER
TRACCAR_USERNAME=your_username
TRACCAR_PASSWORD=your_password
```

### **Für Authentifizierung (ERFORDERLICH):**
```env
JWT_SECRET=your_jwt_secret_key
```

## 🚀 **Backend neu starten**

Nach der Konfiguration das Backend neu starten:

```bash
cd server
npm start
```

## 🎯 **Funktionsverfügbarkeit**

- **Ohne Pipedrive**: Keine Aufträge → Modul zeigt leere Listen
- **Ohne HERE API**: Keine Routenoptimierung → Fallback auf einfache Verteilung
- **Ohne Traccar**: Keine Live-Fahrzeuge → Dashboard zeigt leere Karte
- **Ohne JWT_SECRET**: Authentifizierung funktioniert nicht

## ✅ **Erfolgreich konfiguriert wenn:**

1. `node checkEnv.js` zeigt alle erforderlichen Variablen als "✅ Vorhanden"
2. Backend startet ohne Konfigurationsfehler
3. Frontend kann sich anmelden und Daten laden
4. Tour Planning v2 zeigt echte Pipedrive-Daten

## 🔧 **Debugging**

Wenn etwas nicht funktioniert:

1. **Umgebungsvariablen prüfen**: `node checkEnv.js`
2. **Backend-Logs prüfen**: Achten Sie auf Konfigurationsfehler beim Start
3. **Browser-Konsole prüfen**: API-Aufrufe und Fehler
4. **Netzwerk-Tab prüfen**: HTTP-Requests und Responses

Das System ist jetzt so konfiguriert, dass es Ihre vorhandenen Umgebungsvariablen automatisch erkennt und verwendet!
