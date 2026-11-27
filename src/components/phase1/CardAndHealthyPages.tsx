import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  HealthyPlanPreview,
  PHASE1_HEALTHY_PLANS,
  PHASE1_PHOTOS,
} from '../../data/phase1Data';
import { useI18n } from '../../i18n/translations';
import { BasitPermissions } from '../../lib/rbac';
import { UserProfile } from '../../types/fayd';
import { BasitCardSector } from './BasitCardSector';
import { BottomDetailSheet, SectorHeroCard } from './SharedUI';

export interface CardPageProps {
  permissions?: BasitPermissions;
  authUser?: { uid: string; email?: string | null; displayName?: string | null } | null;
  userProfile?: UserProfile | null;
}

export const CardPage: React.FC<CardPageProps> = (props) => {
  return <BasitCardSector {...props} />;
};

export { BasitCardSector };

export const HealthyPage: React.FC = () => {
  const { isEn, t } = useI18n();
  const [segment, setSegment] = useState<'all' | 'individual' | 'gym' | 'sports_center'>(
    'all',
  );
  const [selectedPlan, setSelectedPlan] = useState<HealthyPlanPreview | null>(null);
  const [enrolledPlanId, setEnrolledPlanId] = useState<string | null>(null);

  const visiblePlans = PHASE1_HEALTHY_PLANS.filter(
    (p) => segment === 'all' || p.segment === segment,
  );

  return (
    <div className="space-y-5">
      <SectorHeroCard
        code="BASIT HEALTHY"
        title={t('اشتراكات الوجبات الصحية والرياضيين', 'Healthy Meal Subscriptions')}
        description={t(
          'برامج غذائية محسوبة السعرات والبروتين للأفراد والجيمات والمراكز الرياضية.',
          'Macro-balanced daily meal subscriptions tailored for individuals, gyms & sports centers.',
        )}
        image={PHASE1_PHOTOS.healthyMeals}
        imageAlt={t('وجبات باسط الصحية', 'BASIT Healthy Meals')}
      />

      {/* Bounded Wrapping Segment Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all', ar: 'جميع الباقات', en: 'All Plans' },
            { id: 'individual', ar: 'الأفراد', en: 'Individuals' },
            { id: 'gym', ar: 'الجيمات', en: 'Gyms' },
            { id: 'sports_center', ar: 'المراكز الرياضية', en: 'Sports Centers' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSegment(tab.id)}
            className={`min-h-[42px] px-3.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              segment === tab.id
                ? 'bg-[#3B123F] text-[#F2D36B]'
                : 'bg-[#FFFFFF] border border-[#ECE4E8] text-[#1F0B22]'
            }`}
          >
            {isEn ? tab.en : tab.ar}
          </button>
        ))}
      </div>

      {/* Meal Plan Cards */}
      <div className="grid grid-cols-1 gap-3.5">
        {visiblePlans.map((plan) => (
          <article
            key={plan.id}
            className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] p-4 flex flex-col justify-between gap-4 shadow-xs"
          >
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold text-[#501C5A]">
                {plan.segment === 'individual'
                  ? t('باقة الأفراد', 'Individual')
                  : plan.segment === 'gym'
                    ? t('باقة الجيمات', 'Gym & Athlete')
                    : t('المراكز الرياضية', 'Sports Center')}
              </p>
              <h2 className="text-base font-bold text-[#1F0B22] break-words">
                {isEn ? plan.titleEn : plan.titleAr}
              </h2>

              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#FFFEFC] border border-[#ECE4E8] text-center tabular-nums">
                <div className="min-w-0">
                  <p className="text-[10px] text-[#68516B]">{t('السعرات', 'Kcal')}</p>
                  <p className="text-xs font-bold text-[#1F0B22]">{plan.calories}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#68516B]">{t('البروتين', 'Protein')}</p>
                  <p className="text-xs font-bold text-[#3B123F]">{plan.proteinGrams}g</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#68516B]">{t('وجبات/يوم', 'Meals')}</p>
                  <p className="text-xs font-bold text-[#1F0B22]">{plan.mealsPerDay}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between tabular-nums">
                <span className="text-base font-bold text-[#3B123F]">
                  {plan.priceEGP.toLocaleString()} {t('ج.م', 'EGP')}
                </span>
                <span className="text-xs text-[#68516B]">
                  {plan.durationDays} {t('يوماً', 'days')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEnrolledPlanId(null);
                  setSelectedPlan(plan);
                }}
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B123F] text-[#F2D36B] text-xs font-bold hover:bg-[#501C5A] cursor-pointer"
              >
                <Activity className="w-4 h-4 text-[#D4AF37]" />
                <span>{t('معاينة الجدول اليومي', 'Preview Daily Menu')}</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <BottomDetailSheet
        open={Boolean(selectedPlan)}
        title={selectedPlan ? (isEn ? selectedPlan.titleEn : selectedPlan.titleAr) : ''}
        subtitle={
          selectedPlan
            ? `${selectedPlan.calories} kcal · ${selectedPlan.proteinGrams}g protein`
            : ''
        }
        onClose={() => setSelectedPlan(null)}
      >
        {selectedPlan && (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] space-y-1.5">
              <p className="font-bold text-[#1F0B22]">
                {t('نموذج وجبات اليوم', 'Sample Daily Menu')}
              </p>
              <p className="text-[#68516B] leading-relaxed break-words">
                {isEn ? selectedPlan.sampleMenuEn : selectedPlan.sampleMenuAr}
              </p>
            </div>

            {enrolledPlanId === selectedPlan.id && (
              <div className="p-3 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#3B123F] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {t(
                    'تم تسجيل طلب الاشتراك في الباقة بنجاح.',
                    'Healthy plan subscription request recorded.',
                  )}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEnrolledPlanId(selectedPlan.id)}
                className="min-h-[46px] px-3 rounded-xl bg-[#3B123F] text-[#F2D36B] text-xs font-bold cursor-pointer"
              >
                {t('طلب اشتراك', 'Subscribe')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
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
