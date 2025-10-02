# 🎨 Neue UI-Features - Mitarbeiter-Übersicht & Terminart-Auswahl

## ✨ Was wurde hinzugefügt

Sie haben jetzt **2 neue leistungsstarke Features** im TourPlanner!

---

## 1️⃣ Mitarbeiter-Übersicht Panel

### 📊 Was ist das?

Ein ausklappbares Panel, das **ALLE** verfügbaren Mitarbeiter für das gewählte Datum übersichtlich darstellt.

### 🎯 Wo finden Sie es?

**Rechte Spalte** im TourPlanner, **oberhalb** der Tourplanung.

```
┌─────────────────────────────────────┐
│ 🏢 Mitarbeiter-Übersicht            │
│    (5 verfügbar, 2 verplant)   [▶]  │
└─────────────────────────────────────┘
```

Klicken Sie auf das Panel, um es **auf-/zuzuklappen**.

### 📋 Features

#### ✅ Verfügbare Mitarbeiter (grüner Bereich)
- **Name** mit ✓-Symbol
- **Skills** als Badges:
  - 🚗 Führerscheinklasse (z.B. "C1, C")
  - 🎹 Klavierträger (falls vorhanden)
- **"Hinzufügen"-Button** → Direkt zur Tour hinzufügen

**Beispiel:**
```
┌─────────────────────────────────────┐
│ ● Verfügbar (5)                     │
├─────────────────────────────────────┤
│ Max Mustermann        ✓ Verfügbar   │
│ 🚗 C1, C  🎹 Klavierträger           │
│                        [Hinzufügen]  │
├─────────────────────────────────────┤
│ Anna Schmidt          ✓ Verfügbar   │
│ 🚗 CE                                │
│                        [Hinzufügen]  │
└─────────────────────────────────────┘
```

#### ⚠️ Verplante Mitarbeiter (gelber Bereich)
- **Name** mit ⚠️-Symbol
- **Termine aufklappbar** → Zeigt bestehende Termine:
  - Startzeit - Endzeit
  - Terminart (z.B. "Umzug", "Urlaub")
- **"Trotzdem +"-Button** → Überbuchung möglich (mit Warnung)

**Beispiel:**
```
┌─────────────────────────────────────┐
│ ● Verplant (2)                      │
├─────────────────────────────────────┤
│ Tom Weber            ⚠️ Verplant     │
│ ▶ 2 Termine                         │
│   • 09:00 - 17:00: Umzug            │
│   • 18:00 - 20:00: Aufstellung      │
│                      [Trotzdem +]   │
└─────────────────────────────────────┘
```

### 💡 Vorteile

- ✅ **Schneller Überblick** über ALLE Mitarbeiter
- ✅ **Skills sofort sichtbar** (Führerschein, Spezialisierungen)
- ✅ **Termine einsehbar** bei verplanten Mitarbeitern
- ✅ **Ein-Klick-Zuweisung** zur Tour
- ✅ **Filtert bereits zugewiesene** Mitarbeiter automatisch aus

---

## 2️⃣ Terminart-Auswahl pro Tour

### 📅 Was ist das?

Ein Dropdown zur Auswahl der **Terminart** für die aktuelle Tour.

### 🎯 Wo finden Sie es?

In der **Tourplanung**, neben Datum, Startzeit und Tourname.

```
┌──────────────────────────────────────────────┐
│ Datum         │ Startzeit │ Tourname         │
│ 02.10.2025    │ 08:00     │ Tour ABC         │
├───────────────┴───────────┴──────────────────┤
│ Terminart                                    │
│ 🎹 Klaviertransport              [▼]        │
└──────────────────────────────────────────────┘
```

### 📋 Verfügbare Terminarten

Alle Terminarten aus Ihrer CSV sind verfügbar:

#### 🎹 Klaviere & Flügel
- **🎹 Klaviertransport** ⭐ (Standard)
- 🎹 Klaviertransport (Alt. 1)
- 🎹 Klaviertransport (Alt. 2)
- 🎹 Flügeltransport
- 🎹 Flügeltransport (Alt. 1)
- 🎹 Flügeltransport (Alt. 2)

#### 📦 Umzüge & Transport
- **📦 Umzug**
- ⚙️ Maschinen
- 📦 Kartonanlief
- 📦 Kartonabhol

#### 🔧 Sonstige
- 👁️ Besichtigung
- 🔧 Aufstellung
- 📍 Abholung
- 🚪 Laden TÜR

### 💡 Verwendung

1. **Tour erstellen** → Aufträge hinzufügen
2. **Terminart wählen** → Passende Terminart aus Dropdown wählen
3. **Mitarbeiter zuweisen** → Aus Übersicht oder Dropdown
4. **Tour speichern** → Die gewählte Terminart wird in ALLE Termine eingetragen

### 📊 In den Terminen

Beim Speichern wird die gewählte Terminart für **jeden Mitarbeiter** verwendet:

```javascript
{
  "personalid": "uuid-des-mitarbeiters",
  "terminart": "5fd2037-9c", // ← Ihre gewählte Terminart
  "datum": "2025-10-02",
  // ...
}
```

### 🔄 Verschiedene Terminarten für verschiedene Touren

**Szenario:** Sie planen 2 Touren am selben Tag:

**Tour 1 (morgens):**
- Terminart: 🎹 Klaviertransport
- Mitarbeiter: Max, Anna

**Tour 2 (nachmittags):**
- Terminart: 📦 Umzug
- Mitarbeiter: Tom, Lisa

Jede Tour kann ihre **eigene** Terminart haben!

---

## 🎓 Workflow-Beispiel

### Beispiel: Klaviertransport planen

1. **Datum wählen:** 15.06.2025
   → System lädt automatisch Mitarbeiter

2. **Mitarbeiter-Übersicht öffnen** (Panel aufklappen)
   → Zeigt z.B.:
   ```
   Verfügbar (5):
   - Max Mustermann ✓ (🚗 C1, C | 🎹 Klavierträger)
   - Anna Schmidt ✓ (🚗 CE)
   
   Verplant (2):
   - Tom Weber ⚠️ (2 Termine: 09:00-12:00 Umzug, ...)
   ```

3. **Mitarbeiter auswählen:**
   - Klick auf "Hinzufügen" bei Max Mustermann
   - Klick auf "Hinzufügen" bei Anna Schmidt
   → Beide erscheinen in "Mitarbeiter für diese Tour"

4. **Terminart wählen:** 
   - Dropdown: "🎹 Klaviertransport" auswählen

5. **Aufträge hinzufügen:**
   - Deals per Drag & Drop in Tour ziehen
   - Route berechnen

6. **Tour speichern:**
   - Pipedrive wird aktualisiert
   - **2 Termine** werden gebucht:
     - Max: Terminart "Klaviertransport"
     - Anna: Terminart "Klaviertransport"

---

## 🆚 Vorher vs. Nachher

### Mitarbeiter-Ansicht

**Vorher:**
- Nur Dropdown mit Namen
- Keine Details sichtbar
- Kein Überblick über alle Mitarbeiter

**Nachher:**
- ✅ Dediziertes Übersichts-Panel
- ✅ Skills & Qualifikationen sichtbar
- ✅ Termine bei verplanten Mitarbeitern
- ✅ Verfügbar/Verplant farblich getrennt
- ✅ Ein-Klick-Zuweisung

### Terminart

**Vorher:**
- Fest in `.env` konfiguriert
- Nur 1 Terminart für ALLE Touren
- Änderung nur durch Code-Anpassung

**Nachher:**
- ✅ Pro Tour wählbar
- ✅ 14 verschiedene Terminarten verfügbar
- ✅ Einfaches Dropdown
- ✅ Icon für visuelle Unterscheidung

---

## 🎨 UI-Verbesserungen im Detail

### Farb-Kodierung

| Status/Typ | Farbe | Bedeutung |
|------------|-------|-----------|
| Verfügbar | 🟢 Grün | Mitarbeiter hat keine Termine am Tag |
| Verplant | 🟡 Gelb | Mitarbeiter hat bereits Termine |
| Skills | 🔵 Blau | Führerschein-Information |
| Klavierträger | 🟣 Lila | Spezial-Qualifikation |

### Icons

| Icon | Bedeutung |
|------|-----------|
| 🎹 | Klavier/Flügel-Transport |
| 📦 | Umzug/Karton |
| 🚗 | Führerschein |
| ⚙️ | Maschinen |
| 👁️ | Besichtigung |
| 🔧 | Aufstellung/Montage |

### Interaktive Elemente

- **Aufklappbar:** Mitarbeiter-Panel, Termin-Details
- **Hover-Effekte:** Buttons ändern Farbe
- **Tooltips:** "Trotzdem +" zeigt Warnung bei Hover
- **Responsive:** Funktioniert auf allen Bildschirmgrößen

---

## 🔍 Technische Details

### Neue State-Variablen

```javascript
const [availableEmployees, setAvailableEmployees] = useState([]);
const [loadingEmployees, setLoadingEmployees] = useState(false);
const [showEmployeePanel, setShowEmployeePanel] = useState(false);
const [selectedTerminartId, setSelectedTerminartId] = useState(DEFAULT_TERMINART_ID);
```

### Neue Komponente

`EmployeeOverviewPanel` - Eigenständige, wiederverwendbare Komponente

### API-Integration

- Nutzt bestehende `fetchAvailableEmployees` Funktion
- Zeigt `eigenschaften`, `termine` und `vertraege` aus API-Response
- Dynamische Verfügbarkeits-Prüfung

---

## 🧪 Testen der neuen Features

### Test 1: Mitarbeiter-Übersicht

1. **App starten:** `npm start`
2. **TourPlanner öffnen**
3. **Datum wählen:** z.B. Morgen
4. **Panel aufklappen:** Klick auf "Mitarbeiter-Übersicht"

**Erwartung:**
- ✅ Panel klappt auf
- ✅ Liste zeigt verfügbare Mitarbeiter (grün)
- ✅ Liste zeigt verplante Mitarbeiter (gelb)
- ✅ Skills werden als Badges angezeigt
- ✅ "Hinzufügen"-Button funktioniert

### Test 2: Terminart-Auswahl

1. **Tour starten:** Aufträge hinzufügen
2. **Terminart-Dropdown öffnen**
3. **Andere Terminart wählen:** z.B. "📦 Umzug"
4. **Mitarbeiter zuweisen & speichern**

**Erwartung:**
- ✅ Dropdown zeigt alle 14 Terminarten
- ✅ Gewählte Terminart wird gespeichert
- ✅ Browser-Konsole (F12) zeigt:
  ```
  [SPTimeSchedule] Sende Termine: [
    { terminart: "3a4df8a1-23", ... }
  ]
  ```

### Test 3: Skills-Anzeige

1. **Mitarbeiter-Panel aufklappen**
2. **Mitarbeiter mit Klavierträger-Skill prüfen**

**Erwartung:**
- ✅ Badge "🎹 Klavierträger" wird angezeigt
- ✅ Führerschein-Badge zeigt Klassen

### Test 4: Termin-Details

1. **Verplanten Mitarbeiter finden** (gelber Bereich)
2. **Klick auf "2 Termine"** (Details aufklappen)

**Erwartung:**
- ✅ Details klappen auf
- ✅ Zeigt Startzeit, Endzeit, Terminart
- ✅ Max. 3 Termine werden angezeigt

---

## 📸 UI-Screenshots (Beschreibung)

### Mitarbeiter-Übersicht (zugeklappt)
```
┌─────────────────────────────────────────┐
│ 🏢 Mitarbeiter-Übersicht                │
│    (5 verfügbar, 2 verplant)       [▶]  │
└─────────────────────────────────────────┘
```

### Mitarbeiter-Übersicht (aufgeklappt)
```
┌─────────────────────────────────────────┐
│ 🏢 Mitarbeiter-Übersicht                │
│    (5 verfügbar, 2 verplant)       [▼]  │
├─────────────────────────────────────────┤
│ ● Verfügbar (5)                         │
│ ┌─────────────────────────────────────┐ │
│ │ Max Mustermann    ✓ Verfügbar       │ │
│ │ 🚗 C1, C  🎹 Klavierträger           │ │
│ │                      [Hinzufügen]   │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Anna Schmidt      ✓ Verfügbar       │ │
│ │ 🚗 CE                                │ │
│ │                      [Hinzufügen]   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ● Verplant (2)                          │
│ ┌─────────────────────────────────────┐ │
│ │ Tom Weber        ⚠️ Verplant         │ │
│ │ ▶ 2 Termine                         │ │
│ │                      [Trotzdem +]   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Terminart-Dropdown
```
┌─────────────────────────────────────────┐
│ Datum      │ Startzeit │ Tourname        │
│ 02.10.2025 │ 08:00     │ Tour Karlsruhe  │
├────────────┴───────────┴─────────────────┤
│ Terminart                                │
│ 🎹 Klaviertransport           [▼]       │
└─────────────────────────────────────────┘

Dropdown-Optionen:
  🎹 Klaviertransport ⭐
  🎹 Klaviertransport (Alt. 1)
  🎹 Klaviertransport (Alt. 2)
  📦 Umzug
  🎹 Flügeltransport
  ...
```

---

## ⚙️ Konfiguration

### Standard-Terminart

**In `.env`:**
```bash
REACT_APP_DEFAULT_TERMINART_ID=5fd2037-9c
```

Diese wird als **Vorauswahl** im Dropdown verwendet.

### Terminarten anpassen

**Datei:** `src/components/TourPlanner.js` (Zeile 638-653)

**Aktuell:**
```javascript
const TERMINARTEN = [
  { id: '5fd2037-9c', name: 'Klaviertransport', icon: '🎹', color: 'purple' },
  { id: '3a4df8a1-23', name: 'Umzug', icon: '📦', color: 'blue' },
  // ... weitere
];
```

**Anpassbar:**
- Namen ändern
- Icons ändern
- Reihenfolge ändern
- Terminarten entfernen (falls nicht benötigt)

### Skills-Anzeige erweitern

**Datei:** `src/components/TourPlanner.js` (Zeile 514-527)

**Aktuell:**
```javascript
{employee.eigenschaften.personal_properties_Fhrerscheinklasse && (
  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
    🚗 {employee.eigenschaften.personal_properties_Fhrerscheinklasse}
  </span>
)}
{employee.eigenschaften.personal_properties_Klavierträger === 'Ja' && (
  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
    🎹 Klavierträger
  </span>
)}
```

**Erweiterbar mit weiteren Skills:**
```javascript
{employee.eigenschaften.personal_properties_Vorarbeiter === 'Ja' && (
  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
    👔 Vorarbeiter
  </span>
)}
{employee.eigenschaften.personal_properties_Montagen === 'Ja' && (
  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
    🔧 Montage
  </span>
)}
```

---

## 💼 Praktische Anwendungsfälle

### Use Case 1: Klaviertransport mit Spezialisten

**Situation:** Sie müssen einen Flügel transportieren

1. **Mitarbeiter-Panel öffnen**
2. **Suchen nach:** Mitarbeiter mit 🎹 Klavierträger Badge
3. **Hinzufügen:** Die Spezialisten
4. **Terminart:** 🎹 Flügeltransport wählen
5. **Speichern**

→ **Ergebnis:** Nur qualifizierte Mitarbeiter, korrekte Terminart

### Use Case 2: Standard-Umzug mit verfügbaren Mitarbeitern

**Situation:** Normaler Umzug, benötigen 3 Mitarbeiter

1. **Datum wählen**
2. **Panel öffnen** → Zeigt 8 verfügbare, 4 verplante
3. **3 verfügbare auswählen** → Schnell per "Hinzufügen"-Button
4. **Terminart:** 📦 Umzug (falls nicht schon Standard)
5. **Tour planen & speichern**

→ **Ergebnis:** Keine Überbuchung, schnelle Zuweisung

### Use Case 3: Notfall - Überbuchung nötig

**Situation:** Alle verfügbaren Mitarbeiter sind zu wenig

1. **Panel öffnen**
2. **Verplante Mitarbeiter prüfen:**
   - Tom Weber: 09:00-12:00 Umzug (kurz!)
   - Könnte danach verfügbar sein
3. **Klick auf "Trotzdem +"** bei Tom
   - System warnt mit gelbem Hintergrund ⚠️
4. **Manuell koordinieren:** Tom ab 13:00 einsetzen

→ **Ergebnis:** Flexibilität bei Engpässen

---

## 🎁 Bonus-Features

### Automatische Filterung
- **Bereits zugewiesene** Mitarbeiter werden im Panel ausgeblendet
- **Verhindert** versehentliche Doppel-Zuweisung

### Live-Aktualisierung
- **Datum ändern** → Mitarbeiter-Liste aktualisiert sich automatisch
- **Mitarbeiter hinzufügen** → Verschwindet aus Panel

### Smart Defaults
- **Terminart:** Startet mit `.env` Wert (Klaviertransport)
- **Sortierung:** Verfügbare zuerst, dann verplante

---

## 🆘 Troubleshooting

### "Keine Mitarbeiter für dieses Datum gefunden"

**Mögliche Ursachen:**
1. Skills zu streng konfiguriert
2. Kein Mitarbeiter verfügbar am gewählten Tag
3. API-Token ungültig

**Lösung:**
- Konsole prüfen (F12): `[ServiceProvider]` Logs
- Skills lockern (siehe `PERSONALEIGENSCHAFTEN_REFERENZ.md`)

### Terminart-Dropdown zeigt keine Icons

**Browser-Problem:** Manche Browser unterstützen Emojis in `<option>` nicht

**Kein Problem:** Funktionalität bleibt erhalten, nur Optik

### Mitarbeiter-Panel bleibt leer nach Aufklappen

**Prüfen:**
1. Konsole: `[ServiceProvider] Gefundene Mitarbeiter: X`
2. Falls 0: Keine Mitarbeiter gefunden → Skills anpassen
3. Falls >0 aber Panel leer: Alle schon zugewiesen?

---

## 📊 Zusammenfassung

**Neue Features:**
- ✅ Mitarbeiter-Übersicht Panel (ausklappbar)
- ✅ Skills & Qualifikationen sichtbar
- ✅ Termin-Details bei verplanten Mitarbeitern
- ✅ Terminart-Dropdown (14 Optionen)
- ✅ Pro Tour individuell wählbar

**Vorteile:**
- 🚀 Schnellere Mitarbeiter-Auswahl
- 👀 Bessere Übersicht
- 🎯 Präzisere Terminbuchung
- 💼 Professionellere Planung

**Sie können jetzt:**
- ✅ ALLE Mitarbeiter auf einen Blick sehen
- ✅ Skills & Verfügbarkeit sofort erkennen
- ✅ Terminart pro Tour anpassen
- ✅ Intelligenter planen mit mehr Informationen

Viel Spaß mit den neuen Features! 🎉

