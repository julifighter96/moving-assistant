# E-Mail an David: Kurze Version

---

**Betreff:** SPTimeSchedule API gibt Login-Seite zurück - Cookie/Auth Problem?

---

Hallo David,

wir integrieren gerade die APIs und haben ein Problem mit **`/sptimeschedule/saveSptimeschedule`**:

**Problem:**
- ServiceProvider-Endpoint funktioniert perfekt mit dem Authorization-Token ✅
- SPTimeSchedule-Endpoint gibt HTML-Login-Seite zurück, obwohl wir den **gleichen Token** verwenden ❌

**Response von SPTimeSchedule:**
```html
<!DOCTYPE html>
<html>
  <body>
    <h3>BACKEND LOGIN</h3>
    ...
  </body>
</html>
```

**Unsere Vermutung:**
Da ServiceProvider mit dem Token funktioniert, aber SPTimeSchedule nicht, vermuten wir:
- Benötigt SPTimeSchedule zusätzlich ein **Session-Cookie** vom Backend-Login?
- Oder fehlen uns zusätzliche Header in der Dokumentation?

**Unsere Bitte:**
Könntet ihr uns bitte einen **funktionierenden Postman-Request** für SPTimeSchedule schicken? 
Dann können wir prüfen:
- Welche Cookies werden mitgesendet?
- Welche Header sind gesetzt?
- Wie genau sieht der Auth-Prozess aus?

Alternativ: Müssen wir uns zunächst über `/users/check_login` einloggen, um ein Session-Cookie zu bekommen, bevor wir SPTimeSchedule aufrufen können?

**Zeit für einen kurzen Call?**
Das wäre wahrscheinlich am schnellsten gelöst. 15-30 Min heute oder morgen?

Danke & Grüße
[Dein Name]

---

**P.S.:** Wir verwenden für beide Endpoints identische Header:
```
Authorization: [Token von Jonathan]
Content-Type: application/json
Accept: application/json
```
ServiceProvider → funktioniert ✅  
SPTimeSchedule → Login-Seite ❌



