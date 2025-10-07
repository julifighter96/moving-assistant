# 🔧 Proxy-Fix für StressFrei API

## Problem
Die Frontend-App hat versucht, direkt auf die StressFrei API zuzugreifen, was zu CORS-Problemen und Authentifizierungsfehlern führte.

## Lösung
Alle API-Calls gehen jetzt über den Backend-Proxy auf `lolworlds.online`.

## Geänderte Dateien

### Frontend (URLs auf Proxy umgestellt):
1. ✅ `src/components/TourEmployeeAssignment.js`
2. ✅ `src/components/TourPlanner.js`
3. ✅ `src/pages/EmployeeScheduling.js`

### Backend (Verbessertes Logging):
4. ✅ `server/server.js`
   - Zeigt ALLE empfangenen Headers
   - Zeigt den weitergeleiteten Token
   - Prüft ob Antwort HTML ist (Login-Seite)
   - Verwendet exakte Header-Reihenfolge von Postman

## URLs (NEU)

**Frontend ruft jetzt auf:**
```
❌ ALT: https://www.stressfrei-solutions.de/dl2238205/...
✅ NEU: https://lolworlds.online/api/...
```

**Backend-Proxy leitet weiter an:**
```
https://www.stressfrei-solutions.de/dl2238205/backend/...
```

## Deployment auf Server

### 1. Code auf Server hochladen
```bash
git pull origin master
```

### 2. Backend neu starten (Port 3001)
```bash
cd server
pm2 restart moving-assistant-api
# oder
pm2 stop moving-assistant-api
npm start
```

### 3. Frontend neu builden & deployen
```bash
cd ..
npm run build
# Deploy build/ Ordner auf Webserver
```

### 4. Logs überwachen
```bash
# Backend-Logs in Echtzeit
pm2 logs moving-assistant-api

# Wichtige Log-Zeilen:
# - "🔍 ALLE EMPFANGENEN HEADERS" - Zeigt was vom Frontend kommt
# - "🔑 Authorization Token" - Zeigt ob Token ankommt
# - "📤 HEADERS DIE WEITERGELEITET WERDEN" - Zeigt was an StressFrei geht
# - "❌ FEHLER: API gibt HTML-Login-Seite zurück" - Wenn Auth fehlschlägt
```

## Test nach Deployment

1. **Orange TEST-Button** klicken in der Mitarbeiter-Zuordnung
2. **Browser-Konsole** öffnen (F12)
3. **Backend-Logs** prüfen:
   ```bash
   pm2 logs moving-assistant-api --lines 50
   ```

## Erwartetes Ergebnis

### ✅ Erfolgreich:
```
📅 [PROXY-SCHEDULE] ...
📥 Termin-Buchung von Frontend erhalten!
🔍 ALLE EMPFANGENEN HEADERS:
{
  "authorization": "56DgRyuQDzuzbl9YinUK...",
  "content-type": "application/json",
  ...
}
🔑 Authorization Token:
   Vorhanden? ✅ JA
   Wert (erste 20 Zeichen): 56DgRyuQDzuzbl9YinUK...
📤 HEADERS DIE WEITERGELEITET WERDEN:
{
  "Content-Type": "application/json",
  "Authorization": "56DgRyuQDzuzbl9YinUK...",
  "Accept": "application/json"
}
✅ Termin-Buchung erfolgreich!
   Status: 200
   Content-Type: application/json
```

### ❌ Fehler:
```
❌ FEHLER: API gibt HTML-Login-Seite zurück!
   Status: 200
   Content-Type: text/html
🔍 MÖGLICHE URSACHEN:
   1. Token ist UNGÜLTIG oder ABGELAUFEN
   2. Token-Format ist falsch (sollte OHNE "Bearer" sein)
   3. API erwartet zusätzliche Cookies/Session
   4. Token hat nicht die nötigen Berechtigungen für diese API
```

## Weitere Schritte bei Fehler

1. **Token in Postman prüfen:**
   - Funktioniert der gleiche Token in Postman?
   - Werden Cookies in Postman mitgesendet?
   - Ist eine Session nötig?

2. **Backend-Logs vergleichen:**
   - Stimmt der Token überein mit dem in Postman?
   - Sind die Header identisch?

3. **StressFrei Support kontaktieren:**
   - Unterschiedliche Auth für verschiedene Endpoints?
   - Braucht SPTimeSchedule API eine Session/Cookie?
   - Ist der Token für beide APIs gültig?

## Notizen

- Die **Mitarbeiterabfrage funktioniert** über den Proxy ✅
- Die **Terminbuchung gibt HTML zurück** ❌
- Beide verwenden den **gleichen Proxy-Code** 🤔
- → Problem liegt vermutlich bei der **StressFrei API** oder **Token-Berechtigungen**

