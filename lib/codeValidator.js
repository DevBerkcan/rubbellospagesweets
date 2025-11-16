// lib/codeValidator.js
// Code-Duplikat-Prävention für Rubbellos-Gewinnspiel

import fs from 'fs';
import path from 'path';

const CODE_DB_PATH = path.join(process.cwd(), 'data', 'used-codes.json');

/**
 * Lädt die Datenbank mit verwendeten Codes
 * @returns {Object} - Code-Datenbank
 */
function loadCodeDatabase() {
  try {
    // Vercel hat read-only filesystem - wenn data/ nicht existiert, return {}
    if (!fs.existsSync(CODE_DB_PATH)) {
      console.warn('⚠️ Code database nicht gefunden (normal auf Vercel) - Duplikat-Prävention deaktiviert');
      return {};
    }

    // Lade used-codes.json
    const data = fs.readFileSync(CODE_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('⚠️ Code database Fehler (normal auf Vercel):', error.message);
    return {};
  }
}

/**
 * Speichert die Code-Datenbank
 * @param {Object} database - Code-Datenbank
 */
function saveCodeDatabase(database) {
  try {
    const dataDir = path.join(process.cwd(), 'data');

    // Auf Vercel: read-only filesystem - nur loggen
    if (!fs.existsSync(dataDir)) {
      console.warn('⚠️ Kann Code-Datenbank nicht speichern (Vercel read-only filesystem)');
      console.log('📋 Code würde gespeichert werden:', JSON.stringify(database, null, 2));
      return; // Kein Fehler werfen
    }

    fs.writeFileSync(CODE_DB_PATH, JSON.stringify(database, null, 2), 'utf8');
    console.log('✅ Code-Datenbank gespeichert');
  } catch (error) {
    console.warn('⚠️ Fehler beim Speichern der Code-Datenbank:', error.message);
    // Kein Error werfen - auf Vercel erwartet
  }
}

/**
 * Prüft ob ein Code bereits verwendet wurde
 * @param {string} code - 5-stelliger Rubbellos-Code
 * @returns {Object} - { valid: boolean, error?: string, data?: Object }
 */
function validateCode(code) {
  const db = loadCodeDatabase();

  const normalizedCode = code.toUpperCase().trim();

  if (db[normalizedCode]) {
    return {
      valid: false,
      error: 'CODE_ALREADY_USED',
      message: 'Dieser Code wurde bereits eingelöst.',
      data: {
        usedAt: db[normalizedCode].timestamp,
        website: db[normalizedCode].website
      }
    };
  }

  return { valid: true };
}

/**
 * Prüft ob eine E-Mail bereits für diese Kampagne teilgenommen hat
 * @param {string} email - E-Mail Adresse
 * @param {string} campaign - Kampagnen-Name (z.B. "rubbellos_2025")
 * @returns {Object} - { valid: boolean, error?: string, data?: Object }
 */
function validateEmail(email, campaign = "rubbellos_2025") {
  const db = loadCodeDatabase();

  const normalizedEmail = email.toLowerCase().trim();

  // Prüfe ob diese E-Mail bereits einen Code für diese Kampagne eingelöst hat
  const existingEntries = Object.values(db).filter(entry =>
    entry &&
    entry.email &&
    entry.campaign &&
    entry.email.toLowerCase() === normalizedEmail &&
    entry.campaign === campaign
  );

  if (existingEntries.length > 0) {
    return {
      valid: false,
      error: 'EMAIL_ALREADY_PARTICIPATED',
      message: 'Du hast bereits mit dieser E-Mail Adresse teilgenommen.',
      data: {
        usedCodes: existingEntries.map(e => e.code),
        firstParticipation: existingEntries[0].timestamp
      }
    };
  }

  return { valid: true };
}

/**
 * Markiert einen Code als verwendet
 * @param {string} code - 5-stelliger Code
 * @param {string} email - E-Mail Adresse
 * @param {Object} options - Zusätzliche Daten
 * @returns {boolean} - Erfolg
 */
function markCodeAsUsed(code, email, options = {}) {
  try {
    const db = loadCodeDatabase();

    const normalizedCode = code.toUpperCase().trim();

    db[normalizedCode] = {
      code: normalizedCode,
      email: email.toLowerCase().trim(),
      timestamp: new Date().toISOString(),
      website: options.website || 'rubbellos.sweetsausallerwelt.de',
      campaign: options.campaign || 'rubbellos_2025',
      firstName: options.firstName || '',
      lastName: options.lastName || '',
      ...options
    };

    saveCodeDatabase(db);

    console.log(`✅ Code ${normalizedCode} marked as used by ${email}`);

    return true;
  } catch (error) {
    console.error('Error marking code as used:', error);
    throw error;
  }
}

/**
 * Statistiken über verwendete Codes
 * @param {string} campaign - Optional: Filter nach Kampagne
 * @returns {Object} - Statistiken
 */
function getCodeStatistics(campaign = null) {
  const db = loadCodeDatabase();

  // Filter out non-entry objects (comments, etc.)
  let entries = Object.values(db).filter(e => e && e.email && e.timestamp);

  if (campaign) {
    entries = entries.filter(e => e.campaign === campaign);
  }

  return {
    totalCodes: entries.length,
    uniqueEmails: new Set(entries.map(e => e.email)).size,
    websites: entries.reduce((acc, e) => {
      acc[e.website] = (acc[e.website] || 0) + 1;
      return acc;
    }, {}),
    latestEntry: entries.length > 0 ? entries.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0] : null
  };
}

/**
 * Vollständige Validierung: Code UND Email
 * @param {string} code - 5-stelliger Code
 * @param {string} email - E-Mail Adresse
 * @param {string} campaign - Kampagnen-Name
 * @returns {Object} - { valid: boolean, error?: string, message?: string }
 */
function validateSubmission(code, email, campaign = "rubbellos_2025") {
  // Prüfe Code
  const codeCheck = validateCode(code);
  if (!codeCheck.valid) {
    return codeCheck;
  }

  // Prüfe Email
  const emailCheck = validateEmail(email, campaign);
  if (!emailCheck.valid) {
    return emailCheck;
  }

  return { valid: true };
}

// ES6 Exports
export {
  validateCode,
  validateEmail,
  markCodeAsUsed,
  getCodeStatistics,
  validateSubmission
};
