import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore (default or specified database)
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const db = firestoreDbId === '(default)' ? getFirestore(app) : getFirestore(app, firestoreDbId);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Request Google Drive file scope
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory cache for Google OAuth Access Token
let cachedDriveAccessToken: string | null = null;

export function getCachedDriveAccessToken(): string | null {
  return cachedDriveAccessToken;
}

export function setCachedDriveAccessToken(token: string | null): void {
  cachedDriveAccessToken = token;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on startup
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase status: Cliente offline ou conectando...', error.message);
      return false;
    }
    // Expected if doc does not exist, but connection reached server
    return true;
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedDriveAccessToken = credential.accessToken;
      setCachedDriveAccessToken(credential.accessToken);
    }
    return { user: result.user, accessToken: credential?.accessToken || null, cancelled: false };
  } catch (error: any) {
    // If the user closed the popup or cancelled the Google prompt
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      String(error?.message).includes('popup-closed-by-user')
    ) {
      console.info('Autenticação Google cancelada pelo usuário ou popup fechada.');
      return { user: null, accessToken: null, cancelled: true };
    }

    if (error?.code === 'auth/unauthorized-domain' || String(error?.message).includes('unauthorized-domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'Netlify';
      const customErr: any = new Error(`O domínio '${currentHost}' precisa ser adicionado aos Domínios Autorizados no Firebase Console (Authentication > Configurações > Domínios autorizados).`);
      customErr.code = 'auth/unauthorized-domain';
      customErr.isNetlifyUnauthorized = true;
      throw customErr;
    }

    console.error('Erro ao autenticar com Google:', error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    cachedDriveAccessToken = null;
  } catch (error) {
    console.error('Erro ao sair:', error);
    throw error;
  }
}
