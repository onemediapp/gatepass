# Gatepass

**Zero-Wait Detailing Protocol for Doctors & Medical Representatives**

Gatepass transforms pharmaceutical detailing from an unpredictable, waiting-room disruption into a structured, mutual-respect appointment protocol. Built for the clinical practice of **Dr. T. Karthik** at **Remedi Clinic, Kurnool** (Beta launching 30 Oct 2026).

---

## 🎟️ Core Philosophy

- **Zero Wait Protocol**: No more crowding clinic waiting rooms. Medical representatives book allocated, verified time slots.
- **Physical Boarding Pass Aesthetic**: Inspired by high-end boarding passes and clinical stationery (Sora, Plus Jakarta Sans, JetBrains Mono with tactile micro-interactions).
- **Anti-Fraud Live Pass**: Dynamic rotating `LiveSeal`, monotonic client/server synchronized countdown clock, and screen wake lock prevent pass forgery and screenshots.
- **1-Tap Atomic Decisioning**: Race-condition protected Firestore transactions issue sequential human-readable tokens (`RM-XXXX`) while enforcing slot and daily quotas atomically.
- **$0 Free-Tier (Firebase Spark) Operating Model**: 100% serverless, zero Cloud Functions required. All concurrency safeguards operate via atomic Firestore transactions and security rules.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Lucide React, Motion
- **Backend / BaaS**: Firebase Spark Plan (Auth, Firestore, Hosting)
- **Timezone**: Strict `Asia/Kolkata` (IST) calculation engine with `date-fns` & `date-fns-tz`
- **PWA**: `vite-plugin-pwa` with service worker auto-updates, maskable vector icons, and standalone app manifest
- **Testing**: Vitest for slot scheduling engine, race conditions, and Firestore security rules

---

## ⚙️ Environment Variables

Create a `.env` or `.env.local` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=gatepass-kurnool.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gatepass-kurnool
VITE_FIREBASE_STORAGE_BUCKET=gatepass-kurnool.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```

### 4. Run Unit & Concurrency Tests
```bash
npx vitest run
```

### 5. Run Firestore Rules Emulator Test Suite
Ensure Java 11+ is installed, then run:
```bash
npm run test:rules
```

---

## 🔒 Security Architecture

1. **Invite-Only Doctor Registration**:
   - Only Google accounts matching an active document in `invites/{email}` can register as a doctor.
2. **Rep Document Lock**:
   - Reps cannot modify their company name, employee ID, or territory without re-verification.
3. **Appointment Transitions**:
   - Status transitions (`pending` → `approved`, `pending` → `declined`, `approved` → `completed`) are strictly validated against user roles.
4. **Token Collision Defense**:
   - Tokens reside in `tokens/{tokenCode}`. Creating a token uses transactional existence checks preventing duplicate tokens.

---

## 📋 Known Beta Limitations (Spark Plan Design Decisions)

| Feature | Beta Implementation | Rationale & Production Roadmap |
| :--- | :--- | :--- |
| **Ledgers (`slotLedger`, `dayLedger`)** | Writable by doctors via client transactions | On the Spark ($0) plan, Cloud Functions cannot run to update ledgers on behalf of the system. Enforced via Firestore security rules allowing doctor writes. |
| **Visit Outcome Tracking** | `outcome` (`met` / `no_show`) stored on appointment doc | Reps have read access to their appointment docs, so outcomes are readable by reps. In v3, private feedback can move to doctor-only subcollections. |
| **Silent Rep Blocking** | Client-side filtering in doctor requests queue | Blocked reps can submit requests without error (avoiding awkward reception confrontations), but their requests are filtered out from the doctor's queue. |
| **Notifications** | Real-time in-app Firestore snapshot listeners + WhatsApp quick links | Firebase Cloud Messaging (FCM) background push notifications will be integrated in a later phase. |

---

## 📄 License
Apache-2.0
