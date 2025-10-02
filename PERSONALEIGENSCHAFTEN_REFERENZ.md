# 📋 Personaleigenschaften - Referenz

Basierend auf der erhaltenen CSV-Datei. Alle verfügbaren Eigenschaften für Skill-Filter.

## 🚗 Führerschein & Fahrzeug

### `personal_properties_Fhrerscheinklasse`
**Typ:** Dropdown (Mehrfachauswahl möglich)  
**Werte:** `"B"`, `"BE"`, `"C"`, `"C1"`, `"C1E"`, `"CE"`  
**Verwendung:**
```javascript
personal_properties_Fhrerscheinklasse: ["C1", "C", "CE"] // Mind. eine muss erfüllt sein
```

⚠️ **WICHTIG:** Property-Name ist **ohne Umlaut** (`Fhrerscheinklasse` statt `Führerscheinklasse`)!

### `personal_properties_Auto`
**Typ:** Ja/Nein  
**Werte:** `"Ja"`, `"Nein"`  
**Verwendung:**
```javascript
personal_properties_Auto: "Ja" // Muss eigenes Fahrzeug haben
```

---

## 🎹 Spezialisierungen (für Klaviertransporte)

### `personal_properties_Klavierträger`
**Typ:** Ja/Nein  
**Werte:** `"Ja"`, `"Nein"`  
**Verwendung:**
```javascript
personal_properties_Klavierträger: "Ja" // Erfahrung mit Klaviertransporten
```

---

## 👔 Positionen & Rollen

### `personal_properties_Vorarbeiter`
**Typ:** Ja/Nein  
**Werte:** `"Ja"`, `"Nein"`  
**Verwendung:**
```javascript
personal_properties_Vorarbeiter: "Ja" // Nur Vorarbeiter
```

---

## 🔧 Fachliche Qualifikationen

### `personal_properties_Montagen`
**Typ:** Ja/Nein  
**Werte:** `"Ja"`, `"Nein"`  
**Verwendung:**
```javascript
personal_properties_Montagen: "Ja" // Montage-Erfahrung
```

### `personal_properties_Elektromontagen`
**Typ:** Ja/Nein  
**Werte:** `"Ja"`, `"Nein"`  
**Verwendung:**
```javascript
personal_properties_Elektromontagen: "Ja" // Elektro-Montage
```

---

## 📄 Administrative Eigenschaften

### `personal_properties_Raucher`
**Typ:** Ja/Nein  
**Werte:** `"Ja"`, `"Nein"`  
**Verwendung:**
```javascript
personal_properties_Raucher: "Nein" // Nur Nichtraucher
```

### `personal_properties_FÃ¼hrungszeugnis`
**Typ:** Ja/Nein  
**Werte:** `"Ja"`, `"Nein"`  
**Verwendung:**
```javascript
personal_properties_FÃ¼hrungszeugnis: "Ja" // Führungszeugnis vorhanden
```

### `personal_properties_Einstellungsverweise`
**Typ:** Ja/Nein  
**Werte:** `"Ja"`, `"Nein"`  
**Info:** Spezielle Einstellungsverweise vorhanden

---

## 📝 Textfelder (nicht für Filter geeignet)

Diese Eigenschaften sind Freitext-Felder und weniger für Skill-Filter geeignet:

- `personal_properties_Ausbildung` (Text)
- `personal_properties_Fortbildungen` (Text)
- `personal_properties_Fehlverhalten/Besondere Anmerkungen` (Text)

---

## 📅 Datumsfelder (nicht für Skill-Filter geeignet)

- `personal_properties_Einstellungsdatum` (Datum)
- `personal_properties_Ausscheidedatum` (Datum)

---

## 🔗 Sonstige

- `personal_properties_Link zum Personalordner` (Link)
- `personal_properties_Akquisekanal` (Akquisekanal)

---

## 💡 Praktische Beispiele

### Beispiel 1: Standard Umzug
```javascript
skill: {
  personal_properties_Fhrerscheinklasse: ["C1", "C", "CE"],
  personal_properties_Auto: "Ja"
}
```

### Beispiel 2: Klaviertransport
```javascript
skill: {
  personal_properties_Fhrerscheinklasse: ["C1", "C", "CE"],
  personal_properties_Auto: "Ja",
  personal_properties_Klavierträger: "Ja" // Zusätzliche Anforderung
}
```

### Beispiel 3: Montage-Tour
```javascript
skill: {
  personal_properties_Fhrerscheinklasse: ["C1", "C"],
  personal_properties_Auto: "Ja",
  personal_properties_Montagen: "Ja"
}
```

### Beispiel 4: Mit OR-Bedingung
```javascript
skill: {
  personal_properties_Fhrerscheinklasse: ["C1", "C", "CE"],
  personal_properties_Auto: "Ja",
  OR: {
    personal_properties_Klavierträger: "Ja",    // ODER Klavierträger
    personal_properties_Vorarbeiter: "Ja"        // ODER Vorarbeiter
  }
}
```
**Bedeutung:** Mitarbeiter muss Führerschein UND Auto haben UND (Klavierträger ODER Vorarbeiter sein)

### Beispiel 5: Nur Vorarbeiter mit speziellen Skills
```javascript
skill: {
  personal_properties_Vorarbeiter: "Ja",
  personal_properties_Fhrerscheinklasse: ["C", "CE"],
  personal_properties_Elektromontagen: "Ja",
  personal_properties_Raucher: "Nein" // Nur Nichtraucher
}
```

---

## ⚙️ Im Code anpassen

**Datei:** `src/components/TourPlanner.js`  
**Zeile:** 1507-1528

**Aktueller Code:**
```javascript
skill: {
  personal_properties_Fhrerscheinklasse: ["C1", "C", "CE", "C1E"],
  personal_properties_Auto: "Ja"
}
```

**Für Klaviertransporte anpassen:**
```javascript
skill: {
  personal_properties_Fhrerscheinklasse: ["C1", "C", "CE", "C1E"],
  personal_properties_Auto: "Ja",
  personal_properties_Klavierträger: "Ja" // Kommentar entfernen!
}
```

---

## ⚠️ Wichtige Hinweise

1. **Umlaut-Problem:** `personal_properties_Fhrerscheinklasse` ist OHNE Umlaut!
2. **Groß-/Kleinschreibung:** Exakt wie in der CSV verwenden
3. **Ja/Nein:** Genau `"Ja"` oder `"Nein"` schreiben (mit Anführungszeichen)
4. **Array für Mehrfachwerte:** Führerscheinklassen als Array `["C1", "C"]`
5. **OR-Statement:** Aktuell nur EIN OR-Statement möglich

---

## 🔍 Verfügbare Werte herausfinden

Wenn Sie unsicher sind, welche Werte eine Eigenschaft hat:

1. Öffnen Sie die CSV-Datei
2. Suchen Sie die Zeile mit der Eigenschaft
3. Dritte Spalte enthält die möglichen Werte

**Beispiel aus CSV:**
```
personal_properties_Fhrerscheinklasse,Führerscheinklasse,Dropdown,"B,BE,C,C1,C1E,CE"
```
→ Mögliche Werte: `"B"`, `"BE"`, `"C"`, `"C1"`, `"C1E"`, `"CE"`

---

## 🚀 Test nach Anpassung

Nach Änderung der Skills:

1. Speichern Sie `TourPlanner.js`
2. App neu starten: `npm start`
3. Tour-Datum wählen
4. Prüfen: Dropdown zeigt nur Mitarbeiter mit den geforderten Skills

**Konsole prüfen (F12):**
```
[ServiceProvider] Lade Mitarbeiter für 2025-06-01
[ServiceProvider] Gefundene Mitarbeiter: 5
```

Wenn `0` Mitarbeiter gefunden werden → Skills zu streng, anpassen!

