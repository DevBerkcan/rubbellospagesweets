// pages/api/golden-ticket.js
// Rubbellos-Gewinnspiel Handler mit KLAVIYO Integration

import { validateSubmission, markCodeAsUsed } from "../../lib/codeValidator";
import { createProfileAndSubscribe } from "../../lib/klaviyo";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const data = req.body;

    const {
      ticketCode,
      firstName,
      lastName,
      email,
      phone,
      street,
      city,
      postalCode,
      country,
      utm_source = "direct",
      utm_medium = "organic",
      utm_campaign = "rubbellos_2025",
      consent,
      consentTs,
      newsletterOptIn = false
    } = data;

    // ========================================
    // 1. VALIDIERUNG
    // ========================================
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Gültige E-Mail erforderlich" });
    }

    if (!ticketCode || !/^[A-Z0-9]{5}$/.test(ticketCode)) {
      return res.status(400).json({ message: "Gültiger 5-stelliger Code erforderlich" });
    }

    // ========================================
    // 2. DUPLIKAT-PRÄVENTION
    // ========================================
    const validationResult = validateSubmission(ticketCode, email, utm_campaign || "rubbellos_2025");
    if (!validationResult.valid) {
      console.warn(`❌ Duplikat erkannt: ${validationResult.error}`, { ticketCode, email });
      return res.status(400).json({
        message: validationResult.message,
        error: validationResult.error,
        ...validationResult.data
      });
    }

    // ========================================
    // 3. KLAVIYO INTEGRATION
    // ========================================

    // Log eingehende Daten
    console.log('📥 Eingehende Formulardaten:', {
      ticketCode,
      email,
      firstName,
      lastName,
      phone: phone || '(leer)',
      street: street || '(leer)',
      city: city || '(leer)',
      postalCode: postalCode || '(leer)',
      newsletterOptIn
    });

    // Custom Properties für Klaviyo
    // Hauptproperty: rubbellos_eintragung (trigger für Bestätigungs-Email)
    const customProperties = {
      rubbellos_eintragung: true,              // ← Trigger für "Gewinn wird geprüft" Mail
      rubbellos_code: ticketCode,              // 5-stelliger Code
      rubbellos_newsletter_optin: newsletterOptIn, // Newsletter-Status
      rubbellos_utm_source: utm_source || '',
      rubbellos_utm_medium: utm_medium || '',
      rubbellos_utm_campaign: utm_campaign || '',
    };

    // Adresse (optional)
    const address = (street || city || postalCode) ? {
      street: street || '',
      city: city || '',
      postalCode: postalCode || '',
      country: country || 'DE'
    } : null;

    if (address) {
      customProperties.rubbellos_adresse_angegeben = true;
    }

    // KLAVIYO: Profil erstellen + Newsletter-Abo (IMMER - unabhängig von Checkbox!)
    // Fehler werden nur geloggt, aber die Teilnahme wird trotzdem gespeichert
    try {
      const klaviyoResult = await createProfileAndSubscribe({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',        // ← Telefon wird übertragen
        address,                   // ← Adresse wird übertragen (falls angegeben)
        customProperties,          // ← Enthält: rubbellos_eintragung, rubbellos_code, etc.
        subscribeNewsletter: true, // ← IMMER zur Liste hinzufügen!
        listId: process.env.KLAVIYO_MAIN_LIST_ID
      });

      console.log('✅ Klaviyo Integration erfolgreich:', {
        email,
        ticketCode,
        newsletterOptIn: newsletterOptIn ? 'JA - DOI wird verschickt' : 'NEIN',
        profileId: klaviyoResult.profile?.data?.id
      });

    } catch (klaviyoError) {
      // Klaviyo Fehler werden nur geloggt, blockieren aber nicht die Teilnahme
      console.error('❌ Klaviyo Error (wird ignoriert):', klaviyoError.message);
      console.log('⚠️ Teilnahme wird trotzdem gespeichert');
    }

    // ========================================
    // 4. CODE IN DATENBANK MARKIEREN
    // ========================================
    markCodeAsUsed(ticketCode, email, {
      website: "rubbellos.sweetsausallerwelt.de",
      campaign: utm_campaign || "rubbellos_2025",
      firstName,
      lastName,
      newsletterOptIn
    });

    // ========================================
    // 5. SUCCESS RESPONSE
    // ========================================
    console.log("✅ Golden Ticket Teilnahme gespeichert:", {
      email,
      ticketCode,
      newsletter: newsletterOptIn ? "DOI aktiviert" : "nicht aktiviert",
      klaviyo: "✅"
    });

    return res.status(200).json({
      success: true,
      message: newsletterOptIn
        ? "Teilnahme registriert! Bitte bestätige deine E-Mail für den Newsletter."
        : "Teilnahme erfolgreich registriert!",
      ticketCode,
      email,
      newsletterOptIn
    });

  } catch (error) {
    console.error("Golden Ticket API Error:", error);
    return res.status(500).json({
      message: "Interner Server-Fehler",
      error: error.message
    });
  }
}
