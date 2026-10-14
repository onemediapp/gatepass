/**
 * Normalizes a company name string and computes a truncated SHA-256 hash (12 hex characters)
 * for private, competitor-blind quota tracking in DayLedger and CompanyRelations.
 */

export function normalizeCompanyName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ');   // collapse spaces
}

/**
 * Computes a 12-character hex company key from normalized company name
 * @param {string} rawName 
 * @returns {Promise<string>} 12-character hex key e.g. "a1b2c3d4e5f6"
 */
export async function generateCompanyKey(rawName) {
  const normalized = normalizeCompanyName(rawName);
  if (!normalized) return 'default_corp';

  // Use crypto.subtle (available in modern browsers and Node/Vitest)
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    const msgBuffer = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fullHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return fullHex.slice(0, 12);
  }

  // Fallback djb2-like 12-character hex for environments without subtle crypto
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0');
  return hex.slice(0, 12);
}
