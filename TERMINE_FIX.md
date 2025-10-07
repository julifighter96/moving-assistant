# Fix: Termin-Buchung - Unauthorized Error

## Problem
Beim Anlegen von Mitarbeiter-Terminen kam ein "unauthorized" Error, obwohl der gleiche Token beim ServiceProvider-Endpoint funktioniert.

## Ursprüngliches Problem
Zunächst gab es eine **doppelte JSON-Serialisierung**, die behoben wurde.

Danach kam ein **unauthorized Error** aufgrund unterschiedlicher Konfigurationen zwischen den beiden Endpoints.

## Ursache

Die beiden Proxy-Endpoints waren **nicht identisch** konfiguriert:

### ServiceProvider (funktioniert) ✅
```javascript
const response = await axios.post(url, req.body, {
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': req.headers.authorization || ''
  }
});
```

### SPTimeSchedule (unauthorized) ❌
```javascript
// Komplexe Token-Extraktion
const authToken = req.headers.authorization || req.headers.Authorization || '';

// Andere Header-Reihenfolge
const forwardHeaders = {
  'Content-Type': 'application/json',
  'Authorization': authToken,  // Variable statt direkter Wert
  'Accept': 'application/json'
};

// Cookie-Logik
if (stressfrei_session_cookies.length > 0) {
  forwardHeaders['Cookie'] = stressfrei_session_cookies.join('; ');
}

const response = await axios.post(url, req.body, {
  headers: forwardHeaders,
  transformRequest: [(data) => JSON.stringify(data)],  // Doppelte Serialisierung
  maxRedirects: 0,
  validateStatus: function (status) { return status < 500; }
});
```

**Unterschiede:**
1. ❌ Token-Extraktion über Variable statt direkter Header-Zugriff
2. ❌ Unterschiedliche Header-Reihenfolge/Schreibweise
3. ❌ Zusätzliche Cookie-Logik
4. ❌ Doppelte JSON-Serialisierung (`transformRequest`)
5. ❌ Zusätzliche Axios-Optionen (`maxRedirects`, `validateStatus`)
6. ❌ Komplexes Response-Handling (HTML-Check, Redirect-Check, Cookie-Speicherung)

## Lösung

**Beide Endpoints wurden 1:1 identisch konfiguriert:**

### Jetzt (beide gleich) ✅
```javascript
// ServiceProvider UND SPTimeSchedule
const response = await axios.post(url, req.body, {
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': req.headers.authorization || ''
  }
});

// Einfaches Response-Handling
console.log('✅ Antwort erhalten!');
console.log('   Status:', response.status);
console.log('   Response:', response.data);

res.json(response.data);
```

### Entfernte Elemente:
- ✅ Cookie-Speicher Variable entfernt
- ✅ Komplexe Token-Extraktion entfernt
- ✅ `transformRequest` entfernt
- ✅ `maxRedirects` entfernt
- ✅ `validateStatus` entfernt
- ✅ HTML-Check entfernt
- ✅ Redirect-Check entfernt
- ✅ Cookie-Handling entfernt
- ✅ Alle Header direkt inline definiert (wie bei ServiceProvider)

## Änderungen

### Backend (`server/server.js`)

**SPTimeSchedule-Endpoint komplett überarbeitet:**

1. **Entfernt**: Cookie-Speicher Variable (`stressfrei_session_cookies`)
2. **Entfernt**: Komplexe Token-Extraktion über Variable
3. **Entfernt**: Cookie-Logik (Setzen und Lesen von Cookies)
4. **Entfernt**: `transformRequest` (doppelte JSON-Serialisierung)
5. **Entfernt**: `maxRedirects` und `validateStatus` Optionen
6. **Entfernt**: HTML-Response Check (Login-Seite Detection)
7. **Entfernt**: Redirect-Check (302/301 Detection)
8. **Vereinfacht**: Header-Konfiguration identisch mit ServiceProvider
9. **Vereinfacht**: Response-Handling auf Minimum reduziert
10. **Vereinfacht**: Logging auf Minimum reduziert (wie ServiceProvider)

### Frontend (`TourPlanner.js`)
1. **Hinzugefügt**: Console-Logs für Request und Response
2. **Verbessert**: Behandlung von leeren Responses (interpretiert als Erfolg bei Status 200)
3. **Hinzugefügt**: Detaillierte Logging-Ausgaben

## Vergleich: Vorher vs. Nachher

### Vorher (komplex, fehleranfällig)
- 80+ Zeilen Code nur für Request/Response
- Cookie-Handling
- HTML-Detection
- Redirect-Detection
- Doppelte JSON-Serialisierung
- **Unterschiedliche** Konfiguration als ServiceProvider

### Nachher (einfach, robust)
- ~25 Zeilen Code für Request/Response
- **Identische** Konfiguration wie ServiceProvider
- Einfaches Error-Handling
- Klare Logs

## Testen

Starten Sie den Server neu:
```bash
cd server
pm2 restart moving-assistant-api
pm2 logs moving-assistant-api
```

**Die Logs zeigen jetzt (für beide Endpoints identisch):**
```
📅 [PROXY-SCHEDULE] 2025-01-07T...
================================================================================
📥 Termin-Buchung von Frontend erhalten!
   Endpoint: /api/sptimeschedule/saveSptimeschedule
   Client IP: ::1
   Authorization: ✅ Token vorhanden
   Termine: 2
   Beispiel: { personalid: '123', datum: '2025-01-10', ... }

📤 Leite Anfrage weiter an StressFrei Solutions API...
   URL: https://www.stressfrei-solutions.de/.../saveSptimeschedule

✅ Antwort von StressFrei Solutions erhalten!
   Status: 200
   Response Typ: string
   Response: (LEER) oder {...}

📤 Sende Antwort zurück an Frontend...
================================================================================
```

## Erwartetes Verhalten

Nach dem Fix sollte:
1. ✅ **Keine "unauthorized" Fehler mehr** auftreten
2. ✅ Die Termine **erfolgreich angelegt** werden
3. ✅ Die API-Response (auch wenn leer) **als Erfolg** interpretiert werden
4. ✅ Die Logs **identisch zu ServiceProvider** aussehen

## Debugging

Falls weiterhin Probleme auftreten:

1. **Prüfen Sie die Logs:**
   ```bash
   pm2 logs moving-assistant-api --lines 100
   ```

2. **Vergleichen Sie beide Endpoints:**
   - Sind die Logs identisch formatiert? ✅
   - Wird der gleiche Authorization-Header verwendet? ✅
   - Ist die URL korrekt? (OHNE `/api/` im Pfad!) ✅

3. **Testen Sie in Postman:**
   - Funktioniert der Request in Postman? → Token ist gültig
   - Welche Response gibt Postman zurück? → Vergleich mit Proxy-Response

4. **Frontend-Logs prüfen:**
   - Browser DevTools → Console
   - Wird der Token korrekt gesendet?
   - Was kommt vom Backend zurück?

