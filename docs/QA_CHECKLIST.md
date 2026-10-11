# Gatepass v2 QA Verification Checklist

**Pilot Deployment**: Dr. T. Karthik · Remedi Clinic, Kurnool  
**Target Beta Launch**: 30 October 2026  
**Architecture**: Firebase Spark Tier (Free Plan), React 19, Tailwind CSS v4, PWA  
**Timezone**: `Asia/Kolkata` (IST)  

---

## 🎯 Test Personas & Environment Setup

| Persona | Role | Identifiers / Test Accounts |
| :--- | :--- | :--- |
| **Doctor** | Primary Clinician | `dr.karthik@remedikurnool.com` (Requires doc in `invites/dr.karthik@remedikurnool.com`) |
| **Medical Rep A** | Cardiovascular Specialist | `rep.sunil@cipla.com` (Cipla, Cardiology) |
| **Medical Rep B** | Endocrinology Specialist | `rep.priya@sunpharma.com` (Sun Pharma, Diabetology) |
| **Receptionist** | Front Desk Staff | Verifies physical poster QR & live phone screen tokens |

---

## 1. Authentication & Role Enforcement

- [ ] **1.1 Rep Google Sign-In & Onboarding**
  - Sign in with a new Google Account.
  - User is immediately routed to `/rep/register`.
  - Fill Name, Mobile, Company, Designation, Employee ID, Primary Therapeutic Category, Territory/HQ.
  - Submitting saves `users/{uid}` and `reps/{uid}`.
  - Verified: Core credentials (Company, Emp ID) are locked against casual tampering.
- [ ] **1.2 Doctor Invite Gatekeeper**
  - Attempt doctor registration at `/doctor/register` with uninvited email.
  - System blocks registration with *"Email not found in authorized doctor invitation list"*.
  - Add doc to `invites/{email}` with `{ active: true, name: "Dr. T. Karthik" }`.
  - Re-attempt registration: Successfully loads doctor setup wizard.
- [ ] **1.3 Doctor Registration & Clinic Setup**
  - Fill qualifications, specialty, registration number, years of experience, city (Kurnool), state (Andhra Pradesh).
  - Create initial clinic (Remedi Clinic, Near Gayatri College, Kurnool).
  - Generates custom URL slug `dr-karthik`.
  - Doctor is routed to `/admin/today`.

---

## 2. Schedule Configuration & Clinic Posters

- [ ] **2.1 Weekly Visiting Rules Editor (`/admin/schedule`)**
  - Set slot duration (e.g. 20 minutes).
  - Set daily maximum reps (e.g. 3 reps/day).
  - Set per-slot limit (e.g. 1 rep/slot).
  - Set advance booking window (e.g. 14 days).
  - Configure Mon / Wed / Fri: `14:00 – 16:00`.
  - Add Blocked Date: e.g. `2026-10-31` (Deepavali holiday).
  - Save changes: Firestore document `doctors/{uid}.repSchedule` updates immediately.
- [ ] **2.2 Clinic Print Poster (`/print/clinic/:clinicId`)**
  - Open print poster page.
  - Check clean high-contrast A4/A5 layout: clinic name, Dr. Karthik's name, QR code linking to `/clinic/remedi-kurnool`.
  - Click "Print Poster": triggers browser print dialog with print-optimized CSS (no headers/footers, crisp QR vector).

---

## 3. Rep Discovery & Slot Booking Flow

- [ ] **3.1 Doctor Directory Search (`/rep/search`)**
  - Search by doctor name ("Karthik"), specialty ("Cardiology"), or city ("Kurnool").
  - Cards show response time badge, clinic affiliation, and "Open Today" indicator.
  - Tap card: navigates to `/dr/dr-karthik`.
- [ ] **3.2 Doctor Public Profile (`/dr/:slug`)**
  - Profile renders qualifications, clinic address, visiting hours table.
  - Notices section shows active announcements (e.g. "Looking for Heart Failure formulations").
  - Notice cards show `"I can help with this"` CTA.
  - Tapping CTA navigates to `/dr/dr-karthik/slots?notice=<noticeId>`.
- [ ] **3.3 Slot Picker Cinema Grid (`/dr/:slug/slots`)**
  - Date strip shows next 14 days in IST.
  - Blocked date (`2026-10-31`) shows "Closed" badge and disabled state.
  - Days with no visiting hours show "No Hours".
  - Select active day (e.g. upcoming Monday): displays slots in 20m increments (`14:00 - 14:20`, `14:20 - 14:40`, etc.).
  - Select a slot: persists selected date and slot range.
  - Click "Continue to Request Details".
- [ ] **3.4 Request Details Submission (`/dr/:slug/request`)**
  - Enter Product Focus (e.g. "Cardivas 3.125mg"), Therapeutic Category, Samples Flag, and Notes.
  - If navigated from notice: Notice banner displays with linked notice details.
  - Tap "Confirm & Request Pass".
  - Creates appointment in `appointments/{id}` with status `pending`.

---

## 4. Doctor Review & 1-Tap Atomic Decisioning

- [ ] **4.1 Pending Requests Queue (`/admin/pending`)**
  - Doctor sees incoming request from Rep with company badge, focus drug, and requested slot.
  - Preferred reps highlighted with gold star badge.
  - Tap "Approve Pass":
    - Executes atomic Firestore transaction `approveAppointmentTransaction`.
    - Decrements `slotLedger` and `dayLedger`.
    - Allocates human-readable token (e.g. `RM-0482`).
    - Creates `tokens/{tokenCode}` doc.
    - Creates `contactGrants` for WhatsApp access.
    - Updates appointment status to `approved`.
- [ ] **4.2 Slot Capacity & Concurrency Safeguard**
  - Attempt to approve two requests for the same slot when `maxRepsPerSlot = 1`.
  - First approval succeeds.
  - Second approval receives transaction rollback error: `SLOT_FULL`.
  - The UI updates status to "Slot Full" without corrupting ledger counts.
- [ ] **4.3 Decline Request with Feedback**
  - Click "Decline" on a request.
  - Modal provides quick constructive reasons: *"Schedule Full"*, *"Focus Not Relevant"*, *"Doctor Out of Station"*, or custom message.
  - Declines appointment and records reason for rep visibility.
- [ ] **4.4 Silent Rep Blocking**
  - From pending or reps view, click "Block Representative".
  - Updates `doctorRepRelations/{docId}` with `{ blocked: true }`.
  - Rep's future requests are silently accepted on their screen (avoiding waiting-room friction) but automatically filtered from doctor queue.

---

## 5. Anti-Fraud Live Gatepass Screen (`/status/:appointmentId`)

- [ ] **5.1 Rotating LiveSeal Inspection**
  - Approved pass displays emerald/teal ticket with perforated ticket edges.
  - Rotating animated `LiveSeal` SVG orbits continuously around verification shield.
  - Shimmer wave passes diagonally across pass every 3.5 seconds.
  - Screen wake lock requested via `navigator.wakeLock` (screen does not turn off while viewing).
- [ ] **5.2 Server-Synchronized Countdown Timer**
  - Pass displays real-time countdown to appointment start time.
  - Clock references `serverNow()` (monotonic client clock anchored to Firestore server timestamp offset).
  - Tampering with local device system clock does not distort pass validity or timer countdown.
- [ ] **5.3 Reception Token Display**
  - Token is prominently displayed in JetBrains Mono (e.g. `RM-0482`).
  - QR Code embeds direct verification URL.
  - Receptionist scanning QR on standard phone camera opens instant validation confirmation.
- [ ] **5.4 Read-Before-Write Transactional Cancellation**
  - Rep taps "Cancel Appointment".
  - Transaction reads appointment, restores `slotLedger` and `dayLedger` counts, and deletes `tokens/{tokenCode}` doc.
  - Pass transitions to "Cancelled" state.

---

## 6. Doctor Today View & Visit Outcomes (`/admin/today`)

- [ ] **6.1 Daily Roster**
  - Displays chronological list of approved reps scheduled for today.
  - Highlights ongoing slot with pulsating indicator.
- [ ] **6.2 Recording Outcomes**
  - Tap "Met" (Visit completed):
    - Sets appointment status to `completed` and `outcome: "met"`.
    - Increments rep's reliability score and doctor's visit log.
  - Tap "No-Show":
    - Sets `outcome: "no_show"`.
    - Increments rep's no-show penalty count in `doctorRepRelations`.

---

## 7. Representative History & Daily Call Report (DCR)

- [ ] **7.1 Rep History View (`/rep/history`)**
  - Shows chronologically segmented passes: Active, Upcoming, Completed, Declined.
  - Empty state includes "Find Doctors" shortcut button.
- [ ] **7.2 1-Tap Pharma DCR Generator (`/rep/home`)**
  - Tap "Generate DCR".
  - Formats today's visits in standard pharma field format:
    ```
    📋 PHARMA DAILY CALL REPORT (DCR)
    👤 Rep: Sunil Sharma | Cipla Ltd
    📅 Date: 30 Oct 2026
    📍 HQ: Kurnool
    1. Dr. T. Karthik - Remedi Clinic | ✅ Met (Token: RM-0482) [Focus: Cardivas]
    ```
  - Tap "Share WhatsApp": opens WhatsApp with pre-filled text ready for territory manager.

---

## 8. Doctor Rep Directory & CRM (`/admin/reps`)

- [ ] **8.1 Rep Directory & Search**
  - Search by representative name or company.
  - Filter by therapeutic category (e.g. Cardiology, Diabetology).
  - Sort by "Most Reliable" or "Most Recent".
- [ ] **8.2 Private CRM Notes**
  - Add private doctor-only note on rep card (e.g. *"Discuss new guidelines in November"*).
  - Saves in `doctorRepRelations/{doctorId}_{repId}.privateNotes`.
  - Rep cannot see or query these private notes.
- [ ] **8.3 CSV Export**
  - Click "Export CSV".
  - Downloads `gatepass-reps-<id>.csv` containing rep roster, met counts, no-show rates, and private notes.

---

## 9. PWA, Offline & Mobile Experience

- [ ] **9.1 Service Worker Registration & Caching**
  - Load app in browser: PWA service worker installs and precaches static shell assets.
  - Disconnect internet: app loads cached UI shell without broken white screen.
- [ ] **9.2 PWA Install Prompt**
  - Floating install banner appears on eligible mobile browsers.
  - Tap "Install": adds Gatepass to device home screen with vector brand icon.
- [ ] **9.3 Update Available Banner**
  - When new build is deployed, `PWAUpdateToast` detects waiting worker and shows "Update Ready · Reload".
  - Tap "Reload": invokes `window.location.reload()` to mount new service worker instantly.
- [ ] **9.4 Accessibility & Touch Targets**
  - Every interactive button, slot chip, tab, and toggle has minimum height/width of 44px (`min-h-[2.75rem]`).
  - Keyboard navigation (Tab / Shift+Tab) highlights interactive elements with visible focus rings (`focus-visible:ring-2 focus-visible:ring-navy-500`).
  - Zero raw hex colors and zero pixel font sizes in JSX components.

---

## 10. Automated Vitest Test Verification

Run command before any release:
```bash
npm test
```
- [ ] `tests/approval.test.js`: 6/6 tests passing (race condition simulation, ledger quota locks, token generation).
- [ ] `tests/slots.test.js`: 12/12 tests passing (slot generation, IST offsets, blocked dates, booking windows).
- [ ] `tests/gatepass.test.js`: 12/12 tests passing (anti-fraud timing, monotonic server clocks, display tokens).
- [ ] `npm run build`: Production build completes without TypeScript or JSX bundling errors.
