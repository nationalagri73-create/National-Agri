import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  MapPin,
  Search,
  Star,
  Store,
  Users,
} from 'lucide-react';
import {
  MarketplacePartnerPreview,
  PHASE1_BUSINESS_VERTICALS,
  PHASE1_PARTNERS,
  PHASE1_PHOTOS,
} from '../../data/phase1Data';
import { useI18n } from '../../i18n/translations';
import { BottomDetailSheet, SectorHeroCard } from './SharedUI';

export const MarketplacePage: React.FC = () => {
  const { isEn, t } = useI18n();
  const [filter, setFilter] = useState<'all' | 'kitchen' | 'supplier'>('all');
  const [search, setSearch] = useState('');
  const [selectedPartner, setSelectedPartner] =
    useState<MarketplacePartnerPreview | null>(null);
  const [rfqSentFor, setRfqSentFor] = useState<string | null>(null);

  const q = search.trim().toLowerCase();
  const items = PHASE1_PARTNERS.filter((p) => {
    const matchesCat = filter === 'all' || p.category === filter;
    const matchesQ =
      !q ||
      p.nameAr.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.zonesAr.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  return (
    <div className="space-y-5">
      <SectorHeroCard
        code="BASIT MARKETPLACE"
        title={t('سوق المطابخ المركزية والموردين', 'Central Kitchens & Suppliers Marketplace')}
        description={t(
          'استعرض التخصصات، الطاقات التشغيلية اليومية، ومناطق التغطية المعتمدة.',
          'Browse certified kitchens and suppliers with daily capacities and service zones.',
        )}
        image={PHASE1_PHOTOS.centralKitchen}
        imageAlt={t('مطبخ مركزي في باسط', 'BASIT Central Kitchen')}
      />

      {/* Search + Bounded Wrap Filter Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#68516B] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('ابحث باسم المطبخ أو المنطقة...', 'Search kitchen or city...')}
            className="w-full min-h-[46px] ps-10 pe-4 rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] text-sm text-[#1F0B22] focus:outline-none focus:border-[#3B123F] focus:ring-2 focus:ring-[#D4AF37]/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', ar: 'الكل', en: 'All Partners' },
              { id: 'kitchen', ar: 'المطابخ المركزية', en: 'Central Kitchens' },
              { id: 'supplier', ar: 'الموردون', en: 'Suppliers' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[42px] px-3.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#3B123F] text-[#F2D36B]'
                  : 'bg-[#FFFFFF] border border-[#ECE4E8] text-[#1F0B22]'
              }`}
            >
              {isEn ? tab.en : tab.ar}
            </button>
          ))}
        </div>
      </div>

      {/* Partners Mobile List */}
      <section className="grid grid-cols-1 gap-3.5">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] p-6 text-center text-xs text-[#68516B]">
            {t('لا توجد نتائج مطابقة للبحث الحالي.', 'No partners match your search.')}
          </div>
        ) : (
          items.map((partner) => (
            <article
              key={partner.id}
              className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] overflow-hidden flex flex-col justify-between shadow-xs"
            >
              <div className="h-36 bg-[#3B123F] relative">
                <img
                  src={partner.image}
                  alt={isEn ? partner.nameEn : partner.nameAr}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs text-[#68516B]">
                  <span className="min-w-0 truncate">
                    {partner.category === 'kitchen'
                      ? t('مطبخ مركزي', 'Central Kitchen')
                      : t('مورد معتمد', 'Verified Supplier')}
                    {' · '}
                    {isEn ? partner.cityEn : partner.cityAr}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#3B123F] tabular-nums shrink-0">
                    <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                    {partner.rating}
                  </span>
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#1F0B22] break-words">
                    {isEn ? partner.nameEn : partner.nameAr}
                  </h2>
                  <p className="mt-1 text-xs text-[#68516B] leading-relaxed break-words">
                    {isEn ? partner.specialtyEn : partner.specialtyAr}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#ECE4E8] flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#501C5A] tabular-nums min-w-0 truncate">
                    {isEn ? partner.capacityEn : partner.capacityAr}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRfqSentFor(null);
                      setSelectedPartner(partner);
                    }}
                    className="min-h-[44px] px-4 rounded-xl bg-[#3B123F] text-[#F2D36B] font-bold hover:bg-[#501C5A] cursor-pointer shrink-0"
                  >
                    {t('ملف الشريك', 'View Profile')}
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      <BottomDetailSheet
        open={Boolean(selectedPartner)}
        title={
          selectedPartner
            ? isEn
              ? selectedPartner.nameEn
              : selectedPartner.nameAr
            : ''
        }
        subtitle={
          selectedPartner
            ? isEn
              ? selectedPartner.cityEn
              : selectedPartner.cityAr
            : ''
        }
        onClose={() => setSelectedPartner(null)}
      >
        {selectedPartner && (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#1F0B22] flex-wrap">
                <Store className="w-4 h-4 text-[#3B123F] shrink-0" />
                <span>{t('الطاقة التشغيلية:', 'Daily Capacity:')}</span>
                <span className="text-[#501C5A] tabular-nums">
                  {isEn ? selectedPartner.capacityEn : selectedPartner.capacityAr}
                </span>
              </div>
              <div className="flex items-start gap-2 text-[#68516B]">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span className="break-words">
                  {isEn ? selectedPartner.zonesEn : selectedPartner.zonesAr}
                </span>
              </div>
            </div>

            <p className="text-[#68516B] leading-relaxed break-words">
              {isEn ? selectedPartner.specialtyEn : selectedPartner.specialtyAr}
            </p>

            {rfqSentFor === selectedPartner.id && (
              <div className="p-3 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#3B123F] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {t(
                    'تم تسجيل طلب عرض السعر المبدئي لهذا الشريك.',
                    'Initial quote request logged for this partner.',
                  )}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRfqSentFor(selectedPartner.id)}
                className="min-h-[46px] px-3 rounded-xl bg-[#3B123F] text-[#F2D36B] text-xs font-bold cursor-pointer"
              >
                {t('طلب عرض سعر', 'Request Quote')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPartner(null)}
                className="min-h-[46px] px-3 rounded-xl bg-[#D4AF37] text-[#3B123F] text-xs font-bold cursor-pointer"
              >
                {t('إغلاق', 'Close')}
              </button>
            </div>
          </div>
        )}
      </BottomDetailSheet>
    </div>
  );
};

export const BusinessPage: React.FC = () => {
  const { isEn, t } = useI18n();
  const [selectedId, setSelectedId] = useState(PHASE1_BUSINESS_VERTICALS[0].id);
  const [mealCount, setMealCount] = useState(250);
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [estimateSaved, setEstimateSaved] = useState(false);

  const activeVertical =
    PHASE1_BUSINESS_VERTICALS.find((v) => v.id === selectedId) ||
    PHASE1_BUSINESS_VERTICALS[0];

  return (
    <div className="space-y-5">
      <SectorHeroCard
        code="BASIT BUSINESS"
        title={t('خدمات التغذية والتوريد المؤسسي', 'Institutional Catering & B2B Supply')}
        description={t(
          'حلول تشغيل متكاملة للمصانع والشركات والمستشفيات والمدارس والنوادي والمؤتمرات.',
          'Turnkey catering & supply programs for factories, corporates, hospitals, schools & events.',
        )}
        image={PHASE1_PHOTOS.businessCatering}
        imageAlt={t('خدمات الإعاشة المؤسسية باسط أعمال', 'BASIT Business Catering')}
        actionLabel={t('حساب التقدير المبدئي', 'Scope Estimator')}
        onAction={() => {
          setEstimateSaved(false);
          setShowSummarySheet(true);
        }}
      />

      {/* Bounded 2-Col / Wrap Sector Pills (Zero Clipped Scroll Edges) */}
      <div className="grid grid-cols-2 gap-2">
        {PHASE1_BUSINESS_VERTICALS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              setSelectedId(v.id);
              setMealCount(Math.max(v.minDailyMeals, mealCount));
            }}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold text-center transition-colors cursor-pointer break-words ${
              selectedId === v.id
                ? 'bg-[#3B123F] text-[#F2D36B]'
                : 'bg-[#FFFFFF] border border-[#ECE4E8] text-[#1F0B22]'
            }`}
          >
            {isEn ? v.titleEn : v.titleAr}
          </button>
        ))}
      </div>

      {/* Focused Active Sector Detail Card */}
      <section className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] p-5 space-y-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#3B123F] text-[#F2D36B] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <h2 className="text-base font-bold text-[#1F0B22] break-words">
              {isEn ? activeVertical.titleEn : activeVertical.titleAr}
            </h2>
            <p className="text-xs text-[#68516B] leading-relaxed break-words">
              {isEn ? activeVertical.summaryEn : activeVertical.summaryAr}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] min-w-0">
            <p className="text-[#68516B] text-[11px]">{t('نموذج الوجبات', 'Meal Cycle')}</p>
            <p className="mt-1 font-bold text-[#1F0B22] break-words">
              {isEn ? activeVertical.shiftModelEn : activeVertical.shiftModelAr}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] tabular-nums min-w-0">
            <p className="text-[#68516B] text-[11px]">
              {t('الحد الأدنى اليومي', 'Min Daily Volume')}
            </p>
            <p className="mt-1 font-bold text-[#3B123F]">
              {activeVertical.minDailyMeals} {t('وجبة / يوم', 'meals / day')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEstimateSaved(false);
            setShowSummarySheet(true);
          }}
          className="w-full min-h-[48px] rounded-2xl bg-[#3B123F] text-[#F2D36B] text-sm font-bold hover:bg-[#501C5A] cursor-pointer"
        >
          {t('معاينة تخطيط الطاقة والعدد', 'Preview Daily Volume Planner')}
        </button>
      </section>

      <BottomDetailSheet
        open={showSummarySheet}
        title={t('مخطط حجم التعاقد المبدئي', 'Contract Volume Preview')}
        subtitle={isEn ? activeVertical.titleEn : activeVertical.titleAr}
        onClose={() => setShowSummarySheet(false)}
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-[#1F0B22] tabular-nums gap-2">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <Users className="w-4 h-4 text-[#3B123F] shrink-0" />
                <span className="truncate">
                  {t('عدد الوجبات اليومية المستهدف', 'Target Daily Meals')}
                </span>
              </span>
              <span className="text-base text-[#3B123F] shrink-0">{mealCount}</span>
            </div>
            <input
              type="range"
              min={activeVertical.minDailyMeals}
              max={2000}
              step={25}
              value={mealCount}
              onChange={(e) => setMealCount(Number(e.target.value))}
              className="w-full accent-[#3B123F]"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] space-y-1.5">
            <p className="font-bold text-[#1F0B22] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>{t('نطاق التشغيل المقترح', 'Recommended Kitchen Tier')}</span>
            </p>
            <p className="text-[#68516B] tabular-nums leading-relaxed">
              {mealCount >= 600
                ? t(
                    'تخصيص خط إنتاج مركزي مخصص + سيارتين مبردتين',
                    'Dedicated central line + 2 insulated fleet vans',
                  )
                : t(
                    'توريد يومي من أقرب مطبخ مركزي معتمد',
                    'Daily dispatch from nearest certified central kitchen',
                  )}
            </p>
          </div>

          {estimateSaved && (
            <div className="p-3 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#3B123F] font-bold">
              {t(
                `تم حفظ التقدير المبدئي لعدد ${mealCount} وجبة يومياً.`,
                `Volume estimate saved for ${mealCount} daily meals.`,
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEstimateSaved(true)}
              className="min-h-[46px] px-3 rounded-xl bg-[#3B123F] text-[#F2D36B] text-xs font-bold cursor-pointer"
            >
              {t('تثبيت التقدير', 'Save Estimate')}
            </button>
            <button
              type="button"
              onClick={() => setShowSummarySheet(false)}
              className="min-h-[46px] px-3 rounded-xl bg-[#D4AF37] text-[#3B123F] text-xs font-bold cursor-pointer"
            >
              {t('إغلاق', 'Close')}
            </button>
          </div>
        </div>
      </BottomDetailSheet>
    </div>
  );
};
