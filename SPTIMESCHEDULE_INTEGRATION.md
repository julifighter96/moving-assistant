# SPTimeSchedule Integration - Setup Guide

## Übersicht

Die Moving Assistant App integriert sich automatisch mit dem SPTimeSchedule-System für:
1. **Mitarbeiter-Abfrage**: Dynamisches Laden verfügbarer Mitarbeiter mit Skills und Verfügbarkeit
2. **Terminbuchung**: Automatisches Erstellen von Kalendereinträgen beim Speichern einer Tour

## Setup-Schritte

### 1. Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei im Projekt-Root mit folgenden Variablen:

```bash
# SPTimeSchedule API - Terminbuchung
REACT_APP_SPTIMESCHEDULE_API_URL=https://open-api-viewer.herokuapp.com/sptimeschedule/saveSptimeschedule
REACT_APP_DEFAULT_TERMINART_ID=ihre-terminart-uuid-hier
REACT_APP_DEFAULT_KENNZEICHEN=KA-RD 1234

# ServiceProvider API - Mitarbeiter-Abfrage
REACT_APP_SERVICEPROVIDER_API_URL=https://open-api-viewer.herokuapp.com/api/serviceprovider/getServiceprovider
```

### 2. Terminart-ID ermitteln

Kontaktieren Sie Ihren SPTimeSchedule-Administrator für:
- **Terminart-UUID**: Die ID der Terminart für Umzugstouren
- **Verfügbare Rollen**: Liste der buchbaren Rollen (z.B. "Monteur", "Fahrer")

Fügen Sie die erhaltene UUID in `REACT_APP_DEFAULT_TERMINART_ID` ein.

### 3. Mitarbeiter-Abfrage konfigurieren

Die App lädt verfügbare Mitarbeiter **automatisch** über die ServiceProvider API basierend auf:
- **Tour-Datum**: Nur Mitarbeiter, die am ausgewählten Tag verfügbar sind
- **Skills**: Nur Mitarbeiter mit benötigten Qualifikationen (z.B. LKW-Führerschein)
- **Verträge**: Nur aktive Mitarbeiter mit gültigem Vertrag

**Keine manuellen Mitarbeiter-IDs mehr nötig!** Das System nutzt die echten UUIDs aus der API.

#### Skills anpassen

Die Standard-Anforderungen in `TourPlanner.js` (Zeile 1453-1464):

```javascript
skill: {
  personal_properties_Fuehrerschein: ["C1", "C", "CE"], // LKW-Führerschein
  personal_properties_Auto: "Ja" // Eigenes Fahrzeug
}
```

Sie können weitere Anforderungen hinzufügen:

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

Dies findet Mitarbeiter, die ALLE Basis-Skills haben UND (Deutsch sprechen ODER Vorarbeiter sind).

### 4. Fahrzeugkennzeichen anpassen

Passen Sie das Standard-Fahrzeugkennzeichen an:

```bash
REACT_APP_DEFAULT_KENNZEICHEN=Ihr-Kennzeichen
```

Für individuelle Kennzeichen pro Tour kann der Code in `TourPlanner.js` erweitert werden.

## API-Struktur

### Request Format

Die API erwartet ein Array von Terminen:

```json
[
  {
    "personalid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "terminart": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "vorgangsno": "1234",
    "angebotsno": "1947",
    "datum": "2025-10-02",
    "startzeit": "09:00:00",
    "endzeit": "17:00:00",
    "kommentar": "Tour: Tour-Name | Stationen: 1. Adresse (09:00 - 10:00), 2. Adresse (10:30 - 11:30), ...",
    "rolle": ["Monteur"],
    "kennzeichen": "KA-RD 1234"
  }
]
```

### Felderbeschreibung

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `personalid` | UUID | Mitarbeiter-UUID aus SPTimeSchedule |
| `terminart` | UUID | Terminart-UUID (z.B. "Umzug", "Klaviertransport") |
| `vorgangsno` | String | Deal-ID aus Pipedrive |
| `angebotsno` | String | Projekt-ID aus Pipedrive |
| `datum` | String | Datum im Format `YYYY-MM-DD` |
| `startzeit` | String | Startzeit im Format `HH:MM:SS` |
| `endzeit` | String | Endzeit im Format `HH:MM:SS` |
| `kommentar` | String | Tour-Details (max. 500 Zeichen) |
| `rolle` | Array | Rolle(n) des Mitarbeiters |
| `kennzeichen` | String | Fahrzeugkennzeichen |

## Wie es funktioniert

### 1. Mitarbeiter-Abfrage (Automatisch)
Sobald der Benutzer ein Tour-Datum auswählt:
1. **API-Aufruf**: System fragt verfügbare Mitarbeiter ab
2. **Skill-Filter**: Nur Mitarbeiter mit LKW-Führerschein (C1/C/CE) und eigenem Auto
3. **Verfügbarkeits-Check**: Prüft ob bereits Termine am selben Tag existieren
4. **Sortierung**: Verfügbare Mitarbeiter zuerst (mit ✓), dann verplante (ausgegraut)

**Im Dropdown sichtbar:**
- ✅ **Max Mustermann ✓** - Verfügbar
- ⚠️ **Anna Schmidt (verplant)** - Bereits Termine am Tag

### 2. Tourenplanung
Der Benutzer:
- Wählt Aufträge aus
- Zieht sie in die Tourplanung
- Ordnet die Route
- Weist verfügbare Mitarbeiter zu (automatisch geladen!)
- Gibt Arbeitsdauern ein

**Visuelles Feedback:**
- Verfügbare Mitarbeiter: Weißer Hintergrund
- Verplante Mitarbeiter: Gelber Hintergrund mit ⚠️-Icon

### 3. Automatische Berechnung
Die App berechnet automatisch:
- Fahrzeiten zwischen Stationen
- Ankunftszeiten an jeder Station
- Fertigstellungszeiten (Ankunft + Arbeitsdauer)
- Gesamtdauer der Tour

### 4. Speichern
Beim Klick auf "Tour speichern":
1. **Pipedrive-Update**: Alle Projekte werden aktualisiert mit:
   - Tour-Datum
   - Tour-ID
   - Reihenfolge in der Tour

2. **SPTimeSchedule-Buchung**: Für jeden Mitarbeiter wird ein Termin erstellt mit:
   - Start: Ankunft an erster Station
   - Ende: Fertigstellung an letzter Station
   - Kommentar: Alle Stationen mit Zeiten
   - Personen-UUID: Aus ServiceProvider API

### 5. Bestätigung
Der Benutzer erhält eine Meldung:
- ✅ Erfolg: "Termine erfolgreich im Kalender gebucht!"
- ⚠️ Fehler: Details zum Fehler
- ℹ️ Info: "Keine Termine gebucht (keine Mitarbeiter zugewiesen)"

## Erweiterte Konfiguration

### Custom Rollen

Um die Rollen anzupassen, bearbeiten Sie in `TourPlanner.js`:

```javascript
rolle: ['Monteur'], // Ersetzen durch: ['Ihre', 'Rollen']
```

### Individuelle Kennzeichen

Fügen Sie ein Dropdown zur Fahrzeugauswahl hinzu:

```javascript
const [selectedVehicle, setSelectedVehicle] = useState('');

// In der TourArea Komponente:
<select onChange={(e) => setSelectedVehicle(e.target.value)}>
  <option value="KA-RD 1234">Transporter 1</option>
  <option value="KA-RD 5678">Transporter 2</option>
</select>
```

### Multiple Termine pro Station

Für separate Termine pro Station anstatt einem Gesamt-Termin:

```javascript
// Statt einem Termin pro Mitarbeiter:
const appointments = employees.flatMap(employee => 
  stations.map(station => ({
    personalid: employee.id,
    // ... weitere Felder mit station-spezifischen Zeiten
  }))
);
```

## Troubleshooting

### "Keine Mitarbeiter verfügbar"

**Mögliche Ursachen:**
1. **Zu strenge Skill-Anforderungen**: Kein Mitarbeiter erfüllt alle Kriterien
2. **Alle verplant**: Alle qualifizierten Mitarbeiter haben bereits Termine
3. **API-Fehler**: ServiceProvider API nicht erreichbar
4. **Falsches Datum**: Format-Fehler beim Datum-Parameter

**Lösung:**
1. Öffnen Sie die Browser-Konsole (F12)
2. Suchen Sie nach `[ServiceProvider]` Log-Einträgen
3. Prüfen Sie die Skill-Anforderungen in Zeile 1453-1464 (TourPlanner.js)
4. Reduzieren Sie die Anforderungen testweise:
   ```javascript
   skill: {
     personal_properties_Fuehrerschein: ["C1", "C", "CE"]
     // Entfernen Sie "personal_properties_Auto" testweise
   }
   ```

### "Lade Mitarbeiter..." bleibt hängen

**Mögliche Ursachen:**
1. **API-Timeout**: ServiceProvider-Server antwortet nicht
2. **Netzwerk-Problem**: Keine Internetverbindung
3. **CORS-Fehler**: API blockiert Anfragen von Ihrer Domain

**Lösung:**
1. Prüfen Sie `REACT_APP_SERVICEPROVIDER_API_URL` in der `.env`
2. Testen Sie die API direkt mit curl (siehe Beispiel oben)
3. Kontaktieren Sie Ihren IT-Administrator für CORS-Konfiguration

### Fehler: "Terminbuchung fehlgeschlagen"

**Mögliche Ursachen:**
1. **Falsche API-URL**: Prüfen Sie `REACT_APP_SPTIMESCHEDULE_API_URL`
2. **Ungültige UUID**: Mitarbeiter- oder Terminart-ID existiert nicht im System
3. **Fehlende Rolle**: Die angegebene Rolle ist nicht verfügbar
4. **Netzwerkfehler**: API nicht erreichbar

**Lösung:**
1. Öffnen Sie die Browser-Konsole (F12)
2. Suchen Sie nach `[SPTimeSchedule]` Log-Einträgen
3. Prüfen Sie die gesendeten Daten
4. Kontaktieren Sie Ihren SPTimeSchedule-Administrator

### Fehler: "Keine Termine gebucht"

Dies ist keine Fehlermeldung, sondern ein Hinweis, dass keine Mitarbeiter der Tour zugewiesen wurden.

**Lösung:** Weisen Sie mindestens einen Mitarbeiter über das Dropdown zu.

### UUIDs herausfinden

Die Mitarbeiter-UUIDs werden jetzt **automatisch** von der ServiceProvider API geladen! 

Für die Konfiguration benötigen Sie nur noch:
- **Terminart-UUID**: Für die Terminbuchung
- **Verfügbare Rollen**: Liste der buchbaren Rollen

## Testing

### ServiceProvider API testen

Testen Sie die Mitarbeiter-Abfrage manuell mit curl:

```bash
curl -X 'POST' \
  'https://open-api-viewer.herokuapp.com/api/serviceprovider/getServiceprovider' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "date_from": "2025-06-01",
  "date_to": "2025-06-01",
  "skill": {
    "personal_properties_Fuehrerschein": ["C1", "C", "CE"],
    "personal_properties_Auto": "Ja"
  },
  "joins": ["Vertraege", "Eigenschaften", "Termine"]
}'
```

**Erwartete Antwort:**
```json
[
  {
    "id": "uuid-des-mitarbeiters",
    "name": "Max Mustermann",
    "vorname": "Max",
    "nachname": "Mustermann",
    "Eigenschaften": {...},
    "Vertraege": [...],
    "Termine": [...]
  }
]
```

### SPTimeSchedule API testen

Für Tests können Sie die bereitgestellte Test-API verwenden:

```bash
REACT_APP_SPTIMESCHEDULE_API_URL=https://open-api-viewer.herokuapp.com/sptimeschedule/saveSptimeschedule
REACT_APP_SERVICEPROVIDER_API_URL=https://open-api-viewer.herokuapp.com/api/serviceprovider/getServiceprovider
```

**Wichtig:** Diese Test-APIs speichern keine echten Daten!

### Produktionsumgebung

Ersetzen Sie die URLs durch Ihre echten APIs:

```bash
REACT_APP_SPTIMESCHEDULE_API_URL=https://ihr-server.de/api/v1/sptimeschedule/saveSptimeschedule
REACT_APP_SERVICEPROVIDER_API_URL=https://ihr-server.de/api/serviceprovider/getServiceprovider
```

## Support

Bei Fragen zur Integration kontaktieren Sie:
- **SPTimeSchedule-Administrator**: Für UUIDs und Systemkonfiguration
- **Entwickler**: Für Code-Anpassungen und Troubleshooting

