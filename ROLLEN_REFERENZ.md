# 👔 Rollen - Referenz

Basierend auf der erhaltenen CSV-Datei. Alle verfügbaren Rollen für Terminbuchungen.

## 📋 Verfügbare Rollen

Aus Ihrer CSV-Datei:

1. **Vorarbeiter_Fahrer**
2. **Fahrer**
3. **Transportfachkraft**
4. **Umzugskoordinator**
5. **Monteur**
6. **Fahrer** (Duplikat in Liste)

---

## 💼 Verwendung im Code

### Standard-Rolle (aktuell im Code)

**Datei:** `src/components/TourPlanner.js` (Zeile 1931)

```javascript
rolle: ['Monteur']  // ✅ Standard - in CSV vorhanden!
```

### Einzelne Rolle

```javascript
rolle: ['Fahrer']
```

### Mehrere Rollen (Mitarbeiter hat mehrere Funktionen)

```javascript
rolle: ['Monteur', 'Fahrer']
```

### Vorarbeiter-Rolle

```javascript
rolle: ['Vorarbeiter_Fahrer']  // ⚠️ Beachte Unterstrich!
```

---

## 🎯 Praktische Beispiele

### Beispiel 1: Standard Umzug/Klaviertransport
```javascript
rolle: ['Monteur']
```
**Verwendung:** Standard für die meisten Aufträge

### Beispiel 2: Reine Fahrt (ohne Montage)
```javascript
rolle: ['Fahrer']
```
**Verwendung:** Nur Transport, keine Montagearbeiten

### Beispiel 3: Komplexe Montage
```javascript
rolle: ['Monteur', 'Transportfachkraft']
```
**Verwendung:** Spezielle Transporte mit Fachkräften

### Beispiel 4: Koordinations-Touren
```javascript
rolle: ['Umzugskoordinator']
```
**Verwendung:** Touren die koordiniert werden müssen

### Beispiel 5: Vorarbeiter-Touren
```javascript
rolle: ['Vorarbeiter_Fahrer']
```
**Verwendung:** Führungsverantwortung erforderlich

---

## ⚙️ Im Code ändern

### Für alle Touren (global):

**Datei:** `src/components/TourPlanner.js`  
**Zeile:** 1931

**Aktuell:**
```javascript
const kommentar = `Tour: ${tourId} | Stationen: ${stationsText}`;

return {
  personalid: employee.id,
  terminart: DEFAULT_TERMINART_ID,
  vorgangsno: tourDeals[0]?.dealId?.toString() || '',
  angebotsno: tourDeals[0]?.id?.toString() || '',
  datum: format(tourDate, 'yyyy-MM-dd'),
  startzeit: startzeit.length === 5 ? `${startzeit}:00` : startzeit,
  endzeit: endzeit.length === 5 ? `${endzeit}:00` : endzeit,
  kommentar: kommentar.substring(0, 500),
  rolle: ['Monteur'], // ← HIER ÄNDERN
  kennzeichen: DEFAULT_KENNZEICHEN
};
```

**Ändern auf:**
```javascript
rolle: ['Transportfachkraft'], // Oder eine andere Rolle
```

### Dynamisch basierend auf Tour-Typ (erweitert):

```javascript
// Bestimme Rolle basierend auf Tour-Inhalt
let tourRolle = ['Monteur']; // Standard

// Prüfe ob Klaviertransport
const hasKlaviertransport = tourDeals.some(deal => 
  deal.title?.toLowerCase().includes('piano') || 
  deal.title?.toLowerCase().includes('flügel')
);

if (hasKlaviertransport) {
  tourRolle = ['Transportfachkraft', 'Monteur']; // Spezielle Skills
}

// Prüfe ob mehrere Stationen (Koordination nötig)
if (stations.length > 5) {
  tourRolle = ['Umzugskoordinator', 'Fahrer'];
}

return {
  // ... andere Felder
  rolle: tourRolle, // ← Dynamisch
  // ...
};
```

---

## ⚠️ Wichtige Hinweise

### 1. Array-Format erforderlich
```javascript
// ✅ Richtig:
rolle: ['Monteur']
rolle: ['Fahrer', 'Monteur']

// ❌ Falsch:
rolle: 'Monteur'  // Muss Array sein!
```

### 2. Exakte Schreibweise
```javascript
// ✅ Richtig (aus CSV):
rolle: ['Vorarbeiter_Fahrer']  // Mit Unterstrich!

// ❌ Falsch:
rolle: ['Vorarbeiter Fahrer']  // Ohne Unterstrich
rolle: ['Vorarbeiter-Fahrer']  // Mit Bindestrich
```

### 3. Groß-/Kleinschreibung beachten
```javascript
// ✅ Richtig:
rolle: ['Monteur']

// ❌ Falsch:
rolle: ['monteur']  // Kleinschreibung
rolle: ['MONTEUR']  // Großschreibung
```

---

## 🔍 Rollenbeschreibungen (Interpretation)

| Rolle | Beschreibung | Typische Verwendung |
|-------|--------------|---------------------|
| **Monteur** | Standard Montage/Umzug | Die meisten Touren |
| **Fahrer** | Reiner Transport | Nur Fahrt, keine Montage |
| **Transportfachkraft** | Spezialtransporte | Klaviere, empfindliche Güter |
| **Umzugskoordinator** | Koordination | Große/komplexe Touren |
| **Vorarbeiter_Fahrer** | Führungsverantwortung | Team-Leitung erforderlich |

---

## 🚀 Nach Anpassung testen

1. **Code ändern** in `TourPlanner.js` Zeile 1931
2. **App neu starten**: `npm start`
3. **Tour erstellen & speichern**
4. **Konsole prüfen** (F12):
   ```
   [SPTimeSchedule] Sende Termine: [...]
   ```
   Suchen Sie nach `"rolle": ["IhreRolle"]`

5. **Erfolg prüfen**:
   ```
   [SPTimeSchedule] Termine erfolgreich erstellt
   ```

---

## 🎓 Empfehlungen

### Standard-Setup (empfohlen)
```javascript
rolle: ['Monteur']
```
✅ Funktioniert für die meisten Szenarien

### Erweitert für Klaviertransporte
```javascript
rolle: ['Transportfachkraft', 'Monteur']
```
✅ Zeigt Spezialwissen an

### Für große Touren
```javascript
rolle: ['Umzugskoordinator']
```
✅ Koordinations-Skills

---

## 📝 Status-Update

**Was Sie jetzt haben:**
- ✅ Personaleigenschaften.csv
- ✅ Rollen.csv
- ❌ Terminarten.csv (noch fehlend)
- ❌ API-Token (noch fehlend)

**Nächster Schritt:** 
E-Mail an Jonathan für die letzten 2 fehlenden Teile!

