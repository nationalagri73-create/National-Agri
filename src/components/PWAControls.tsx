import React, { useState } from 'react';
import { Download, Share, WifiOff, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ isEn?: boolean }> = ({ isEn = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-xl bg-[#3B123F] text-white text-xs font-semibold hover:bg-[#501C5A] transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        {isEn ? 'Install App' : 'تثبيت التطبيق'}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Share className="w-3.5 h-3.5 text-[#3B123F]" />
          {isEn ? 'Install iOS' : 'تثبيت iOS'}
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
            <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-6 pb-safe shadow-xl border border-slate-200">
              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900">
                  {isEn ? 'Install BASIT on iPhone / iPad' : 'تثبيت تطبيق باسط على آيفون'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-xs text-slate-600 leading-relaxed">
                <li>
                  {isEn
                    ? '1. Tap the Share button in the Safari toolbar.'
                    : '1. اضغط على زر المشاركة (Share) في شريط متصفح Safari.'}
                </li>
                <li>
                  {isEn
                    ? '2. Scroll down and tap "Add to Home Screen".'
                    : '2. اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'}
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-[#3B123F] text-white text-sm font-semibold hover:bg-[#501C5A] transition-colors cursor-pointer"
              >
                {isEn ? 'Got it' : 'حسناً'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC<{ isEn?: boolean }> = ({ isEn = false }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-[68px] md:bottom-5 right-4 left-4 md:left-auto md:w-auto z-50 flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {isEn
          ? 'Offline Mode — Showing cached data'
          : 'وضع عدم الاتصال — يتم عرض البيانات المخزنة مؤقتاً'}
      </span>
    </div>
  );
};
