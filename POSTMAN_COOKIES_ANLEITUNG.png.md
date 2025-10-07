# 📸 So finden Sie Cookies in Postman

## Schritt-für-Schritt:

### 1. Request öffnen
Öffnen Sie Ihren **funktionierenden** Request in Postman (der, der `true` zurückgibt).

### 2. Cookies-Button klicken
Unter dem "Send"-Button → Rechts neben "Code" (</>) → **"Cookies"**

### 3. Domain auswählen
Im Cookies-Fenster → Wählen Sie `stressfrei-solutions.de`

### 4. Cookies kopieren
Sie sollten sehen:
```
Name: CAKEPHP
Value: f443e85c0103c5dadf6fda9779036b14
Domain: stressfrei-solutions.de
Path: /dl2238205/backend
...
```

**Kopieren Sie den KOMPLETTEN Cookie-String:**
```
CAKEPHP=f443e85c0103c5dadf6fda9779036b14
```

---

## ❓ Falls KEINE Cookies da sind:

**Das würde bedeuten:**
- Token alleine funktioniert tatsächlich in Postman
- Aber im Proxy nicht → Anderes Problem

**Dann brauche ich:**
- Postman Request als **cURL Export** (Code → cURL → Copy)

---

## ✅ Falls Cookies DA sind:

**Senden Sie mir:**
```
CAKEPHP=DER-WERT-AUS-POSTMAN
```

**Dann:**
1. Ich zeige Ihnen wo Sie ihn einfügen
2. Backend neu starten
3. Sollte funktionieren! 🎉

