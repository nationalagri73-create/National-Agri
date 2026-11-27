import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Lock,
  MapPin,
  Star,
} from 'lucide-react';
import {
  BASIT_SECTORS,
  PHASE1_PARTNERS,
  PHASE1_PHOTOS,
  Phase1PageId,
} from '../../data/phase1Data';
import { useI18n } from '../../i18n/translations';
import { BasitPermissions } from '../../lib/rbac';
import { InstallPwaButton } from './InstallPwaButton';
import { getSectorIcon } from './SharedUI';

export const HomeScreen: React.FC<{
  searchQuery: string;
  permissions: BasitPermissions;
  onClearSearch: () => void;
  onNavigate: (page: Phase1PageId) => void;
  onOpenAllSectors: () => void;
}> = ({ searchQuery, permissions, onClearSearch, onNavigate, onOpenAllSectors }) => {
  const { isEn, t } = useI18n();
  const [promoIndex, setPromoIndex] = useState(0);
  const ChevronDir = isEn ? ChevronRight : ChevronLeft;

  const q = searchQuery.trim().toLowerCase();

  const permittedSectors = BASIT_SECTORS.filter((s) =>
    permissions.allowedPages.includes(s.id),
  );
  const topTwoSectors = permittedSectors.slice(0, 2);
  const remainingSectors = permittedSectors.slice(2);

  const matchingSectors = q
    ? BASIT_SECTORS.filter(
        (s) =>
          s.titleAr.toLowerCase().includes(q) ||
          s.titleEn.toLowerCase().includes(q) ||
          s.shortAr.toLowerCase().includes(q) ||
          s.shortEn.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q),
      )
    : [];

  const matchingPartners = PHASE1_PARTNERS.filter(
    (p) =>
      !q ||
      p.nameAr.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.cityAr.toLowerCase().includes(q) ||
      p.specialtyAr.toLowerCase().includes(q),
  );

  const promoCards = [
    {
      id: 'promo_b2b',
      target: (permissions.allowedPages.includes('business')
        ? 'business'
        : 'marketplace') as Phase1PageId,
      kickerAr: 'باسط أعمال · المؤسسات',
      kickerEn: 'BASIT BUSINESS',
      titleAr: 'تغذية المصانع والشركات بمواعيد ورديات دقيقة',
      titleEn: 'Factory & Corporate Shift Meal Plans',
      ctaAr: 'استكشف الباقات',
      ctaEn: 'Explore Plans',
      image: PHASE1_PHOTOS.businessCatering,
    },
    {
      id: 'promo_healthy',
      target: (permissions.allowedPages.includes('healthy')
        ? 'healthy'
        : 'marketplace') as Phase1PageId,
      kickerAr: 'باسط هيلثي · اشتراكات',
      kickerEn: 'BASIT HEALTHY',
      titleAr: 'وجبات يومية موزونة السعرات للأفراد والرياضيين',
      titleEn: 'Macro-Balanced Daily Subscriptions',
      ctaAr: 'تصفح الباقات',
      ctaEn: 'View Plans',
      image: PHASE1_PHOTOS.healthyMeals,
    },
  ];

  const activePromo = promoCards[promoIndex % promoCards.length];

  if (q) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#1F0B22]">
            {t('نتائج البحث', 'Search Results')}
          </h2>
          <button
            type="button"
            onClick={onClearSearch}
            className="min-h-[40px] px-3 rounded-xl text-xs font-bold text-[#3B123F] bg-[#FFFFFF] border border-[#ECE4E8] cursor-pointer"
          >
            {t('مسح البحث', 'Clear')}
          </button>
        </div>

        {matchingSectors.length === 0 && matchingPartners.length === 0 ? (
          <div className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] p-6 text-center space-y-2">
            <p className="text-sm font-bold text-[#1F0B22]">
              {t('لا توجد نتائج مطابقة', 'No matching results')}
            </p>
            <p className="text-xs text-[#68516B]">
              {t(
                'جرّب البحث باسم مطبخ أو خدمة مثل الكارت أو المصانع.',
                'Try searching for a kitchen, Card, or Factory.',
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matchingSectors.map((sector) => {
              const Icon = getSectorIcon(sector.id);
              const isPermitted = permissions.allowedPages.includes(sector.id);
              return (
                <button
                  key={sector.id}
                  type="button"
                  disabled={!isPermitted}
                  onClick={() => isPermitted && onNavigate(sector.id)}
                  className={`w-full min-h-[64px] rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] p-3.5 flex items-center justify-between gap-3 text-start ${
                    isPermitted ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#3B123F] text-[#F2D36B] flex items-center justify-center shrink-0">
                      {isPermitted ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1F0B22] truncate">
                        {isEn ? sector.titleEn : sector.titleAr}
                      </h3>
                      <p className="text-xs text-[#68516B] truncate">
                        {isPermitted
                          ? isEn
                            ? sector.shortEn
                            : sector.shortAr
                          : t('يتطلب صلاحية مخولة', 'Requires authorized role')}
                      </p>
                    </div>
                  </div>
                  <ChevronDir className="w-4 h-4 text-[#D4AF37] shrink-0" />
                </button>
              );
            })}

            {matchingPartners.map((partner) => (
              <button
                key={partner.id}
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="w-full min-h-[72px] rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] p-3 flex items-center gap-3 text-start cursor-pointer"
              >
                <img
                  src={partner.image}
                  alt={isEn ? partner.nameEn : partner.nameAr}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#1F0B22] truncate">
                    {isEn ? partner.nameEn : partner.nameAr}
                  </h3>
                  <p className="text-xs text-[#68516B] truncate">
                    {isEn ? partner.cityEn : partner.cityAr} ·{' '}
                    {isEn ? partner.capacityEn : partner.capacityAr}
                  </p>
                </div>
                <ChevronDir className="w-4 h-4 text-[#D4AF37] shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Direct Mobile Install Button & Ha-Be Partner Card */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <InstallPwaButton className="w-full md:w-auto" />
      </div>

      <section className="rounded-3xl p-4 bg-gradient-to-r from-[#240046] via-[#4B148C] to-[#1A052E] text-white border border-[#D4AF37]/60 shadow-md space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFE875] animate-pulse" />
            <span className="text-[11px] font-black tracking-wider text-[#FFE875]">
              {t('شريك متعاقد معتمد', 'Certified Partner Enterprise')}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-lg bg-[#FACC15] text-[#1A052E] text-[10px] font-black">
            {t('شركة ها-بي', 'Ha-Be Enterprise')}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-black text-white">
            {t('تطبيق شركة ها-بي للكيماويات والتوريد الفندقي والغذائي', 'Ha-Be Chemicals & Catering App Portal')}
          </h3>
          <p className="text-xs text-[#FFFDF7]/85 leading-relaxed mt-1">
            {t(
              'تم ربط تطبيق شركة ها-بي المتعاقدة معنا رسمياً داخل المنصة لتوفير خدمات الإعاشة وإدارة الوجبات.',
              'Ha-Be contracted company application is officially linked inside BASIT for catering & meal operations.',
            )}
          </p>
        </div>

        <div className="pt-1">
          <a
            href="https://catering-egypt-nov-25-2026-2-31-29-am-1-avetvzchc-basit-cb8e.vercel.app/habe?install=1"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[46px] px-4 rounded-xl bg-gradient-to-r from-[#FACC15] via-[#EAB308] to-[#9A6B16] text-[#1A052E] font-black text-xs inline-flex items-center justify-center gap-2 shadow-md hover:brightness-110 cursor-pointer"
          >
            <span>{t('فتح بوابة وتطبيق شركة ها-بي المتعاقدة', 'Open Ha-Be Partner Portal & App')}</span>
            <ExternalLink className="w-4 h-4 text-[#1A052E]" />
          </a>
        </div>
      </section>

      {/* 1. Primary Hero Service Cards (Strictly Contained 2-Col Mobile Grid) */}
      <section className="grid grid-cols-2 gap-3">
        {topTwoSectors.map((sector) => {
          const Icon = getSectorIcon(sector.id);
          return (
            <button
              key={sector.id}
              type="button"
              onClick={() => onNavigate(sector.id)}
              className="w-full min-w-0 rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] overflow-hidden text-start flex flex-col justify-between shadow-xs active:scale-[0.97] transition-transform cursor-pointer"
            >
              <div className="relative h-24 w-full bg-[#3B123F]">
                <img
                  src={sector.image}
                  alt={isEn ? sector.titleEn : sector.titleAr}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3B123F]/75 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 start-2.5 w-8 h-8 rounded-xl bg-[#3B123F] border border-[#D4AF37] text-[#F2D36B] flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="p-3 space-y-0.5 min-w-0">
                <h2 className="text-sm font-bold text-[#1F0B22] truncate">
                  {isEn ? sector.titleEn : sector.titleAr}
                </h2>
                <p className="text-[11px] text-[#68516B] truncate">
                  {isEn ? sector.shortEn : sector.shortAr}
                </p>
              </div>
            </button>
          );
        })}
      </section>

      {/* 2. Remaining Permitted Services — Clean Bounded 2-Column Mobile Cards */}
      {remainingSectors.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#1F0B22]">
              {t('خدمات وبوابات باسط', 'More BASIT Services')}
            </h2>
            <button
              type="button"
              onClick={onOpenAllSectors}
              className="min-h-[38px] px-2 inline-flex items-center gap-0.5 text-xs font-bold text-[#3B123F] cursor-pointer"
            >
              <span>{t('الكل', 'All')}</span>
              <ChevronDir className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {remainingSectors.map((sector) => {
              const Icon = getSectorIcon(sector.id);
              return (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => onNavigate(sector.id)}
                  className="w-full min-w-0 min-h-[72px] rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] p-3 flex items-center gap-2.5 text-start active:scale-[0.97] transition-transform cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#3B123F] border border-[#D4AF37]/50 text-[#F2D36B] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-[#1F0B22] truncate">
                      {isEn ? sector.titleEn : sector.titleAr}
                    </h3>
                    <p className="text-[10px] text-[#68516B] truncate">
                      {isEn ? sector.shortEn : sector.shortAr}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Full-Width Bounded Spotlight Banner (No Edge Clipping) */}
      <section className="space-y-2">
        <div className="rounded-3xl bg-[#3B123F] text-white overflow-hidden border border-[#501C5A] shadow-sm">
          <button
            type="button"
            onClick={() => onNavigate(activePromo.target)}
            className="w-full flex items-stretch text-start active:scale-[0.99] transition-transform cursor-pointer"
          >
            <div className="flex-1 p-4 flex flex-col justify-between gap-2.5 min-w-0">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#F2D36B] truncate">
                  {isEn ? activePromo.kickerEn : activePromo.kickerAr}
                </p>
                <h3 className="text-sm font-bold leading-snug text-white break-words">
                  {isEn ? activePromo.titleEn : activePromo.titleAr}
                </h3>
              </div>
              <span className="self-start px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#3B123F] text-[11px] font-bold">
                {isEn ? activePromo.ctaEn : activePromo.ctaAr}
              </span>
            </div>
            <div className="w-28 bg-[#501C5A] shrink-0">
              <img
                src={activePromo.image}
                alt={isEn ? activePromo.titleEn : activePromo.titleAr}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          {promoCards.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              aria-label={isEn ? p.kickerEn : p.kickerAr}
              onClick={() => setPromoIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                promoIndex === idx
                  ? 'w-6 bg-[#3B123F]'
                  : 'w-2 bg-[#D4AF37]/45'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 4. Featured Kitchens & Partners Feed */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#1F0B22]">
            {t('المطابخ والشركاء المميزون', 'Featured Kitchens & Supply')}
          </h2>
          {permissions.allowedPages.includes('marketplace') && (
            <button
              type="button"
              onClick={() => onNavigate('marketplace')}
              className="min-h-[38px] px-2 inline-flex items-center gap-0.5 text-xs font-bold text-[#3B123F] cursor-pointer"
            >
              <span>{t('عرض الكل', 'See All')}</span>
              <ChevronDir className="w-4 h-4 text-[#D4AF37]" />
            </button>
          )}
        </div>

        <div className="space-y-3.5">
          {PHASE1_PARTNERS.map((partner) => (
            <button
              key={partner.id}
              type="button"
              onClick={() =>
                onNavigate(
                  permissions.allowedPages.includes('marketplace')
                    ? 'marketplace'
                    : permissions.allowedPages[0] || 'home',
                )
              }
              className="w-full rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] overflow-hidden text-start shadow-xs active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div className="relative h-36 w-full bg-[#3B123F]">
                <img
                  src={partner.image}
                  alt={isEn ? partner.nameEn : partner.nameAr}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1F0B22]/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between gap-2 text-white text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1 tabular-nums min-w-0 truncate">
                    <Clock className="w-3.5 h-3.5 text-[#F2D36B] shrink-0" />
                    <span className="truncate">
                      {isEn ? partner.capacityEn : partner.capacityAr}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#3B123F]/90 border border-[#D4AF37]/50 px-2 py-0.5 rounded-lg tabular-nums shrink-0">
                    <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                    {partner.rating}
                  </span>
                </div>
              </div>

              <div className="p-3.5 space-y-1 min-w-0">
                <h3 className="text-sm font-bold text-[#1F0B22] truncate">
                  {isEn ? partner.nameEn : partner.nameAr}
                </h3>
                <p className="text-xs text-[#68516B] truncate">
                  {isEn ? partner.specialtyEn : partner.specialtyAr}
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#501C5A] font-semibold min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span className="truncate">
                    {isEn ? partner.zonesEn : partner.zonesAr}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
