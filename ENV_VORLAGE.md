# .env Datei - Vorlage

## 📝 Anleitung

1. Erstellen Sie eine Datei namens `.env` im Projekt-Root
2. Kopieren Sie den Inhalt unten
3. Ersetzen Sie `HIER_TOKEN_EINFUEGEN` mit dem echten Token
4. Speichern und App starten: `npm start`

---

## 📋 Kopieren Sie dies in Ihre .env Datei:

```bash
# ============================================
# Moving Assistant - Umgebungsvariablen
# ============================================

# ============================================
# 🔑 StressFrei Solutions (SFS) API
# ============================================

# API-Token (von Jonathan/Administrator)
REACT_APP_SFS_API_TOKEN=HIER_TOKEN_EINFUEGEN

# API-URLs (Produktionssystem Riedlin)
REACT_APP_SERVICEPROVIDER_API_URL=https://www.stressfrei-solutions.de/dl2238205/backend/api/serviceprovider/getServiceprovider
REACT_APP_SPTIMESCHEDULE_API_URL=https://www.stressfrei-solutions.de/dl2238205/backend/sptimeschedule/saveSptimeschedule

# ============================================
# 📋 Tour-Konfiguration
# ============================================

# Terminart-ID: Klaviertransport (empfohlen)
REACT_APP_DEFAULT_TERMINART_ID=5fd2037-9c

# Fahrzeugkennzeichen
REACT_APP_DEFAULT_KENNZEICHEN=KA-RD 1234

# ============================================
# Pipedrive API (bereits vorhanden)
# ============================================

REACT_APP_PIPEDRIVE_API_TOKEN=ihr-pipedrive-token
REACT_APP_PIPEDRIVE_API_URL=https://api.pipedrive.com/v1

# Pipedrive Feld-IDs
REACT_APP_PIPEDRIVE_ADDRESS_FIELD_KEY=07c3da8804f7b96210e45474fba35b8691211ddd
REACT_APP_PIPEDRIVE_DELIVERY_ADDRESS_FIELD_KEY=9cb4de1018ec8404feeaaaf7ee9b293c78c44281
REACT_APP_PIPEDRIVE_MOVE_DATE_FIELD_KEY=949696aa9d99044db90383a758a74675587ed893

# ============================================
# Google Maps API (bereits vorhanden)
# ============================================

REACT_APP_GOOGLE_MAPS_API_KEY=ihr-google-maps-key
```

---

## ✅ Was ist bereits konfiguriert?

- ✅ **API-URLs** → Produktionssystem Riedlin
- ✅ **Terminart** → `5fd2037-9c` (Klaviertransport)
- ✅ **Personaleigenschaften** → Im Code (Skills: Führerschein C1/C/CE, Auto)
- ✅ **Rollen** → Im Code (Standard: "Monteur")

## ❌ Was fehlt noch?

- ❌ **API-Token** → Von Jonathan anfordern
- ❌ Pipedrive Token → Falls noch nicht vorhanden
- ❌ Google Maps Key → Falls noch nicht vorhanden

---

## 🎯 Nach Erhalt des Tokens

1. **Öffnen Sie `.env`**
2. **Ersetzen:**
   ```bash
   REACT_APP_SFS_API_TOKEN=HIER_TOKEN_EINFUEGEN
   ```
   **Mit:**
   ```bash
   REACT_APP_SFS_API_TOKEN=der-echte-token-von-jonathan
   ```
3. **Speichern**
4. **App neu starten:** `npm start`
5. **Testen:** Mitarbeiter sollten jetzt geladen werden!

---

## 🔄 Alternative Terminarten

Falls Sie eine andere Terminart verwenden möchten:

```bash
# Allgemeiner Umzug:
REACT_APP_DEFAULT_TERMINART_ID=3a4df8a1-23

# Flügeltransport:
REACT_APP_DEFAULT_TERMINART_ID=67179cd1-9c

# Klaviertransport (Alternative):
REACT_APP_DEFAULT_TERMINART_ID=67179cf2-69c
```

Siehe [TERMINARTEN_REFERENZ.md](./TERMINARTEN_REFERENZ.md) für alle Optionen.

---

## ⚠️ Wichtig

**NIEMALS** die `.env` Datei ins Git Repository committen!

Sie enthält sensible Zugangsdaten!

Die `.env` Datei ist bereits in `.gitignore` eingetragen.

---

## 🆘 Bei Problemen

**Fehler:** "Kein API-Token konfiguriert"
→ Token in `.env` fehlt oder falsch geschrieben

**Fehler:** "Keine Mitarbeiter verfügbar"
→ API-Token ungültig oder Skills zu streng

**Konsole öffnen:** F12 → Suche nach `[ServiceProvider]` oder `[SPTimeSchedule]`

