# Mailchimp Setup Guide - Rubbellos Gewinnspiel

## ✅ Code-Änderungen (FERTIG)

Alle Code-Änderungen sind bereits implementiert:
- ✅ Status von "transactional" → "subscribed"
- ✅ Tag-System für Automations
- ✅ Duplikat-Prävention
- ✅ Multi-Website Tracking

---

## 🎯 Nächste Schritte: Mailchimp Dashboard Setup

### 1. Merge Fields in Mailchimp anlegen

Gehe zu: **Audience → Settings → Audience fields and *|MERGE|* tags**

Erstelle folgende Merge Fields:

| Field Name | Tag | Type | Required |
|------------|-----|------|----------|
| Ticket Code | TICKET | Text | Nein |
| Website | WEBSITE | Text | Nein |
| Angebot | OFFER | Text | Nein |
| Quelle | SOURCE | Text | Nein |
| UTM Source | UTM_SOURCE | Text | Nein |
| UTM Medium | UTM_MEDIUM | Text | Nein |
| UTM Campaign | UTM_CAMPAIGN | Text | Nein |

**Wichtig:** FNAME, LNAME, PHONE, ADDRESS sind bereits vorhanden!

---

### 2. Tags erstellen

Gehe zu: **Audience → Tags**

Erstelle folgende Tags (falls noch nicht vorhanden):

**Gewinnspiel-Tags:**
- `gewinnspiel-teilnehmer`
- `golden-ticket-2025`
- `rubbellos_gewinnspiel`
- `adventskalender_2025`

**Newsletter-Tags:**
- `newsletter-pending` (wartet auf Bestätigung)
- `newsletter-confirmed` (wurde bestätigt)

**Website-Tags:**
- `website-rubbellos`
- `site-rubbellos`
- `site-goldenticket`
- `site-newsletter`

**Adresse-Tag:**
- `address-provided`

---

### 3. Automation 1: Gewinnspiel-Bestätigung erstellen

#### Schritt 1: Neue Automation erstellen
1. Gehe zu: **Automations → Create Automation**
2. Wähle: **Custom**
3. Name: "Rubbellos Gewinnspiel - Bestätigung"

#### Schritt 2: Trigger einrichten
1. Trigger: **Tag is added**
2. Tag auswählen: `gewinnspiel-teilnehmer`
3. Speichern

#### Schritt 3: Email erstellen
1. **Delay:** 0 minutes (sofort)
2. **From name:** Sweets aus aller Welt
3. **From email:** noreply@sweetsausallerwelt.de
4. **Subject:** 🎁 Du bist dabei! Dein Code wurde registriert

**Email-Content (Beispiel):**
```html
<h1>🎄 Teilnahme bestätigt! 🎁</h1>

<p>Hallo *|FNAME|*,</p>

<p><strong>Glückwunsch!</strong> Dein Rubbellos-Code wurde erfolgreich registriert:</p>

<div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 0.3em;">
  <strong>*|TICKET|*</strong>
</div>

<p>✨ Du nimmst jetzt am Gewinnspiel teil!</p>

<p>🎅 Der Gewinner wird nach Ende des Teilnahmezeitraums (24.12.2025) per E-Mail benachrichtigt.</p>

<p>Viel Glück!<br>
Dein Team von Sweets aus aller Welt</p>

<hr>
<p style="font-size: 11px; color: #666;">
Teilnahmezeitraum: 01.12.–24.12.2025 | Teilnahme ab 18 Jahren
</p>
```

#### Schritt 4: Aktivieren
- Klicke auf **Start Workflow**
- Status: **Sending**

---

### 4. Automation 2: Newsletter Double-Opt-in

#### Schritt 1: Neue Automation erstellen
1. Gehe zu: **Automations → Create Automation**
2. Wähle: **Custom**
3. Name: "Newsletter - Double Opt-in"

#### Schritt 2: Trigger einrichten
1. Trigger: **Tag is added**
2. Tag auswählen: `newsletter-pending`
3. Speichern

#### Schritt 3: Email erstellen
1. **Delay:** 0 minutes (sofort)
2. **From name:** Sweets aus aller Welt
3. **From email:** noreply@sweetsausallerwelt.de
4. **Subject:** Bitte bestätige deine Newsletter-Anmeldung 📧

**Email-Content (Beispiel):**
```html
<h1>Noch ein Schritt! 📧</h1>

<p>Hallo *|FNAME|*,</p>

<p>vielen Dank für deine Newsletter-Anmeldung!</p>

<p>Bitte bestätige deine E-Mail Adresse, indem du auf den folgenden Link klickst:</p>

<p style="text-align: center;">
  <a href="*|CONFIRM_SUB|*" style="background: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
    📧 Newsletter-Anmeldung bestätigen
  </a>
</p>

<p><strong>Hinweis:</strong> Deine Gewinnspiel-Teilnahme ist bereits registriert - unabhängig von der Newsletter-Bestätigung!</p>

<p>Falls du den Newsletter nicht abonnieren möchtest, kannst du diese E-Mail ignorieren.</p>

<p>Viele Grüße,<br>
Dein Team von Sweets aus aller Welt</p>
```

**Wichtig:** Verwende den Merge Tag `*|CONFIRM_SUB|*` für den Bestätigungs-Link!

#### Schritt 4: Aktivieren
- Klicke auf **Start Workflow**
- Status: **Sending**

---

### 5. Segments erstellen (für Reporting)

Gehe zu: **Audience → Segments → Create Segment**

#### Segment 1: "Rubbellos Website"
- **Name:** Rubbellos Website
- **Condition:** Tag is `site-rubbellos`

#### Segment 2: "Gewinnspiel-Teilnehmer"
- **Name:** Gewinnspiel-Teilnehmer
- **Condition:** Tag is `gewinnspiel-teilnehmer`

#### Segment 3: "Newsletter bestätigt"
- **Name:** Newsletter bestätigt
- **Condition:** Tag is `newsletter-confirmed`

#### Segment 4: "Newsletter ausstehend"
- **Name:** Newsletter ausstehend
- **Condition:** Tag is `newsletter-pending`

#### Segment 5: "Mehrfach-Teilnehmer" (Fraud Detection)
- **Name:** Mehrfach-Teilnehmer
- **Condition 1:** Tag contains `ticket-`
- **Condition 2:** Tag count is greater than 2

---

## 📊 Wie der Flow funktioniert

### Szenario 1: Nur Gewinnspiel-Checkbox ✅

1. User füllt Formular aus
2. Nur Checkbox "Teilnahmebedingungen" aktiviert
3. → Code-Prüfung (nicht verwendet?)
4. → Mailchimp: Status "subscribed", Tag `gewinnspiel-teilnehmer`
5. → **1 Mail:** "Du bist dabei!" (Automation 1)
6. ✅ Fertig!

### Szenario 2: Beide Checkboxen ✅✅

1. User füllt Formular aus
2. Beide Checkboxen aktiviert
3. → Code-Prüfung (nicht verwendet?)
4. → Mailchimp: Status "subscribed", Tags `gewinnspiel-teilnehmer` + `newsletter-pending`
5. → **2 Mails:**
   - Mail 1: "Du bist dabei!" (Automation 1)
   - Mail 2: "Bitte bestätige Newsletter" (Automation 2)
6. User klickt Newsletter-Link → Tag wechselt zu `newsletter-confirmed`
7. ✅ Gewinnspiel-Teilnahme gültig (egal ob Newsletter bestätigt!)

---

## 🛡️ Duplikat-Prävention

**Automatische Prüfungen (Code-Ebene):**
1. ✅ Code bereits verwendet? → Fehler
2. ✅ Email bereits teilgenommen? → Fehler
3. ✅ Nur 1 Teilnahme pro Email

**Datenbank:**
- `/data/used-codes.json` speichert alle Codes
- **WICHTIG:** Diese Datei ist in `.gitignore` (DSGVO!)

**Manuelle Prüfung (Mailchimp):**
- Segment "Mehrfach-Teilnehmer" zeigt verdächtige Accounts

---

## 🎯 Testing-Checklist

### Test 1: Nur Gewinnspiel
- [ ] Formular ausfüllen
- [ ] Nur Checkbox 1 aktivieren
- [ ] Submit
- [ ] Erwarte: 1 Mail ("Du bist dabei")
- [ ] Mailchimp: Status "subscribed", Tag `gewinnspiel-teilnehmer`

### Test 2: Beide Checkboxen
- [ ] Formular ausfüllen (andere Email!)
- [ ] Beide Checkboxen aktivieren
- [ ] Submit
- [ ] Erwarte: 2 Mails ("Du bist dabei" + "Newsletter-Opt-in")
- [ ] Mailchimp: Tags `gewinnspiel-teilnehmer` + `newsletter-pending`

### Test 3: Duplikat-Code
- [ ] Selben Code erneut versuchen
- [ ] Erwarte: Fehler "Code bereits eingelöst"
- [ ] **KEIN** Mailchimp-Call

### Test 4: Duplikat-Email
- [ ] Neuer Code, aber selbe Email wie Test 1/2
- [ ] Erwarte: Fehler "Du hast bereits teilgenommen"
- [ ] **KEIN** Mailchimp-Call

### Test 5: Multi-Website
- [ ] In Mailchimp: Merge Field `WEBSITE` prüfen
- [ ] Erwarte: "rubbellos.sweetsausallerwelt.de"
- [ ] Segment "Rubbellos Website" sollte User enthalten

---

## 🚨 Troubleshooting

### Problem: Mails kommen nicht an

**Lösung:**
1. Prüfe Mailchimp Automation Status: **Sending** (nicht Paused)
2. Prüfe Tag-Schreibweise (exakt wie im Code!)
3. Prüfe Spam-Ordner
4. Teste mit @gmail.com Adresse

### Problem: "Domain Mismatch" Fehler

**Das sollte NICHT mehr passieren!**
- Status ist jetzt "subscribed" (nicht "transactional")
- Falls doch: Prüfe ob alte API-Version cached ist

### Problem: User bekommt beide Mails obwohl nur Gewinnspiel

**Lösung:**
1. Prüfe Frontend: Newsletter-Checkbox wirklich nicht aktiviert?
2. Prüfe API-Log: Welche Tags wurden gesetzt?
3. Prüfe Mailchimp: Welche Tags hat der User?

### Problem: Code-Datenbank wird nicht gespeichert

**Lösung:**
1. Prüfe ob `/data/` Ordner existiert
2. Prüfe Schreibrechte für Node.js
3. Prüfe Server-Logs: Fehler beim Speichern?

---

## 📞 Support

Bei Problemen:
1. Prüfe Server-Logs: `console.log` Outputs
2. Prüfe Mailchimp Activity Feed
3. Prüfe `/data/used-codes.json` für Code-Status

**Wichtig:** Diese Lösung nutzt **KEINE** kostenpflichtigen Features!
- ✅ Normale Mailchimp Automations (kostenlos)
- ❌ Kein Transactional/Mandrill nötig
- ❌ Keine Domain-Verifizierung nötig
