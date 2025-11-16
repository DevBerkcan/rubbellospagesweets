// pages/api/newsletter.js
// Newsletter/Hero-Signup Handler mit KLAVIYO Integration

const { createProfileAndSubscribe } = require("../../lib/klaviyo");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const {
      email,
      firstName = "",
      lastName = "",
      phone = "",
      street = "",
      city = "",
      postalCode = "",
      country = "DE",
      source = "standard",
      offer,
      code = "", // Optional: Rubbellos-Code
      utm_source,
      utm_medium,
      utm_campaign,
      website = null, // Multi-Website Tracking
    } = req.body || {};

    // ========================================
    // 1. VALIDIERUNG
    // ========================================
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    // ========================================
    // 2. WEBSITE-ERKENNUNG
    // ========================================
    const detectedWebsite = website ||
      (source === "rubbellos" ? "rubbellos.sweetsausallerwelt.de" :
       source === "goldenticket" ? "goldenticket.sweetsausallerwelt.de" :
       source === "newsletter" ? "newsletter.sweetsausallerwelt.de" :
       "sweetsausallerwelt.de");

    // ========================================
    // 3. KLAVIYO CUSTOM PROPERTIES
    // ========================================
    // Ersetzt die bisherigen Mailchimp-Tags mit Klaviyo-Properties
    const customProperties = {
      saaw_source_last: source,
      saaw_website: detectedWebsite,
      saaw_newsletter_signup: true,
      saaw_utm_source: utm_source || '',
      saaw_utm_medium: utm_medium || '',
      saaw_utm_campaign: utm_campaign || '',
    };

    // Offer-Handling
    const finalOffer = offer || (source === "hero_dubai_offer" || source === "hero_offer" ? "Dubai Schokolade" : "Standard");
    customProperties.saaw_offer = finalOffer;

    // Source-spezifische Properties
    if (source === "hero_dubai_offer" || source === "hero_offer") {
      customProperties.saaw_dubai_chocolate = true;
    }

    if (source === "rubbellos" || detectedWebsite.includes("rubbellos")) {
      customProperties.saaw_rubbellos_signup = true;
      customProperties.saaw_adventskalender_2025 = true;
    } else if (source === "goldenticket" || detectedWebsite.includes("goldenticket")) {
      customProperties.saaw_goldenticket_signup = true;
    } else if (source === "newsletter" || detectedWebsite.includes("newsletter")) {
      customProperties.saaw_newsletter_page_signup = true;
    }

    // Code (falls vorhanden)
    if (code && code.trim()) {
      customProperties.saaw_code = code.toUpperCase().trim();
    }

    // ========================================
    // 4. ADRESSE (optional)
    // ========================================
    const address = (street || city || postalCode) ? {
      street: street || '',
      city: city || '',
      postalCode: postalCode || '',
      country: country || 'DE'
    } : null;

    if (address) {
      customProperties.saaw_address_provided = true;
    }

    // ========================================
    // 5. KLAVIYO INTEGRATION
    // ========================================
    // Newsletter-Handler: IMMER Newsletter-Abo aktivieren
    try {
      const klaviyoResult = await createProfileAndSubscribe({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        address,
        customProperties,
        subscribeNewsletter: true, // Newsletter-Handler → IMMER subscribed
        listId: process.env.KLAVIYO_MAIN_LIST_ID
      });

      console.log('✅ Klaviyo Newsletter-Signup erfolgreich:', {
        email,
        source,
        offer: finalOffer,
        profileId: klaviyoResult.profile?.data?.id
      });

    } catch (klaviyoError) {
      console.error('❌ Klaviyo Error:', klaviyoError);
      return res.status(500).json({
        message: "Subscription failed",
        error: klaviyoError.message
      });
    }

    // ========================================
    // 6. SUCCESS RESPONSE
    // ========================================
    const responseData = {
      message: "Successfully subscribed!",
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      offer: finalOffer,
      status: "subscribed",
      address_provided: !!(street || city || postalCode),
      klaviyo: "✅"
    };

    // Debug-Info für Entwicklung
    if (process.env.NODE_ENV === "development") {
      responseData.debug = {
        customProperties,
        website: detectedWebsite,
        source
      };
    }

    return res.status(200).json(responseData);

  } catch (err) {
    console.error("Newsletter signup error:", err);
    return res.status(500).json({
      message: "Subscription failed",
      error: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
    });
  }
}
