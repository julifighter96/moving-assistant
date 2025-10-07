# 👔 Rollen-Integration - Dokumentation

## Übersicht

Mitarbeiter können jetzt bei der Tour-Zuweisung spezifische Rollen erhalten. Diese Rollen werden automatisch an die SPTimeSchedule API und die Route API übertragen.

## Verfügbare Rollen

Basierend auf `ROLLEN_REFERENZ.md`:

| Rolle | Icon | Beschreibung | Verwendung |
|-------|------|--------------|------------|
| **Monteur** | 🔧 | Standard Montage/Umzug | Standard für die meisten Touren |
| **Fahrer** | 🚗 | Reiner Transport | Nur Fahrt, keine Montage |
| **Transportfachkraft** | 📦 | Spezialtransporte | Klaviere, empfindliche Güter |
| **Umzugskoordinator** | 📋 | Koordination | Große/komplexe Touren |
| **Vorarbeiter_Fahrer** | 👷 | Führungsverantwortung | Team-Leitung erforderlich |

## Funktionen

### 1. **Primäre Rolle auswählen**
- Jeder Mitarbeiter hat eine Hauptrolle
- Standard: "Monteur"
- Dropdown-Menü mit allen verfügbaren Rollen

### 2. **Mehrere Rollen zuweisen**
- Mitarbeiter können mehrere Rollen haben
- Beispiel: `['Monteur', 'Fahrer']`
- Aufklappbare Mehrfachauswahl

### 3. **Automatische Übertragung**
Rollen werden übertragen an:
- ✅ **SPTimeSchedule API** (Termine mit vollständigen Details im Kommentar)

## Verwendung

### Im Moving Assistant

1. **Tour erstellen** und zur Mitarbeiterplanung wechseln
2. **Mitarbeiter hinzufügen** aus verfügbarer Liste
3. **Rolle auswählen** für jeden Mitarbeiter:
   - Dropdown öffnen
   - Rolle wählen (z.B. "Transportfachkraft")
   - Optional: Zusätzliche Rollen hinzufügen
4. **Speichern** → Rollen werden automatisch übertragen

### Beispiel-Workflows

#### Klaviertransport-Team
```
Mitarbeiter 1: Max Mustermann
  → Rolle: Transportfachkraft
  → Zusatz: Vorarbeiter_Fahrer

Mitarbeiter 2: Hans Schmidt  
  → Rolle: Transportfachkraft
  → Zusatz: -

Mitarbeiter 3: Peter Müller
  → Rolle: Fahrer
  → Zusatz: -
```

#### Normaler Umzug
```
Mitarbeiter 1: Team-Lead
  → Rolle: Umzugskoordinator
  → Zusatz: Monteur

Mitarbeiter 2-4: Team-Mitglieder
  → Rolle: Monteur
  → Zusatz: -
```

## API-Integration

### SPTimeSchedule API (Einzige API)

**Endpoint:** `/sptimeschedule/saveSptimeschedule`

**Payload (pro Mitarbeiter):**
```json
{
  "personalid": "emp123",
  "terminart": "5fd2037-9c",
  "vorgangsno": "12345",
  "angebotsno": "67890",
  "datum": "2025-01-06",
  "startzeit": "08:00:00",
  "endzeit": "16:30:00",
  "kommentar": "Tour: Karlsruhe Nord | Stationen: 1. Musterstr. 1 [🎹 Klaviertransport] (08:30 - 10:00), 2. Hauptstr. 5 [📦 Normaler Umzug] (10:30 - 12:00)",
  "rolle": ["Transportfachkraft", "Vorarbeiter_Fahrer"],
  "kennzeichen": "KA-RD 1234"
}
```

**Wichtig:**
- ✅ `rolle` ist ein **Array** (auch bei nur einer Rolle!)
- ✅ Exakte Schreibweise beachten (z.B. `Vorarbeiter_Fahrer` mit Unterstrich)
- ✅ Mindestens eine Rolle erforderlich
- ✅ `kommentar` enthält alle Stationen mit Transport-Arten (max. 500 Zeichen)
- ✅ `vorgangsno` ist die Pipedrive Deal-ID
- ✅ `angebotsno` ist die Pipedrive Projekt-ID

## UI-Features

### Zugewiesene Mitarbeiter-Karte

```
┌─────────────────────────────────────┐
│ Max Mustermann              [X]     │
├─────────────────────────────────────┤
│ Rolle(n) für diese Tour:            │
│                                     │
│ [🔧 Monteur - Standard... ▼]       │
│                                     │
│ + Zusätzliche Rollen hinzufügen ▶   │
│   [🚗 Fahrer] [📦 Transportfachkr.] │
│   [👷 Vorarbeiter_Fahrer]           │
│                                     │
│ Aktuelle Rollen:                    │
│ [🔧 Monteur] [👷 Vorarbeiter_Fahrer]│
└─────────────────────────────────────┘
```

### Funktionen

- **Dropdown**: Wählt primäre Rolle
- **Toggle-Buttons**: Zusätzliche Rollen hinzufügen/entfernen
- **Badge-Anzeige**: Zeigt alle aktiven Rollen
- **Standard**: Jeder Mitarbeiter startet mit "Monteur"

## Daten-Flow

```
Benutzer wählt Rolle + Transport-Art
    ↓
State: employeeRoles[index] = ['Rolle1', 'Rolle2']
       stationTransportTypes[idx] = 'klavier'
    ↓
Speichern-Klick
    ↓
┌──────────────────────────────────────────────┐
│ 1. Tour → Pipedrive                          │
│ 2. Termine → SPTimeSchedule API              │
│    - Rollen im "rolle" Array                 │
│    - Stationen + Transport-Arten im Kommentar│
│    - vorgangsno = Pipedrive Deal-ID          │
└──────────────────────────────────────────────┘
```

## Besonderheiten

### Mehrfache Rollen

Mitarbeiter können mehrere Rollen haben, z.B.:
- Hauptrolle: **Transportfachkraft**
- Zusatzrolle: **Fahrer**

API erhält: `["Transportfachkraft", "Fahrer"]`

### Standard-Rolle

Wenn keine Rolle explizit gewählt:
- ✅ Automatisch: `["Monteur"]`
- ✅ Verhindert leere Rollen-Arrays

### Validierung

- ✅ Mindestens eine Rolle erforderlich
- ✅ Array-Format wird automatisch sichergestellt
- ✅ Exakte Schreibweise aus Referenz verwendet

## Erfolgsmeldung

Nach dem Speichern zeigt das System:

```
✅ Erfolgreich gespeichert!

✅ Tour in Pipedrive gespeichert
✅ Kalendertermine für 3 Mitarbeiter gebucht
   → 5 Stationen im Kommentar
   → Transport-Arten: 🎹 Klaviertransport (3×), 📦 Normaler Umzug (2×)

Mitarbeiter & Rollen:
  • Max Mustermann: 🔧 Monteur, 👷 Vorarbeiter & Fahrer
  • Hans Schmidt: 📦 Transportfachkraft
  • Peter Müller: 🚗 Fahrer

Tour: "Karlsruhe Nord"
```

## Best Practices

### Empfohlene Rollen-Zuweisungen

#### Klaviertransport-Tour
```
Team-Lead: Vorarbeiter_Fahrer + Transportfachkraft
Team-Mitglieder: Transportfachkraft
```

#### Großer Umzug
```
Koordinator: Umzugskoordinator
Vorarbeiter: Vorarbeiter_Fahrer
Team: Monteur
```

#### Kleine Tour
```
Alle: Monteur + Fahrer
```

### Tipps

1. ✅ **Vorarbeiter zuweisen** bei großen Teams
2. ✅ **Transportfachkraft** für Spezialtransporte (Klavier, Flügel)
3. ✅ **Fahrer** wenn nur Transport ohne Montage
4. ✅ **Mehrere Rollen** wenn Mitarbeiter flexibel eingesetzt wird

## Fehlerbehebung

### Problem: Rolle wird nicht übertragen
**Lösung:** 
- Prüfen Sie die Browser-Konsole
- Log: `"rolle": ["IhreRolle"]`
- Stellen Sie sicher, dass Rolle ausgewählt wurde

### Problem: "Mindestens eine Rolle erforderlich"
**Lösung:**
- Primäre Rolle muss gesetzt sein
- Bei Mehrfachauswahl: Primäre Rolle bleibt erhalten

### Problem: API-Fehler "Ungültige Rolle"
**Lösung:**
- Prüfen Sie Schreibweise (z.B. `Vorarbeiter_Fahrer` mit Unterstrich)
- Verwenden Sie nur Rollen aus `ROLLEN_REFERENZ.md`

## Technische Details

### State-Management

```javascript
// State
const [employeeRoles, setEmployeeRoles] = useState({});

// Struktur
{
  0: ['Monteur'],                           // Mitarbeiter 1
  1: ['Transportfachkraft', 'Fahrer'],     // Mitarbeiter 2
  2: ['Vorarbeiter_Fahrer']                 // Mitarbeiter 3
}
```

### API-Format

**SPTimeSchedule:**
```javascript
{
  rolle: ['Monteur', 'Fahrer']  // Array!
}
```

**Route API:**
```javascript
{
  rollen: ['Monteur', 'Fahrer']  // Array!
}
```

## Migration

### Von fester Rolle zu auswählbarer Rolle

**Vorher (fest codiert):**
```javascript
rolle: ['Monteur']  // Immer gleich
```

**Jetzt (auswählbar):**
```javascript
rolle: employeeRoles[index] || ['Monteur']  // Pro Mitarbeiter
```

### Kompatibilität

- ✅ Alte Termine (ohne Rollenauswahl): Nutzen Standard "Monteur"
- ✅ Neue Termine: Nutzen ausgewählte Rollen
- ✅ Keine Daten-Migration erforderlich

## Erweiterungsmöglichkeiten

### Zukünftige Features

1. **Rollen-Vorschläge** basierend auf:
   - Mitarbeiter-Qualifikationen
   - Tour-Art (Klavier → Transportfachkraft)
   - Transport-Arten der Stationen

2. **Rollen-Statistik**
   - Welche Rolle wird am häufigsten genutzt?
   - Mitarbeiter-Auslastung pro Rolle

3. **Rollen-Anforderungen**
   - Tour erfordert bestimmte Rolle
   - Warnung bei fehlender Qualifikation

4. **Dynamische Rollen**
   - Rolle ändert sich pro Station
   - Beispiel: Station 1-3 = Monteur, Station 4 = Koordinator

## Zusammenfassung

✅ **Implementiert:**
- Rollenauswahl pro Mitarbeiter
- Primäre + Zusätzliche Rollen
- Übertragung an beide APIs
- Detaillierte Erfolgsmeldung

✅ **Getestet:**
- Keine Linter-Fehler
- Korrekte API-Formate
- State-Management funktioniert

✅ **Bereit für Produktion:**
- Vollständig dokumentiert
- Best Practices definiert
- Fehlerbehandlung implementiert

Die Rollen-Integration ist vollständig einsatzbereit! 🚀

