# 🍪 Cookie-Problem gefunden und Lösung

## ❌ Problem

Die StressFrei API gibt **HTTP 302 Redirect** zurück:
```
Status: 302
Location: https://www.stressfrei-solutions.de/dl2238205/backend/
set-cookie: CAKEPHP=...
```

**Das bedeutet:** Die API leitet zur Login-Seite um = **Authentifizierung fehlgeschlagen!**

---

## 🔍 Warum funktioniert es in Postman?

**Postman sendet vermutlich zusätzlich zum Token auch COOKIES mit!**

Die StressFrei API verwendet:
- ✅ **Authorization Token** (für API-Zugriff)
- ✅ **Session-Cookie (CAKEPHP)** (für Session-Verwaltung)

**Beides zusammen** ist nötig!

---

## 🧪 SCHRITT 1: Cookies in Postman prüfen

### In Postman:

1. **Öffnen Sie Ihren funktionierenden Request**
2. **Klicken Sie auf "Cookies"** (Button unter "Send")
3. **Screenshot** oder kopieren Sie alle Cookies für `stressfrei-solutions.de`

**Erwartetes Ergebnis:**
```
CAKEPHP=f443e85c0103c5dadf6fda9779036b14
```

**Falls KEINE Cookies da sind:**
- → Token alleine funktioniert
- → Problem liegt woanders (ich muss weiter debuggen)

**Falls Cookies DA sind:**
- → Cookie ist nötig!
- → Wir müssen ihn im Proxy verwenden

---

## 🔧 SCHRITT 2: Cookie im Backend hardcoden (temporär)

### Option A: In .env Datei (EMPFOHLEN)

**Auf dem Server:**
```bash
nano server/.env
```

**Fügen Sie hinzu:**
```bash
# StressFrei Session Cookie (aus Postman kopiert)
STRESSFREI_SESSION_COOKIE=CAKEPHP=f443e85c0103c5dadf6fda9779036b14
```

**Speichern** und **Backend neu starten:**
```bash
pm2 restart moving-assistant-api
```

### Option B: Direkt in server.js (schneller Test)

**In `server/server.js`** (Zeile ~16):
```javascript
// Cookie-Speicher für StressFrei API (simpler In-Memory Store)
let stressfrei_session_cookies = [
  'CAKEPHP=HIER-DEN-COOKIE-WERT-AUS-POSTMAN-EINFÜGEN'
];
```

**Backend neu starten:**
```bash
pm2 restart moving-assistant-api
```

---

## 🚀 SCHRITT 3: Testen

1. **Orange TEST-Button** klicken
2. **Backend-Logs** prüfen:
   ```bash
   pm2 logs moving-assistant-api --lines 100
   ```

**Erwartetes Ergebnis:**
```
🍪 FÜGE GESPEICHERTE COOKIES HINZU:
    CAKEPHP=f443e85c0103c5dadf6fda9779036b14

✅ Termin-Buchung erfolgreich!
   Status: 200  ← NICHT mehr 302!
   Antwort: { "success": true, ... }  ← JSON statt leer!
```

---

## 📋 Was ich gerade gecodet habe:

### Backend-Änderungen (`server.js`):

1. **Cookie-Speicher** hinzugefügt:
   ```javascript
   let stressfrei_session_cookies = [];
   ```

2. **Cookies werden automatisch gespeichert** aus jeder API-Response:
   ```javascript
   if (response.headers['set-cookie']) {
     stressfrei_session_cookies = extractCookies(response);
   }
   ```

3. **Cookies werden automatisch mitgesendet** bei jedem Request:
   ```javascript
   if (stressfrei_session_cookies.length > 0) {
     forwardHeaders['Cookie'] = stressfrei_session_cookies.join('; ');
   }
   ```

4. **302 Redirects werden erkannt** und als Fehler zurückgegeben:
   ```javascript
   if (response.status === 302) {
     return res.status(401).json({ error: 'Auth failed' });
   }
   ```

---

## ⚠️ WICHTIG

**Cookies laufen ab!**

Session-Cookies sind typischerweise **24 Stunden** gültig (wie in den Logs zu sehen: `Max-Age=86400`).

**Langfristige Lösung:**
1. **Login-Endpoint** im Proxy implementieren
2. Proxy macht **automatischen Login** mit Username/Password
3. Proxy speichert **Session-Cookie** für 24h
4. Nach Ablauf: **Automatischer Re-Login**

**Kurzfristige Lösung:**
- Cookie aus Postman kopieren
- Im Backend hardcoden
- Alle 24h manuell neu setzen

---

## 🔄 Alternativen

### Alternative 1: Token-Only Auth

**Fragen Sie StressFrei Support:**
- "Kann die API NUR mit dem Authorization-Token genutzt werden?"
- "Warum ist ein Session-Cookie zusätzlich nötig?"
- "Gibt es einen API-Endpoint der NUR Token-Auth nutzt?"

### Alternative 2: Login-Flow implementieren

**Wir bauen einen Login-Endpoint im Proxy:**
1. Proxy sendet Username/Password an StressFrei Login-Seite
2. StressFrei gibt Session-Cookie zurück
3. Proxy speichert Cookie
4. Alle nachfolgenden Requests nutzen Cookie + Token

**Code-Beispiel:**
```javascript
// Login-Endpoint für Proxy
app.post('/api/stressfrei/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Login bei StressFrei
  const loginResponse = await axios.post(
    'https://www.stressfrei-solutions.de/dl2238205/backend/users/check_login',
    { username, password }
  );
  
  // Speichere Session-Cookie
  stressfrei_session_cookies = extractCookies(loginResponse);
  
  res.json({ success: true });
});
```

---

## 📊 Zusammenfassung

| Schritt | Status | Aktion |
|---------|--------|--------|
| Problem identifiziert | ✅ | 302 Redirect = Cookie fehlt |
| Cookie-Management codiert | ✅ | Backend bereit |
| **Cookie aus Postman extrahieren** | ⏳ | **BITTE TUN** |
| Cookie in Backend einfügen | ⏳ | Warten auf Cookie |
| Backend deployen | ⏳ | Nach Cookie-Einfügung |
| Testen | ⏳ | Sollte dann funktionieren |

---

## 🎯 NÄCHSTER SCHRITT

**Bitte senden Sie mir:**

1. **Screenshot** von Postman → Cookies-Tab für `stressfrei-solutions.de`
2. **ODER** kopieren Sie den Cookie-Wert:
   ```
   Name: CAKEPHP
   Value: f443e85c0103c5dadf6fda9779036b14
   ```

Dann kann ich Ihnen **exakt** sagen, was Sie einfügen müssen! 🚀

