// Golden Ticket Gewinnspiel API für Pages Router
// Speichert ALLE Gewinnspiel-Teilnehmer in Mailchimp (status: transactional)
// Bei Newsletter-Checkbox: zusätzlich status: pending für Double-Opt-In

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
      offer = "Adventskalender 2024",
      utm_source = "direct",
      utm_medium = "organic",
      utm_campaign = "golden_ticket_2024",
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
    const mailchimpUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;

    // Tags sammeln
    const tags = [
      "gewinnspiel-teilnehmer",  // ALLE Gewinnspiel-Teilnehmer
      "golden-ticket-2024",      // Kampagnen-spezifisch
      "rubbellos",               // Quelle: Rubbellos-Gewinnspiel
      source,                    // z.B. "rubbellos"
      `ticket-${ticketCode.substring(0, 3)}`, // Erste 3 Zeichen für Gruppierung
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

    // Bei Newsletter-Anmeldung zusätzliche Tags
    if (newsletterOptIn) {
      tags.push("newsletter-opt-in");
      tags.push("golden-ticket-gewinnspiel");
    }

    // Mailchimp Payload
    const mailchimpPayload = {
      email_address: email,
      status: newsletterOptIn ? "pending" : "transactional", // DOI nur bei Newsletter
      merge_fields: {
        FNAME: firstName || "",
        LNAME: lastName || "",
        PHONE: phone || "",
        TICKET: ticketCode,
        OFFER: offer,
        SOURCE: source,
        UTM_SOURCE: utm_source || "",
        UTM_MEDIUM: utm_medium || "",
        UTM_CAMPAIGN: utm_campaign || "",
      },
      tags: tags
    };

    // Vollständige Adresse hinzufügen
    if (street && city && postalCode) {
      mailchimpPayload.merge_fields.ADDRESS = {
        addr1: street,
        city: city,
        state: "",
        zip: postalCode,
        country: country || "DE"
      };
    }

    // Consent-Metadaten
    if (consent && consentTs) {
      mailchimpPayload.marketing_permissions = [{
        marketing_permission_id: "gewinnspiel_teilnahme",
        enabled: true
      }];
    }

    // Mailchimp API Call
    const mailchimpResponse = await fetch(mailchimpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
      },
      body: JSON.stringify(mailchimpPayload),
    });

    const mailchimpData = await mailchimpResponse.json();

    // Fehlerbehandlung
    if (!mailchimpResponse.ok) {
      // Bereits existierende E-Mail → Update statt Create
      if (mailchimpData.title === "Member Exists") {
        const emailHash = require("crypto")
          .createHash("md5")
          .update(email.toLowerCase())
          .digest("hex");

        const updateUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${emailHash}`;

        const updateResponse = await fetch(updateUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
          },
          body: JSON.stringify({
            merge_fields: mailchimpPayload.merge_fields,
          }),
        });

        // Tags separat hinzufügen
        const tagsUrl = `${updateUrl}/tags`;
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

        console.log("✅ Golden Ticket Teilnahme in Mailchimp aktualisiert:", { email, ticketCode });
        return res.status(200).json({
          success: true,
          message: "Teilnahme erfolgreich aktualisiert",
          ticketCode,
          email,
          updated: true
        });
      }

      console.error("Mailchimp Error:", mailchimpData);
      return res.status(500).json({
        message: "Fehler beim Speichern in Mailchimp",
        error: mailchimpData.detail || mailchimpData.title
      });
    }

    console.log("✅ Golden Ticket Teilnahme in Mailchimp gespeichert:", {
      email,
      ticketCode,
      status: newsletterOptIn ? "pending (DOI)" : "transactional",
      tags: tags.slice(0, 3).join(", ")
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
