# 🔧 Postman → App Setup - Schritt für Schritt

## Problem: Postman funktioniert, App nicht

Die API gibt HTML-Login-Seite zurück → **Authentifizierung schlägt fehl**

## Lösung: Exakte Postman-Konfiguration kopieren

### Schritt 1: Postman öffnen

Öffnen Sie Ihren funktionierenden Request in Postman

### Schritt 2: URL kopieren

1. Schauen Sie in die **URL-Leiste** oben
2. Kopieren Sie die **vollständige URL**

Beispiel:
```
https://lolworlds.online/api/sptimeschedule/saveSptimeschedule
```

**WICHTIG:** Notieren Sie die URL EXAKT wie sie ist!

### Schritt 3: Headers prüfen

1. Klicken Sie auf Tab **"Headers"**
2. Notieren Sie **alle** Headers:

Beispiel:
```
Content-Type: application/json
Authorization: 56DgRyuQDzuzbl9YinUKEVPUcfo9Vn
Accept: application/json
```

**Achten Sie auf:**
- Groß-/Kleinschreibung
- Leerzeichen
- Ob "Bearer" dabei ist oder nicht

### Schritt 4: .env Datei aktualisieren

Öffnen Sie `.env` im Projekt-Root und setzen Sie:

```env
# Die EXAKTE URL aus Postman
REACT_APP_SPTIMESCHEDULE_API_URL=https://lolworlds.online/api/sptimeschedule/saveSptimeschedule

# Der Token aus Postman (ohne "Bearer")
REACT_APP_SFS_API_TOKEN=56DgRyuQDzuzbl9YinUKEVPUcfo9Vn
```

### Schritt 5: App neu starten

**WICHTIG:** Die App muss neu gestartet werden damit .env gelesen wird!

```powershell
# App stoppen (Ctrl+C im Terminal)
# Dann neu starten:
npm start
```

### Schritt 6: Testen

1. F12 → Konsole öffnen
2. Orange TEST-Button klicken
3. Prüfen Sie in der Konsole:

```
🌐 API URL: https://lolworlds.online/api/sptimeschedule/saveSptimeschedule
                    ^^^^^^^^^^^^ Stimmt mit Postman überein?

🔑 VOLLSTÄNDIGER Token: 56DgRyuQDzuzbl9YinUKEVPUcfo9Vn
                       ^^^^^^^^ Stimmt mit Postman überein?

📤 EXAKTE HEADERS:
{
  "Content-Type": "application/json",
  "Authorization": "56DgRyuQDzuzbl9YinUKEVPUcfo9Vn",  ← Ohne "Bearer"!
  "Accept": "application/json"
}

📋 VERGLEICHEN SIE MIT POSTMAN:
   - Content-Type: application/json  ← Gleich?
   - Authorization: 56DgRy...         ← Gleich?
   - Accept: application/json         ← Gleich?
```

## Häufige Probleme

### Problem 1: URL unterschiedlich

**In Postman:**
```
https://lolworlds.online/api/sptimeschedule/saveSptimeschedule
```

**In App (.env Standard):**
```
https://www.stressfrei-solutions.de/dl2238205/sptimeschedule/saveSptimeschedule
```

**Lösung:** Verwenden Sie die URL aus Postman in .env!

### Problem 2: Token Format

**In Postman:**
```
Authorization: 56DgRyuQDzuzbl9YinUKEVPUcfo9Vn
```

**In App (falsch):**
```
Authorization: Bearer 56DgRyuQDzuzbl9YinUKEVPUcfo9Vn
```

**Lösung:** KEIN "Bearer" verwenden!

### Problem 3: Zusätzliche Headers in Postman

Prüfen Sie in Postman ob es weitere Headers gibt:
- `x-api-key`
- `Cookie`
- `Session`
- Andere Custom Headers

### Problem 4: CORS

**Symptom:** Browser zeigt CORS-Fehler in Konsole

**Lösung:** 
1. Backend muss CORS aktivieren für Ihre Domain
2. Oder: API über Backend-Proxy aufrufen

## Postman Request als cURL exportieren

### Alternative Methode:

1. In Postman: Klicken Sie auf **Code** (Symbol `</>` rechts oben)
2. Wählen Sie **"cURL"**
3. Kopieren Sie den Code

Beispiel cURL:
```bash
curl --location 'https://lolworlds.online/api/sptimeschedule/saveSptimeschedule' \
--header 'Content-Type: application/json' \
--header 'Authorization: 56DgRyuQDzuzbl9YinUKEVPUcfo9Vn' \
--header 'Accept: application/json' \
--data '[...]'
```

Senden Sie mir den cURL-Command und ich passe den Code exakt an!

## Checkliste

Bevor Sie testen:

- [ ] ✅ URL aus Postman in .env kopiert?
- [ ] ✅ Token aus Postman in .env kopiert?
- [ ] ✅ App neu gestartet nach .env Änderung?
- [ ] ✅ F12 Konsole geöffnet?
- [ ] ✅ Headers in Konsole stimmen mit Postman überein?
- [ ] ✅ Keine CORS-Fehler in Konsole (rot)?

## Expected Console Output (Erfolg)

```
🌐 API URL: https://lolworlds.online/api/sptimeschedule/saveSptimeschedule
🔑 VOLLSTÄNDIGER Token: 56DgRyuQDzuzbl9YinUKEVPUcfo9Vn

📤 EXAKTE HEADERS:
{
  "Content-Type": "application/json",
  "Authorization": "56DgRyuQDzuzbl9YinUKEVPUcfo9Vn",
  "Accept": "application/json"
}

✅ RESPONSE STATUS: 200
📦 RESPONSE DATA: { success: true, created: 3 }
📦 RESPONSE TYPE: object  ← MUSS "object" sein, nicht "string"!
```

## Wenn es immer noch HTML gibt

**Dann ist es ein CORS-Problem!**

Die API erlaubt keine Requests vom Browser aus. Postman umgeht CORS, Browser nicht.

**Lösung:** Backend-Administrator muss CORS aktivieren für:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Headers: Content-Type, Authorization, Accept
Access-Control-Allow-Methods: POST, OPTIONS
```

## Nächste Schritte

1. **Prüfen Sie** Ihre `.env` Datei
2. **Kopieren Sie** die exakte URL aus Postman
3. **Starten Sie** die App neu
4. **Testen Sie** erneut
5. **Senden Sie mir** die Konsolen-Logs (zwischen `═══` Linien)

Mit den exakten Logs kann ich das Problem sofort identifizieren!

