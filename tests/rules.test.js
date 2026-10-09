import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  initializeTestEnvironment, 
  assertFails, 
  assertSucceeds 
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

let testEnv;

beforeAll(async () => {
  const rules = readFileSync('firestore.rules', 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: 'gatepass-test-project',
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describe('Gatepass Firestore Security Rules (Phase 1.3/1.4)', () => {

  // 1. Anonymous user cannot read anything except clinics, doctorSlugs
  it('1. Anonymous user cannot read anything except clinics and doctorSlugs', async () => {
    // Seed clinic and doctorSlug
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'clinics', 'c1'), { clinicName: 'Remedi Clinic' });
      await setDoc(doc(db, 'doctorSlugs', 'dr-karthik'), { uid: 'doc1', slug: 'dr-karthik' });
      await setDoc(doc(db, 'users', 'u1'), { name: 'User 1', role: ['rep'] });
      await setDoc(doc(db, 'appointments', 'a1'), { repId: 'r1', doctorId: 'd1', status: 'pending' });
    });

    const unauthed = testEnv.unauthenticatedContext();
    const db = unauthed.firestore();

    // Clinics and doctorSlugs allow public read
    await assertSucceeds(getDoc(doc(db, 'clinics', 'c1')));
    await assertSucceeds(getDoc(doc(db, 'doctorSlugs', 'dr-karthik')));

    // Users and appointments must NOT allow unauthenticated read
    await assertFails(getDoc(doc(db, 'users', 'u1')));
    await assertFails(getDoc(doc(db, 'appointments', 'a1')));
  });

  // 2. A rep cannot read another rep's reps/{id}
  it('2. A rep cannot read another rep reps/{id}', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'rep1'), { role: ['rep'] });
      await setDoc(doc(db, 'reps', 'rep1'), { uid: 'rep1', companyName: 'Pharma 1' });
      await setDoc(doc(db, 'users', 'rep2'), { role: ['rep'] });
      await setDoc(doc(db, 'reps', 'rep2'), { uid: 'rep2', companyName: 'Pharma 2' });
    });

    const rep1Ctx = testEnv.authenticatedContext('rep1', { email: 'rep1@test.com' });
    const db = rep1Ctx.firestore();

    // Can read own rep profile
    await assertSucceeds(getDoc(doc(db, 'reps', 'rep1')));

    // Cannot read other rep profile
    await assertFails(getDoc(doc(db, 'reps', 'rep2')));
  });

  // 3. A doctor cannot read a rep who never contacted them; can after doctorRepLinks exists
  it('3. A doctor cannot read a rep who never contacted them; can after doctorRepLinks exists', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'doc1'), { role: ['doctor'] });
      await setDoc(doc(db, 'doctors', 'doc1'), { uid: 'doc1', name: 'Dr. Karthik' });
      await setDoc(doc(db, 'users', 'rep1'), { role: ['rep'] });
      await setDoc(doc(db, 'reps', 'rep1'), { uid: 'rep1', companyName: 'Sun Pharma' });
    });

    const doc1Ctx = testEnv.authenticatedContext('doc1', { email: 'drkarthik@test.com' });
    const db = doc1Ctx.firestore();

    // Doctor cannot read rep1 without link
    await assertFails(getDoc(doc(db, 'reps', 'rep1')));

    // Create the doctorRepLink
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'doctorRepLinks', 'doc1_rep1'), {
        doctorId: 'doc1',
        repId: 'rep1',
      });
    });

    // Now doctor can read rep1
    await assertSucceeds(getDoc(doc(db, 'reps', 'rep1')));
  });

  // 4. A rep cannot create a user doc with role doctor without an invite; can with one
  it('4. A user cannot create a user doc with role doctor without an invite; can with one', async () => {
    const candidateCtx = testEnv.authenticatedContext('cand1', { email: 'doc.candidate@test.com' });
    const db = candidateCtx.firestore();

    // Attempting to create user with role doctor without an invite
    await assertFails(
      setDoc(doc(db, 'users', 'cand1'), {
        role: ['doctor'],
        name: 'Doctor Candidate',
      })
    );

    // Seed the invite doc (emailKey is lowercased)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'invites', 'doc.candidate@test.com'), {
        invitedAt: new Date(),
      });
    });

    // With invite present, creating doctor user doc succeeds
    await assertSucceeds(
      setDoc(doc(db, 'users', 'cand1'), {
        role: ['doctor'],
        name: 'Doctor Candidate',
      })
    );
  });

  // 5. A user cannot change their own role
  it('5. A user cannot change their own role', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'rep1'), {
        role: ['rep'],
        name: 'Rep One',
      });
    });

    const rep1Ctx = testEnv.authenticatedContext('rep1', { email: 'rep1@test.com' });
    const db = rep1Ctx.firestore();

    // Updating profile without changing role succeeds
    await assertSucceeds(
      updateDoc(doc(db, 'users', 'rep1'), {
        name: 'Rep One Updated',
      })
    );

    // Attempting to change role from ['rep'] to ['doctor'] fails
    await assertFails(
      updateDoc(doc(db, 'users', 'rep1'), {
        role: ['doctor'],
      })
    );
  });

  // 6. A rep cannot read someone else's appointment or token
  it('6. A rep cannot read someone else appointment or token', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'rep1'), { role: ['rep'] });
      await setDoc(doc(db, 'users', 'rep2'), { role: ['rep'] });
      await setDoc(doc(db, 'appointments', 'appt_rep2'), {
        repId: 'rep2',
        doctorId: 'doc1',
        status: 'pending',
      });
      await setDoc(doc(db, 'tokens', 'RM4000'), {
        tokenCode: 'RM4000',
        repId: 'rep2',
        doctorId: 'doc1',
      });
    });

    const rep1Ctx = testEnv.authenticatedContext('rep1', { email: 'rep1@test.com' });
    const db = rep1Ctx.firestore();

    // Rep1 cannot read Rep2's appointment or token
    await assertFails(getDoc(doc(db, 'appointments', 'appt_rep2')));
    await assertFails(getDoc(doc(db, 'tokens', 'RM4000')));

    // Rep2 can read their own appointment and token
    const rep2Ctx = testEnv.authenticatedContext('rep2', { email: 'rep2@test.com' });
    const rep2Db = rep2Ctx.firestore();
    await assertSucceeds(getDoc(doc(rep2Db, 'appointments', 'appt_rep2')));
    await assertSucceeds(getDoc(doc(rep2Db, 'tokens', 'RM4000')));
  });

  // 7. A doctor cannot read doctorContacts of another doctor; a rep can only after contactGrants
  it('7. A doctor cannot read doctorContacts of another doctor; a rep can only after contactGrants', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'doc1'), { role: ['doctor'] });
      await setDoc(doc(db, 'users', 'doc2'), { role: ['doctor'] });
      await setDoc(doc(db, 'doctorContacts', 'doc2'), {
        whatsappNumber: '+919876543210',
        phone: '+919876543210',
      });
      await setDoc(doc(db, 'users', 'rep1'), { role: ['rep'] });
    });

    const doc1Ctx = testEnv.authenticatedContext('doc1', { email: 'doc1@test.com' });
    const doc1Db = doc1Ctx.firestore();

    // Doctor 1 cannot read Doctor 2's private contacts
    await assertFails(getDoc(doc(doc1Db, 'doctorContacts', 'doc2')));

    // Doctor 2 can read their own contacts
    const doc2Ctx = testEnv.authenticatedContext('doc2', { email: 'doc2@test.com' });
    const doc2Db = doc2Ctx.firestore();
    await assertSucceeds(getDoc(doc(doc2Db, 'doctorContacts', 'doc2')));

    // Rep 1 cannot read Doctor 2's contacts without grant
    const rep1Ctx = testEnv.authenticatedContext('rep1', { email: 'rep1@test.com' });
    const rep1Db = rep1Ctx.firestore();
    await assertFails(getDoc(doc(rep1Db, 'doctorContacts', 'doc2')));

    // Seed contact grant for rep1
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await setDoc(doc(adminDb, 'contactGrants', 'doc2_rep1'), {
        doctorId: 'doc2',
        repId: 'rep1',
      });
    });

    // Now Rep 1 can read Doctor 2's contacts
    await assertSucceeds(getDoc(doc(rep1Db, 'doctorContacts', 'doc2')));
  });

  // 8. A rep cannot write slotLedger upward; can decrement by exactly 1
  it('8. A rep cannot write slotLedger upward; can decrement by exactly 1', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'rep1'), { role: ['rep'] });
      await setDoc(doc(db, 'slotLedger', 'doc1_slot1'), {
        doctorId: 'doc1',
        slotKey: 'slot1',
        approvedCount: 2,
      });
    });

    const rep1Ctx = testEnv.authenticatedContext('rep1', { email: 'rep1@test.com' });
    const db = rep1Ctx.firestore();

    // Attempting to increment ledger upwards fails
    await assertFails(
      updateDoc(doc(db, 'slotLedger', 'doc1_slot1'), {
        approvedCount: 3,
      })
    );

    // Attempting to decrement by 2 fails
    await assertFails(
      updateDoc(doc(db, 'slotLedger', 'doc1_slot1'), {
        approvedCount: 0,
      })
    );

    // Decrementing by exactly 1 succeeds
    await assertSucceeds(
      updateDoc(doc(db, 'slotLedger', 'doc1_slot1'), {
        approvedCount: 1,
      })
    );
  });

  // 9. A doctor cannot write a ledger whose id starts with another doctor's uid
  it('9. A doctor cannot write a ledger whose id starts with another doctor uid', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', 'doc1'), { role: ['doctor'] });
      await setDoc(doc(db, 'users', 'doc2'), { role: ['doctor'] });
    });

    const doc1Ctx = testEnv.authenticatedContext('doc1', { email: 'doc1@test.com' });
    const db = doc1Ctx.firestore();

    // Doctor 1 writing their own ledger succeeds
    await assertSucceeds(
      setDoc(doc(db, 'slotLedger', 'doc1_2026-10-30_14:00'), {
        doctorId: 'doc1',
        approvedCount: 1,
      })
    );
    await assertSucceeds(
      setDoc(doc(db, 'dayLedger', 'doc1_2026-10-30'), {
        doctorId: 'doc1',
        approvedCount: 1,
      })
    );

    // Doctor 1 attempting to write Doctor 2's ledger fails
    await assertFails(
      setDoc(doc(db, 'slotLedger', 'doc2_2026-10-30_14:00'), {
        doctorId: 'doc2',
        approvedCount: 1,
      })
    );
    await assertFails(
      setDoc(doc(db, 'dayLedger', 'doc2_2026-10-30'), {
        doctorId: 'doc2',
        approvedCount: 1,
      })
    );
  });

});
