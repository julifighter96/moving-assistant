# Setup-Anleitung: StressFrei Solutions (SFS) API Integration

## ✅ Checkliste für die Inbetriebnahme

### 1. API-Token besorgen

**Wichtig:** Die SFS-API benötigt einen Authentifizierungs-Token!

**Von wem:** Token von Jonathan oder Administrator anfordern

**Wo verwenden:** In der `.env` Datei als `REACT_APP_SFS_API_TOKEN`

### 2. Umgebungsvariablen konfigurieren (.env)

Erstellen Sie eine `.env` Datei im Projekt-Root mit folgenden Variablen:

```bash
# ============================================
# StressFrei Solutions (SFS) API
# ============================================

# 🔑 API-TOKEN (von Jonathan/Administrator)
REACT_APP_SFS_API_TOKEN=ihr-token-hier

# 🌐 API-URLs (Produktionssystem Riedlin)
REACT_APP_SERVICEPROVIDER_API_URL=https://www.stressfrei-solutions.de/dl2238205/backend/api/serviceprovider/getServiceprovider
REACT_APP_SPTIMESCHEDULE_API_URL=https://www.stressfrei-solutions.de/dl2238205/backend/sptimeschedule/saveSptimeschedule

# 📋 Tour-Konfiguration
REACT_APP_DEFAULT_TERMINART_ID=ihre-terminart-id-hier
REACT_APP_DEFAULT_KENNZEICHEN=KA-RD 1234

# ============================================
# Bestehende APIs (Pipedrive & Google Maps)
# ============================================

REACT_APP_PIPEDRIVE_API_TOKEN=ihr-pipedrive-token
REACT_APP_GOOGLE_MAPS_API_KEY=ihr-google-maps-key
# ... weitere Pipedrive Feld-IDs
```

### 3. Übersetzungstabellen einholen

Fordern Sie von Jonathan/Administrator per E-Mail an:

#### 📊 Terminarten (CSV)
- **Spalten:** `id`, `Name`
- **Verwendung:** Für `REACT_APP_DEFAULT_TERMINART_ID` in `.env`
- **Beispiel:**
  ```
  id,Name
  3fa85f64-...,Umzug
  4fb96g75-...,Klaviertransport
  ```

#### 🔧 Personaleigenschaften (CSV)
- **Spalten:** `id`, `Mögliche Werte`
- **Verwendung:** Für Skill-Filter in `TourPlanner.js`
- **Beispiele:**
  - `personal_properties_Fuehrerschein`: "C1", "C", "CE"
  - `personal_properties_Auto`: "Ja", "Nein"
  - `personal_properties_Sprache`: "Deutsch", "Englisch"

#### 👔 Rollen (CSV)
- **Spalten:** `Bezeichnungen`
- **Verwendung:** Für `rolle`-Array in Terminbuchung
- **Beispiel:** "Monteur", "Fahrer", "Vorarbeiter"

### 4. Skill-Anforderungen anpassen (optional)

**Datei:** `src/components/TourPlanner.js` (Zeile 1507-1518)

**Standard-Konfiguration:**
```javascript
skill: {
  personal_properties_Fuehrerschein: ["C1", "C", "CE"],
  personal_properties_Auto: "Ja"
}
```

**Mit OR-Bedingung (optional):**
```javascript
skill: {
  personal_properties_Fuehrerschein: ["C1", "C", "CE"],
  personal_properties_Auto: "Ja",
  OR: {
    personal_properties_Sprache: ["Deutsch"],
    personal_properties_Position: "Vorarbeiter"
  }
}
```

> **Hinweis:** Aktuell ist nur ein OR-Statement möglich

### 5. Terminart-ID setzen

Nach Erhalt der Terminarten-CSV:

1. Öffnen Sie die CSV-Datei
2. Suchen Sie die passende Terminart (z.B. "Umzug" oder "Klaviertransport")
3. Kopieren Sie die UUID (Spalte `id`)
4. Setzen Sie in `.env`:
   ```bash
   REACT_APP_DEFAULT_TERMINART_ID=die-kopierte-uuid
   ```

### 6. Rollen anpassen (optional)

**Datei:** `src/components/TourPlanner.js` (Zeile 1931)

**Standard:**
```javascript
rolle: ['Monteur']
```

**Mehrere Rollen:**
```javascript
rolle: ['Monteur', 'Fahrer']
```

## 🚀 Nach der Konfiguration

### Test 1: Mitarbeiter-Abfrage

1. Starten Sie die App: `npm start`
2. Öffnen Sie den TourPlanner
3. Wählen Sie ein Tour-Datum
4. **Erwartung:** Dropdown zeigt verfügbare Mitarbeiter

**Bei Problemen:**
- Öffnen Sie Browser-Konsole (F12)
- Suchen Sie nach `[ServiceProvider]` Logs
- Prüfen Sie ob Token korrekt gesetzt ist

### Test 2: Tour speichern

1. Fügen Sie Aufträge zur Tour hinzu
2. Weisen Sie mindestens einen Mitarbeiter zu
3. Klicken Sie "Tour speichern"
4. **Erwartung:** Meldung "✅ Termine erfolgreich im Kalender gebucht!"

**Bei Problemen:**
- Öffnen Sie Browser-Konsole (F12)
- Suchen Sie nach `[SPTimeSchedule]` Logs
- Prüfen Sie gesendete Daten

## 📝 Wichtige Informationen

### Vorgangsnummern & Angebotsnummern

Ab dem letzten Update werden diese **automatisch** von Pipedrive übermittelt:
- **Vorgangsnummer**: Sobald Vorgang gespeichert wird
- **Angebotsnummer**: Sobald Angebot auf "angenommen" gestellt wird

> **Tipp:** Bei älteren Daten können Sie Angebote nochmal auf "angenommen" stellen oder Vorgänge erneut speichern, um die Daten nachzutragen.

### API-Besonderheiten

#### ServiceProvider API (POST statt GET)
- Eigentlich ein GET-Request, aber als POST implementiert
- **Grund:** Parameter können sehr umfangreich werden (Skill-Filter, OR-Bedingungen)
- **Nicht irritieren lassen:** Ist so gewollt!

#### Joins für zusätzliche Informationen
```javascript
joins: [
  "Vertraege",      // Vertragsinformationen, Arbeitsstunden
  "Eigenschaften",  // Führerschein, Auto, Sprache, etc.
  "Termine"         // Bereits gebuchte Termine
]
```

#### Regelarbeitszeiten
- **Aktuell nicht verfügbar** im System
- Alternative: Stunden im Vertrag gepflegt

#### Urlaub/Krankheit erkennen
- Über zurückgelieferte Termine (Feld `Terminart`)
- System zeigt automatisch "verplant" an

#### Mehrtagestouren erkennen
```javascript
{
  date_from: "2025-06-01",
  date_to: "2025-06-03" // Mehrere Tage abfragen
}
```

#### Letzter Einsatzort
- Nicht immer eindeutig (kurzfristige Einschübe möglich)
- **Empfehlung:** Datumsfilter größer setzen, auch gestrigen Tag prüfen

## 🔗 Dokumentation

**Offizielle API-Dokumentation:**
https://stressfrei-solutions.atlassian.net/servicedesk/customer/portal/3/article/391151671

**System-URL Riedlin:**
https://www.stressfrei-solutions.de/dl2238205/backend/

## 🆘 Support

Bei Fragen wenden Sie sich an:
- **API-Token:** Jonathan oder Administrator
- **Übersetzungstabellen (CSV):** Jonathan oder Administrator
- **Technische Probleme:** IT-Support mit Browser-Konsole Logs (`[ServiceProvider]` oder `[SPTimeSchedule]`)

## ✨ Zukünftige Erweiterungen

Die SFS-API wird intern umgebaut und stark erweitert. Zukünftig werden folgende Features per API verfügbar sein:
- Übersetzungstabellen per API abrufen (nicht mehr per CSV)
- Erweiterte Personalplanung-Features
- Mehr Filter-Möglichkeiten

Aktualisierungen werden in dieser Dokumentation nachgetragen.

