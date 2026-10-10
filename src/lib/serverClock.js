/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { setServerClockOffset } from './time';

let cachedOffsetMs = 0;
let isSynced = false;
let initPromise = null;

let baseServerMs = 0;
let basePerfMs = 0;

/**
 * Initializes server time synchronization by sending a HEAD request to the origin
 * Reads the Date header, calculates offset against device time, and caches it.
 * Anchors to performance.now() to prevent client clock tampering during session.
 * Falls back to device clock if request fails.
 * @returns {Promise<{ offsetMs: number, isSynced: boolean }>}
 */
export async function initServerClock() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const perfBefore = typeof performance !== 'undefined' ? performance.now() : 0;
      // Use origin or current path with cache-busting
      const targetUrl = typeof window !== 'undefined' && window.location?.origin 
        ? `${window.location.origin}/?_ts=${Date.now()}`
        : `/?_ts=${Date.now()}`;

      const response = await fetch(targetUrl, {
        method: 'HEAD',
        cache: 'no-store',
      });

      const serverDateHeader = response.headers.get('date');
      if (serverDateHeader) {
        const serverMs = new Date(serverDateHeader).getTime();
        if (!isNaN(serverMs)) {
          const clientMs = Date.now();
          cachedOffsetMs = serverMs - clientMs;
          baseServerMs = serverMs;
          basePerfMs = typeof performance !== 'undefined' ? performance.now() : 0;
          isSynced = true;
          setServerClockOffset(cachedOffsetMs);
          console.log(`[ServerClock] Synced with server clock. Offset: ${cachedOffsetMs}ms (Date: ${serverDateHeader})`);
          return { offsetMs: cachedOffsetMs, isSynced: true };
        }
      }
    } catch (err) {
      console.warn('[ServerClock] Failed to fetch server Date header, falling back to device clock:', err);
    }

    // Fallback: device clock
    cachedOffsetMs = 0;
    baseServerMs = Date.now();
    basePerfMs = typeof performance !== 'undefined' ? performance.now() : 0;
    isSynced = false;
    setServerClockOffset(0);
    return { offsetMs: 0, isSynced: false };
  })();

  return initPromise;
}

/**
 * Returns current timestamp in milliseconds, adjusted by server offset
 * Uses monotonic performance.now() when available to resist client clock adjustments
 * @returns {number}
 */
export function serverNow() {
  if (isSynced && baseServerMs > 0 && typeof performance !== 'undefined') {
    return Math.round(baseServerMs + (performance.now() - basePerfMs));
  }
  return Date.now() + cachedOffsetMs;
}

/**
 * Returns current JS Date object adjusted by server offset
 * @returns {Date}
 */
export function serverNowDate() {
  return new Date(serverNow());
}

/**
 * Returns cached server clock offset in ms
 * @returns {number}
 */
export function getServerClockOffset() {
  return cachedOffsetMs;
}

/**
 * Returns whether clock is verified and synced with server
 * @returns {boolean}
 */
export function isClockSynced() {
  return isSynced;
}
