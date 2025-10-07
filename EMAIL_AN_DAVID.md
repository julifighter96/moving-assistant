# E-Mail an David: SPTimeSchedule API Problem

---

**Betreff:** API-Integration: SPTimeSchedule gibt Login-Seite zurück (Authorization-Problem)

---

Hallo David,

vielen Dank für die Bereitstellung der API-Dokumentation und das Update vom gestrigen Tag. 

Wir haben die Integration der beiden Endpoints begonnen und stoßen auf ein Authentifizierungs-Problem beim **SPTimeSchedule-Endpoint**, das wir nicht lösen können.

## Status Quo

### ✅ Funktioniert perfekt:
**`/api/serviceprovider/getServiceprovider`**
- Authorization-Token wird akzeptiert
- Liefert Mitarbeiterdaten wie erwartet
- Keine Probleme

### ❌ Funktioniert nicht:
**`/sptimeschedule/saveSptimeschedule`**
- Verwendet den **gleichen Authorization-Token** wie ServiceProvider
- API gibt eine **HTML-Login-Seite** zurück (Status 200)
- Token wird offensichtlich nicht akzeptiert

## Technische Details

**Request (identisch für beide Endpoints):**
```javascript
POST https://www.stressfrei-solutions.de/dl2238205/backend/sptimeschedule/saveSptimeschedule

Headers:
- Content-Type: application/json
- Accept: application/json
- Authorization: [Der Token von Jonathan]

Body:
[
  {
    "personalid": "123",
    "terminart": "abc-def-ghi",
    "vorgangsno": "456",
    "angebotsno": "789",
    "datum": "2025-01-10",
    "startzeit": "08:00:00",
    "endzeit": "17:00:00",
    "kommentar": "Tour: ...",
    "rolle": ["Monteur"],
    "kennzeichen": "KA-RD 1234"
  }
]
```

**Response:**
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Users</title>
    ...
  </head>
  <body>
    <h3>BACKEND LOGIN</h3>
    <form action="/dl2238205/backend/users/check_login" ...>
      ...
    </form>
  </body>
</html>
```

## Unsere Vermutung

Da der **gleiche Token** für ServiceProvider funktioniert, aber nicht für SPTimeSchedule, vermuten wir:

1. **Unterschiedliche Authentifizierung**: Benötigt SPTimeSchedule zusätzlich zu dem Authorization-Token auch ein **Session-Cookie**?

2. **Unterschiedliche Permissions**: Hat der Token möglicherweise unterschiedliche Berechtigungen für die beiden Endpoints?

3. **Zusätzliche Header**: Werden für SPTimeSchedule zusätzliche Header benötigt, die in der Dokumentation nicht erwähnt sind?

## Unsere Bitte

Könntet ihr uns bitte helfen, das Problem zu identifizieren? Folgende Informationen wären sehr hilfreich:

### Option 1: Postman Collection
Könntet ihr uns eine **Postman Collection** mit einem funktionierenden SPTimeSchedule-Request zur Verfügung stellen? So könnten wir:
- Die exakten Header vergleichen
- Prüfen, ob Cookies mitgesendet werden
- Die Request-Struktur 1:1 übernehmen

### Option 2: Spezifische Infos
Falls keine Postman Collection möglich ist:
1. **Cookies**: Werden für SPTimeSchedule **zusätzliche Cookies** benötigt? (z.B. Session-Cookies vom Backend-Login?)
2. **Headers**: Gibt es weitere **erforderliche Header** außer Authorization, Content-Type und Accept?
3. **Token-Format**: Muss der Token für SPTimeSchedule in einem **anderen Format** gesendet werden?
4. **Login-Prozess**: Muss man sich zunächst über `/users/check_login` einloggen, um ein Session-Cookie zu erhalten?

### Option 3: Test-Account
Alternativ könntet ihr uns einen **Test-Account** (Username/Passwort) geben, damit wir testen können, ob ein Session-Cookie zusätzlich zum Authorization-Token benötigt wird?

## Was wir bereits versucht haben

- ✅ Identische Header-Konfiguration für beide Endpoints
- ✅ Gleichen Authorization-Token verwendet
- ✅ Request-Body gemäß Dokumentation strukturiert
- ✅ Verschiedene Content-Type Varianten getestet
- ✅ Token-Format (mit/ohne Prefix) getestet

## Zeitkritisch?

Die Integration der Tourenplanung mit automatischer Mitarbeiter-Terminbuchung ist ein zentrales Feature für unseren Kunden. Wir würden das gerne zeitnah lösen, um die Funktionalität produktiv nutzen zu können.

Habt ihr eventuell heute oder morgen Zeit für einen **kurzen Call (15-30 Min)**, in dem wir das gemeinsam anschauen könnten? Das wäre wahrscheinlich der schnellste Weg zur Lösung.

Vielen Dank im Voraus für eure Unterstützung!

Beste Grüße
[Dein Name]

---

**Anhang: Logs**

Zur besseren Nachvollziehbarkeit habe ich die vollständigen Request/Response-Logs angehängt.



