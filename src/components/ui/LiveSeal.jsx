/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { ShieldCheck, AlertCircle, WifiOff } from 'lucide-react';

/**
 * LiveSeal: Anti-fraud signature rotating seal with synchronized seconds tick
 * Impossible to forge with a static screenshot.
 *
 * @param {Object} props
 * @param {'valid'|'expiring'|'not_yet_valid'|'expired'} props.status
 * @param {number} props.secondTick 0-59
 * @param {boolean} [props.isOfflineOver60s]
 * @param {string} [props.className]
 */
export default function LiveSeal({
  status = 'valid',
  secondTick = 0,
  isOfflineOver60s = false,
  className = '',
}) {
  const isLive = !isOfflineOver60s && (status === 'valid' || status === 'expiring');
  const isExpiring = status === 'expiring';
  const isExpired = status === 'expired';
  const isNotYet = status === 'not_yet_valid';

  // Rotation angle for the seconds tick indicator (6 degrees per second)
  const tickAngle = (secondTick % 60) * 6;

  // Colors based on pass state
  const colorTheme = isOfflineOver60s
    ? {
        border: 'border-slate-300',
        bg: 'bg-slate-50/80',
        innerBg: 'bg-slate-100/60',
        accentText: 'text-slate-500',
        ringStroke: 'stroke-slate-400',
        dotBg: 'bg-slate-400',
        tagBg: 'bg-slate-100',
        tagText: 'text-slate-600'
      }
    : isExpired
    ? {
        border: 'border-coral-500/30',
        bg: 'bg-coral-50/70',
        innerBg: 'bg-coral-100/40',
        accentText: 'text-coral-600',
        ringStroke: 'stroke-coral-500',
        dotBg: 'bg-coral-600',
        tagBg: 'bg-coral-100',
        tagText: 'text-coral-700'
      }
    : isExpiring
    ? {
        border: 'border-amber-500/40',
        bg: 'bg-amber-50/80',
        innerBg: 'bg-amber-100/50',
        accentText: 'text-amber-600',
        ringStroke: 'stroke-amber-500',
        dotBg: 'bg-amber-500',
        tagBg: 'bg-amber-100',
        tagText: 'text-amber-800'
      }
    : isNotYet
    ? {
        border: 'border-amber-400/40',
        bg: 'bg-amber-50/60',
        innerBg: 'bg-amber-100/40',
        accentText: 'text-amber-600',
        ringStroke: 'stroke-amber-500',
        dotBg: 'bg-amber-500',
        tagBg: 'bg-amber-100',
        tagText: 'text-amber-800'
      }
    : {
        border: 'border-teal-500/40',
        bg: 'bg-gradient-to-b from-teal-50/90 to-emerald-50/40',
        innerBg: 'bg-teal-100/50',
        accentText: 'text-teal-600',
        ringStroke: 'stroke-teal-600',
        dotBg: 'bg-teal-500',
        tagBg: 'bg-teal-100/80',
        tagText: 'text-teal-800'
      };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-3.5 rounded-[1.5rem] border shadow-sm transition-all duration-300 select-none overflow-hidden',
        colorTheme.border,
        colorTheme.bg,
        className
      )}
      role="status"
      aria-label={
        isOfflineOver60s
          ? 'Live seal unverified: offline'
          : isExpired
          ? 'Live seal expired'
          : `Live security seal active, second ${secondTick}`
      }
    >
      {/* Precision Chronometer Seal Body */}
      <div className="relative w-26 h-26 sm:w-28 sm:h-28 flex items-center justify-center">
        {/* Outer Rotating Ring (continuous smooth spin) */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border border-dashed pointer-events-none opacity-80',
            colorTheme.border,
            isLive ? 'animate-seal-spin' : ''
          )}
          style={{
            borderWidth: '0.125rem',
            borderDasharray: '0.25rem 0.25rem',
          }}
        />

        {/* Circular Medallion Inner Glow */}
        <div className={cn(
          'absolute inset-2 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] pointer-events-none transition-colors',
          colorTheme.innerBg
        )} />

        {/* SVG Ring with fixed ticks & rotating second hand */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Circular track */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            strokeWidth="1.5"
            stroke="currentColor"
            className="text-slate-300/80"
          />

          {/* 12 Hour/5-sec Tick marks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="8"
              x2="50"
              y2={deg % 90 === 0 ? '14' : '11'}
              stroke="currentColor"
              strokeWidth={deg % 90 === 0 ? '2' : '1'}
              className="text-slate-400/80"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}

          {/* Active seconds tick indicator hand (ticks every second) */}
          {isLive && (
            <g transform={`rotate(${tickAngle} 50 50)`} className="transition-transform duration-150 ease-out">
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="13"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={colorTheme.accentText}
              />
              <circle
                cx="50"
                cy="13"
                r="3.5"
                fill="currentColor"
                className={colorTheme.accentText}
              />
            </g>
          )}
        </svg>

        {/* Center Seal Emblem */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {isOfflineOver60s ? (
            <WifiOff className="w-5 h-5 text-slate-400 mb-0.5" />
          ) : isExpired ? (
            <AlertCircle className="w-5 h-5 text-coral-600 mb-0.5" />
          ) : (
            <div className="flex items-center gap-1 mb-0.5">
              <span className={cn('w-2 h-2 rounded-full motion-safe:animate-ping shadow-sm', colorTheme.dotBg)} />
              <ShieldCheck className={cn('w-5 h-5', colorTheme.accentText)} />
            </div>
          )}

          {/* Seconds Display */}
          <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-ink tabular-nums">
            {isOfflineOver60s ? (
              'OFFLINE'
            ) : isExpired ? (
              'EXPIRED'
            ) : (
              `:${String(secondTick).padStart(2, '0')}`
            )}
          </span>

          <span className="text-[0.5625rem] font-mono font-semibold uppercase tracking-wider text-slate-400">
            {isLive ? 'SEC TICK' : 'STATIC'}
          </span>
        </div>
      </div>

      {/* Seal Banner / Verification Label */}
      <div className="mt-2.5 text-center">
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.625rem] font-mono font-bold tracking-wider uppercase border border-black/5 shadow-2xs',
            colorTheme.tagBg,
            colorTheme.tagText
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', colorTheme.dotBg, isLive ? 'motion-safe:animate-pulse' : '')} />
          {isOfflineOver60s
            ? 'VERIFICATION PAUSED'
            : isExpired
            ? 'PASS EXPIRED'
            : isExpiring
            ? 'LIVE SEAL · EXPIRING SOON'
            : isNotYet
            ? 'PENDING ACTIVATION'
            : 'LIVE SEAL · VERIFIED'}
        </div>
      </div>
    </div>
  );
}
