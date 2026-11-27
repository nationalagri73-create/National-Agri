import { initializeApp } from 'firebase/app';
import {
  ConfirmationResult,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  initializeFirestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId,
);
export const auth = getAuth(app);
auth.useDeviceLanguage();

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const BOOTSTRAPPED_ADMIN_EMAILS = [
  'hamzaelhelaly08@gmail.com',
  'national.agri73@gmail.com',
] as const;

export function isBootstrappedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return BOOTSTRAPPED_ADMIN_EMAILS.includes(
    email.toLowerCase() as (typeof BOOTSTRAPPED_ADMIN_EMAILS)[number],
  );
}

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function registerWithEmail(params: {
  email: string;
  password: string;
  displayName: string;
}): Promise<User> {
  const result = await createUserWithEmailAndPassword(
    auth,
    params.email.trim(),
    params.password,
  );
  if (params.displayName.trim()) {
    await updateProfile(result.user, {
      displayName: params.displayName.trim().slice(0, 120),
    });
  }
  await sendEmailVerification(result.user);
  return result.user;
}

export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('NO_ACTIVE_USER');
  }
  await sendEmailVerification(auth.currentUser);
}

export async function reloadAuthUser(): Promise<User | null> {
  if (!auth.currentUser) return null;
  await reload(auth.currentUser);
  return auth.currentUser;
}

export async function resetPasswordByEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function startPhoneSignIn(
  phoneNumber: string,
  recaptchaContainerId: string,
): Promise<ConfirmationResult> {
  const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
    size: 'invisible',
  });
  try {
    return await signInWithPhoneNumber(auth, phoneNumber.trim(), verifier);
  } catch (err) {
    verifier.clear();
    throw err;
  }
}

export async function confirmPhoneCode(
  confirmationResult: ConfirmationResult,
  code: string,
): Promise<User> {
  const result = await confirmationResult.confirm(code.trim());
  return result.user;
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

export function mapFirebaseAuthError(error: unknown, isEn: boolean): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return isEn
        ? 'This sign-in method (Email/Password or Phone) is not enabled in Firebase Console yet. Enable it under Authentication > Sign-in method, or sign in with Google.'
        : 'طريقة الدخول هذه (البريد وكلمة المرور أو رقم الهاتف) غير مفعّلة في لوحة Firebase Console بعد. يرجى تفعيلها من Authentication > Sign-in method، أو استخدام الدخول بحساب Google.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return isEn
        ? 'Incorrect email or password. Check your details or reset your password.'
        : 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد أو استعادة كلمة المرور.';
    case 'auth/invalid-email':
      return isEn
        ? 'Please enter a valid email address.'
        : 'يرجى إدخال عنوان بريد إلكتروني صحيح.';
    case 'auth/email-already-in-use':
      return isEn
        ? 'This email is already registered. Please sign in instead.'
        : 'هذا البريد الإلكتروني مسجّل بالفعل. يمكنك تسجيل الدخول مباشرة.';
    case 'auth/weak-password':
      return isEn
        ? 'Password is too weak. Use at least 6 characters.'
        : 'كلمة المرور ضعيفة. يرجى استخدام 6 أحرف على الأقل.';
    case 'auth/too-many-requests':
      return isEn
        ? 'Too many attempts. Please wait a moment and try again.'
        : 'تم تجاوز عدد المحاولات المسموح به مؤقتاً. يرجى الانتظار والمحاولة لاحقاً.';
    case 'auth/popup-closed-by-user':
      return isEn
        ? 'Google sign-in popup was closed before completing login.'
        : 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.';
    case 'auth/unauthorized-domain':
      return isEn
        ? 'This preview domain is not yet authorized in Firebase Auth settings.'
        : 'نطاق التشغيل الحالي غير مضاف بعد ضمن النطاقات المصرح بها في Firebase Authentication.';
    case 'auth/invalid-phone-number':
      return isEn
        ? 'Invalid phone number. Include country code, e.g. +2010xxxxxxxx.'
        : 'رقم الهاتف غير صالح. يرجى كتابته بالصيغة الدولية مثل +2010xxxxxxxx.';
    case 'auth/invalid-verification-code':
      return isEn
        ? 'Invalid SMS verification code. Please check and retry.'
        : 'رمز التحقق غير صحيح. يرجى مراجعة الرسالة وإعادة المحاولة.';
    case 'auth/network-request-failed':
      return isEn
        ? 'Network connection issue while contacting Firebase Auth.'
        : 'تعذر الاتصال بخدمة التحقق بسبب الشبكة. تحقق من الإنترنت وحاول مجدداً.';
    default:
      return error instanceof Error && error.message
        ? error.message
        : isEn
          ? 'Authentication failed. Please try again.'
          : 'تعذر إتمام تسجيل الدخول. يرجى المحاولة مرة أخرى.';
  }
}

export { firebaseConfig };
