/**
 * Gatepass ID & Slug generation helpers
 * Standardizes ID formats across client transactions and collections
 */

/**
 * Creates a clean URL-friendly kebab-case slug
 * @param {string} text 
 * @returns {string}
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Combines slotDate and slotStart into canonical slotKey
 * @param {string} slotDate yyyy-MM-dd
 * @param {string} slotStart HH:mm
 * @returns {string} e.g. "2026-10-28_14:00"
 */
export function slotKey(slotDate, slotStart) {
  return `${slotDate}_${slotStart}`;
}

/**
 * ID for slotLedger document: {doctorId}_{slotKey}
 * @param {string} doctorId 
 * @param {string} slotKey 
 * @returns {string}
 */
export function slotLedgerId(doctorId, slotKey) {
  return `${doctorId}_${slotKey}`;
}

/**
 * ID for dayLedger document: {doctorId}_{yyyy-MM-dd}
 * @param {string} doctorId 
 * @param {string} slotDate 
 * @returns {string}
 */
export function dayLedgerId(doctorId, slotDate) {
  return `${doctorId}_${slotDate}`;
}

/**
 * Composite ID for repRelations: {doctorId}_{repId}
 * @param {string} doctorId 
 * @param {string} repId 
 * @returns {string}
 */
export function repRelationId(doctorId, repId) {
  return `${doctorId}_${repId}`;
}

/**
 * Composite ID for contactGrants: {doctorId}_{repId}
 * @param {string} doctorId 
 * @param {string} repId 
 * @returns {string}
 */
export function contactGrantId(doctorId, repId) {
  return `${doctorId}_${repId}`;
}

/**
 * Composite ID for doctorRepLinks: {doctorId}_{repId}
 * @param {string} doctorId 
 * @param {string} repId 
 * @returns {string}
 */
export function doctorRepLinkId(doctorId, repId) {
  return `${doctorId}_${repId}`;
}

/**
 * Generates an unambiguous, easy-to-read alphanumeric token candidate
 * (Excludes 0/O, 1/I to avoid misreading at reception desk)
 * @param {number} length 
 * @returns {string} e.g. "K7M2X9"
 */
export function tokenCandidate(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
