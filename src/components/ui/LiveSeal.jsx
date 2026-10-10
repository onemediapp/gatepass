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
        border: 'border-ink-mute/30',
        bg: 'bg-ink-mute/5',
        accentText: 'text-ink-mute',
        ringStroke: 'stroke-ink-mute/40',
        dotBg: 'bg-ink-mute',
        tagBg: 'bg-ink-mute/10',
        tagText: 'text-ink-mute'
      }
    : isExpired
    ? {
        border: 'border-coral-600/20',
        bg: 'bg-coral-50/50',
        accentText: 'text-coral-600',
        ringStroke: 'stroke-coral-600/40',
        dotBg: 'bg-coral-600',
        tagBg: 'bg-coral-50',
        tagText: 'text-coral-600'
      }
    : isExpiring
    ? {
        border: 'border-amber-500/30',
        bg: 'bg-amber-50/60',
        accentText: 'text-amber-500',
        ringStroke: 'stroke-amber-500',
        dotBg: 'bg-amber-500',
        tagBg: 'bg-amber-100',
        tagText: 'text-amber-500'
      }
    : isNotYet
    ? {
        border: 'border-sand-600/30',
        bg: 'bg-sand-50/60',
        accentText: 'text-sand-600',
        ringStroke: 'stroke-sand-600',
        dotBg: 'bg-sand-600',
        tagBg: 'bg-sand-100',
        tagText: 'text-sand-600'
      }
    : {
        border: 'border-teal-600/30',
        bg: 'bg-teal-50/70',
        accentText: 'text-teal-600',
        ringStroke: 'stroke-teal-600',
        dotBg: 'bg-teal-600',
        tagBg: 'bg-teal-50',
        tagText: 'text-teal-600'
      };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-3 rounded-[1.25rem] border transition-all duration-300 select-none',
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
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
        {/* Outer Rotating Ring (continuous smooth spin) */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border border-dashed pointer-events-none',
            colorTheme.border,
            isLive ? 'animate-seal-spin' : ''
          )}
          style={{
            borderWidth: '0.125rem',
            borderDasharray: '0.25rem 0.25rem',
          }}
        />

        {/* Inner SVG Ring with fixed ticks & rotating second hand */}
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
            className="text-line/60"
          />

          {/* 12 Hour/5-sec Tick marks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="8"
              x2="50"
              y2={deg % 90 === 0 ? '13' : '11'}
              stroke="currentColor"
              strokeWidth={deg % 90 === 0 ? '2' : '1'}
              className="text-ink-mute/50"
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
                y2="14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={colorTheme.accentText}
              />
              <circle
                cx="50"
                cy="14"
                r="3"
                fill="currentColor"
                className={colorTheme.accentText}
              />
            </g>
          )}
        </svg>

        {/* Center Seal Emblem */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {isOfflineOver60s ? (
            <WifiOff className="w-5 h-5 text-ink-mute mb-0.5" />
          ) : isExpired ? (
            <AlertCircle className="w-5 h-5 text-coral-600 mb-0.5" />
          ) : (
            <div className="flex items-center gap-1 mb-0.5">
              <span className={cn('w-2 h-2 rounded-full motion-safe:animate-ping', colorTheme.dotBg)} />
              <ShieldCheck className={cn('w-5 h-5', colorTheme.accentText)} />
            </div>
          )}

          {/* Seconds Display */}
          <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-ink">
            {isOfflineOver60s ? (
              'OFFLINE'
            ) : isExpired ? (
              'EXPIRED'
            ) : (
              `:${String(secondTick).padStart(2, '0')}`
            )}
          </span>

          <span className="text-[0.5625rem] font-mono uppercase tracking-wider text-ink-mute">
            {isLive ? 'SEC TICK' : 'STATIC'}
          </span>
        </div>
      </div>

      {/* Seal Banner / Verification Label */}
      <div className="mt-2 text-center">
        <div
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.625rem] font-mono font-semibold tracking-wider uppercase',
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
