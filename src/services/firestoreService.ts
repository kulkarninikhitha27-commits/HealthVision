import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { createSeedData } from '../data/seedData';
import {
  DoctorConsultation,
  FamilyProfile,
  HealthReminder,
  LabReport,
  PrivacyAuditLog,
} from '../types';

const OFFLINE_CACHE_KEY_PREFIX = 'healthvision_vault_v1_';

export interface VaultSnapshot {
  profiles: FamilyProfile[];
  reports: LabReport[];
  reminders: HealthReminder[];
  consultations: DoctorConsultation[];
  auditLogs: PrivacyAuditLog[];
  lastSyncedAt: string;
}

export function saveOfflineVault(uid: string, snapshot: Omit<VaultSnapshot, 'lastSyncedAt'>) {
  try {
    const payload: VaultSnapshot = {
      ...snapshot,
      lastSyncedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${OFFLINE_CACHE_KEY_PREFIX}${uid}`, JSON.stringify(payload));
    localStorage.setItem('healthvision_last_uid', uid);
  } catch (err) {
    console.warn('Failed to persist offline vault:', err);
  }
}

export function loadOfflineVault(uid?: string): VaultSnapshot | null {
  try {
    const targetUid = uid || localStorage.getItem('healthvision_last_uid');
    if (!targetUid) return null;
    const raw = localStorage.getItem(`${OFFLINE_CACHE_KEY_PREFIX}${targetUid}`);
    if (!raw) return null;
    return JSON.parse(raw) as VaultSnapshot;
  } catch {
    return null;
  }
}

export async function ensureUserAccountAndSeed(
  uid: string,
  displayName: string,
  email: string
): Promise<VaultSnapshot> {
  const userPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/account`;

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid,
        displayName: (displayName || 'HealthVision Member').slice(0, 120),
        preferredLanguage: 'en',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const privateRef = doc(db, 'users', uid, 'private', 'account');
    const privateSnap = await getDoc(privateRef);
    if (!privateSnap.exists()) {
      await setDoc(privateRef, {
        uid,
        email: (email || '').slice(0, 160),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath || privatePath);
  }

  // Check if profiles exist
  const profilesPath = `users/${uid}/profiles`;
  let existingProfiles: FamilyProfile[] = [];
  try {
    const q = query(collection(db, profilesPath), where('ownerId', '==', uid));
    const snap = await getDocs(q);
    existingProfiles = snap.docs.map((d) => d.data() as FamilyProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, profilesPath);
  }

  if (existingProfiles.length === 0) {
    const seeded = createSeedData(uid);
    try {
      const profileBatch = writeBatch(db);
      for (const profile of seeded.profiles) {
        profileBatch.set(doc(db, 'users', uid, 'profiles', profile.id), {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await profileBatch.commit();

      const dependentBatch = writeBatch(db);
      for (const report of seeded.reports) {
        dependentBatch.set(doc(db, 'users', uid, 'reports', report.id), {
          ...report,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const reminder of seeded.reminders) {
        dependentBatch.set(doc(db, 'users', uid, 'reminders', reminder.id), {
          ...reminder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const consult of seeded.consultations) {
        dependentBatch.set(doc(db, 'users', uid, 'consultations', consult.id), {
          ...consult,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const log of seeded.auditLogs) {
        dependentBatch.set(doc(db, 'users', uid, 'auditLogs', log.id), {
          ...log,
          createdAt: serverTimestamp(),
        });
      }
      await dependentBatch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/seed`);
    }

    const snap: VaultSnapshot = {
      ...seeded,
      lastSyncedAt: new Date().toISOString(),
    };
    saveOfflineVault(uid, seeded);
    return snap;
  }

  // Fetch all collections scoped by ownerId
  try {
    const [repSnap, remSnap, conSnap, audSnap] = await Promise.all([
      getDocs(query(collection(db, `users/${uid}/reports`), where('ownerId', '==', uid))),
      getDocs(query(collection(db, `users/${uid}/reminders`), where('ownerId', '==', uid))),
      getDocs(query(collection(db, `users/${uid}/consultations`), where('ownerId', '==', uid))),
      getDocs(query(collection(db, `users/${uid}/auditLogs`), where('ownerId', '==', uid))),
    ]);

    const snapshot: VaultSnapshot = {
      profiles: existingProfiles,
      reports: repSnap.docs
        .map((d) => d.data() as LabReport)
        .sort((a, b) => b.reportDate.localeCompare(a.reportDate)),
      reminders: remSnap.docs.map((d) => d.data() as HealthReminder),
      consultations: conSnap.docs.map((d) => d.data() as DoctorConsultation),
      auditLogs: audSnap.docs.map((d) => d.data() as PrivacyAuditLog),
      lastSyncedAt: new Date().toISOString(),
    };
    saveOfflineVault(uid, snapshot);
    return snapshot;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}`);
  }
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export async function createProfileInDb(uid: string, profile: FamilyProfile) {
  const path = `users/${uid}/profiles/${profile.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'profiles', profile.id), {
      ...omitUndefined(profile as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProfileSectionInDb(
  uid: string,
  profileId: string,
  fields: Partial<FamilyProfile>
) {
  const path = `users/${uid}/profiles/${profileId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'profiles', profileId), {
      ...omitUndefined(fields as unknown as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createReportInDb(uid: string, report: LabReport) {
  const path = `users/${uid}/reports/${report.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'reports', report.id), {
      ...omitUndefined(report as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateReportFollowUpInDb(
  uid: string,
  reportId: string,
  fields: Pick<LabReport, 'followUpQuestions' | 'refinedAdvice' | 'simplifiedTerms'>
) {
  const path = `users/${uid}/reports/${reportId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'reports', reportId), {
      ...omitUndefined(fields as unknown as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createReminderInDb(uid: string, reminder: HealthReminder) {
  const path = `users/${uid}/reminders/${reminder.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'reminders', reminder.id), {
      ...omitUndefined(reminder as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleReminderInDb(uid: string, reminderId: string, completed: boolean) {
  const path = `users/${uid}/reminders/${reminderId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'reminders', reminderId), {
      completed,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReminderInDb(uid: string, reminderId: string) {
  const path = `users/${uid}/reminders/${reminderId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'reminders', reminderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createConsultationInDb(uid: string, consultation: DoctorConsultation) {
  const path = `users/${uid}/consultations/${consultation.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'consultations', consultation.id), {
      ...omitUndefined(consultation as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelConsultationInDb(uid: string, consultationId: string) {
  const path = `users/${uid}/consultations/${consultationId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'consultations', consultationId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function appendAuditLogInDb(uid: string, log: PrivacyAuditLog) {
  const path = `users/${uid}/auditLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'auditLogs', log.id), {
      ...omitUndefined(log as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
