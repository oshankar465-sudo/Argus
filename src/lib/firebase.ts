import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Candidate } from '../types';

interface ExtendedFirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
  firestoreDatabaseId?: string;
}

const config = firebaseConfig as ExtendedFirebaseConfig;

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Connect to specific database if provided in config
export const db: Firestore =
  config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);

export const configInfo = {
  projectId: config.projectId,
  databaseId: config.firestoreDatabaseId || '(default)',
  appId: config.appId,
};

/**
 * Recursively strips undefined values from an object or array so Firestore setDoc does not reject them
 */
export function cleanForFirestore<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
  );
}

/**
 * Validates active connection to Google Cloud Firestore by testing server reachability
 */
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const testRef = doc(db, 'test', 'connection');
    await setDoc(testRef, {
      status: 'healthy',
      lastChecked: new Date().toISOString(),
      databaseId: configInfo.databaseId,
    });
    await getDocFromServer(testRef);
    return {
      success: true,
      message: `Verified live connection & synchronization with Google Cloud Firestore (${configInfo.databaseId})`,
    };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'not-found') {
      return {
        success: true,
        message: `Successfully connected to Google Cloud Firestore (${configInfo.databaseId})`,
      };
    }
    if (err.message && err.message.includes('the client is offline')) {
      return {
        success: false,
        message: 'Client is offline. Please check your network connection.',
      };
    }
    return {
      success: false,
      message: err.message || 'Unable to establish Firestore connection.',
    };
  }
}

/**
 * Real-time subscription to the candidates collection in Firestore
 */
export function subscribeToCandidates(
  onData: (candidates: Candidate[]) => void,
  onError: (error: Error) => void
) {
  const candidatesCollection = collection(db, 'candidates');
  return onSnapshot(
    candidatesCollection,
    (snapshot) => {
      const items: Candidate[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as Candidate;
        items.push({
          ...data,
          id: docSnapshot.id,
        });
      });
      // Sort by creation date descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (err) => {
      onError(err);
    }
  );
}

/**
 * Persists a candidate document into Firestore with recursive data sanitization
 */
export async function saveCandidateToFirestore(candidate: Candidate): Promise<void> {
  const candidateRef = doc(db, 'candidates', candidate.id);
  const sanitized = cleanForFirestore(candidate);
  await setDoc(candidateRef, sanitized, { merge: true });
}

/**
 * Deletes a candidate document from Firestore
 */
export async function deleteCandidateFromFirestore(candidateId: string): Promise<void> {
  const candidateRef = doc(db, 'candidates', candidateId);
  await deleteDoc(candidateRef);
}

/**
 * Batch upload / sync initial local dataset to Firestore
 */
export async function syncInitialDatasetToFirestore(candidates: Candidate[]): Promise<void> {
  for (const candidate of candidates) {
    await saveCandidateToFirestore(candidate);
  }
}
