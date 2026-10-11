/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePWA } from '../../hooks/usePWA';
import { RefreshCw, Download, X } from 'lucide-react';

export default function PWAUpdateToast() {
  const { isInstallable, promptInstall, isUpdateAvailable, reloadApp, dismissUpdate } = usePWA();

  if (!isUpdateAvailable && !isInstallable) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {isUpdateAvailable && (
        <div className="bg-navy-900 text-white p-3.5 rounded-[1.25rem] shadow-card border border-white/10 flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-teal-600/30 text-teal-300 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight">Update Ready</p>
              <p className="text-[0.6875rem] text-navy-100/80 truncate">A new version of Gatepass is ready.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={reloadApp}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-[0.75rem] text-xs font-semibold shadow-sm transition-all active:scale-95 min-h-[2.75rem] flex items-center"
            >
              Reload
            </button>
            <button
              onClick={dismissUpdate}
              className="p-2 text-navy-100 hover:text-white rounded-[0.5rem] transition-colors"
              aria-label="Dismiss update banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isInstallable && !isUpdateAvailable && (
        <div className="bg-white text-ink p-3.5 rounded-[1.25rem] shadow-card border border-line flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-900 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink leading-tight">Install Gatepass App</p>
              <p className="text-[0.6875rem] text-ink-soft truncate">Add to home screen for instant access.</p>
            </div>
          </div>

          <button
            onClick={promptInstall}
            className="px-3 py-1.5 bg-navy-900 hover:bg-navy-700 text-white rounded-[0.75rem] text-xs font-semibold shadow-sm transition-all active:scale-95 min-h-[2.75rem] flex items-center flex-shrink-0"
          >
            Install
          </button>
        </div>
      )}
    </div>
  );
}
