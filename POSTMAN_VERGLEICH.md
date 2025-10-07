# 🔍 Postman vs. App - API-Vergleich

## Problem: In Postman funktioniert es, in der App nicht

**Symptom:** API gibt HTML-Login-Seite zurück statt JSON
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Users</title>
    ...
    BACKEND LOGIN
```

**Ursache:** Authentifizierung schlägt fehl - falsches Header-Format

## Lösung: Auto-Tester

Der Test-Button probiert jetzt **4 verschiedene Auth-Formate** automatisch:

1. **Bearer Token**: `Authorization: Bearer YOUR_TOKEN`
2. **Direktes Token**: `Authorization: YOUR_TOKEN`
3. **Custom Header**: `x-api-token: YOUR_TOKEN`
4. **Alternative**: `token: YOUR_TOKEN`

## So finden Sie das richtige Format

### In Postman (funktioniert):

1. Öffnen Sie Ihren funktionierenden Request
2. Gehen Sie zum Tab **"Headers"**
3. Suchen Sie nach:
   - `Authorization`
   - `x-api-token`
   - `token`
   - oder ähnlichen Auth-Headern

4. Notieren Sie:
   - **Header-Name**: z.B. `Authorization`
   - **Header-Wert**: z.B. `Bearer abc123...` oder nur `abc123...`

### Beispiele:

#### Format 1: Bearer Token
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
               ^^^^^^ (mit "Bearer")
```

#### Format 2: Direktes Token
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
               (ohne "Bearer")
```

#### Format 3: Custom Header
```
x-api-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Test durchführen

### 1. Browser-Konsole öffnen (F12)

### 2. Test-Button klicken (orange)

### 3. In der Konsole sehen Sie:

```
🔄 Versuche Auth-Format 1/4...
📤 Headers: { Authorization: "Bearer abc..." }
⚠️ Header-Format 1 gibt HTML zurück - Auth fehlgeschlagen

🔄 Versuche Auth-Format 2/4...
📤 Headers: { Authorization: "abc..." }
✅ Header-Format 2 funktioniert!
```

### 4. Notieren Sie das funktionierende Format

## Wenn Auto-Tester ein Format findet

**Erfolgsmeldung:**
```
✅ TEST ERFOLGREICH!

API Response Status: 200
✅ Funktionierendes Auth-Format: Direktes Token

6 Termine an SPTimeSchedule gesendet
...
```

**→ Das System verwendet ab jetzt automatisch dieses Format!**

## Wenn alle Formate fehlschlagen

**Fehlermeldung:**
```
❌ TEST fehlgeschlagen!
Fehler: Alle Auth-Formate fehlgeschlagen - 
API gibt HTML Login-Seite zurück. 
Bitte Token-Format prüfen!
```

### Dann tun Sie folgendes:

1. **Exportieren Sie Ihren Postman-Request:**
   - In Postman: Request öffnen
   - Rechts oben: Code-Symbol `</>` klicken
   - Wählen Sie "cURL"
   - Kopieren Sie den Code

2. **Suchen Sie im cURL nach dem Header:**
   ```bash
   curl -X POST \
     https://...sptimeschedule/saveSptimeschedule \
     -H 'Authorization: Bearer YOUR_TOKEN' \  ← HIER!
     -H 'Content-Type: application/json' \
     ...
   ```

3. **Senden Sie mir:**
   - Header-Name (z.B. `Authorization`)
   - Format (z.B. `Bearer TOKEN` oder nur `TOKEN`)

## Häufige Auth-Formate

### JWT Token (JSON Web Token)
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi...
```
**Erkennbar an:** Beginnt mit `eyJ...` und hat Punkte `.`

### API Key
```
Authorization: sk_live_abc123def456...
x-api-key: abc123def456...
```
**Erkennbar an:** Relativ kurzer String, oft mit Prefix

### Session Token
```
Authorization: session_abc123...
Cookie: sessionId=abc123...
```

## Debugging-Checklist

- [ ] ✅ Postman-Request funktioniert?
- [ ] ✅ Gleiche URL in App wie in Postman?
- [ ] ✅ Token aus .env ist der gleiche wie in Postman?
- [ ] ✅ Konsole zeigt "🔑 API Token vorhanden? true"?
- [ ] ✅ Token-Länge > 20 Zeichen?
- [ ] ✅ Auto-Tester hat alle 4 Formate probiert?

## Nächste Schritte

### Wenn Auto-Tester Format findet:
→ **Fertig!** System funktioniert ab jetzt

### Wenn alle Formate fehlschlagen:
1. Exportieren Sie Postman-Request als cURL
2. Suchen Sie das funktionierende Auth-Format
3. Teilen Sie mir das Format mit
4. Ich passe den Code entsprechend an

## Wichtig zu wissen

Die HTML-Response ist eine **Login-Seite** des Backend-Systems.
Das bedeutet: Die API lehnt den Request ab weil:
- Token ungültig
- Token im falschen Format
- Token fehlt im erwarteten Header
- Token abgelaufen

Der Auto-Tester findet jetzt automatisch das richtige Format! 🎯

