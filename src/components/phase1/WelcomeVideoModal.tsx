import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  Sparkles,
  CreditCard,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { useI18n } from '../../i18n/translations';
import { BrandLogo } from './SharedUI';

interface WelcomeVideoModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateToCard?: () => void;
  onOpenLogin?: () => void;
}

export const WelcomeVideoModal: React.FC<WelcomeVideoModalProps> = ({
  open,
  onClose,
  onNavigateToCard,
  onOpenLogin,
}) => {
  const { isEn, t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [open]);

  if (!open) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('basit_welcome_seen_v2', 'true');
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-[#1A052E]/85 backdrop-blur-md overflow-y-auto"
      onClick={handleDismiss}
    >
      <div
        className="w-full max-w-[430px] rounded-3xl bg-gradient-to-b from-[#240046] via-[#4B148C] to-[#1A052E] border-2 border-[#D4AF37]/60 shadow-[0_0_50px_rgba(168,85,247,0.5)] overflow-hidden text-[#FFFDF7] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 pb-2 flex items-center justify-between border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-2.5">
            <BrandLogo sizeClass="w-9 h-9" alt="BASIT" />
            <div>
              <p className="text-[10px] font-black tracking-widest text-[#FFE875]">
                BASIT | باسط
              </p>
              <h2 className="text-xs font-bold text-[#FFFFFF]">
                {t('منصة الشركة الوطنية اللوجستية', 'National Logistics Platform')}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('تخطي', 'Skip')}
            className="min-h-[38px] px-3 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFE875] text-xs font-bold border border-[#D4AF37]/40 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <span>{t('تخطي', 'Skip')}</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Hero Container */}
        <div className="relative aspect-[16/9] w-full bg-[#1A052E] overflow-hidden group">
          <video
            ref={videoRef}
            src="/assets/aistudio/__________________7__035816fc.mp4"
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={isMuted}
            loop
            onLoadedData={() => setVideoLoaded(true)}
          />

          {!videoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#240046]">
              <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
            </div>
          )}

          {/* Video Control Overlays */}
          <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={toggleMute}
              className="pointer-events-auto min-h-[36px] px-3 rounded-xl bg-black/60 backdrop-blur-md text-[#FFE875] text-xs font-bold border border-[#D4AF37]/40 flex items-center gap-1.5 hover:bg-black/80 cursor-pointer transition-all shadow-md"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-amber-300" />
                  <span>{t('تشغيل الصوت', 'Unmute')}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>{t('إيقاف الصوت', 'Mute')}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="pointer-events-auto w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md text-[#FFE875] border border-[#D4AF37]/40 flex items-center justify-center hover:bg-black/80 cursor-pointer shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Copy & Promotional Body */}
        <div className="p-5 space-y-4 text-center">
          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#FFE875] text-[11px] font-black inline-block shadow-sm">
              {t('عضويتك لعالم من المزايا والخصومات', 'Your Membership to a World of Perks & Discounts')}
            </span>
            <h1 className="text-base font-black text-[#FFFFFF] leading-snug">
              {t('منصة باسط الرقمية للموظفين والعاملين', 'BASIT Digital Platform for Staff & Members')}
            </h1>
            <p className="text-xs text-[#FFFDF7]/85 leading-relaxed max-w-[340px] mx-auto">
              {t(
                'خصومات وترفيه ورحلات ومزايا حصرية للعاملين لدى الجهات والشركات المتعاقدة مع الشركة الوطنية اللوجستية.',
                'Exclusive discounts, leisure, tours and perks for employees of contracted entities with Al-Wataniya Logistics.',
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full min-h-[46px] rounded-2xl bg-gradient-to-r from-[#FACC15] via-[#EAB308] to-[#9A6B16] text-[#1A052E] font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#1A052E]" />
              <span>{t('ابدأ الآن واستكشف المنصة', 'Start Exploring Now')}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {onOpenLogin && (
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss();
                    onOpenLogin();
                  }}
                  className="w-full min-h-[42px] rounded-xl bg-white/10 hover:bg-white/20 border border-[#D4AF37]/50 text-[#FFE875] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <LogIn className="w-4 h-4 text-[#FFE875]" />
                  <span>{t('تسجيل الدخول', 'Sign In')}</span>
                </button>
              )}

              {onNavigateToCard && (
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss();
                    onNavigateToCard();
                  }}
                  className="w-full min-h-[42px] rounded-xl bg-gradient-to-r from-[#852BEB] to-[#5A189A] hover:brightness-110 border border-[#FFE875]/40 text-[#FFE875] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <CreditCard className="w-4 h-4 text-[#FFE875]" />
                  <span>{t('تفعيل كارت BASIT', 'Activate Card')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
