// pages/api/golden-ticket.js
import crypto from "crypto";

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

    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
    const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
      console.error("Mailchimp credentials missing");
      return res.status(500).json({ message: "Server-Konfigurationsfehler" });
    }

    const dc = MAILCHIMP_API_KEY.split("-")[1];
    const subscriberHash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
    const memberUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}`;

    // Tags sammeln
    const tags = [
      "gewinnspiel-teilnehmer",
      "golden-ticket-2025", 
      "rubbellos",
      source,
      `ticket-${ticketCode.substring(0, 3)}`,
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

    if (newsletterOptIn) {
      tags.push("newsletter-opt-in");
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

    // Mailchimp Payload
    const mailchimpPayload = {
      email_address: email,
      status_if_new: newsletterOptIn ? "pending" : "transactional",
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

    console.log("✅ Golden Ticket Teilnahme gespeichert:", {
      email,
      ticketCode,
      status: newsletterOptIn ? "pending (DOI)" : "transactional"
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