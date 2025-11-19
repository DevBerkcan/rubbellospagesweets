// lib/klaviyo.js
// Klaviyo API Integration für Rubbellos-Gewinnspiel & Newsletter

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
const KLAVIYO_REVISION = '2024-10-15';

/**
 * Sucht ein Profil per E-Mail
 * @param {string} email - E-Mail Adresse
 * @returns {Promise<Object|null>} - Profil oder null
 */
async function getProfileByEmail(email) {
  const apiKey = process.env.KLAVIYO_API_KEY;

  if (!apiKey) {
    throw new Error('KLAVIYO_API_KEY fehlt in ENV');
  }

  const emailFilter = `equals(email,"${email.toLowerCase().trim()}")`;
  // WICHTIG: additional-fields[profile]=properties muss hinzugefügt werden, um Custom Properties zu erhalten
  const url = `${KLAVIYO_API_BASE}/profiles/?filter=${encodeURIComponent(emailFilter)}&additional-fields[profile]=properties`;

  console.log('🔍 Suche Profil für:', email);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'revision': KLAVIYO_REVISION,
      }
    });

    if (!response.ok) {
      console.warn('❌ Klaviyo Profile Search Error:', response.status);
      return null;
    }

    const result = await response.json();

    if (result.data && result.data.length > 0) {
      console.log('✅ Profil gefunden:', {
        id: result.data[0].id,
        email: result.data[0].attributes.email,
        existingCodes: result.data[0].attributes.properties?.rubbellos_codes || 'keine'
      });
      return result.data[0]; // Erstes Profil zurückgeben
    }

    console.log('⚠️ Kein Profil gefunden für:', email);
    return null;
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Profils:', error);
    return null;
  }
}

/**
 * Erstellt/Aktualisiert ein Klaviyo-Profil mit allen Daten
 * @param {Object} params - Profil-Parameter
 * @returns {Promise<Object>} - Klaviyo Profil-Response
 */
async function upsertProfile({
  email,
  firstName = '',
  lastName = '',
  phone = '',
  address = null, // { street, city, postalCode, country }
  customProperties = {}, // saaw_* Properties
  newCode = null // Neuer Code, der hinzugefügt werden soll
}) {
  const apiKey = process.env.KLAVIYO_API_KEY;

  if (!apiKey) {
    throw new Error('KLAVIYO_API_KEY fehlt in ENV');
  }

  // Wenn ein neuer Code hinzugefügt werden soll, hole das bestehende Profil
  if (newCode) {
    console.log(`🆕 Neuer Code soll hinzugefügt werden: ${newCode}`);
    const existingProfile = await getProfileByEmail(email);

    if (existingProfile) {
      console.log('📋 Bestehendes Profil:', JSON.stringify(existingProfile.attributes, null, 2));

      if (existingProfile.attributes && existingProfile.attributes.properties) {
        const existingCodes = existingProfile.attributes.properties.rubbellos_codes || [];
        console.log(`📦 Bestehende Codes im Profil:`, existingCodes);

        // Füge den neuen Code zum Array hinzu (wenn er noch nicht existiert)
        if (!existingCodes.includes(newCode)) {
          customProperties.rubbellos_codes = [...existingCodes, newCode];
          console.log(`✅ Code ${newCode} wird zu bestehenden Codes hinzugefügt:`, customProperties.rubbellos_codes);
        } else {
          customProperties.rubbellos_codes = existingCodes;
          console.log(`⚠️ Code ${newCode} existiert bereits im Profil`);
        }
      } else {
        console.log('⚠️ Profil gefunden, aber keine Properties vorhanden');
        customProperties.rubbellos_codes = [newCode];
        console.log(`✅ Erster Code wird gespeichert:`, customProperties.rubbellos_codes);
      }
    } else {
      // Erstes Mal - erstelle neues Array
      console.log('🆕 Kein bestehendes Profil - erstelle neues Array');
      customProperties.rubbellos_codes = [newCode];
      console.log(`✅ Erster Code wird gespeichert:`, customProperties.rubbellos_codes);
    }

    // Behalte auch einzelnen Code für Kompatibilität (letzter Code)
    customProperties.rubbellos_code = newCode;
    console.log(`📝 Finale customProperties:`, customProperties);
  }

  // Profil-Attribute aufbauen
  const attributes = {
    email: email.toLowerCase().trim(),
  };

  if (firstName) attributes.first_name = firstName;
  if (lastName) attributes.last_name = lastName;
  if (phone && phone.trim()) {
    // Klaviyo benötigt Telefonnummern im E.164 Format
    // 1. Entferne alle Leerzeichen, Bindestriche, Klammern
    let cleanedPhone = phone.replace(/[\s\-\(\)]/g, '').trim();

    // 2. Stelle sicher, dass die Nummer mit + beginnt
    if (!cleanedPhone.startsWith('+')) {
      // Wenn keine Ländervorwahl, füge +49 für Deutschland hinzu
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = '+49' + cleanedPhone.substring(1);
      } else if (cleanedPhone.startsWith('49')) {
        cleanedPhone = '+' + cleanedPhone;
      } else {
        cleanedPhone = '+49' + cleanedPhone;
      }
    }

    // 3. Nur wenn die Nummer valide aussieht (mindestens 10 Zeichen nach +), speichern
    if (cleanedPhone.length >= 11 && /^\+\d+$/.test(cleanedPhone)) {
      attributes.phone_number = cleanedPhone;
      console.log(`📞 Telefonnummer wird übertragen: ${phone} → bereinigt: ${cleanedPhone}`);
    } else {
      console.warn(`⚠️ Telefonnummer ungültig und wird übersprungen: ${phone} → ${cleanedPhone}`);
    }
  }

  // Adresse hinzufügen (Klaviyo location-Format)
  if (address && (address.street || address.city || address.postalCode)) {
    attributes.location = {};
    if (address.street) attributes.location.address1 = address.street;
    if (address.city) attributes.location.city = address.city;
    if (address.postalCode) attributes.location.zip = address.postalCode;
    if (address.country) attributes.location.country = address.country;
  }

  // Custom Properties (alle saaw_* Felder)
  if (Object.keys(customProperties).length > 0) {
    attributes.properties = customProperties;
  }

  // Klaviyo API Call - Profile Upsert
  const url = `${KLAVIYO_API_BASE}/profiles/`;

  // Log was an Klaviyo gesendet wird
  console.log('📤 An Klaviyo gesendete Attribute:', JSON.stringify(attributes, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${apiKey}`,
      'revision': KLAVIYO_REVISION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        type: 'profile',
        attributes
      }
    })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('Klaviyo Profile Upsert Error:', result);
    throw new Error(result.errors?.[0]?.detail || 'Klaviyo Profil-Erstellung fehlgeschlagen');
  }

  console.log(`✅ Klaviyo Profil erstellt/aktualisiert: ${email}`);
  return result;
}

/**
 * Abonniert ein Profil für eine Klaviyo-Liste (Email Marketing Opt-in)
 * @param {string} email - E-Mail Adresse
 * @param {string} listId - Klaviyo List ID
 * @returns {Promise<Object>} - Subscription Response
 */
async function subscribeToList(email, listId) {
  const apiKey = process.env.KLAVIYO_API_KEY;

  if (!apiKey) {
    throw new Error('KLAVIYO_API_KEY fehlt in ENV');
  }

  if (!listId) {
    throw new Error('KLAVIYO_MAIN_LIST_ID fehlt in ENV');
  }

  const url = `${KLAVIYO_API_BASE}/profile-subscription-bulk-create-jobs/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${apiKey}`,
      'revision': KLAVIYO_REVISION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          custom_source: 'Rubbellos Website',
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: email.toLowerCase().trim(),
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED'
                      }
                    }
                  }
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: listId
            }
          }
        }
      }
    })
  });

  // Klaviyo gibt bei erfolgreicher Subscription oft 202 Accepted zurück
  // Bei Fehler: JSON parsen, bei Success: leeres Objekt returnen
  if (!response.ok) {
    let errorResult;
    try {
      errorResult = await response.json();
    } catch (e) {
      throw new Error(`Klaviyo Newsletter-Anmeldung fehlgeschlagen (Status: ${response.status})`);
    }
    console.error('Klaviyo Subscription Error:', errorResult);
    throw new Error(errorResult.errors?.[0]?.detail || 'Klaviyo Newsletter-Anmeldung fehlgeschlagen');
  }

  console.log(`✅ Klaviyo Newsletter-Abo erstellt: ${email} → List ${listId}`);

  // Bei Success (202 Accepted) gibt Klaviyo möglicherweise keinen Body zurück
  // Return einfach Success-Objekt
  return { success: true, status: response.status };
}

/**
 * Kombinierte Funktion: Profil erstellen + optional Newsletter subscriben
 * @param {Object} params - Alle Parameter
 * @returns {Promise<Object>} - { profile, subscription }
 */
async function createProfileAndSubscribe({
  email,
  firstName,
  lastName,
  phone,
  address,
  customProperties,
  subscribeNewsletter = false,
  listId = null,
  newCode = null // Neuer Code, der zum Array hinzugefügt werden soll
}) {
  // 1. Profil erstellen/updaten
  const profile = await upsertProfile({
    email,
    firstName,
    lastName,
    phone,
    address,
    customProperties,
    newCode // Code wird zum Array hinzugefügt
  });

  let subscription = null;

  // 2. Newsletter-Abo nur wenn gewünscht
  if (subscribeNewsletter) {
    const targetListId = listId || process.env.KLAVIYO_MAIN_LIST_ID;
    subscription = await subscribeToList(email, targetListId);
  }

  return { profile, subscription };
}

export {
  getProfileByEmail,
  upsertProfile,
  subscribeToList,
  createProfileAndSubscribe
};
