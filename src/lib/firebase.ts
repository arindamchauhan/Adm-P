import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
export const isFirebaseOtpEnabled = hasFirebaseConfig && process.env.NEXT_PUBLIC_FIREBASE_OTP_ENABLED === 'true';

const app = hasFirebaseConfig ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

export const auth = app ? getAuth(app) : null;

export function setupRecaptchaVerifier(containerId: string) {
  if (!auth) {
    throw new Error('Firebase is not configured');
  }

  return new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
}

export async function sendOTP(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) {
  if (!auth) {
    throw new Error('Firebase is not configured');
  }

  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

export async function verifyOTP(confirmationResult: any, otp: string) {
  const result = await confirmationResult.confirm(otp);
  return result.user;
}
