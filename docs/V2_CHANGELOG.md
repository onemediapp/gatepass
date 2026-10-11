# Gatepass v2 Architecture & Implementation Changelog

**Release Version**: 2.0.0-beta  
**Date**: October 2026  
**Target Pilot**: Dr. T. Karthik · Remedi Clinic, Kurnool, Andhra Pradesh  
**Branch**: `v2-refactor`  

---

## 🏗️ Architectural Overview & Strategic Shift

Gatepass v2 is a ground-up refactoring of the medical representative appointment platform, built strictly within the bounds of the **Firebase Spark Tier ($0 / month budget)** while delivering enterprise-grade anti-fraud protection and concurrency guarantees.

### Key Architectural Shifts:
1. **Zero Cloud Functions Requirement**:
   - Concurrency, quota enforcement, and token issuance were migrated from hypothetical Cloud Functions into hardened **client-side Firestore transactions** with strict security rules validation.
2. **Dedicated Data Access Layer (`src/lib/db/*`)**:
   - Eliminated ad-hoc inline Firestore queries across UI components.
   - Introduced dedicated modules: `doctors.js`, `clinics.js`, `reps.js`, `users.js`, `appointments.js`, `transactions.js`, `notices.js`, `slotLedger.js`, `dayLedger.js`, `doctorContacts.js`, `doctorRepLinks.js`, and `contactGrants.js`.
3. **Strict Indian Standard Time (`Asia/Kolkata`) Synchronization**:
   - All appointment dates are standardized to `yyyy-MM-dd` date strings.
   - Slot calculations use `date-fns-tz` to eliminate client device timezone skew and daylight savings drift.
   - Dynamic pass expiration uses a monotonic clock (`serverNow()`) anchored to Firestore server timestamp offsets.
4. **Physical Boarding Pass Aesthetic (A5 Clinical Token System)**:
   - Replaced generic SaaS design with an A5 physical boarding pass aesthetic using Tailwind CSS v4 custom theme tokens (`navy`, `cream`, `teal`, `coral`, `sand`, `amber`, `ink`, `line`).
   - 100% rem units, zero raw hex codes, and zero pixel font sizes across all JSX templates.

---

## 📜 Detailed Phase Breakdown

### Phase 0: Repository Reconnaissance & Audit
- Scanned entire repository, mapped all routes, dependencies, and Firestore collections.
- Cataloged legacy components (`DoctorAnalytics.jsx`, `DoctorApprovedRequests.jsx`, `DoctorRejectedRequests.jsx`, `DoctorHome.jsx`) scheduled for retirement.
- Created `docs/MIGRATION_MAP.md`.

### Phase 1: Security Rules Hardening & Decoupled DB Layer
- Completely rewrote `firestore.rules`:
  - Enforced invite-only doctor creation via `invites/{email}` collection.
  - Restricted rep profile modifications (preventing reps from altering company or employee ID without re-verification).
  - Enforced atomic transaction constraints on `slotLedger` and `dayLedger`.
  - Added read-after-approval privacy rules for `doctorContacts` via `contactGrants`.
- Built comprehensive rules emulator test suite (`tests/rules.test.js`).
- Structured `src/lib/db/` data layer with normalized types and schema defaults.

### Phase 2: Firebase Project Hardening
- Replaced hardcoded sample credentials with environment-driven configuration in `src/lib/firebase.js`.
- Configured project `gatepass-kurnool` with production-grade rules and indexes.

### Phase 3: A5 Boarding Pass Visual Tokens & Signature Components
- Installed Tailwind CSS v4 `@theme` with Sora, Plus Jakarta Sans, and JetBrains Mono.
- Created signature micro-components:
  - `EdgeCard.jsx`: Color-coded left-accent card with boarding pass borders.
  - `LiveDot.jsx`: Pulsating status beacon for live appointments.
  - `MonoTag.jsx`: Boarding pass monospace badge.
  - `Perforation.jsx`: Tear-strip perforated cut-out divider.
  - `StatusChip.jsx`: Standardized status indicator.
  - `Skeleton.jsx`: Responsive skeleton placeholders.

### Phase 4: Doctor Onboarding, Multi-Clinic Tenancy & Posters
- Built `/doctor/register` wizard enforcing invite verification, medical credentials, and clinic location creation.
- Implemented `RepScheduleEditor.jsx` for weekly visiting hours, slot duration, quotas, and holiday blocking.
- Implemented `/print/clinic/:clinicId` generating print-optimized reception posters with dynamic QR codes.

### Phase 5: Rep Discovery, Doctor Profiles & Rep Home Dashboard
- Built `/rep/search` with instant doctor name, specialty, and city filtering.
- Implemented `/dr/:slug` public doctor profile rendering clinic addresses, visiting hours, and active notices.
- Built `/rep/home` dashboard featuring today's active gatepass, recent requests, doctor notices feed, and 1-tap WhatsApp Daily Call Report (DCR) generator.

### Phase 6: Slot Generation Engine & Booking Workflow
- Created `src/lib/slots.js`:
  - 14-day booking window calculation in IST.
  - Breakup of daily visiting hours into 15/20/30-minute intervals.
  - Dynamic slot states (`available`, `selected`, `full`, `past`).
- Built `/dr/:slug/slots` cinema-style slot picker with horizontal date strip.
- Built `/dr/:slug/request` capturing product focus, therapeutic categories, and sample flags.
- Developed `src/lib/serverClock.js` for monotonic clock synchronization.

### Phase 7: Anti-Fraud Live Pass & Rotating LiveSeal
- Built `/status/:appointmentId` anti-fraud live gatepass screen:
  - Continuous rotating animated SVG `LiveSeal.jsx`.
  - Monotonic countdown timer resistant to local system clock manipulation.
  - Screen Wake Lock integration (`useWakeLock.js`) ensuring screen stays awake at reception.
  - Dynamic QR verification linking directly to pass state.
- Implemented read-before-write transactional cancellation restoring ledger quotas.

### Phase 8: Doctor Dashboard & 1-Tap Atomic Decisioning
- Implemented `/admin/*` unified doctor dashboard:
  - `/admin/today`: Daily visitor roster with "Met" and "No-show" visit logging.
  - `/admin/pending`: Real-time request queue with preferred rep highlighting and batch approval.
  - `/admin/upcoming`: Chronological past and upcoming visit history.
  - `/admin/reps`: Private CRM directory with search, category filtering, private doctor notes, and CSV export.
  - `/admin/notices`: Clinic notice publisher with max-1-pinned enforcement.
- Created `approveAppointmentTransaction` in `src/lib/db/transactions.js`:
  - Atomic validation of slot ledger and day ledger.
  - Generation of sequential human-readable tokens (`RM-0482`).
  - Allocation of `tokens/{tokenCode}` preventing token collisions.
  - Automatic `contactGrants` issuance for private WhatsApp communication.
- Verified transaction race conditions via Vitest (`tests/approval.test.js`).
- Deleted retired legacy components.

### Phase 9: Notices Feed, Settings, Route Splitting & PWA
- Added `"I can help with this"` CTA buttons linking `looking_for` notices directly to slot booking.
- Upgraded `DoctorSettings.jsx` with quick navigation to schedule, clinics, edit-profile, and private WhatsApp number management.
- Upgraded empty states across all screens with illustrations and action triggers.
- Configured PWA manifest with vector maskable icons in `public/`.
- Built `usePWA.js` and `PWAUpdateToast.jsx` for update notifications and install prompts.
- Code-split all route pages in `App.jsx` using `React.lazy()` and `<Suspense>`.
- Authored comprehensive `README.md`.

### Phase 10: QA Pass & Final Verification
- Produced `docs/QA_CHECKLIST.md` with complete step-by-step verification protocols.
- Authored `docs/V2_CHANGELOG.md`.
- Completed test and build audits: 30/30 Vitest tests passing, 0 raw hex colors, 0 px font sizes in JSX components.

---

## 📊 Summary of Modified and Removed Files

### Core Removed Legacy Files:
- `src/pages/doctor/DoctorHome.jsx`
- `src/pages/doctor/DoctorAnalytics.jsx`
- `src/pages/doctor/DoctorApprovedRequests.jsx`
- `src/pages/doctor/DoctorRejectedRequests.jsx`
- `src/App.css`

### New / Refactored Core Architecture:
- `src/lib/db/*` (12 modules)
- `src/lib/slots.js`, `src/lib/serverClock.js`, `src/lib/time.js`, `src/lib/schedule.js`
- `src/components/ui/*` (12 tokens & components)
- `src/hooks/useWakeLock.js`, `src/hooks/usePWA.js`
- `tests/approval.test.js`, `tests/slots.test.js`, `tests/gatepass.test.js`, `tests/rules.test.js`
- `docs/MIGRATION_MAP.md`, `docs/QA_CHECKLIST.md`, `docs/V2_CHANGELOG.md`, `README.md`
