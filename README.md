# Moving Assistant - Tourenplanungs-App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## SPTimeSchedule Integration

Die App integriert sich automatisch mit dem SPTimeSchedule-System für:
1. **Mitarbeiter-Abfrage**: Dynamisches Laden verfügbarer Mitarbeiter basierend auf Datum und Skills
2. **Terminbuchung**: Automatisches Erstellen von Kalendereinträgen

### 🎨 Neue UI-Features

- **📊 Mitarbeiter-Übersicht Panel**: Alle verfügbaren Mitarbeiter auf einen Blick mit Skills, Terminen und Ein-Klick-Zuweisung
- **📅 Terminart-Auswahl**: Wählen Sie die passende Terminart (Klaviertransport, Umzug, Flügel, etc.) pro Tour

**➡️ Siehe:** [SCHNELLSTART_NEUE_FEATURES.md](./SCHNELLSTART_NEUE_FEATURES.md) für Details

### Erforderliche Umgebungsvariablen

Fügen Sie folgende Variablen zu Ihrer `.env`-Datei hinzu:

```bash
# 🔑 StressFrei Solutions (SFS) API-Token
# WICHTIG: Token von Jonathan/Administrator anfordern!
REACT_APP_SFS_API_TOKEN=ihr-token-hier

# 🌐 SFS API-URLs (Produktionssystem Riedlin)
REACT_APP_SERVICEPROVIDER_API_URL=https://www.stressfrei-solutions.de/dl2238205/backend/api/serviceprovider/getServiceprovider
REACT_APP_SPTIMESCHEDULE_API_URL=https://www.stressfrei-solutions.de/dl2238205/backend/sptimeschedule/saveSptimeschedule

# 📋 Tour-Konfiguration (Terminart-ID aus CSV-Übersetzungstabelle)
REACT_APP_DEFAULT_TERMINART_ID=ihre-terminart-uuid-hier
REACT_APP_DEFAULT_KENNZEICHEN=KA-RD 1234

# Bestehende Pipedrive & Google Maps Variablen
REACT_APP_PIPEDRIVE_API_TOKEN=ihr-pipedrive-token
REACT_APP_GOOGLE_MAPS_API_KEY=ihr-google-maps-key
# ... weitere Variablen
```

**📖 Detaillierte Setup-Anleitung:** Siehe [SETUP_ANLEITUNG.md](./SETUP_ANLEITUNG.md)

### Wie es funktioniert

1. **Tourenplanung**: Benutzer erstellen eine Tour mit mehreren Aufträgen
2. **Mitarbeiter-Abfrage**: System lädt automatisch verfügbare Mitarbeiter für das gewählte Datum
   - ✅ Verfügbare Mitarbeiter werden zuerst angezeigt
   - ⚠️ Bereits verplante Mitarbeiter werden ausgegraut dargestellt
3. **Mitarbeiter zuweisen**: Benutzer wählt aus den verfügbaren Mitarbeitern
4. **Zeitplanung**: Start- und Endzeiten werden automatisch berechnet
5. **Tour speichern**: Beim Speichern werden automatisch:
   - Pipedrive-Projekte aktualisiert
   - Termine im SPTimeSchedule-System für alle zugewiesenen Mitarbeiter gebucht

### API-Struktur

Die SPTimeSchedule-API erwartet folgende Daten pro Termin:

```json
{
  "personalid": "uuid-des-mitarbeiters",
  "terminart": "uuid-der-terminart",
  "vorgangsno": "deal-id",
  "angebotsno": "projekt-id",
  "datum": "2025-10-02",
  "startzeit": "09:00:00",
  "endzeit": "17:00:00",
  "kommentar": "Tour-Details mit Stationen",
  "rolle": ["Monteur"],
  "kennzeichen": "KA-RD 1234"
}
```

### Mitarbeiter-ID Mapping

Die Mitarbeiter-IDs werden **automatisch** von der ServiceProvider API geladen - keine manuelle Konfiguration nötig! 

Das System:
- Fragt verfügbare Mitarbeiter ab basierend auf Tour-Datum
- Filtert nach benötigten Skills (LKW-Führerschein, eigenes Fahrzeug)
- Prüft Verfügbarkeit (bereits gebuchte Termine)
- Verwendet echte UUIDs aus dem SPTimeSchedule-System

**Skill-Anforderungen anpassen**: Siehe `TourPlanner.js` Zeile 1453-1464

### Terminarten & Rollen

Kontaktieren Sie Ihren SPTimeSchedule-Administrator für:
- Liste der verfügbaren Terminart-UUIDs (benötigt für `.env`)
- Liste der verfügbaren Rollen (z.B. "Monteur", "Fahrer")

**Hinweis**: Mitarbeiter-UUIDs werden automatisch abgefragt - kein manueller Export nötig!

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
