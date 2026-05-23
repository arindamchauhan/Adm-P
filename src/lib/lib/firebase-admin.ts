import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

type ServiceAccountConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function getServiceAccountConfig(): ServiceAccountConfig | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_ADMIN_CREDENTIALS;

  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as Partial<ServiceAccountConfig>;
      if (parsed.projectId && parsed.clientEmail && parsed.privateKey) {
        return {
          projectId: parsed.projectId,
          clientEmail: parsed.clientEmail,
          privateKey: parsed.privateKey.replace(/\\n/g, '\n'),
        };
      }
    } catch {
      // Fall through to individual env var parsing.
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
}

export function hasFirebaseAdminConfig() {
  return Boolean(getServiceAccountConfig());
}

function getAdminApp() {
  const serviceAccount = getServiceAccountConfig();
  if (!serviceAccount) {
    throw new Error('Firebase Admin is not configured');
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
  }

  return getApps()[0];
}

export async function verifyFirebaseIdToken(idToken: string) {
  const auth = getAuth(getAdminApp());
  return auth.verifyIdToken(idToken);
}