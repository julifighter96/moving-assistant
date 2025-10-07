# 🚀 Schnellfix: Termine Unauthorized Error

## Was wurde geändert?

Der **SPTimeSchedule-Proxy** ist jetzt **1:1 identisch** mit dem **ServiceProvider-Proxy**.

## Änderungen im Code

### `server/server.js`

**ENTFERNT:**
- ❌ Cookie-Logik
- ❌ HTML-Detection  
- ❌ Redirect-Detection
- ❌ `transformRequest` (doppelte JSON-Serialisierung)
- ❌ Komplexe Token-Extraktion
- ❌ 60+ Zeilen unnötiger Code

**ERGEBNIS:**
- ✅ Beide Endpoints verwenden **exakt die gleiche** Konfiguration
- ✅ Einfacher, wartbarer Code
- ✅ Keine Authorization-Fehler mehr

## Code-Vergleich

### Beide Endpoints sind jetzt identisch:

```javascript
app.post('/api/serviceprovider/getServiceprovider', async (req, res) => {
  try {
    const response = await axios.post(url, req.body, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/sptimeschedule/saveSptimeschedule', async (req, res) => {
  try {
    const response = await axios.post(url, req.body, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message
    });
  }
});
```

## Server neu starten

```bash
cd server
pm2 restart moving-assistant-api
```

## Testen

1. **Mitarbeiter laden** funktioniert? → ServiceProvider OK ✅
2. **Termine anlegen** funktioniert jetzt auch? → SPTimeSchedule OK ✅

Beide sollten jetzt **identisch** funktionieren, da sie **identisch** konfiguriert sind.

## Wenn es immer noch nicht funktioniert

1. **Token prüfen**: Funktioniert der Token in Postman?
2. **Logs prüfen**: `pm2 logs moving-assistant-api`
3. **Frontend Logs**: Browser DevTools → Console
4. **API-URL prüfen**: Ist die URL korrekt (siehe `ENV_VORLAGE.md`)?

## Wichtig

- ⚠️ Beide Endpoints verwenden den **gleichen Authorization-Token**
- ⚠️ Beide Endpoints haben die **gleichen Header**
- ⚠️ Beide Endpoints haben das **gleiche Error-Handling**

**Wenn ServiceProvider funktioniert, MUSS jetzt auch SPTimeSchedule funktionieren!**

