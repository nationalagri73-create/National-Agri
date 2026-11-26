import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, X } from 'lucide-react';

interface QrBadgeModalProps {
  title: string;
  subtitle: string;
  payload: string;
  onClose: () => void;
}

export const QrBadgeModal: React.FC<QrBadgeModalProps> = ({
  title,
  subtitle,
  payload,
  onClose,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(payload, {
      width: 240,
      margin: 2,
      color: { dark: '#1E1B4B', light: '#FFFFFF' },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [payload]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 border border-slate-200 shadow-xl">
        <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <QrCode className="w-5 h-5 text-[#4F2487] shrink-0" />
            <h3 className="text-base font-bold text-slate-900 truncate">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>

        <div className="mt-5 flex items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={title}
              className="w-48 h-48 rounded-xl bg-white p-2 border border-slate-100"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-500">
              جاري توليد رمز التحقق...
            </div>
          )}
        </div>

        <div className="mt-3 text-center font-mono text-[11px] text-slate-500 break-all">
          {payload}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full min-h-[48px] rounded-xl bg-[#4F2487] text-white text-sm font-semibold hover:bg-[#3f1c6d] transition-colors cursor-pointer"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};
