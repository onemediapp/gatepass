/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Screen Wake Lock hook for keeping mobile screens active while displaying live passes
 * Automatically handles re-acquisition on visibilitychange
 * @returns {{ isLocked: boolean, isSupported: boolean }}
 */
export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const sentinelRef = useRef(null);
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const requestLock = useCallback(async () => {
    if (!isSupported) return;
    try {
      if (sentinelRef.current && !sentinelRef.current.released) {
        return;
      }
      const sentinel = await navigator.wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setIsLocked(true);

      sentinel.addEventListener('release', () => {
        setIsLocked(false);
        sentinelRef.current = null;
      });
    } catch (err) {
      // Common when tab is in background or low battery mode
      setIsLocked(false);
      sentinelRef.current = null;
    }
  }, [isSupported]);

  const releaseLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch (err) {
        // Ignore release errors
      }
      sentinelRef.current = null;
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [requestLock, releaseLock]);

  return { isLocked, isSupported, requestLock, releaseLock };
}

export default useWakeLock;
