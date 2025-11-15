// pages/api/golden-ticket.js
const crypto = require("crypto");
const { validateSubmission, markCodeAsUsed } = require("../../lib/codeValidator");

module.exports = async function handler(req, res) {
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
      source = "golden_ticket",
      offer = "Adventskalender 2025",
      utm_source = "direct",
      utm_medium = "organic", 
      utm_campaign = "golden_ticket_2025",
      consent,
      consentTs,
      newsletterOptIn = false
    } = data;

    // Validierung
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Gültige E-Mail erforderlich" });
    }

    if (!ticketCode || !/^[A-Z0-9]{8}$/.test(ticketCode)) {
      return res.status(400).json({ message: "Gültiger 8-stelliger Code erforderlich" });
    }

    // DUPLIKAT-PRÄVENTION: Prüfe ob Code bereits verwendet oder Email bereits teilgenommen
    const validationResult = validateSubmission(ticketCode, email, utm_campaign || "rubbellos_2025");
    if (!validationResult.valid) {
      console.warn(`❌ Duplikat erkannt: ${validationResult.error}`, { ticketCode, email });
      return res.status(400).json({
        message: validationResult.message,
        error: validationResult.error,
        ...validationResult.data
      });
    }

    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
    const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
      console.error("Mailchimp credentials missing");
      return res.status(500).json({ message: "Server-Konfigurationsfehler" });
    }

    const dc = MAILCHIMP_API_KEY.split("-")[1];
    const subscriberHash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
    const memberUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}`;

    // Tags sammeln - steuern welche Automations getriggert werden
    const tags = [
      "gewinnspiel-teilnehmer",  // → Triggers Gewinnspiel-Bestätigungs-Mail (ALLE)
      "golden-ticket-2025",
      "rubbellos",
      source,
      `ticket-${ticketCode.substring(0, 3)}`,
      "website-rubbellos"  // Multi-Website Tracking
    ];

    if (street && city && postalCode) {
      tags.push("address-provided");
    }

    if (utm_source && utm_source !== "direct") {
      tags.push(`utm_source_${utm_source}`);
    }

    if (utm_campaign) {
      tags.push(`utm_campaign_${utm_campaign}`);
    }

    // Newsletter-Tag System: pending → wartet auf Bestätigung
    if (newsletterOptIn) {
      tags.push("newsletter-pending");  // → Triggers Newsletter-Opt-in Mail
      tags.push("golden-ticket-gewinnspiel");
    }

    // Merge Fields für Mailchimp
    const merge_fields = {
      FNAME: firstName || "",
      LNAME: lastName || "",
      PHONE: phone || "",
      TICKET: ticketCode,
      OFFER: offer,
      SOURCE: source,
      WEBSITE: "rubbellos.sweetsausallerwelt.de",  // Multi-Website Tracking
      UTM_SOURCE: utm_source || "",
      UTM_MEDIUM: utm_medium || "",
      UTM_CAMPAIGN: utm_campaign || "",
    };

    // Adresse hinzufügen
    if (street || city || postalCode || country) {
      merge_fields.ADDRESS = {
        addr1: street || "",
        city: city || "",
        zip: postalCode || "",
        country: country || "DE"
      };
    }

    // Mailchimp Payload - IMMER "subscribed" verwenden!
    // Tags entscheiden über welche Mails verschickt werden
    const mailchimpPayload = {
      email_address: email,
      status_if_new: "subscribed",  // Sofortige Speicherung
      status: "subscribed",          // Auch für existing users
      merge_fields
    };

    // Mailchimp API Call
    const response = await fetch(memberUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
      },
      body: JSON.stringify(mailchimpPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Mailchimp Error:", result);
      return res.status(500).json({
        message: "Fehler beim Speichern in Mailchimp",
        error: result.detail || result.title
      });
    }

    // Tags hinzufügen
    const tagsUrl = `${memberUrl}/tags`;
    await fetch(tagsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
      },
      body: JSON.stringify({
        tags: tags.map(name => ({ name, status: "active" }))
      }),
    });

    // Code in Datenbank markieren (nach erfolgreichem Mailchimp-Call)
    markCodeAsUsed(ticketCode, email, {
      website: "rubbellos.sweetsausallerwelt.de",
      campaign: utm_campaign || "rubbellos_2025",
      firstName,
      lastName,
      newsletterOptIn
    });

    console.log("✅ Golden Ticket Teilnahme gespeichert:", {
      email,
      ticketCode,
      status: "subscribed",
      newsletter: newsletterOptIn ? "pending (DOI wird verschickt)" : "nicht aktiviert",
      tags: tags.join(", ")
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