import React, { useState } from 'react';
import { ConfirmationResult, User } from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { BASIT_LOGO_URL } from '../../data/phase1Data';
import { useI18n } from '../../i18n/translations';
import {
  confirmPhoneCode,
  mapFirebaseAuthError,
  registerWithEmail,
  reloadAuthUser,
  resendVerificationEmail,
  resetPasswordByEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutAccount,
  startPhoneSignIn,
} from '../../lib/firebase';

type AuthMode = 'login' | 'register' | 'reset';

function looksLikePhone(input: string): boolean {
  const cleaned = input.trim().replace(/[\s\-()]/g, '');
  return /^\+?\d{8,15}$/.test(cleaned);
}

function normalizePhoneForFirebase(input: string): string {
  const cleaned = input.trim().replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return `+20${cleaned.slice(1)}`;
  }
  return `+${cleaned}`;
}

export const LoginScreen: React.FC<{
  pendingVerificationUser: User | null;
  authBootError?: string | null;
  onVerificationRefreshed: (user: User) => void;
}> = ({ pendingVerificationUser, authBootError, onVerificationRefreshed }) => {
  const { isEn, toggleLang, t } = useI18n();
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [phoneConfirmation, setPhoneConfirmation] =
    useState<ConfirmationResult | null>(null);
  const [smsCode, setSmsCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const trimmed = identifier.trim();
    if (!trimmed) {
      setErrorMsg(
        t(
          'يرجى إدخال البريد الإلكتروني أو رقم الهاتف.',
          'Please enter your email address or phone number.',
        ),
      );
      return;
    }

    if (looksLikePhone(trimmed)) {
      setLoading(true);
      try {
        const formattedPhone = normalizePhoneForFirebase(trimmed);
        const result = await startPhoneSignIn(formattedPhone, 'basit-recaptcha-container');
        setPhoneConfirmation(result);
        setSuccessMsg(
          t(
            `تم إرسال رمز التحقق إلى ${formattedPhone}.`,
            `Verification code sent to ${formattedPhone}.`,
          ),
        );
      } catch (err) {
        setErrorMsg(mapFirebaseAuthError(err, isEn));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg(t('يرجى إدخال كلمة المرور.', 'Please enter your password.'));
      return;
    }

    setLoading(true);
    try {
      const user = await signInWithEmail(trimmed, password);
      if (!user.emailVerified) {
        setSuccessMsg(
          t(
            'تم تسجيل الدخول، يرجى تفعيل بريدك الإلكتروني عبر الرابط المرسل للمتابعة.',
            'Signed in. Please verify your email link to continue.',
          ),
        );
      }
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, isEn));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneConfirmation || !smsCode.trim()) return;
    clearFeedback();
    setLoading(true);
    try {
      await confirmPhoneCode(phoneConfirmation, smsCode);
      setPhoneConfirmation(null);
      setSmsCode('');
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, isEn));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const cleanName = displayName.trim();
    const cleanEmail = identifier.trim();

    if (cleanName.length < 2) {
      setErrorMsg(
        t('يرجى إدخال الاسم الكامل (حرفان على الأقل).', 'Please enter your full name.'),
      );
      return;
    }
    if (!cleanEmail || looksLikePhone(cleanEmail) || !cleanEmail.includes('@')) {
      setErrorMsg(
        t(
          'لإنشاء حساب جديد يرجى إدخال بريد إلكتروني صحيح.',
          'Please enter a valid email address to register.',
        ),
      );
      return;
    }
    if (password.length < 6) {
      setErrorMsg(
        t(
          'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
          'Password must be at least 6 characters.',
        ),
      );
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail({
        email: cleanEmail,
        password,
        displayName: cleanName,
      });
      setSuccessMsg(
        t(
          'تم إنشاء الحساب وإرسال رابط التفعيل إلى بريدك الإلكتروني.',
          'Account created. A verification link has been sent to your email.',
        ),
      );
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, isEn));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    const cleanEmail = identifier.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg(
        t(
          'يرجى إدخال البريد الإلكتروني المسجّل لاستعادة كلمة المرور.',
          'Please enter your registered email address.',
        ),
      );
      return;
    }

    setLoading(true);
    try {
      await resetPasswordByEmail(cleanEmail);
      setSuccessMsg(
        t(
          'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.',
          'Password reset link sent to your email.',
        ),
      );
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, isEn));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearFeedback();
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, isEn));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    clearFeedback();
    setLoading(true);
    try {
      const refreshed = await reloadAuthUser();
      if (refreshed && refreshed.emailVerified) {
        onVerificationRefreshed(refreshed);
      } else {
        setErrorMsg(
          t(
            'لم يتم تأكيد البريد الإلكتروني بعد. افتح رابط التفعيل في بريدك ثم أعد المحاولة.',
            'Email is not verified yet. Open the verification link in your inbox and retry.',
          ),
        );
      }
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, isEn));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    clearFeedback();
    setLoading(true);
    try {
      await resendVerificationEmail();
      setSuccessMsg(
        t(
          'تمت إعادة إرسال رابط التفعيل إلى بريدك الإلكتروني.',
          'Verification email resent to your inbox.',
        ),
      );
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, isEn));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#FFFEFC] flex flex-col justify-between">
      {/* Top Royal Burgundy Brand Band */}
      <header className="bg-gradient-to-b from-[#3B123F] to-[#501C5A] text-white px-4 pt-safe pb-7 rounded-b-[30px] shadow-md">
        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="text-[11px] font-bold tracking-wide text-[#F2D36B] truncate">
            {t('الشركة الوطنية اللوجستية', 'AL-WATANIYA LOGISTICS')}
          </span>
          <button
            type="button"
            onClick={toggleLang}
            aria-label={t('تبديل اللغة', 'Switch Language')}
            className="min-h-[42px] min-w-[44px] px-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 border border-[#F2D36B]/30 text-xs font-bold text-[#F2D36B] cursor-pointer shrink-0"
          >
            <Globe className="w-4 h-4" />
            <span>{isEn ? 'عربي' : 'EN'}</span>
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center text-center">
          <div className="p-1.5 rounded-full bg-white/10 border-2 border-[#D4AF37]">
            <img
              src={BASIT_LOGO_URL}
              alt="BASIT | باسط"
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover bg-[#FFFFFF]"
            />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
            BASIT | باسط
          </h1>
          <p className="mt-1 text-xs text-[#F2D36B] font-semibold max-w-[280px] leading-relaxed">
            {t(
              'بوابة الدخول الموحدة لخدمات الأغذية والتوريد والمصانع',
              'Unified Access Gate for Food, Supply & Factory Operations',
            )}
          </p>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                const event = new CustomEvent('open-basit-welcome-video');
                window.dispatchEvent(event);
              }
            }}
            className="mt-4 min-h-[40px] px-4 rounded-xl bg-gradient-to-r from-[#FACC15] to-[#EAB308] text-[#3B123F] font-black text-xs inline-flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span>{t('▶ شاهد فيديو الترحيب والمميزات', '▶ Watch Welcome & Perks Video')}</span>
          </button>
        </div>
      </header>

      {/* Main Auth Card Container */}
      <main className="flex-1 w-full px-4 py-5 pb-safe flex flex-col justify-start">
        <div id="basit-recaptcha-container" />

        {authBootError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#3B123F]/25 text-xs text-[#3B123F] flex items-start gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-[#3B123F] shrink-0 mt-0.5" />
            <span className="leading-relaxed">{authBootError}</span>
          </div>
        )}

        {pendingVerificationUser ? (
          <section className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#3B123F] text-[#F2D36B] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#1F0B22]">
                  {t('تأكيد البريد الإلكتروني مطلوب', 'Email Verification Required')}
                </h2>
                <p className="text-xs text-[#68516B] truncate">
                  {pendingVerificationUser.email}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#68516B] leading-relaxed">
              {t(
                'لحماية صلاحيات الحسابات والمصانع، يجب تفعيل بريدك الإلكتروني عبر الرابط المرسل قبل الدخول إلى قطاعات المنصة.',
                'To enforce workspace and RBAC security, please click the verification link sent to your inbox before accessing sectors.',
              )}
            </p>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-[#3B123F]/8 border border-[#3B123F]/25 text-xs font-semibold text-[#3B123F] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-semibold text-[#3B123F] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3B123F] shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={handleCheckVerified}
                className="w-full min-h-[48px] px-4 rounded-2xl bg-[#3B123F] text-[#F2D36B] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#501C5A] disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {t('تم التفعيل — دخول المنصة', 'Verified — Enter Platform')}
                </span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleResendVerification}
                className="w-full min-h-[46px] px-4 rounded-2xl bg-[#FFFEFC] border border-[#D4AF37] text-[#3B123F] text-xs font-bold hover:bg-[#F2D36B]/15 disabled:opacity-60 cursor-pointer"
              >
                {t('إعادة إرسال رابط التفعيل', 'Resend Verification Email')}
              </button>

              <button
                type="button"
                onClick={() => signOutAccount()}
                className="w-full min-h-[44px] px-4 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] text-[#68516B] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('تسجيل الخروج وتبديل الحساب', 'Sign Out / Switch Account')}</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] p-5 shadow-sm space-y-4">
            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setPhoneConfirmation(null);
                  clearFeedback();
                }}
                className={`min-h-[42px] px-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#3B123F] text-[#F2D36B]'
                    : 'text-[#68516B] hover:text-[#3B123F]'
                }`}
              >
                {t('تسجيل الدخول', 'Sign In')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setPhoneConfirmation(null);
                  clearFeedback();
                }}
                className={`min-h-[42px] px-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#3B123F] text-[#F2D36B]'
                    : 'text-[#68516B] hover:text-[#3B123F]'
                }`}
              >
                {t('حساب جديد', 'Register')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setPhoneConfirmation(null);
                  clearFeedback();
                }}
                className={`min-h-[42px] px-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  mode === 'reset'
                    ? 'bg-[#3B123F] text-[#F2D36B]'
                    : 'text-[#68516B] hover:text-[#3B123F]'
                }`}
              >
                {t('استعادة', 'Reset')}
              </button>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3 rounded-2xl bg-[#3B123F]/8 border border-[#3B123F]/25 text-xs font-semibold text-[#3B123F] flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                role="status"
                className="p-3 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-xs font-semibold text-[#3B123F] flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#3B123F] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {mode === 'login' && !phoneConfirmation && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1F0B22]">
                    {t('البريد الإلكتروني أو رقم الهاتف', 'Email or Phone Number')}
                  </label>
                  <div className="relative">
                    {looksLikePhone(identifier) ? (
                      <Phone className="w-4 h-4 text-[#501C5A] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                    ) : (
                      <Mail className="w-4 h-4 text-[#501C5A] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                    )}
                    <input
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t(
                        'name@company.com · 010xxxxxxxx',
                        'name@company.com · +2010...',
                      )}
                      className="w-full min-h-[48px] ps-10 pe-4 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] text-sm text-[#1F0B22] placeholder:text-[#68516B]/70 focus:outline-none focus:border-[#3B123F] focus:ring-2 focus:ring-[#D4AF37]/50"
                    />
                  </div>
                </div>

                {!looksLikePhone(identifier) && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#1F0B22]">
                        {t('كلمة المرور', 'Password')}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('reset');
                          clearFeedback();
                        }}
                        className="text-[11px] font-bold text-[#501C5A] hover:text-[#3B123F] cursor-pointer"
                      >
                        {t('نسيت كلمة المرور؟', 'Forgot password?')}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#501C5A] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full min-h-[48px] ps-10 pe-12 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] text-sm text-[#1F0B22] placeholder:text-[#68516B]/70 focus:outline-none focus:border-[#3B123F] focus:ring-2 focus:ring-[#D4AF37]/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={t('إظهار أو إخفاء كلمة المرور', 'Toggle password visibility')}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center absolute top-1/2 -translate-y-1/2 end-1 text-[#68516B] cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[50px] px-5 rounded-2xl bg-[#3B123F] text-[#F2D36B] text-sm font-bold hover:bg-[#501C5A] active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
                >
                  {loading
                    ? t('جاري التحقق...', 'Signing in...')
                    : looksLikePhone(identifier)
                      ? t('إرسال رمز التحقق للهاتف', 'Send SMS Code')
                      : t('تسجيل الدخول', 'Sign In')}
                </button>
              </form>
            )}

            {mode === 'login' && phoneConfirmation && (
              <form onSubmit={handleConfirmSms} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1F0B22]">
                    {t('رمز التحقق المرسل عبر SMS', 'SMS Verification Code')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    placeholder="123456"
                    className="w-full min-h-[48px] px-4 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] text-sm text-center font-bold tracking-widest text-[#1F0B22] focus:outline-none focus:border-[#3B123F]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[50px] rounded-2xl bg-[#3B123F] text-[#F2D36B] text-sm font-bold cursor-pointer"
                >
                  {loading ? t('جاري التأكيد...', 'Verifying...') : t('تأكيد الرمز والدخول', 'Verify & Sign In')}
                </button>
                <button
                  type="button"
                  onClick={() => setPhoneConfirmation(null)}
                  className="w-full min-h-[42px] text-xs font-bold text-[#68516B] cursor-pointer"
                >
                  {t('رجوع', 'Back')}
                </button>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1F0B22]">
                    {t('الاسم الكامل / اسم المسؤول', 'Full Name')}
                  </label>
                  <div className="relative">
                    <UserPlus className="w-4 h-4 text-[#501C5A] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                    <input
                      type="text"
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t('أحمد محمد', 'Full Name')}
                      className="w-full min-h-[48px] ps-10 pe-4 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] text-sm text-[#1F0B22] focus:outline-none focus:border-[#3B123F]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1F0B22]">
                    {t('البريد الإلكتروني', 'Email Address')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#501C5A] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full min-h-[48px] ps-10 pe-4 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] text-sm text-[#1F0B22] focus:outline-none focus:border-[#3B123F]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1F0B22]">
                    {t('كلمة المرور (6 أحرف فأكثر)', 'Password (6+ characters)')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#501C5A] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full min-h-[48px] ps-10 pe-12 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] text-sm text-[#1F0B22] focus:outline-none focus:border-[#3B123F]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={t('إظهار أو إخفاء كلمة المرور', 'Toggle password visibility')}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center absolute top-1/2 -translate-y-1/2 end-1 text-[#68516B] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[50px] px-5 rounded-2xl bg-[#3B123F] text-[#F2D36B] text-sm font-bold hover:bg-[#501C5A] disabled:opacity-60 cursor-pointer"
                >
                  {loading
                    ? t('جاري إنشاء الحساب...', 'Creating Account...')
                    : t('إنشاء حساب وإرسال التفعيل', 'Create Account')}
                </button>
              </form>
            )}

            {mode === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1F0B22]">
                    {t('البريد الإلكتروني لاستعادة كلمة المرور', 'Registered Email Address')}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#501C5A] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full min-h-[48px] ps-10 pe-4 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] text-sm text-[#1F0B22] focus:outline-none focus:border-[#3B123F]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[50px] px-5 rounded-2xl bg-[#3B123F] text-[#F2D36B] text-sm font-bold hover:bg-[#501C5A] disabled:opacity-60 cursor-pointer"
                >
                  {loading
                    ? t('جاري الإرسال...', 'Sending...')
                    : t('إرسال رابط استعادة كلمة المرور', 'Send Password Reset Link')}
                </button>
              </form>
            )}

            {/* Divider & Verified Google Sign-In */}
            <div className="relative py-1 flex items-center">
              <div className="flex-1 border-t border-[#ECE4E8]" />
              <span className="px-3 text-[11px] font-semibold text-[#68516B]">
                {t('أو المتابعة عبر', 'Or continue with')}
              </span>
              <div className="flex-1 border-t border-[#ECE4E8]" />
            </div>

            <button
              type="button"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full min-h-[48px] px-4 rounded-2xl bg-[#FFFEFC] border border-[#D4AF37] text-[#3B123F] text-xs font-bold flex items-center justify-center gap-2.5 hover:bg-[#F2D36B]/15 active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-[#3B123F] text-[#F2D36B] text-[11px] font-bold flex items-center justify-center">
                G
              </span>
              <span>
                {googleLoading
                  ? t('جاري فتح نافذة Google...', 'Opening Google Sign-In...')
                  : t('الدخول السريع بحساب Google', 'Continue with Google')}
              </span>
            </button>
          </section>
        )}

        <p className="mt-4 text-center text-[11px] text-[#68516B] leading-relaxed px-2">
          {t(
            'صلاحيات القطاعات وإدارة المصانع والإدارة المالية تخضع للتحقق الفعلي وقواعد الحماية في Firebase.',
            'Sector access, factory tenant isolation & Owner Financial Management are enforced via Firebase Auth & Firestore Rules.',
          )}
        </p>
      </main>
    </div>
  );
};
