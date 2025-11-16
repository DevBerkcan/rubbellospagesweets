// lib/klaviyo.js
// Klaviyo API Integration für Rubbellos-Gewinnspiel & Newsletter

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
const KLAVIYO_REVISION = '2024-10-15';

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
  customProperties = {} // saaw_* Properties
}) {
  const apiKey = process.env.KLAVIYO_API_KEY;

  if (!apiKey) {
    throw new Error('KLAVIYO_API_KEY fehlt in ENV');
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
  listId = null
}) {
  // 1. Profil erstellen/updaten
  const profile = await upsertProfile({
    email,
    firstName,
    lastName,
    phone,
    address,
    customProperties
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
  upsertProfile,
  subscribeToList,
  createProfileAndSubscribe
};
