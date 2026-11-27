import React, { useEffect, useState } from 'react';
import { Download, Sparkles, Smartphone, CheckCircle2, X } from 'lucide-react';
import { useI18n } from '../../i18n/translations';
import { BottomDetailSheet } from './SharedUI';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isEn, t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('PWA prompt error:', err);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  if (installed) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold ${className}`}>
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{t('التطبيق مثبت على جهازك', 'App Installed')}</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-[#FACC15] via-[#EAB308] to-[#9A6B16] text-[#1A052E] font-black text-xs inline-flex items-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer ${className}`}
      >
        <Smartphone className="w-4 h-4 text-[#1A052E]" />
        <span>{t('تثبيت تطبيق باسط فوراً', 'Install BASIT App Now')}</span>
      </button>

      <BottomDetailSheet
        open={showInstallModal}
        title={t('تثبيت تطبيق BASIT | باسط على هاتفك', 'Install BASIT on Your Phone')}
        subtitle={t('تجربة تطبيق موبايل احترافية بدون متجر', 'Native Mobile App Experience')}
        onClose={() => setShowInstallModal(false)}
      >
        <div className="space-y-4 text-xs text-[#1F0B22]">
          <div className="p-3.5 rounded-2xl bg-[#3B123F] text-[#FFFDF7] space-y-2">
            <p className="font-bold text-[#FFE875]">
              {t('طريقة التثبيت السريع على الموبايل:', 'Quick Mobile Installation:')}
            </p>
            <ol className="space-y-1.5 text-[11px] list-decimal pr-4 pl-4 leading-relaxed text-[#FFFDF7]/90">
              <li>
                {t(
                  'افتح القائمة في متصفح هاتفك (سفاري للأيفون أو كروم للأندرويد).',
                  'Open your browser menu (Safari on iOS or Chrome on Android).',
                )}
              </li>
              <li>
                {t(
                  'اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).',
                  'Select "Add to Home Screen".',
                )}
              </li>
              <li>
                {t(
                  'اضغط "إضافة" لتظهر أيقونة تطبيق باسط فوراً على شاشة هاتفك.',
                  'Tap "Add" to place the BASIT icon instantly on your home screen.',
                )}
              </li>
            </ol>
          </div>

          <button
            type="button"
            onClick={() => setShowInstallModal(false)}
            className="w-full min-h-[46px] rounded-xl bg-[#5A189A] text-[#FFE875] font-bold text-xs cursor-pointer"
          >
            {t('فهمت، شكراً', 'Got it, Thanks')}
          </button>
        </div>
      </BottomDetailSheet>
    </>
  );
};
