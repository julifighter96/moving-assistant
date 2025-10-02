# 🚀 Schnellstart - Neue UI-Features

## ✨ Sie haben jetzt 2 neue Features!

Nach dem nächsten App-Start sehen Sie:

---

## 1️⃣ Mitarbeiter-Übersicht Panel

### Wo? 
**Rechte Spalte**, ganz oben (über der Tourplanung)

### Aussehen (zugeklappt):
```
╔═══════════════════════════════════════╗
║ 🏢 Mitarbeiter-Übersicht              ║
║    (5 verfügbar, 2 verplant)     [▶]  ║
╚═══════════════════════════════════════╝
```

### Klicken → Aufklappen:
```
╔═══════════════════════════════════════╗
║ 🏢 Mitarbeiter-Übersicht              ║
║    (5 verfügbar, 2 verplant)     [▼]  ║
╠═══════════════════════════════════════╣
║ ● Verfügbar (5)                       ║
║ ┌───────────────────────────────────┐ ║
║ │ Max Mustermann    ✓ Verfügbar     │ ║
║ │ 🚗 C1, C  🎹 Klavierträger         │ ║
║ │                    [Hinzufügen]   │ ║
║ └───────────────────────────────────┘ ║
║ ┌───────────────────────────────────┐ ║
║ │ Anna Schmidt      ✓ Verfügbar     │ ║
║ │ 🚗 CE                              │ ║
║ │                    [Hinzufügen]   │ ║
║ └───────────────────────────────────┘ ║
║                                       ║
║ ● Verplant (2)                        ║
║ ┌───────────────────────────────────┐ ║
║ │ Tom Weber        ⚠️ Verplant       │ ║
║ │ ▶ 2 Termine (klicken für Details) │ ║
║ │                    [Trotzdem +]   │ ║
║ └───────────────────────────────────┘ ║
╚═══════════════════════════════════════╝
```

### Funktionen:
- ✅ **Klick auf "Hinzufügen"** → Mitarbeiter wird sofort zur Tour hinzugefügt
- ✅ **Skills sichtbar** → Sehen Sie Führerschein & Qualifikationen
- ✅ **Termine aufklappbar** → Bei verplanten Mitarbeitern Details sehen
- ✅ **"Trotzdem +"** → Auch verplante Mitarbeiter zuweisen (mit Warnung)

---

## 2️⃣ Terminart-Auswahl

### Wo?
**In der Tourplanung**, neben Datum/Startzeit/Tourname

### Aussehen:
```
╔════════════════════════════════════════════╗
║ Datum      │ Startzeit │ Tourname          ║
║ 02.10.2025 │ 08:00     │ Tour Karlsruhe    ║
╠════════════╪═══════════╪═══════════════════╣
║ Terminart                                  ║
║ 🎹 Klaviertransport            [▼]        ║
╚════════════════════════════════════════════╝
```

### Dropdown öffnen:
```
╔════════════════════════════════════╗
║ 🎹 Klaviertransport         ← Gewählt
║ 🎹 Klaviertransport (Alt. 1)
║ 🎹 Klaviertransport (Alt. 2)
║ 📦 Umzug
║ 🎹 Flügeltransport
║ 🎹 Flügeltransport (Alt. 1)
║ 🎹 Flügeltransport (Alt. 2)
║ ⚙️ Maschinen
║ 📦 Kartonanlief
║ 📦 Kartonabhol
║ 👁️ Besichtigung
║ 🔧 Aufstellung
║ 📍 Abholung
║ 🚪 Laden TÜR
╚════════════════════════════════════╝
```

### Funktion:
- ✅ **Wählen Sie** die passende Terminart für diese Tour
- ✅ **Wird automatisch** in ALLE gebuchten Termine eingetragen
- ✅ **Pro Tour unterschiedlich** → Morgens Klavier, Nachmittags Umzug

---

## 🎯 Schnellstart in 30 Sekunden

### Schritt 1: App starten
```bash
npm start
```

### Schritt 2: Datum wählen
- TourPlanner öffnen
- Datum auswählen (z.B. morgen)
- ⏳ System lädt Mitarbeiter automatisch

### Schritt 3: Mitarbeiter-Panel öffnen
- **Klick** auf "🏢 Mitarbeiter-Übersicht"
- Panel klappt auf
- ✅ Sehen Sie verfügbare Mitarbeiter

### Schritt 4: Mitarbeiter hinzufügen
- **Klick** auf "Hinzufügen" bei einem verfügbaren Mitarbeiter
- ✅ Erscheint in "Mitarbeiter für diese Tour"

### Schritt 5: Terminart wählen
- **Dropdown** bei "Terminart" öffnen
- **Wählen:** z.B. "🎹 Klaviertransport"
- ✅ Wird für alle Termine verwendet

### Schritt 6: Tour speichern
- Aufträge zur Tour hinzufügen
- "Tour speichern" klicken
- ✅ **Termine werden mit gewählter Terminart gebucht!**

---

## 🎓 Tipps & Tricks

### Tipp 1: Schnelle Mitarbeiter-Auswahl
**Statt** Dropdown nutzen:
→ **Panel aufklappen** → Alle Mitarbeiter auf einen Blick → Klick "Hinzufügen"

**Vorteil:** Sehen Sie Skills direkt, keine Suche nötig

### Tipp 2: Verplante Mitarbeiter prüfen
**Klick** auf "2 Termine" bei verplanten Mitarbeitern
→ Sehen Sie: "09:00-12:00: Umzug"
→ **Entscheidung:** Vielleicht ab 13:00 verfügbar? → "Trotzdem +" und manuell koordinieren

### Tipp 3: Terminart pro Tour-Typ
- **Klaviere/Flügel:** 🎹 Klaviertransport/Flügeltransport
- **Normale Umzüge:** 📦 Umzug
- **Karton-Lieferungen:** 📦 Kartonanlief
- **Besichtigungen:** 👁️ Besichtigung

### Tipp 4: Skills-Filter anpassen
Wenn Sie **mehr/andere** Skills in der Übersicht sehen möchten:
→ Siehe `PERSONALEIGENSCHAFTEN_REFERENZ.md`

---

## 🎨 Visuelle Hinweise

### Farb-Kodierung verstehen

| Farbe | Bedeutung | Aktion |
|-------|-----------|--------|
| **Grüner Bereich** | Verfügbar | Bedenkenlos hinzufügen |
| **Gelber Bereich** | Verplant | Nur bei Bedarf / Notfall |
| **Grüner Button** | Hinzufügen | Normales Hinzufügen |
| **Gelber Button** | Trotzdem + | Warnung: Überbuchung! |

### Icons verstehen

| Icon | Bedeutung |
|------|-----------|
| 🚗 | Führerschein-Klasse |
| 🎹 | Klavierträger-Qualifikation |
| ✓ | Verfügbar am gewählten Tag |
| ⚠️ | Hat bereits Termine |

---

## 📝 Was wird gespeichert?

Beim Klick auf "Tour speichern" wird für **jeden** zugewiesenen Mitarbeiter ein Termin erstellt:

```json
{
  "personalid": "uuid-des-mitarbeiters",
  "terminart": "5fd2037-9c", // ← Ihre gewählte Terminart!
  "datum": "2025-10-02",
  "startzeit": "08:00:00",
  "endzeit": "17:00:00",
  "kommentar": "Tour: XYZ | Stationen: 1. Adresse A, 2. Adresse B, ...",
  "rolle": ["Monteur"],
  "kennzeichen": "KA-RD 1234"
}
```

**Besonders:** Die `terminart` ist jetzt die **von Ihnen gewählte**!

---

## 🚀 Bereit zum Testen!

Nach `npm start` sehen Sie sofort:
1. ✅ Neues Mitarbeiter-Panel (rechte Spalte, oben)
2. ✅ Terminart-Dropdown (in Tourplanung)

**Viel Spaß beim Ausprobieren!** 🎉

