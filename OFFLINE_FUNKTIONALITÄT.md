# Offline-Funktionalität für Besichtigungen

## Übersicht

Die Web-App ist jetzt vollständig offline-fähig. Während einer Besichtigung werden alle Daten automatisch lokal gespeichert und synchronisiert, sobald wieder eine Internetverbindung verfügbar ist.

## Hauptfunktionen

### 1. Automatisches Speichern (Auto-Save)
- **Alle 2 Sekunden** wird der aktuelle Inspektionszustand automatisch in IndexedDB gespeichert
- Gespeichert werden:
  - Räume und Inventar (`roomsData`)
  - Umzugsinformationen (`moveInfo`)
  - Zusätzliche Details (`additionalInfo`)
  - Berechnungsdaten (`calculationData`)
  - Aktueller Schritt (`currentStep`)

### 2. Offline-Queue für API-Calls
- Alle API-Aufrufe werden durch den `apiWrapper` geleitet
- Wenn offline, werden Requests in einer Queue gespeichert
- Typen von Queue-Items:
  - `updateDeal` - Deal-Updates
  - `saveInspection` - Inspektionsdaten
  - `uploadPhoto` - Foto-Uploads
  - `updateOffer` - Angebots-Updates

### 3. Automatische Synchronisation
- **Alle 30 Sekunden** wird geprüft, ob ausstehende Items synchronisiert werden können
- Synchronisation startet automatisch wenn:
  - Internet wieder verfügbar ist
  - Der Tab wieder aktiv wird
  - Manuell über den Offline-Indikator ausgelöst

### 4. Offline-Indikator
- Zeigt den aktuellen Online/Offline-Status an
- Zeigt Anzahl ausstehender Synchronisationen
- Ermöglicht manuelle Synchronisation

## Technische Details

### Services

#### `offlineStorage` (src/services/offlineStorage.js)
- Verwaltet IndexedDB für lokale Datenspeicherung
- Speichert Inspektionszustände, Fotos und Sync-Queue

#### `syncService` (src/services/syncService.js)
- Verwaltet die Synchronisation von offline gespeicherten Daten
- Verarbeitet die Sync-Queue
- Benachrichtigt über Sync-Events

#### `apiWrapper` (src/services/apiWrapper.js)
- Wrapper für alle API-Calls
- Leitet Requests durch die Offline-Queue
- Ermöglicht nahtlose Offline-Funktionalität

### IndexedDB Schema

```
MovingAssistantDB (Version 2)
├── photos: id, roomId, data, dealId, timestamp, synced
├── inspections: id, dealId, timestamp, status, data
├── syncQueue: id, type, dealId, timestamp, status, retryCount
└── inspectionState: dealId (primary key), data, timestamp
```

### Service Worker
- Erweitert für bessere Offline-Unterstützung
- Cached statische Assets
- Network-first Strategie für API-Requests mit Fallback

## Verwendung

### Für Entwickler

#### API-Calls mit Offline-Support
```javascript
import { apiWrapper } from '../services/apiWrapper';

// Statt direktem API-Call:
const response = await apiWrapper.updateDeal(dealId, data);

// Response enthält offline-Flag wenn offline gespeichert
if (response.offline) {
  // Daten werden später synchronisiert
}
```

#### Manuelle Synchronisation
```javascript
import { syncService } from '../services/syncService';

// Synchronisiere alle ausstehenden Items
await syncService.syncAll();
```

#### Gespeicherten Zustand laden
```javascript
import { offlineStorage } from '../services/offlineStorage';

const savedState = await offlineStorage.loadInspectionState(dealId);
```

### Für Benutzer

1. **Während der Besichtigung:**
   - Alle Daten werden automatisch gespeichert
   - Keine manuelle Aktion erforderlich

2. **Wenn Internet weg ist:**
   - Offline-Indikator erscheint (rot)
   - Alle Eingaben werden weiterhin lokal gespeichert
   - App funktioniert normal weiter

3. **Wenn Internet wieder verfügbar ist:**
   - Offline-Indikator zeigt Synchronisation an
   - Alle gespeicherten Daten werden automatisch synchronisiert
   - Benachrichtigung wenn Synchronisation abgeschlossen

## Vorteile

✅ **Kein Datenverlust** - Alle Eingaben werden gespeichert, auch offline
✅ **Nahtlose Erfahrung** - App funktioniert auch ohne Internet
✅ **Automatische Synchronisation** - Keine manuelle Aktion erforderlich
✅ **Zuverlässig** - Retry-Mechanismus für fehlgeschlagene Syncs
✅ **Benutzerfreundlich** - Klare Anzeige des Offline-Status

## Wartung

### Cleanup alter Daten
- Abgeschlossene Sync-Items werden nach 7 Tagen automatisch gelöscht
- Gespeicherte Inspektionszustände können nach erfolgreichem Abschluss gelöscht werden:
  ```javascript
  await offlineStorage.clearDealData(dealId);
  ```

### Debugging
- Alle Offline-Operationen werden in der Console geloggt
- Sync-Status kann über den Offline-Indikator überwacht werden
- IndexedDB kann in den Browser DevTools inspiziert werden

