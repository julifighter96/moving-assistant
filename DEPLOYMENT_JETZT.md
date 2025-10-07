# 🚀 JETZT DEPLOYEN

## ✅ Was wurde gefixt?

### Problem
Das Frontend hat versucht, **direkt** auf die StressFrei API zuzugreifen:
```
❌ https://www.stressfrei-solutions.de/dl2238205/...
```

Das führte zu:
- CORS-Fehler (Cross-Origin Blocking)
- HTML-Login-Seite statt JSON
- Authentifizierung fehlgeschlagen

### Lösung
Alle API-Calls gehen jetzt über den **Backend-Proxy**:
```
✅ Frontend → https://lolworlds.online/api/... (Proxy)
✅ Proxy → https://www.stressfrei-solutions.de/... (StressFrei)
```

---

## 📝 Geänderte Dateien

### Backend (server.js)
- ✅ Verbessertes Logging für Debugging
- ✅ Zeigt alle empfangenen Headers
- ✅ Zeigt weitergeleiteten Token
- ✅ Erkennt HTML-Login-Seiten

### Frontend
- ✅ `src/components/TourEmployeeAssignment.js` → Proxy-URLs
- ✅ `src/components/TourPlanner.js` → Proxy-URLs
- ✅ `src/pages/EmployeeScheduling.js` → Proxy-URLs

### Dokumentation
- ✅ `ENV_VORLAGE.md` → Aktualisiert mit Proxy-URLs
- ✅ `PROXY_FIX.md` → Detaillierte Erklärung
- ✅ `DEPLOYMENT_JETZT.md` → Diese Anleitung

---

## 🎯 DEPLOYMENT SCHRITTE

### 1️⃣ Code auf Server hochladen
```bash
cd /pfad/zu/moving-assistant
git pull origin master
```

### 2️⃣ Backend neu starten
```bash
cd server
pm2 restart moving-assistant-api

# ODER wenn nicht via pm2:
npm start
```

**Backend läuft jetzt mit verbessertem Logging!**

### 3️⃣ Frontend neu builden
```bash
cd ..
npm install  # Falls neue Dependencies
npm run build
```

### 4️⃣ Build deployen
Kopieren Sie den `build/` Ordner auf Ihren Webserver (wo aktuell die App läuft).

---

## 🧪 TESTEN

### Backend-Logs live ansehen
```bash
pm2 logs moving-assistant-api --lines 100
```

### Test durchführen
1. **App öffnen** im Browser
2. **Tourenplanung** → Tour erstellen
3. **"Weiter zur Mitarbeiter-Zuordnung"** klicken
4. **Orange TEST-Button** klicken
5. **Browser-Konsole** öffnen (F12)
6. **Backend-Logs** prüfen

### ✅ Erfolgreich wenn:

**Browser-Konsole:**
```
📤 TEST-SYNC: Sende 3 Termine...
🌐 API URL: https://lolworlds.online/api/sptimeschedule/saveSptimeschedule
🔑 API Token vorhanden? true
✅ RESPONSE STATUS: 200
📦 RESPONSE TYPE: object  ← WICHTIG: object, nicht string!
```

**Backend-Logs:**
```
📅 [PROXY-SCHEDULE] ...
🔍 ALLE EMPFANGENEN HEADERS:
{
  "authorization": "56DgRyuQDzuzbl9YinUK...",
  ...
}
✅ Termin-Buchung erfolgreich!
   Status: 200
   Content-Type: application/json  ← WICHTIG: JSON, nicht HTML!
   Antwort: { ... }
```

### ❌ Fehler wenn:

**Browser-Konsole:**
```
📦 RESPONSE TYPE: string  ← HTML statt JSON!
```

**Backend-Logs:**
```
❌ FEHLER: API gibt HTML-Login-Seite zurück!
   Status: 200
   Content-Type: text/html
```

**→ Dann liegt das Problem bei StressFrei API oder Token!**

---

## 🔍 Debugging

### Falls immer noch HTML zurückkommt:

1. **Token prüfen in Postman:**
   - Kopieren Sie den Token aus `.env`
   - Senden Sie den EXAKT GLEICHEN Request wie die App
   - Funktioniert es in Postman? → Dann liegt es am Header-Format
   - Funktioniert es NICHT in Postman? → Token ist ungültig

2. **Cookies in Postman prüfen:**
   - Deaktivieren Sie "Send cookies" in Postman
   - Funktioniert es dann noch? → Token ist OK
   - Funktioniert es NICHT mehr? → API braucht Session/Cookie

3. **StressFrei Support kontaktieren:**
   - "Warum gibt SPTimeSchedule API eine HTML-Login-Seite zurück?"
   - "Braucht diese API eine Session oder Cookie?"
   - "Ist der Token für beide APIs gültig (ServiceProvider + SPTimeSchedule)?"

---

## 🎉 Nächste Schritte (wenn erfolgreich)

- ✅ Grünen SAVE-Button testen (speichert auch zu Pipedrive)
- ✅ Im StressFrei-Kalender prüfen ob Termine ankommen
- ✅ Mehrere Mitarbeiter zuweisen testen
- ✅ Verschiedene Terminarten testen

---

## 📞 Support

Bei Fragen zu den Änderungen: Siehe `PROXY_FIX.md` für Details.

**WICHTIG:** Die Mitarbeiterabfrage funktioniert bereits über den Proxy, nur die Terminbuchung gibt noch HTML zurück. Das deutet auf ein Problem bei der StressFrei API oder Token-Berechtigungen hin!

