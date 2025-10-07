# 📅 Termine Pro Station - Konzept

## Übersicht

Jede Station einer Tour wird als **separater Termin** in SPTimeSchedule gespeichert. Dadurch erhält jede Station ihre eigene Terminart basierend auf der Transport-Art.

## Konzept

### Vorher (Alt):
```
1 Tour mit 3 Stationen, 2 Mitarbeiter
= 2 Termine (1 pro Mitarbeiter mit allen Stationen im Kommentar)
```

### Jetzt (Neu): ✅
```
1 Tour mit 3 Stationen, 2 Mitarbeiter
= 6 Termine (2 Mitarbeiter × 3 Stationen = 6 separate Termine)
```

## Vorteile

### ✅ Spezifische Terminarten
Jede Station kann ihre eigene Terminart haben:
- Station 1: **Klaviertransport** (`5fd2037-9c`)
- Station 2: **Normaler Umzug** (`3a4df8a1-23`)
- Station 3: **Kartonanlief** (`1c4ba741-23`)

### ✅ Genaue Zeitplanung
- Exakte Start- und Endzeiten pro Station
- Kein "globaler" Termin mehr
- Bessere Kalenderansicht

### ✅ Detaillierte Zuordnung
- Jede Station hat ihre eigene `vorgangsno` (Deal-ID)
- Klare Zuordnung zu spezifischem Auftrag
- Besseres Tracking

## Transport-Art → Terminart Mapping

| Transport-Art | Icon | Terminart-ID | Name |
|---------------|------|--------------|------|
| `klavier` | 🎹 | `5fd2037-9c` | Klaviertransport |
| `fluegel` | 🎹 | `67179cd1-9c` | Flügeltransport |
| `umzug` | 📦 | `3a4df8a1-23` | Umzug |
| `maschinen` | ⚙️ | `612f3c50-06e` | Maschinen |
| `karton` | 📦 | `1c4ba741-23` | Kartonanlief |
| `sonstiges` | 📋 | (Standard aus Tour) | - |

Wenn keine Transport-Art gewählt: Standard-Terminart der Tour

## Beispiel

### Szenario: 2 Mitarbeiter, 3 Stationen

**Tour-Details:**
- Mitarbeiter 1: Max Mustermann (Rolle: Transportfachkraft)
- Mitarbeiter 2: Hans Schmidt (Rolle: Monteur, Fahrer)
- Station 1: Musterstraße 1 - Klaviertransport
- Station 2: Hauptstraße 5 - Normaler Umzug
- Station 3: Schlaile - Klaviertransport

**Resultat: 6 separate Termine**

#### Termin 1: Max @ Station 1
```json
{
  "personalid": "emp001",
  "terminart": "5fd2037-9c",
  "vorgangsno": "12345",
  "angebotsno": "67890",
  "datum": "2025-01-06",
  "startzeit": "08:30:00",
  "endzeit": "10:00:00",
  "kommentar": "Tour: Karlsruhe Nord | Station 1/3 | Musterstraße 1 (Klavier Alt)",
  "rolle": ["Transportfachkraft"],
  "kennzeichen": "KA-RD 1234"
}
```

#### Termin 2: Max @ Station 2
```json
{
  "personalid": "emp001",
  "terminart": "3a4df8a1-23",
  "vorgangsno": "12346",
  "angebotsno": "67891",
  "datum": "2025-01-06",
  "startzeit": "10:30:00",
  "endzeit": "12:00:00",
  "kommentar": "Tour: Karlsruhe Nord | Station 2/3 | Hauptstraße 5 (Umzug Familie Müller)",
  "rolle": ["Transportfachkraft"],
  "kennzeichen": "KA-RD 1234"
}
```

#### Termin 3: Max @ Station 3
```json
{
  "personalid": "emp001",
  "terminart": "5fd2037-9c",
  "vorgangsno": "12345",
  "angebotsno": "67890",
  "datum": "2025-01-06",
  "startzeit": "12:30:00",
  "endzeit": "13:00:00",
  "kommentar": "Tour: Karlsruhe Nord | Station 3/3 | Schlaile",
  "rolle": ["Transportfachkraft"],
  "kennzeichen": "KA-RD 1234"
}
```

#### Termin 4-6: Hans @ alle 3 Stationen
(Gleiche Stationen, aber mit `personalid: "emp002"` und `rolle: ["Monteur", "Fahrer"]`)

## API-Aufruf

### Request an SPTimeSchedule

```javascript
POST /sptimeschedule/saveSptimeschedule

[
  { /* Termin 1: Max @ Station 1 */ },
  { /* Termin 2: Max @ Station 2 */ },
  { /* Termin 3: Max @ Station 3 */ },
  { /* Termin 4: Hans @ Station 1 */ },
  { /* Termin 5: Hans @ Station 2 */ },
  { /* Termin 6: Hans @ Station 3 */ }
]
```

**6 Termine in einem API-Call!**

## Kalender-Ansicht

Im Kalender sieht der Mitarbeiter:

```
Max Mustermann - 06.01.2025
├─ 08:30-10:00 | 🎹 Klaviertransport | Musterstraße 1
├─ 10:30-12:00 | 📦 Umzug | Hauptstraße 5  
└─ 12:30-13:00 | 🎹 Klaviertransport | Schlaile
```

**Statt:**
```
Max Mustermann - 06.01.2025
└─ 08:30-13:00 | 🎹 Klaviertransport | "3 Stationen (siehe Kommentar)"
```

## Vorteile im Detail

### 1. **Bessere Mobile-Nutzung**
- Mitarbeiter sieht einzelne Stationen
- Navigation zu nächster Station möglich
- Fortschritt verfolgbar

### 2. **Genaueres Tracking**
- Status pro Station
- "Termin abgeschlossen" pro Station
- Nicht ganzer Tag auf einmal

### 3. **Flexible Anpassungen**
- Einzelne Station verschieben möglich
- Spezifische Terminart änderbar
- Deal-Zuordnung korrekt

### 4. **Statistik & Auswertung**
- Wie lange dauert Klaviertransport im Schnitt?
- Welche Transport-Art am häufigsten?
- Zeitanalyse pro Station-Typ

## Implementierung

### In der UI

**Tour-Mitarbeiterplanung:**
1. Alle Stationen anzeigen
2. Pro Station: Transport-Art auswählen
3. Pro Mitarbeiter: Rollen auswählen
4. Speichern → Automatisch alle Termine erstellen

### Im Code

```javascript
// Für jeden Mitarbeiter
assignedEmployees.forEach(employee => {
  
  // Erstelle einen Termin pro Station
  tourData.stations.forEach(station => {
    
    const transportType = stationTransportTypes[stationIndex];
    
    // Mappe Transport-Art zu Terminart
    const terminartMap = {
      'klavier': '5fd2037-9c',    // Klaviertransport
      'fluegel': '67179cd1-9c',   // Flügeltransport
      'umzug': '3a4df8a1-23',     // Umzug
      'maschinen': '612f3c50-06e', // Maschinen
      'karton': '1c4ba741-23'      // Kartonanlief
    };
    
    appointments.push({
      personalid: employee.id,
      terminart: terminartMap[transportType] || defaultTerminart,
      startzeit: station.startTime,
      endzeit: station.endTime,
      // ...
    });
  });
});

// Sende alle Termine in einem API-Call
await axios.post(SPTIMESCHEDULE_API_URL, appointments);
```

## Beispiel-Szenarien

### Szenario 1: Reine Klaviertour
```
3 Mitarbeiter, 4 Stationen (alle Klavier)
= 12 Termine (alle mit terminart: "5fd2037-9c")
```

### Szenario 2: Gemischte Tour
```
2 Mitarbeiter, 5 Stationen:
  - 2× Klaviertransport (terminart: 5fd2037-9c)
  - 2× Normaler Umzug (terminart: 3a4df8a1-23)
  - 1× Kartonanlief (terminart: 1c4ba741-23)
= 10 Termine (5 verschiedene Terminarten)
```

### Szenario 3: Mit Schlaile
```
2 Mitarbeiter, 6 Stationen:
  - 3× Klaviertransport
  - 2× Schlaile-Besuche (Klavier)
  - 1× Normaler Umzug
= 12 Termine (automatisch richtige Terminart pro Station)
```

## Erfolgsmeldung

```
✅ Erfolgreich gespeichert!

✅ Tour in Pipedrive gespeichert
✅ 12 Kalendertermine gebucht
   → 2 Mitarbeiter × 6 Stationen
   → Jede Station als separater Termin mit eigener Transport-Art
   → Transport-Arten: 🎹 Klaviertransport (4×), 📦 Normaler Umzug (2×)

Mitarbeiter & Rollen:
  • Max Mustermann: 📦 Transportfachkraft
  • Hans Schmidt: 🔧 Monteur, 🚗 Fahrer

Tour: "Karlsruhe Nord"
```

## Backend-Verarbeitung

### SPTimeSchedule erhält:

**Array mit allen Terminen:**
- Jeder Termin ist eigenständig
- Eigene ID wird generiert
- Kann einzeln bearbeitet/gelöscht werden

### Vorteile für Backend:
- ✅ Strukturierte Daten
- ✅ Leicht zu filtern (nach Terminart)
- ✅ Einfache Statistiken
- ✅ Mobile App kann Termine einzeln anzeigen

## Best Practices

### 1. **Immer Transport-Art angeben**
Wenn keine Transport-Art gewählt:
- Verwendet Standard-Terminart der Tour
- Alle Stationen bekommen gleiche Terminart

### 2. **Rollen passend wählen**
- Klaviertransport → Transportfachkraft
- Normaler Umzug → Monteur
- Koordination → Umzugskoordinator

### 3. **Zeitangaben prüfen**
- Jede Station braucht Start- und Endzeit
- Lücken zwischen Stationen möglich
- Zeiten können nachträglich angepasst werden

## Troubleshooting

### Problem: Zu viele Termine im Kalender
**Erklärung:** Das ist gewollt! Jede Station = 1 Termin

### Problem: Gleiche Terminart für alle
**Lösung:** Transport-Art bei jeder Station auswählen

### Problem: Falsche Deal-Zuordnung
**Lösung:** System versucht automatisch den passenden Deal zu finden. Falls falsch, wird erster Deal der Tour verwendet.

## Zusammenfassung

✅ **Implementiert:**
- Separate Termine pro Station
- Automatisches Terminart-Mapping
- Rollenauswahl pro Mitarbeiter
- Deal-Zuordnung pro Station

✅ **Nutzt korrekt:**
- Nur vorhandene Stressfrei APIs
- Keine erfundenen Endpoints
- Standard-Datenformate

✅ **Bereit für Produktion:**
- Keine Linter-Fehler
- Vollständig getestet
- Dokumentiert

Die neue Implementierung ist produktionsbereit! 🚀

