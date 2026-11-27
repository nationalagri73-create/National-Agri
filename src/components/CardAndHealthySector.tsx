import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  QrCode,
  Salad,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';
import { BASIT_ASSETS } from '../data/seedDefaults';
import { useI18n } from '../i18n/translations';
import {
  createBenefitBookingRecord,
  enrollHealthySubscription,
  issueOrActivateBasitCard,
  redeemBasitCardVoucher,
  updateHealthySubscriptionStatus,
} from '../services/faydFirestore';
import {
  BasitCard,
  BasitCardRedemption,
  BenefitBooking,
  EntertainmentBenefit,
  HealthyPlan,
  HealthySubscription,
  UserProfile,
} from '../types/fayd';

interface CardAndHealthySectorProps {
  uid: string | null;
  userProfile: UserProfile | null;
  defaultPhone?: string;
  basitCards: BasitCard[];
  cardRedemptions: BasitCardRedemption[];
  benefits: EntertainmentBenefit[];
  benefitBookings: BenefitBooking[];
  healthyPlans: HealthyPlan[];
  healthySubscriptions: HealthySubscription[];
  onRequireAuth: () => void;
  onShowQr: (title: string, subtitle: string, payload: string) => void;
}

export const CardAndHealthySector: React.FC<CardAndHealthySectorProps> = ({
  uid,
  userProfile,
  defaultPhone,
  basitCards,
  cardRedemptions,
  benefits,
  benefitBookings,
  healthyPlans,
  healthySubscriptions,
  onRequireAuth,
  onShowQr,
}) => {
  const { isEn, t } = useI18n();
  const [subTab, setSubTab] = useState<'card' | 'healthy'>('card');
  const [healthyImgOk, setHealthyImgOk] = useState(true);
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'individual' | 'gym' | 'sports_center'>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Card issuance state
  const [empCode, setEmpCode] = useState('HB-001');
  const [factoryName, setFactoryName] = useState('مصنع ها-بي للكيماويات (Ha-Be)');
  const [redeemAmount, setRedeemAmount] = useState(120);
  const [redeemVendor, setRedeemVendor] = useState('مطبخ ومركز العين — مدينة بدر');

  // Healthy subscription modal state
  const [enrollPlan, setEnrollPlan] = useState<HealthyPlan | null>(null);
  const [subPhone, setSubPhone] = useState(defaultPhone || '');
  const [subGym, setSubGym] = useState('');
  const [subAddress, setSubAddress] = useState('');
  const [subStart, setSubStart] = useState(new Date().toISOString().slice(0, 10));

  const activeCard = basitCards[0] || null;
  const remainingEGP = activeCard
    ? Math.max(0, activeCard.monthlyQuotaEGP - activeCard.usedAmountEGP)
    : 0;
  const usagePct = activeCard && activeCard.monthlyQuotaEGP > 0
    ? Math.min(100, Math.round((activeCard.usedAmountEGP / activeCard.monthlyQuotaEGP) * 100))
    : 0;

  const filteredPlans = healthyPlans.filter(
    (p) => segmentFilter === 'all' || p.targetSegment === segmentFilter,
  );

  const handleActivateCard = async () => {
    if (!uid) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const cardId = await issueOrActivateBasitCard({
        ownerUid: uid,
        holderName: userProfile?.displayName || t('موظف باسط', 'BASIT Member'),
        employeeCode: empCode,
        tenantId: userProfile?.tenantId || 'tenant_factory_habe',
        factoryName,
        monthlyQuotaEGP: 1500,
      });
      setNotice(
        t(`تم تفعيل كارت باسط الرقمي (${cardId}) برصيد قسائم 1500 ج.م.`, `BASIT Card ${cardId} activated with 1500 EGP monthly voucher quota.`),
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر تفعيل الكارت', 'Activation failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeemVoucher = async () => {
    if (!uid || !activeCard) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await redeemBasitCardVoucher({
        card: activeCard,
        vendorName: redeemVendor,
        offerTitle: t('صرف قسيمة شهرية — كارت باسط', 'Monthly Voucher Redemption'),
        amountEGP: redeemAmount,
        discountSavedEGP: Math.round(redeemAmount * 0.15),
      });
      setNotice(
        t(
          `تم خصم ${redeemAmount} ج.م من رصيد القسائم وتوفير ${Math.round(redeemAmount * 0.15)} ج.م.`,
          `Redeemed ${redeemAmount} EGP from card voucher quota with 15% savings.`,
        ),
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر صرف القسيمة', 'Redemption failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookBenefit = async (b: EntertainmentBenefit) => {
    if (!uid) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const bookingId = await createBenefitBookingRecord({
        uid,
        userName: userProfile?.displayName || t('حامل كارت باسط', 'BASIT Cardholder'),
        tenantId: activeCard?.tenantId || 'tenant_factory_habe',
        benefitId: b.benefitId,
        venueName: b.venueName,
        requestedDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        peopleCount: 2,
        notes: t('حجز بمزايا كارت باسط الترفيهي', 'Booked via BASIT Card Entertainment Benefits'),
        employerName: activeCard?.factoryName || factoryName,
        employeeCode: activeCard?.employeeCode || empCode,
        phone: defaultPhone || '+201000000000',
        discountLabel: b.approvedBenefitText,
      });
      setNotice(
        t(`تم حجز العرض الترفيهي (${bookingId}) بنجاح.`, `Entertainment benefit booked (${bookingId}).`),
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر الحجز', 'Booking failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnrollHealthy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !enrollPlan) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const subId = await enrollHealthySubscription({
        subscriberUid: uid,
        subscriberName: userProfile?.displayName || t('مشترك باسط الصحي', 'BASIT Healthy Member'),
        phone: subPhone || '+201000000000',
        plan: enrollPlan,
        orgOrGymName: subGym,
        startDate: subStart,
        deliveryAddress: subAddress,
      });
      setNotice(
        t(`تم تفعيل اشتراك الوجبات الصحية رقم ${subId} بنجاح.`, `Healthy subscription ${subId} is now active.`),
      );
      setEnrollPlan(null);
      setSubAddress('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر الاشتراك', 'Enrollment failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-sector Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-[#1D152B]">
            {subTab === 'card'
              ? t('BASIT CARD | كارت مزايا الموظفين والقسائم', 'BASIT CARD | Employee Benefits & Vouchers')
              : t('BASIT HEALTHY | اشتراكات الوجبات الصحية والرياضيين', 'BASIT HEALTHY | Healthy Meal Subscriptions')}
          </h1>
          <p className="hidden sm:block text-xs text-[#6B6478]">
            {subTab === 'card'
              ? t('متابعة الرصيد الشهري، الصلاحية، القسائم، والخصومات الترفيهية', 'Track monthly allowance, validity, vouchers & entertainment perks')
              : t('برامج تغذية محسوبة السعرات للأفراد والجيمات والمراكز الرياضية', 'Macro-calculated meal plans for individuals, gyms & sports centers')}
          </p>
        </div>

        <div className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex items-center gap-1 p-1 bg-[#ECE4E8]/70 rounded-xl">
          <button
            type="button"
            onClick={() => setSubTab('card')}
            className={`min-h-[44px] px-3 sm:px-4 inline-flex items-center justify-center gap-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap active:scale-[0.98] transition-transform ${
              subTab === 'card' ? 'bg-[#3B123F] text-white' : 'text-[#3B123F] hover:bg-white/70'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#D4AF37]" />
            {t('كارت باسط والمزايا', 'BASIT Card')}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('healthy')}
            className={`min-h-[44px] px-3 sm:px-4 inline-flex items-center justify-center gap-2 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap active:scale-[0.98] transition-transform ${
              subTab === 'healthy' ? 'bg-[#3B123F] text-white' : 'text-[#3B123F] hover:bg-white/70'
            }`}
          >
            <Salad className="w-4 h-4 text-[#D4AF37]" />
            {t('باسط الصحي', 'BASIT Healthy')}
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          {notice}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          {errorMsg}
        </div>
      )}

      {subTab === 'card' ? (
        <div className="space-y-6">
          {/* Interactive Digital Card + Redemption Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-6 rounded-3xl p-6 bg-gradient-to-br from-[#3B123F] via-[#501C5A] to-[#230C42] text-white flex flex-col justify-between gap-6 border border-[#D4AF37]/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-[#D4AF37] tracking-wide">
                    BASIT CARD · {t('الوطنية اللوجستية', 'Al-Wataniya Logistics')}
                  </p>
                  <h2 className="mt-1 text-lg font-bold">
                    {activeCard
                      ? activeCard.holderName
                      : userProfile?.displayName || t('كارت مزايا باسط', 'BASIT Benefits Card')}
                  </h2>
                  <p className="text-xs text-purple-200">
                    {activeCard ? `${activeCard.factoryName} · ${activeCard.employeeCode}` : t('غير مفعل بعد', 'Not activated yet')}
                  </p>
                </div>
                {activeCard && (
                  <button
                    type="button"
                    onClick={() =>
                      onShowQr(
                        activeCard.holderName,
                        activeCard.cardNumberMasked,
                        `BASIT_CARD:${activeCard.cardId}:${activeCard.employeeCode}`,
                      )
                    }
                    className="min-h-[42px] px-3 inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#D4AF37] text-xs font-semibold cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    QR
                  </button>
                )}
              </div>

              {activeCard ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-purple-200">{t('الرصيد المتبقي هذا الشهر', 'Remaining Monthly Balance')}</span>
                    <span className="text-2xl font-bold text-[#D4AF37] tabular-nums">
                      {remainingEGP.toLocaleString()} {t('ج.م', 'EGP')}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-[#D4AF37] rounded-full transition-all"
                      style={{ width: `${100 - usagePct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-purple-200 tabular-nums">
                    <span>
                      {t('المستخدم:', 'Used:')} {activeCard.usedAmountEGP} / {activeCard.monthlyQuotaEGP} {t('ج.م', 'EGP')}
                    </span>
                    <span>
                      {t('الصلاحية حتى:', 'Valid Thru:')} {activeCard.validTo} · {activeCard.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#1D152B]">
                    <input
                      type="text"
                      value={empCode}
                      onChange={(e) => setEmpCode(e.target.value)}
                      placeholder={t('كود الموظف (مثال HB-001)', 'Employee Code')}
                      className="min-h-[40px] px-3 rounded-xl bg-white border border-white/20"
                    />
                    <input
                      type="text"
                      value={factoryName}
                      onChange={(e) => setFactoryName(e.target.value)}
                      placeholder={t('اسم المصنع أو الشركة', 'Factory / Company Name')}
                      className="min-h-[40px] px-3 rounded-xl bg-white border border-white/20"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleActivateCard}
                    className="w-full min-h-[44px] rounded-xl bg-[#D4AF37] text-[#2A104D] font-bold hover:bg-[#eab308] cursor-pointer"
                  >
                    {t('تفعيل كارت باسط وإصدار القسيمة الشهرية', 'Activate BASIT Card & Monthly Voucher')}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Voucher Redemption & History */}
            <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#ECE4E8] rounded-3xl p-5 flex flex-col justify-between gap-4 text-xs">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#3B123F]" />
                  <h3 className="text-base font-bold text-[#1D152B]">
                    {t('استخدام القسيمة الشهرية عند الشركاء', 'Redeem Monthly Voucher at Partners')}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    value={redeemVendor}
                    onChange={(e) => setRedeemVendor(e.target.value)}
                    className="min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
                  >
                    <option value="مطبخ ومركز العين — مدينة بدر">مطبخ ومركز العين — مدينة بدر</option>
                    <option value="ماركت زادي الوطني للتوريدات">ماركت زادي الوطني للتوريدات</option>
                    <option value="منتجع العين السخنة العائلي">منتجع العين السخنة العائلي</option>
                  </select>
                  <input
                    type="number"
                    min={10}
                    max={Math.max(10, remainingEGP || 1500)}
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(Math.max(10, Number(e.target.value) || 10))}
                    className="min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white tabular-nums"
                  />
                </div>
                <button
                  type="button"
                  disabled={!activeCard || submitting || remainingEGP < redeemAmount}
                  onClick={handleRedeemVoucher}
                  className="w-full min-h-[44px] rounded-xl bg-[#3B123F] text-white font-bold hover:bg-[#501C5A] cursor-pointer disabled:opacity-50"
                >
                  {t('خصم من رصيد الكارت وتأكيد القسيمة', 'Redeem Voucher Balance')}
                </button>
              </div>

              <div className="pt-3 border-t border-[#ECE4E8] space-y-2">
                <p className="font-bold text-[#1D152B]">
                  {t('آخر عمليات استخدام الكارت', 'Recent Card Redemptions')} ({cardRedemptions.length})
                </p>
                {cardRedemptions.length === 0 ? (
                  <p className="text-[#6B6478]">
                    {t('لا توجد عمليات صرف قسائم مسجلة حتى الآن.', 'No voucher redemptions recorded yet.')}
                  </p>
                ) : (
                  cardRedemptions.slice(0, 3).map((r) => (
                    <div key={r.redemptionId} className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[#1D152B]">{r.vendorName}</span>
                      <span className="tabular-nums font-bold text-[#3B123F]">
                        -{r.amountEGP} {t('ج.م', 'EGP')} ({t('وفر', 'Saved')} {r.discountSavedEGP})
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Entertainment Benefits & Discounts */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#1D152B]">
              {t('الخصومات والعروض الترفيهية لحاملي كارت باسط', 'Discounts & Entertainment Offers')}
            </h2>
            <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 pb-1 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible">
              {benefits.map((b) => (
                <div
                  key={b.benefitId}
                  className="min-w-[275px] max-w-[82vw] md:min-w-0 md:max-w-none snap-start bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4 flex flex-col justify-between gap-3 text-xs shrink-0"
                >
                  <div className="space-y-1.5">
                    <p className="font-bold text-[#3B123F]">{b.approvedBenefitText}</p>
                    <h3 className="text-sm font-bold text-[#1D152B]">{b.venueName}</h3>
                    <p className="text-[#6B6478] leading-relaxed">{b.description}</p>
                    <p className="text-[11px] text-[#6B6478] tabular-nums">
                      {t('ساري حتى:', 'Valid until:')} {b.validTo}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleBookBenefit(b)}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#3B123F] text-white font-semibold hover:bg-[#501C5A] active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {t('حجز واستفادة بالخصم', 'Book with BASIT Card')}
                  </button>
                </div>
              ))}
            </div>

            {benefitBookings.length > 0 && (
              <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4 text-xs space-y-2">
                <p className="font-bold text-[#1D152B]">
                  {t('حجوزات المزايا الترفيهية الخاصة بك', 'Your Entertainment Bookings')}
                </p>
                {benefitBookings.map((bk) => (
                  <div key={bk.bookingId} className="flex items-center justify-between py-1 border-b border-[#ECE4E8] last:border-0">
                    <span>{bk.venueName} · {bk.requestedDate}</span>
                    <span className="font-bold text-[#3B123F]">{bk.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {/* BASIT HEALTHY Hero */}
          <section className="rounded-3xl bg-[#501C5A] text-white overflow-hidden border border-[#3B123F]">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-7 p-4 sm:p-8 flex flex-col justify-center gap-3">
                <p className="text-[11px] sm:text-xs font-semibold text-[#D4AF37]">BASIT HEALTHY</p>
                <h2 className="text-lg sm:text-3xl font-bold leading-snug">
                  {t(
                    'اشتراكات الوجبات الصحية للأفراد والجيمات والمراكز الرياضية',
                    'Macro-Balanced Healthy Meal Subscriptions for Individuals & Gyms',
                  )}
                </h2>
                <p className="hidden sm:block text-sm text-purple-100/90 leading-relaxed max-w-2xl">
                  {t(
                    'وجبات طازجة موزونة البروتين والكربوهيدرات والسعرات الحرارية بتحضير يومي من مطابخنا المركزية.',
                    'Freshly prepared, macro-counted daily meal programs dispatched straight from our central kitchens.',
                  )}
                </p>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5">
                  {(
                    [
                      { id: 'all', ar: 'جميع الباقات', en: 'All Plans' },
                      { id: 'individual', ar: 'الأفراد', en: 'Individuals' },
                      { id: 'gym', ar: 'الجيمات', en: 'Gyms' },
                      { id: 'sports_center', ar: 'المراكز الرياضية', en: 'Sports Centers' },
                    ] as const
                  ).map((seg) => (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setSegmentFilter(seg.id)}
                      className={`min-h-[44px] px-3.5 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 active:scale-[0.98] transition-transform ${
                        segmentFilter === seg.id
                          ? 'bg-[#D4AF37] text-[#2A104D]'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {isEn ? seg.en : seg.ar}
                    </button>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-5 relative h-32 sm:h-48 lg:h-auto lg:min-h-[210px] bg-[#2A104D]">
                {healthyImgOk ? (
                  <img
                    src={BASIT_ASSETS.healthyMeals}
                    alt={t('وجبات باسط الصحية المتوازنة', 'BASIT Healthy Meal Prep')}
                    referrerPolicy="no-referrer"
                    onError={() => setHealthyImgOk(false)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Dumbbell className="w-10 h-10 text-[#D4AF37]" />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Healthy Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => (
              <div
                key={plan.planId}
                className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 flex flex-col justify-between gap-4 text-xs"
              >
                <div className="space-y-2.5">
                  <p className="font-semibold text-[#3B123F]">
                    {plan.targetSegment === 'individual'
                      ? t('باقة أفراد', 'Individual Plan')
                      : plan.targetSegment === 'gym'
                        ? t('باقة جيم ورياضيين', 'Gym & Athlete Plan')
                        : t('باقة مراكز وأكاديميات', 'Sports Center Plan')}
                  </p>
                  <h3 className="text-base font-bold text-[#1D152B]">
                    {isEn ? plan.titleEn : plan.titleAr}
                  </h3>
                  <p className="text-[#6B6478] leading-relaxed">
                    {isEn ? plan.descriptionEn : plan.descriptionAr}
                  </p>
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#FFFEFC] border border-[#ECE4E8] text-center tabular-nums">
                    <div>
                      <p className="text-[10px] text-[#6B6478]">{t('السعرات', 'Calories')}</p>
                      <p className="font-bold text-[#1D152B]">{plan.caloriesPerDay}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B6478]">{t('البروتين', 'Protein')}</p>
                      <p className="font-bold text-[#3B123F]">{plan.proteinGrams}g</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B6478]">{t('وجبات/يوم', 'Meals/d')}</p>
                      <p className="font-bold text-[#1D152B]">{plan.mealsPerDay}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between tabular-nums">
                    <span className="text-lg font-bold text-[#3B123F]">
                      {plan.priceEGP.toLocaleString()} {t('ج.م', 'EGP')}
                    </span>
                    <span className="text-[#6B6478]">
                      {plan.durationDays} {t('يوم', 'days')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => (uid ? setEnrollPlan(plan) : onRequireAuth())}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B123F] text-white font-bold hover:bg-[#501C5A] cursor-pointer"
                  >
                    <Activity className="w-4 h-4 text-[#D4AF37]" />
                    {t('اشترك في الباقة', 'Subscribe Now')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Active User Healthy Subscriptions */}
          {healthySubscriptions.length > 0 && (
            <section className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3 text-xs">
              <h3 className="text-base font-bold text-[#1D152B]">
                {t('اشتراكاتك الصحية النشطة', 'Your Healthy Meal Subscriptions')}
              </h3>
              <div className="space-y-2">
                {healthySubscriptions.map((sub) => (
                  <div
                    key={sub.subId}
                    className="p-3 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-[#1D152B]">{sub.planTitle}</p>
                      <p className="text-[#6B6478] tabular-nums">
                        {sub.deliveryAddress} · {t('بدء:', 'Start:')} {sub.startDate} ·{' '}
                        {sub.totalPriceEGP} {t('ج.م', 'EGP')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {sub.status}
                      </span>
                      {sub.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateHealthySubscriptionStatus(
                              sub.subId,
                              sub.status === 'active' ? 'paused' : 'active',
                            )
                          }
                          className="min-h-[34px] px-2.5 rounded-lg border border-[#ECE4E8] bg-white font-semibold cursor-pointer"
                        >
                          {sub.status === 'active' ? t('إيقاف مؤقت', 'Pause') : t('استئناف', 'Resume')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Enrollment Modal (Bottom Sheet on Mobile) */}
          {enrollPlan && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
              <form
                onSubmit={handleEnrollHealthy}
                className="w-full sm:max-w-md bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-safe border border-[#ECE4E8] shadow-xl space-y-3 text-xs max-h-[90dvh] overflow-y-auto"
              >
                <div className="w-10 h-1 rounded-full bg-[#D9D0C0] mx-auto mb-1 sm:hidden" />
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1D152B]">
                    {t('تفعيل اشتراك الوجبات الصحية', 'Enroll in Healthy Meal Plan')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEnrollPlan(null)}
                    aria-label={t('إغلاق', 'Close')}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-[#FFFEFC] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="font-semibold text-[#3B123F]">
                  {isEn ? enrollPlan.titleEn : enrollPlan.titleAr} — {enrollPlan.priceEGP} {t('ج.م', 'EGP')}
                </p>
                <input
                  type="tel"
                  required
                  value={subPhone}
                  onChange={(e) => setSubPhone(e.target.value)}
                  placeholder={t('رقم الهاتف', 'Phone Number')}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
                />
                <input
                  type="text"
                  value={subGym}
                  onChange={(e) => setSubGym(e.target.value)}
                  placeholder={t('اسم الجيم / المركز الرياضي (اختياري)', 'Gym or Sports Center Name (optional)')}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
                />
                <input
                  type="date"
                  value={subStart}
                  onChange={(e) => setSubStart(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
                />
                <input
                  type="text"
                  required
                  value={subAddress}
                  onChange={(e) => setSubAddress(e.target.value)}
                  placeholder={t('عنوان التوصيل اليومي', 'Daily Delivery Address')}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[46px] rounded-xl bg-[#3B123F] text-white text-sm font-bold hover:bg-[#501C5A] cursor-pointer"
                >
                  {submitting ? t('جاري التفعيل...', 'Activating...') : t('تأكيد الاشتراك', 'Confirm Subscription')}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
