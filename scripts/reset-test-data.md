# Reset Test Data Guide (Firebase Console)

During beta preparation for Remedi Clinic (Kurnool), all Firestore collections contain obsolete mock/test records (from legacy schema iterations with shifts, mock tokens, and old reception desk records).

Follow these steps in the Firebase Console to reset the database to a clean state for Gatepass v2.

---

## 1. Wipe Obsolete Collections via Firebase Console

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Select your Gatepass Firebase project.
3. In the left navigation sidebar, click **Build** &rarr; **Firestore Database**.
4. In the **Data** tab, view your root collection list.
5. For each of the following collections:
   - Click the three vertical dots (`⋮`) next to the collection name at the top of the collection panel.
   - Click **Delete collection**.
   - Type the collection name in the confirmation modal and click **Delete**.

### Collections to Delete:
- `appointments` (legacy shift-based requests)
- `tokens` (legacy client-generated tokens)
- `reps` (legacy rep profiles)
- `doctors` (legacy doctor profiles containing old shift structures)
- `clinics` (legacy clinic records)
- `doctorClinics`
- `slotLedger` (if present)
- `dayLedger` (if present)
- `notices` (if present)
- `visitHistory` (if present)
- `repRelations` (if present)
- `doctorRepLinks` (if present)
- `contactGrants` (if present)
- `doctorContacts` (if present)
- `doctorSlugs` (if present)
- `users` (deleting users forces clean onboarding through the new Role Chooser)

> **Important**: Do NOT delete the `invites` collection, or ensure you re-create it immediately (see Step 2).

---

## 2. Re-create the `invites` Collection for Beta Doctors

Because doctor sign-up is strictly invite-only during beta:
1. In the Firestore Database **Data** tab, click **Start collection**.
2. Collection ID: `invites`.
3. First Document ID: Enter Dr. Karthik's Google account email address in **all lowercase** (e.g., `karthik@example.com` or your actual clinic Google address).
4. Add fields:
   - `active` (boolean): `true`
   - `name` (string): `Dr. T. Karthik`
5. Click **Save**.

---

## 3. Deploy New Indexes and Security Rules

Run these commands from your local terminal:
```bash
# Deploy both security rules and composite indexes
firebase deploy --only firestore:rules,firestore:indexes
```

Or deploy individually:
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Manual Console Alternative for Indexes:
If you prefer managing indexes in the Console:
1. Go to **Firestore Database** &rarr; **Indexes** tab &rarr; **Composite**.
2. The Firebase CLI command above (`firebase deploy --only firestore:indexes`) uploads the 14 composite indexes defined in `firestore.indexes.json` automatically without needing to type them manually in the UI.
