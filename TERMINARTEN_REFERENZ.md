# 📅 Terminarten - Referenz

Basierend auf der erhaltenen CSV-Datei. Alle verfügbaren Terminarten für Terminbuchungen.

## 🎯 Wichtig für Ihre Anwendung

### Klaviertransport & Umzug (Hauptverwendung)

Für Ihren TourPlanner sind besonders relevant:

| UUID | Name | Verwendung |
|------|------|------------|
| `5fd2037-9c` | **Klaviertransport** | ✅ **EMPFOHLEN für Klaviere** |
| `67179cf2-69c` | Klaviertransport | Alternative 1 |
| `63a4163-3d` | Klaviertransport | Alternative 2 |
| `3a4df8a1-23` | **Umzug** | ✅ **EMPFOHLEN für normale Umzüge** |

### Spezielle Transporte

| UUID | Name | Verwendung |
|------|------|------------|
| `67179cd1-9c` | Flügeltransport | Für Flügel-spezifische Touren |
| `67179c00-e1` | Flügeltransport | Alternative 1 |
| `67179c6c-72` | Flügeltransport | Alternative 2 |
| `612f3c50-06e` | Maschinen m | Maschinentransporte |

### Vor-/Nachbereitung

| UUID | Name | Verwendung |
|------|------|------------|
| `1c4ba741-23` | Kartonanlief | Karton-Anlieferung |
| `67179e4b-41` | Kartonabhol | Karton-Abholung |
| `5e3a990f-bd` | Besichtigung | Besichtigungstermine |
| `63930de7-e4` | Aufstellung h | Aufstellung |
| `67179f19-4c` | Abholung h | Abholung |
| `63932fa1-44` | Laden TÜR K | Beladen |

---

## ⚙️ Im Code verwenden

### Standard-Setup (EMPFOHLEN)

Wählen Sie **eine** dieser UUIDs für `.env`:

#### Option 1: Klaviertransport (für Piano-fokussierte App)
```bash
REACT_APP_DEFAULT_TERMINART_ID=5fd2037-9c
```

#### Option 2: Allgemeiner Umzug (für gemischte Touren)
```bash
REACT_APP_DEFAULT_TERMINART_ID=3a4df8a1-23
```

### Im Code (wird automatisch verwendet)

**Datei:** `src/components/TourPlanner.js` (Zeile 1924)

```javascript
return {
  personalid: employee.id,
  terminart: DEFAULT_TERMINART_ID, // ← Nutzt .env Wert
  // ...
};
```

Die UUID aus `.env` wird automatisch in alle Termine eingefügt.

---

## 🔍 Alle verfügbaren Terminarten

### Arbeits-Termine
- `3a4df8a1-23` - **Umzug**
- `5fd2037-9c` - **Klaviertransport** ⭐
- `67179cf2-69c` - Klaviertransport
- `63a4163-3d` - Klaviertransport
- `67179cd1-9c` - Flügeltransport
- `67179c00-e1` - Flügeltransport
- `67179c6c-72` - Flügeltransport
- `612f3c50-06e` - Maschinen m
- `1c4ba741-23` - Kartonanlief
- `67179e4b-41` - Kartonabhol
- `5e3a990f-bd` - Besichtigung
- `63930de7-e4` - Aufstellung h
- `67179f19-4c` - Abholung h
- `63932fa1-44` - Laden TÜR K

### Abwesenheits-Termine (nicht für TourPlanner)
Diese werden vom System zur Verfügbarkeits-Prüfung genutzt:

- `4086271D-23` - Urlaub
- `4aa956e9-23` - Krankheit
- `609e289a-dd` - Krankheit (mi
- `60de466a-66` - Krank0
- `5fd2023a-f2f` - Kindkrank m
- `5784c795-23` - Feiertag
- `62a1f6a7-22f` - Feiertag
- `5fd2023a-f2f` - Pause
- `5fd2023a-f2f` - Ehrenamt
- `5fd2023a-f2f` - unbezahlte A
- `5fd2023a-f2f` - Azubisrund
- `6001a0bb-3e` - Unbezahlt AI
- `61823ba3-4c` - Nicht planba
- `5e9f536a-3f` - Einstellungsdatum

---

## 💡 Empfehlung für Ihre .env

### Variante A: Fokus auf Klaviertransporte
```bash
# Optimal wenn hauptsächlich Klaviere/Flügel transportiert werden
REACT_APP_DEFAULT_TERMINART_ID=5fd2037-9c
```

**Vorteil:** Termine werden spezifisch als "Klaviertransport" gekennzeichnet

### Variante B: Gemischte Touren
```bash
# Optimal wenn verschiedene Arten von Transporten vorkommen
REACT_APP_DEFAULT_TERMINART_ID=3a4df8a1-23
```

**Vorteil:** Allgemeinerer Begriff, deckt alle Umzugsarten ab

### Variante C: Dynamisch (erweitert)

Für Fortgeschrittene - verschiedene Terminarten basierend auf Tour-Inhalt:

**Datei:** `src/components/TourPlanner.js` (Zeile 1920-1934)

```javascript
// Bestimme Terminart dynamisch
let terminartId = DEFAULT_TERMINART_ID; // Standard aus .env

// Prüfe Tour-Typ
const hasKlaviere = tourDeals.some(deal => 
  deal.title?.toLowerCase().includes('piano') || 
  deal.title?.toLowerCase().includes('klavier')
);

const hasFlügel = tourDeals.some(deal => 
  deal.title?.toLowerCase().includes('flügel')
);

// Wähle spezifische Terminart
if (hasFlügel) {
  terminartId = '67179cd1-9c'; // Flügeltransport
} else if (hasKlaviere) {
  terminartId = '5fd2037-9c'; // Klaviertransport
}

return {
  personalid: employee.id,
  terminart: terminartId, // ← Dynamisch gewählt
  // ...
};
```

---

## ⚠️ Wichtige Hinweise

### 1. UUID-Format
Die UUIDs sind **ohne** vollständige UUID-Struktur:
```
✅ Richtig: 5fd2037-9c
❌ Nicht: 5fd2037-9c-xxxx-xxxx-xxxxxxxxxxxx
```

Verwenden Sie die UUIDs **exakt** wie in der CSV!

### 2. Mehrfache Klaviertransport-Einträge
Es gibt 3 verschiedene UUIDs für "Klaviertransport":
- `5fd2037-9c` ⭐ **EMPFOHLEN** (scheint Standard zu sein)
- `67179cf2-69c`
- `63a4163-3d`

**Fragen Sie Jonathan**, ob es einen Unterschied gibt, oder nutzen Sie `5fd2037-9c`.

### 3. Verfügbarkeits-Check
Das System erkennt automatisch Mitarbeiter als "verplant", wenn sie Termine haben mit:
- Urlaub
- Krankheit
- Feiertag
- etc.

Diese Terminarten werden **nicht** im TourPlanner verwendet, aber bei der Mitarbeiter-Abfrage berücksichtigt!

---

## 🧪 Nach Konfiguration testen

1. **`.env` ergänzen:**
   ```bash
   REACT_APP_DEFAULT_TERMINART_ID=5fd2037-9c
   ```

2. **App starten:**
   ```bash
   npm start
   ```

3. **Tour erstellen & speichern**

4. **Konsole prüfen (F12):**
   ```javascript
   [SPTimeSchedule] Sende Termine: [
     {
       terminart: "5fd2037-9c", // ← Prüfen!
       // ...
     }
   ]
   ```

5. **Erfolg:**
   ```
   [SPTimeSchedule] Termine erfolgreich erstellt
   ```

---

## 📊 Status-Update

**Was Sie jetzt haben:**
- ✅ Personaleigenschaften.csv
- ✅ Rollen.csv  
- ✅ **Terminarten.csv** 🎉
- ❌ API-Token (NUR NOCH DIES!)

**Nächster Schritt:**
Nur noch den **API-Token** von Jonathan anfordern!

---

## 🎯 Meine Empfehlung

### Für Ihre Moving-Assistant App:

```bash
# In .env setzen:
REACT_APP_DEFAULT_TERMINART_ID=5fd2037-9c
```

**Begründung:**
- Ihre App heißt "Moving Assistant"
- Fokus auf Klaviertransporte (TourPlanner.js hat Piano-Logik)
- "Klaviertransport" ist spezifischer als "Umzug"
- UUID `5fd2037-9c` scheint die Standard-ID zu sein

Falls Sie auch normale Umzüge (ohne Klavier) planen, können Sie später auf `3a4df8a1-23` (Umzug) wechseln oder die dynamische Variante implementieren.

