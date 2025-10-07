# 🔍 Termine Debuggen - Anleitung

## Browser-Konsole öffnen

### In Chrome/Edge:
1. Drücken Sie **F12** oder
2. Rechtsklick → "Untersuchen" → Tab "Console"

### In Firefox:
1. Drücken Sie **F12** oder
2. Rechtsklick → "Element untersuchen" → Tab "Konsole"

## Was Sie in der Konsole sehen sollten

### Bei erfolgreichem Test-Sync:

```
🧪 TEST-SYNC: Sende Termine an SPTimeSchedule (ohne Pipedrive)...
📤 TEST-SYNC: Sende 6 Termine...
═══════════════════════════════════════════
📋 VOLLSTÄNDIGER PAYLOAD:
[
  {
    "personalid": "emp001",
    "terminart": "5fd2037-9c",
    "vorgangsno": "12345",
    "angebotsno": "67890",
    "datum": "2025-01-06",
    "startzeit": "08:30:00",
    "endzeit": "10:00:00",
    "kommentar": "[TEST] Tour: ... | Station 1/3 | ...",
    "rolle": ["Transportfachkraft"],
    "kennzeichen": "KA-RD 1234"
  },
  ...
]
═══════════════════════════════════════════
🌐 API URL: https://www.stressfrei-solutions.de/...
🔑 API Token vorhanden? true
═══════════════════════════════════════════
✅ RESPONSE STATUS: 200
📦 RESPONSE DATA: { success: true, ... }
═══════════════════════════════════════════
```

### Bei Fehler:

```
═══════════════════════════════════════════
❌ TEST-SYNC FEHLER:
Error Message: Request failed with status code 401
Error Response: { error: "Unauthorized" }
Error Status: 401
═══════════════════════════════════════════
```

## Häufige Fehler & Lösungen

### 1. Error 401 - Unauthorized
```
Error Status: 401
Error Response: { error: "Unauthorized" }
```

**Problem:** API-Token fehlt oder ungültig

**Lösung:**
1. Öffnen Sie `.env` Datei
2. Prüfen Sie:
   ```
   REACT_APP_SFS_API_TOKEN=ihr_echter_token
   ```
3. Token von Jonathan anfordern
4. App neu starten: `npm start`

### 2. Error 400 - Bad Request
```
Error Status: 400
Error Response: { error: "Invalid personalid" }
```

**Problem:** Ungültige Mitarbeiter-ID oder Datenformat

**Lösung:**
1. Prüfen Sie im Payload die `personalid`
2. Stellen Sie sicher, dass Mitarbeiter existiert
3. Format muss UUID sein

### 3. Error 404 - Not Found
```
Error Status: 404
```

**Problem:** API-URL falsch

**Lösung:**
1. Prüfen Sie in der Konsole: "🌐 API URL: ..."
2. In `.env`:
   ```
   REACT_APP_SPTIMESCHEDULE_API_URL=https://www.stressfrei-solutions.de/dl2238205/backend/sptimeschedule/saveSptimeschedule
   ```

### 4. Network Error
```
Error Message: Network Error
```

**Problem:** API nicht erreichbar oder CORS-Fehler

**Lösung:**
1. Prüfen Sie Internetverbindung
2. Firewall/Proxy prüfen
3. API-Server läuft?

### 5. Keine Logs sichtbar
```
(leere Konsole)
```

**Problem:** Konsole nicht geöffnet oder Filter aktiv

**Lösung:**
1. F12 drücken
2. Tab "Console" wählen
3. Filter zurücksetzen (X-Button in Konsole)
4. "All levels" auswählen

## Schritt-für-Schritt Debug

### 1. Konsole öffnen
- **F12** drücken
- Tab **"Console"** wählen

### 2. Filter setzen
In der Konsole-Suchleiste eingeben: `TEST-SYNC`

### 3. Test-Button klicken
Klicken Sie den **orange** Button "🧪 TEST: Nur Termine..."

### 4. Logs prüfen
Suchen Sie nach:
- ✅ `📤 TEST-SYNC: Sende X Termine...`
- ✅ `📋 VOLLSTÄNDIGER PAYLOAD:`
- ✅ `✅ RESPONSE STATUS: 200`

### 5. Payload prüfen
Kopieren Sie den Payload und prüfen Sie:
```json
{
  "personalid": "...",      // ← Ist das eine gültige UUID?
  "terminart": "...",       // ← Ist das eine gültige Terminart?
  "vorgangsno": "...",      // ← Ist das eine Pipedrive ID?
  "datum": "2025-01-06",    // ← Format korrekt (YYYY-MM-DD)?
  "startzeit": "08:30:00",  // ← Format korrekt (HH:MM:SS)?
  "endzeit": "10:00:00",    // ← Format korrekt (HH:MM:SS)?
  "rolle": ["Monteur"],     // ← Ist das ein Array?
  "kennzeichen": "KA-RD 1234" // ← Kennzeichen gesetzt?
}
```

## Netzwerk-Tab prüfen

### 1. Netzwerk-Tab öffnen
- F12 → Tab **"Network"** oder **"Netzwerkanalyse"**

### 2. Filter setzen
- Filter auf **"XHR"** oder **"Fetch"**

### 3. Test-Button klicken
Erneut den Test-Button klicken

### 4. Request finden
Suchen Sie nach: `saveSptimeschedule`

### 5. Request prüfen
Klicken Sie auf den Request:
- **Headers**: Prüfen Sie Authorization-Header
- **Payload**: Sehen Sie die gesendeten Daten
- **Preview**: Sehen Sie die Antwort
- **Response**: Raw Response Data

## Was Sie sehen sollten

### Success Response (200/201):
```json
{
  "success": true,
  "created": 6,
  "appointments": [...]
}
```
oder
```json
{
  "status": "ok",
  "message": "Termine erfolgreich erstellt"
}
```

### Error Response (4xx/5xx):
```json
{
  "error": "Unauthorized",
  "message": "Invalid API token"
}
```

## Test-Checkliste

Bevor Sie testen, prüfen Sie:

- [ ] ✅ Tour hat Datum
- [ ] ✅ Mindestens 1 Mitarbeiter zugewiesen
- [ ] ✅ Mindestens 1 Station vorhanden
- [ ] ✅ Transport-Arten ausgewählt (optional, aber empfohlen)
- [ ] ✅ Rollen ausgewählt (Standard: Monteur)
- [ ] ✅ API-Token in .env gesetzt
- [ ] ✅ Browser-Konsole geöffnet (F12)
- [ ] ✅ App läuft ohne andere Fehler

## Beispiel: Erfolgreicher Test

### Konsolen-Output:
```
🧪 TEST-SYNC: Sende Termine an SPTimeSchedule (ohne Pipedrive)...
📤 TEST-SYNC: Sende 6 Termine...
═══════════════════════════════════════════
📋 VOLLSTÄNDIGER PAYLOAD:
[
  {
    "personalid": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "terminart": "5fd2037-9c",
    "vorgangsno": "12345",
    "angebotsno": "67890",
    "datum": "2025-01-06",
    "startzeit": "08:30:00",
    "endzeit": "10:00:00",
    "kommentar": "[TEST] Tour: Nord | Station 1/3 | Musterstr. 1",
    "rolle": ["Transportfachkraft"],
    "kennzeichen": "KA-RD 1234"
  },
  ... 5 weitere Termine
]
═══════════════════════════════════════════
🌐 API URL: https://www.stressfrei-solutions.de/dl2238205/backend/sptimeschedule/saveSptimeschedule
🔑 API Token vorhanden? true
═══════════════════════════════════════════
✅ RESPONSE STATUS: 200
📦 RESPONSE DATA: { success: true, created: 6 }
═══════════════════════════════════════════
```

### Alert-Meldung:
```
✅ TEST ERFOLGREICH!

API Response Status: 200
6 Termine an SPTimeSchedule gesendet:
• 2 Mitarbeiter
• 3 Stationen pro Mitarbeiter

Transport-Arten:
  • 🎹 Klaviertransport: 4×
  • 📦 Normaler Umzug: 2×

⚠️ HINWEIS: Dies war ein TEST.
Die Tour wurde NICHT in Pipedrive gespeichert.
Prüfen Sie die Browser-Konsole (F12) für Details!

Response: {"success":true,"created":6}...
```

## Typische Probleme

### Problem 1: "🔑 API Token vorhanden? false"

**Lösung:**
```bash
# In .env Datei:
REACT_APP_SFS_API_TOKEN=ihr_token_hier
```

Dann App neu starten!

### Problem 2: Payload enthält "personalid": "undefined"

**Lösung:**
- Mitarbeiter wurden nicht korrekt geladen
- Prüfen Sie ServiceProvider API
- Stellen Sie sicher, dass Mitarbeiter eine gültige ID haben

### Problem 3: "terminart": "undefined"

**Lösung:**
- Wählen Sie Terminart im TourPlanner aus
- Oder wählen Sie Transport-Art für die Station

### Problem 4: Response 200, aber Termine nicht im Kalender

**Mögliche Ursachen:**
1. **Falsches Datum**: Prüfen Sie das Datum im Payload
2. **Falscher Mitarbeiter**: PersonalID existiert nicht
3. **Terminart ungültig**: ID nicht im System
4. **Zeitformat falsch**: Muss HH:MM:SS sein

**Debug:**
```
Kopieren Sie die "personalid" aus dem Payload
Suchen Sie nach diesem Mitarbeiter im Stressfrei-System
Prüfen Sie, ob Termine für diesen Mitarbeiter an diesem Datum sichtbar sind
```

## Weitere Debug-Tools

### 1. Payload kopieren
1. Öffnen Sie Konsole (F12)
2. Finden Sie den Log `📋 VOLLSTÄNDIGER PAYLOAD:`
3. Rechtsklick auf das Objekt
4. "Copy object" oder "Als Objekt kopieren"
5. In Text-Editor einfügen und prüfen

### 2. Response kopieren
1. Finden Sie `📦 RESPONSE DATA:`
2. Kopieren Sie die Antwort
3. Prüfen Sie, ob `success: true` oder Fehlermeldung

### 3. Network-Tab verwenden
1. F12 → Tab "Network"
2. Test-Button klicken
3. Finden Sie Request "saveSptimeschedule"
4. Rechtsklick → "Copy as cURL"
5. Testen Sie den Request extern

## Kontakt & Support

Wenn der Test fehlschlägt:

1. **Konsolen-Logs kopieren** (die Zeilen mit ═══)
2. **Screenshot der Fehlermeldung** machen
3. **Payload kopieren** (das JSON)
4. An Jonathan/Administrator senden

Mit diesen Informationen kann das Problem schnell gelöst werden!

## Quick-Check

Öffnen Sie die Konsole und suchen Sie nach:

✅ **Erfolg:**
- `✅ RESPONSE STATUS: 200` oder `201`
- `📦 RESPONSE DATA` zeigt Erfolg

❌ **Fehler:**
- `❌ TEST-SYNC FEHLER`
- `Error Status: 401/400/500`
- Fehlermeldung in roter Schrift

## Nächste Schritte

### Wenn Test erfolgreich:
→ Normale Speicherung verwenden (blauer Button)

### Wenn Test fehlschlägt:
1. Logs aus Konsole kopieren
2. Probleme anhand dieser Anleitung prüfen
3. Bei Bedarf Administrator kontaktieren

