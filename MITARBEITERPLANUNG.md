# Mitarbeiterplanung - Dokumentation

## Übersicht

Das Mitarbeiterplanungs-Modul bietet eine umfassende Lösung zur Verwaltung und Planung von Mitarbeitereinsätzen.

## Funktionen

### 1. Eigenständige Seite
- Erreichbar über das Hauptmenü unter **"Personalmanagement"**
- Vollständig unabhängig von der Tourenplanung
- Dedizierte Ansicht für Mitarbeiterübersicht

### 2. Erweiterte Suchkriterien

#### Zeitraum-Auswahl
- **Von/Bis Datum**: Flexibler Zeitraum wählbar
- **Schnellauswahl**: 
  - Heute
  - Diese Woche
  - Dieser Monat

#### Führerscheinklassen
Mehrfachauswahl möglich:
- B (PKW)
- C1 (LKW bis 7,5t)
- C (LKW über 7,5t)
- CE (LKW mit Anhänger)
- C1E (LKW bis 7,5t mit Anhänger)
- BE (PKW mit Anhänger)

#### Spezielle Fähigkeiten
- **Klavierträger**: Ja/Nein/Alle
- **Vorarbeiter**: Ja/Nein/Alle
- **Montagen**: Ja/Nein/Alle
- **Eigenes Auto**: Ja/Nein/Alle

#### Verfügbarkeit
- Nur verfügbare Mitarbeiter anzeigen
- Nur verplante Mitarbeiter anzeigen

### 3. Mitarbeiter-Übersicht

Jede Mitarbeiter-Karte zeigt:
- **Name und ID**
- **Verfügbarkeitsstatus**:
  - ✅ Grün = Verfügbar
  - ⚠️ Gelb = Verplant
- **Qualifikationen** (als Badges):
  - 🚗 Führerscheinklasse
  - 🎹 Klavierträger
  - 👷 Vorarbeiter
  - 🔧 Montagen
  - 🚙 Eigenes Auto
- **Termine**: Aufklappbare Liste aller Termine im gewählten Zeitraum

### 4. Export-Funktion
- **CSV-Export** aller gefilterten Mitarbeiter
- Enthält: ID, Name, Qualifikationen, Status, Anzahl Termine
- Dateiname: `mitarbeiter_YYYY-MM-DD.csv`

### 5. Integration mit Tourenplanung

#### Workflow
1. Tour planen und speichern (TourPlanner)
2. "Weiter zur Mitarbeiterplanung" klicken
3. Mitarbeiter aus verfügbarer Liste auswählen
4. Termine im Kalender buchen

#### Oder: Eigenständige Nutzung
1. Personalmanagement-Modul öffnen
2. Zeitraum und Kriterien festlegen
3. Mitarbeiter durchsuchen
4. Verfügbarkeit prüfen

## API-Integration

### ServiceProvider API
**Endpoint**: `/backend/api/serviceprovider/getServiceprovider`

**Request Body**:
```json
{
  "date_from": "2025-01-01",
  "date_to": "2025-01-31",
  "skill": {
    "personal_properties_Fhrerscheinklasse": ["C1", "C"],
    "personal_properties_Klavierträger": "Ja",
    "personal_properties_Auto": "Ja"
  },
  "joins": ["Vertraege", "Eigenschaften", "Termine"]
}
```

**Response**: Array von Mitarbeitern mit:
- Grunddaten (ID, Name)
- Eigenschaften (Skills)
- Verträge
- Termine im Zeitraum

### Umgebungsvariablen

Erforderlich in `.env`:
```
REACT_APP_SERVICEPROVIDER_API_URL=https://...
REACT_APP_SFS_API_TOKEN=your_api_token
```

## Verwendung

### Als Administrator
1. Öffnen Sie das **Personalmanagement-Modul**
2. Wählen Sie den Zeitraum aus
3. Setzen Sie Filter nach Bedarf
4. Suchen Sie nach bestimmten Mitarbeitern
5. Prüfen Sie Verfügbarkeit und Qualifikationen
6. Exportieren Sie die Liste bei Bedarf

### Als Tourenplaner
1. Planen Sie Ihre Tour im **TourPlanner**
2. Speichern Sie die Tour
3. Klicken Sie auf **"Weiter zur Mitarbeiterplanung"**
4. Wählen Sie verfügbare Mitarbeiter aus
5. Termine werden automatisch gebucht

## Vorteile

### Übersichtlichkeit
- ✅ Klare Trennung von Tourenplanung und Personalmanagement
- ✅ Dedizierte Seite für jeden Anwendungsfall
- ✅ Keine überladenen Ansichten

### Flexibilität
- ✅ Freie Kombination von Suchkriterien
- ✅ Anpassbare Zeiträume
- ✅ Export-Möglichkeit

### Effizienz
- ✅ Schnelle Verfügbarkeitsübersicht
- ✅ Qualifikationen auf einen Blick
- ✅ Automatische Terminbuchung

## Beispiel-Workflows

### Workflow 1: Team für Klaviertransport zusammenstellen
1. Öffnen Sie Personalmanagement
2. Wählen Sie "Diese Woche" als Zeitraum
3. Aktivieren Sie Filter:
   - Führerschein: C1 oder C
   - Klavierträger: Ja
   - Nur verfügbare Mitarbeiter
4. Sehen Sie verfügbare Klavierträger mit passender Lizenz

### Workflow 2: Vorarbeiter für größeren Umzug finden
1. Zeitraum wählen
2. Filter setzen:
   - Vorarbeiter: Ja
   - Führerschein: C
   - Nur verfügbare Mitarbeiter
3. Qualifizierte Vorarbeiter werden angezeigt

### Workflow 3: Mitarbeiter-Auslastung prüfen
1. Zeitraum wählen (z.B. nächste 2 Wochen)
2. Filter: "Nur verplante Mitarbeiter"
3. Termine-Details aufklappen
4. Auslastung analysieren

## Tipps

💡 **Kombinieren Sie Filter**: Je mehr Filter Sie setzen, desto spezifischer die Ergebnisse

💡 **Nutzen Sie die Schnellauswahl**: Spart Zeit bei häufigen Zeiträumen

💡 **Exportieren Sie Listen**: Praktisch für Meetings oder Dokumentation

💡 **Prüfen Sie Termine**: Klappen Sie Termine auf, um Konflikte zu vermeiden

## Support

Bei Fragen oder Problemen:
1. Prüfen Sie die API-Token-Konfiguration
2. Überprüfen Sie die Umgebungsvariablen
3. Schauen Sie in die Browser-Konsole für Fehler-Details

