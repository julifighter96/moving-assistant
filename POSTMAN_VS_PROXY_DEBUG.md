# 🔍 Debug: Postman vs. Proxy

## Problem

**Postman:** ✅ Request funktioniert, gibt `true` zurück, Termin wird angelegt
**App (via Proxy):** ❌ Request gibt leeren String zurück, Termin wird NICHT angelegt

→ **Der Proxy leitet etwas anders weiter als Postman sendet!**

---

## 🧪 Debug-Schritte

### Schritt 1: Backend neu starten (mit neuem Logging)

```bash
cd server
pm2 restart moving-assistant-api

# ODER:
npm start
```

### Schritt 2: Test durchführen

1. **Orange TEST-Button** in der App klicken
2. **Backend-Logs öffnen:**
   ```bash
   pm2 logs moving-assistant-api --lines 200
   ```

### Schritt 3: Logs analysieren

**Suchen Sie nach diesen Zeilen:**

```
📅 [PROXY-SCHEDULE] ...
📥 Termin-Buchung von Frontend erhalten!

🔍 ALLE EMPFANGENEN HEADERS:
{
  "authorization": "...",
  "content-type": "...",
  "accept": "...",
  "user-agent": "...",  ← Steht hier was?
  "cookie": "...",       ← Steht hier was?
  ...
}

📤 HEADERS DIE WEITERGELEITET WERDEN:
{
  "Content-Type": "application/json",
  "Authorization": "...",
  "Accept": "application/json"
}

📦 BODY DER WEITERGELEITET WIRD:
[
  {
    "personalid": "...",
    "terminart": "...",
    ...
  }
]
   Body Typ: object
   Ist Array? true
   Anzahl Termine: 3

✅ Termin-Buchung erfolgreich!
   Status: 200
   Content-Type: ???  ← Was steht hier?
   Response Typ: string  ← Sollte "object" sein!
   Response Länge: 0
   Antwort: ""

   ⚠️ WARNUNG: Response ist LEER!  ← Das ist das Problem!
   Status war: 200
   Alle Response Headers: { ... }  ← Prüfen Sie diese!
```

---

## 🎯 Mögliche Ursachen

### 1. **Postman sendet Cookies mit**

**Prüfen:**
- In Postman → Cookies-Tab → Sind Cookies für `stressfrei-solutions.de` gespeichert?

**Test:**
- Deaktivieren Sie Cookies in Postman
- Senden Sie Request erneut
- Funktioniert es NOCH? 
  - ✅ JA → Cookies sind nicht das Problem
  - ❌ NEIN → API braucht Session/Cookie!

**Lösung wenn Cookies nötig:**
Der Proxy muss Cookie-Header weiterleiten:
```javascript
'Cookie': req.headers.cookie || ''
```

### 2. **Postman sendet zusätzliche Headers**

**Exportieren Sie Ihren Postman-Request:**

1. **In Postman:**
   - Request auswählen
   - Rechtsklick → "Export"
   - Als JSON speichern

2. **Oder kopieren Sie den Code:**
   - Klicken Sie auf "Code" (</>)
   - Wählen Sie "cURL"
   - Kopieren Sie alle Header

3. **Vergleichen Sie mit Backend-Logs:**
   - Welche Header sendet Postman?
   - Welche Header leitet der Proxy weiter?
   - Fehlt einer?

### 3. **Body-Format unterschiedlich**

**Prüfen Sie in Backend-Logs:**
```
📦 BODY DER WEITERGELEITET WIRD:
   Body Typ: object  ← Sollte "object" sein
   Ist Array? true   ← Sollte "true" sein
```

**Falls hier "string" steht:**
→ Body wird doppelt JSON.stringify() - das ist falsch!

### 4. **Content-Type unterschiedlich**

**In Postman prüfen:**
- Headers → Was steht bei `Content-Type`?
  - `application/json` ✅
  - `application/json; charset=utf-8` ✅
  - Etwas anderes? ❌

**Im Proxy (server.js) prüfen:**
```javascript
'Content-Type': 'application/json',  // Korrekt?
```

### 5. **Authorization-Format unterschiedlich**

**In Postman prüfen:**
- Headers → `Authorization` → Wie sieht der Wert aus?
  - `56DgRyuQDzuzbl9YinUK...` ✅ (ohne "Bearer")
  - `Bearer 56DgRyuQ...` ❌ (mit "Bearer")

**Im Proxy-Log prüfen:**
```
🔑 Authorization Token:
   Wert (erste 20 Zeichen): 56DgRyuQDzuzbl9YinUK...
```

Sollte EXAKT gleich sein wie in Postman!

---

## 🔧 Sofort-Fix-Versuche

### Versuch 1: Alle Request-Headers weiterleiten

**In `server/server.js`** (Zeile ~1517):

```javascript
// Statt nur ausgewählte Headers:
const forwardHeaders = {
  'Content-Type': 'application/json',
  'Authorization': authToken,
  'Accept': 'application/json'
};

// ALLE Headers vom Frontend weiterleiten:
const forwardHeaders = {
  ...req.headers,  // Alle Headers übernehmen
  'host': 'www.stressfrei-solutions.de',  // Nur Host überschreiben
  'authorization': authToken  // Token explizit setzen
};
delete forwardHeaders['content-length'];  // Axios berechnet neu
```

### Versuch 2: User-Agent setzen

```javascript
const forwardHeaders = {
  'Content-Type': 'application/json',
  'Authorization': authToken,
  'Accept': 'application/json',
  'User-Agent': 'PostmanRuntime/7.26.8'  // Postman nachahmen
};
```

### Versuch 3: Cookies weiterleiten (falls vorhanden)

```javascript
const forwardHeaders = {
  'Content-Type': 'application/json',
  'Authorization': authToken,
  'Accept': 'application/json'
};

if (req.headers.cookie) {
  forwardHeaders['Cookie'] = req.headers.cookie;
}
```

---

## 📋 Checkliste

Bitte prüfen Sie:

- [ ] Backend-Logs zeigen empfangene Headers
- [ ] Backend-Logs zeigen weitergeleiteten Body
- [ ] Backend-Logs zeigen Response Type = "string" und Länge = 0
- [ ] Postman-Request hat Cookies? (Cookies-Tab prüfen)
- [ ] Postman-Request hat zusätzliche Header? (Code-Export vergleichen)
- [ ] Authorization Token ist identisch (Postman vs. Backend-Log)
- [ ] Content-Type ist identisch (Postman vs. Backend-Log)

---

## 💡 Nächste Schritte

1. **Führen Sie Schritt 1-3 aus** (Backend neu starten, testen, Logs prüfen)
2. **Senden Sie mir:**
   - Die vollständigen Backend-Logs (von `📅 [PROXY-SCHEDULE]` bis `📤 Sende Bestätigung`)
   - Einen Screenshot von Postman Headers (oder cURL-Export)
   - Einen Screenshot von Postman Cookies-Tab
3. **Ich identifiziere** den fehlenden/falschen Header
4. **Ich fixe** den Proxy-Code

---

## ⚙️ Fortgeschrittener Debug

### Request genau wie Postman nachstellen

Falls Sie Zugriff auf `curl` haben:

```bash
# Exportieren Sie den Postman-Request als cURL
# Führen Sie ihn direkt auf dem Server aus:
curl 'https://www.stressfrei-solutions.de/dl2238205/backend/sptimeschedule/saveSptimeschedule' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: 56DgRyuQDzuzbl9YinUK...' \
  -H 'Accept: application/json' \
  --data-raw '[{"personalid":"...","terminart":"..."}]'
```

**Funktioniert dieser cURL-Befehl?**
- ✅ JA → Proxy-Problem (Code ist falsch)
- ❌ NEIN → Server-Problem (Server blockt Request)

Bitte führen Sie die Debug-Schritte aus und senden Sie mir die Logs! 🚀

