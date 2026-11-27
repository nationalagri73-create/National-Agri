import React, { useMemo, useState } from 'react';
import {
  Building2,
  ChefHat,
  FileText,
  MapPin,
  Package,
  Plus,
  QrCode,
  ShoppingBag,
  Star,
  Store,
  Tag,
  X,
} from 'lucide-react';
import { BASIT_ASSETS } from '../data/seedDefaults';
import { useI18n } from '../i18n/translations';
import {
  createCommercialOrder,
  createMarketplaceReviewRecord,
  createMarketplaceRfqRecord,
  respondToMarketplaceRfq,
  submitOnboardingApplication,
} from '../services/faydFirestore';
import {
  CatalogItem,
  CommissionRule,
  CountryCode,
  MarketplaceReview,
  MarketplaceRfq,
  OfferAd,
  OnboardingEntityType,
  OnboardingTargetRole,
  PublicStorefront,
  SubscriptionPlan,
  UserProfile,
} from '../types/fayd';

interface MarketplaceSectorProps {
  uid: string | null;
  userProfile: UserProfile | null;
  defaultPhone?: string;
  storefronts: PublicStorefront[];
  catalogItems: CatalogItem[];
  plans: SubscriptionPlan[];
  commissionRule: CommissionRule;
  offersAds: OfferAd[];
  reviews: MarketplaceReview[];
  rfqs: MarketplaceRfq[];
  onRequireAuth: () => void;
  onShowQr: (title: string, subtitle: string, payload: string) => void;
  onNavigateSection: (section: string) => void;
}

const KITCHEN_KIND_FILTERS = [
  { id: 'all', ar: 'الكل', en: 'All' },
  { id: 'central_kitchen', ar: 'المطابخ المركزية', en: 'Central Kitchens' },
  { id: 'supplier', ar: 'الموردون والماركت', en: 'Suppliers & Wholesale' },
  { id: 'restaurant', ar: 'مطاعم التموين', en: 'Catering Kitchens' },
] as const;

export const MarketplaceSector: React.FC<MarketplaceSectorProps> = ({
  uid,
  userProfile,
  defaultPhone,
  storefronts,
  catalogItems,
  plans,
  commissionRule,
  offersAds,
  reviews,
  rfqs,
  onRequireAuth,
  onShowQr,
  onNavigateSection,
}) => {
  const { isEn, t } = useI18n();
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [heroImgOk, setHeroImgOk] = useState(true);
  const [kitchenImgOk, setKitchenImgOk] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Order checkout state
  const [checkoutItem, setCheckoutItem] = useState<CatalogItem | null>(null);
  const [qty, setQty] = useState(1);
  const [needsDelivery, setNeedsDelivery] = useState(true);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // RFQ modal state
  const [rfqTarget, setRfqTarget] = useState<PublicStorefront | null>(null);
  const [rfqOrg, setRfqOrg] = useState('');
  const [rfqPhone, setRfqPhone] = useState(defaultPhone || '');
  const [rfqQty, setRfqQty] = useState(100);
  const [rfqFreq, setRfqFreq] = useState<MarketplaceRfq['frequency']>('daily');
  const [rfqCity, setRfqCity] = useState('مدينة بدر');
  const [rfqDetails, setRfqDetails] = useState('');

  // Review modal state
  const [reviewTarget, setReviewTarget] = useState<PublicStorefront | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Onboarding modal state
  const [showOnboard, setShowOnboard] = useState(false);
  const [targetRole, setTargetRole] = useState<OnboardingTargetRole>('kitchen_manager');
  const [entityType, setEntityType] = useState<OnboardingEntityType>('central_kitchen');
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [city, setCity] = useState('مدينة بدر');
  const [countryCode, setCountryCode] = useState<CountryCode>('EG');
  const [regRef, setRegRef] = useState('');
  const [planId, setPlanId] = useState(plans[0]?.planId || 'plan_kitchen_pro');
  const [notes, setNotes] = useState('');

  // Merchant quote input per RFQ
  const [quoteInputs, setQuoteInputs] = useState<Record<string, { price: string; note: string }>>({});

  const vendorStorefronts = useMemo(
    () =>
      storefronts.filter((sf) => {
        if (sf.entityType === 'company_factory') return false;
        if (kindFilter === 'all') return true;
        if (kindFilter === 'supplier') {
          return sf.entityType === 'supplier' || sf.entityType === 'store';
        }
        return sf.entityType === kindFilter;
      }),
    [storefronts, kindFilter],
  );

  const visibleCatalog = useMemo(() => {
    const validIds = new Set(vendorStorefronts.map((s) => s.tenantId));
    return catalogItems.filter((item) => validIds.has(item.tenantId));
  }, [catalogItems, vendorStorefronts]);

  const reviewsByTenant = useMemo(() => {
    const map: Record<string, MarketplaceReview[]> = {};
    for (const r of reviews) {
      if (!map[r.tenantId]) map[r.tenantId] = [];
      map[r.tenantId].push(r);
    }
    return map;
  }, [reviews]);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !checkoutItem) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const orderId = await createCommercialOrder({
        customerUid: uid,
        customerName: userProfile?.displayName || t('عميل باسط', 'BASIT Client'),
        item: checkoutItem,
        quantity: qty,
        needsDelivery,
        dropoffAddress:
          address.trim() || t('استلام مباشر من مقر المطبخ', 'Direct pickup from kitchen'),
        commissionPct: commissionRule.defaultOrderCommissionPct,
        deliveryFeeEGP: commissionRule.minDeliveryFeeEGP,
      });
      setNotice(
        t(
          `تم تسجيل طلب التوريد رقم ${orderId} وإرساله مباشرة للمورد.`,
          `Commercial order ${orderId} has been placed and routed to the supplier.`,
        ),
      );
      setCheckoutItem(null);
      setAddress('');
      setQty(1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر إتمام الطلب', 'Order failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !rfqTarget) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const rfqId = await createMarketplaceRfqRecord({
        requesterUid: uid,
        requesterOrgName: rfqOrg.trim() || userProfile?.displayName || 'جهة متعاقدة',
        phone: rfqPhone.trim() || '+201000000000',
        targetTenantId: rfqTarget.tenantId,
        targetMerchantOwnerUid: 'seed_admin',
        targetName: isEn ? rfqTarget.nameEn || rfqTarget.name : rfqTarget.name,
        dailyQty: rfqQty,
        frequency: rfqFreq,
        city: rfqCity.trim() || rfqTarget.city,
        details: rfqDetails.trim() || 'طلب توريد وجبات يومية بمواصفات قياسية',
      });
      setNotice(
        t(
          `تم إرسال طلب عرض السعر (${rfqId}) إلى ${rfqTarget.name}.`,
          `Quote request (${rfqId}) sent to ${rfqTarget.nameEn || rfqTarget.name}.`,
        ),
      );
      setRfqTarget(null);
      setRfqDetails('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر إرسال الطلب', 'Failed to send RFQ'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !reviewTarget) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createMarketplaceReviewRecord({
        tenantId: reviewTarget.tenantId,
        authorUid: uid,
        authorName: userProfile?.displayName || t('عميل موثق', 'Verified Client'),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setNotice(
        t('تم نشر تقييمك الموثق بنجاح.', 'Your verified rating has been published.'),
      );
      setReviewTarget(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر حفظ التقييم', 'Failed to save review'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const appId = await submitOnboardingApplication({
        applicantUid: uid,
        targetRole,
        entityType,
        businessName,
        contactName: contactName || userProfile?.displayName || 'Partner',
        phone,
        countryCode,
        city,
        commercialRegRef: regRef,
        selectedPlanId: planId,
        notes,
      });
      setNotice(
        t(
          `تم استلام طلب الانضمام (${appId}) لمراجعة الإدارة المركزية.`,
          `Partner application (${appId}) submitted for admin review.`,
        ),
      );
      setShowOnboard(false);
      setBusinessName('');
      setRegRef('');
      setNotes('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر إرسال الطلب', 'Submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner Split (Royal Purple + Luminous Gold + Real Logistics Image) */}
      <section className="rounded-3xl bg-[#501C5A] text-white overflow-hidden border border-[#3B123F]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-4 sm:p-8 flex flex-col justify-between gap-4">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-[#D4AF37]">
                {t('الشركة الوطنية اللوجستية · BASIT MARKETPLACE', 'Al-Wataniya Logistics · BASIT MARKETPLACE')}
              </p>
              <h1 className="mt-1.5 text-lg sm:text-3xl font-bold leading-snug text-balance">
                {t(
                  'سوق المطابخ المركزية والموردين والتشغيل الغذائي المتكامل',
                  'Central Kitchens, Verified Suppliers & Commercial Catering Hub',
                )}
              </h1>
              <p className="hidden sm:block mt-3 text-sm text-purple-100/90 leading-relaxed max-w-2xl">
                {t(
                  'استعرض المطابخ المركزية المعتمدة، الطاقات الإنتاجية اليومية، ومناطق الخدمة — واطلب عروض أسعار فورية أو توريد مباشر للشركات والمصانع والأفراد.',
                  'Explore certified central kitchens, daily meal capacities, and service regions — request institutional quotes or place direct supply orders.',
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => (uid ? setShowOnboard(true) : onRequireAuth())}
                className="min-h-[44px] px-4 sm:px-5 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] text-[#2A104D] text-xs sm:text-sm font-bold hover:bg-[#eab308] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                {t('انضم كمطبخ أو مورّد', 'Join as Kitchen / Supplier')}
              </button>
              <button
                type="button"
                onClick={() => onNavigateSection('business')}
                className="min-h-[44px] px-4 sm:px-5 inline-flex items-center gap-2 rounded-xl bg-white/10 text-white border border-white/20 text-xs sm:text-sm font-semibold hover:bg-white/20 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                {t('تعاقدات الأعمال', 'B2B Catering')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative h-36 sm:h-48 lg:h-auto lg:min-h-full bg-[#2A104D]">
            {heroImgOk ? (
              <img
                src={BASIT_ASSETS.heroLogistics}
                alt={t('عمليات باسط اللوجستية والمطابخ المركزية', 'BASIT Food Logistics Hub')}
                referrerPolicy="no-referrer"
                onError={() => setHeroImgOk(false)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#3B123F] to-[#2A104D]">
                <ChefHat className="w-12 h-12 text-[#D4AF37]" />
                <span className="mt-2 text-sm font-bold">BASIT | باسط</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A104D]/85 via-[#2A104D]/25 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {notice && (
        <div
          role="status"
          className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800"
        >
          {notice}
        </div>
      )}
      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700"
        >
          {errorMsg}
        </div>
      )}

      {/* Approved Marketplace Offers Strip */}
      {offersAds.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {offersAds.slice(0, 3).map((ad) => (
            <div
              key={ad.offerId}
              className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#6B6478]">
                  <span>{ad.countryCode}</span>
                  <span className="font-bold text-[#3B123F]">
                    {isEn ? ad.discountBadgeEn : ad.discountBadgeAr}
                  </span>
                </div>
                <h3 className="mt-1.5 text-sm font-bold text-[#1D152B] leading-snug">
                  {isEn ? ad.titleEn : ad.titleAr}
                </h3>
                {ad.terms && (
                  <p className="mt-1 text-xs text-[#6B6478] line-clamp-2">{ad.terms}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  onNavigateSection(
                    ad.offerId === 'offer_alain_habe_92' ? 'factory' : 'business',
                  )
                }
                className="min-h-[40px] px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#3B123F] text-white text-xs font-semibold hover:bg-[#501C5A] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                {isEn ? ad.ctaEn : ad.ctaAr}
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Central Kitchens & Suppliers Directory */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1D152B]">
              {t('المطابخ المركزية والموردون المعتمدون', 'Certified Central Kitchens & Suppliers')}
            </h2>
            <p className="text-xs text-[#6B6478]">
              {t(
                'ملفات تشغيلية كاملة بالطاقات اليومية ومناطق التغطية وطلبات عروض الأسعار (RFQ)',
                'Full profiles with daily meal capacities, service zones, reviews & RFQ quoting',
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#ECE4E8]/60 rounded-xl overflow-x-auto no-scrollbar">
            {KITCHEN_KIND_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setKindFilter(f.id)}
                className={`min-h-[40px] px-3.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  kindFilter === f.id
                    ? 'bg-[#3B123F] text-white'
                    : 'text-[#3B123F] hover:bg-white/70'
                }`}
              >
                {isEn ? f.en : f.ar}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendorStorefronts.map((sf) => {
            const tenantRevs = reviewsByTenant[sf.tenantId] || [];
            const avg =
              tenantRevs.length > 0
                ? (
                    tenantRevs.reduce((s, r) => s + r.rating, 0) / tenantRevs.length
                  ).toFixed(1)
                : (sf.averageRating ?? 4.8).toFixed(1);
            const revCount = (sf.ratingCount ?? 0) + tenantRevs.length;

            return (
              <article
                key={sf.tenantId}
                className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-36 bg-[#501C5A] relative overflow-hidden">
                    {kitchenImgOk ? (
                      <img
                        src={sf.logoUrl || BASIT_ASSETS.centralKitchen}
                        alt={isEn ? sf.nameEn || sf.name : sf.name}
                        referrerPolicy="no-referrer"
                        onError={() => setKitchenImgOk(false)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3B123F] to-[#2A104D] text-[#D4AF37]">
                        <Store className="w-9 h-9" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 start-4 end-4 flex items-end justify-between gap-2 text-white">
                      <div>
                        <p className="text-[11px] text-[#D4AF37] font-semibold">
                          {sf.city} · {sf.countryCode}
                        </p>
                        <h3 className="text-base font-bold leading-tight">
                          {isEn ? sf.nameEn || sf.name : sf.name}
                        </h3>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-[#D4AF37] inline-flex items-center gap-1 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {avg} ({revCount})
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5 text-xs">
                    <p className="text-[#1D152B] font-medium leading-relaxed">
                      {isEn
                        ? sf.specialtiesEn || sf.specialtiesAr
                        : sf.specialtiesAr || t('توريد وإعاشة غذائية معتمدة', 'Certified food supply & catering')}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#6B6478]">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Package className="w-3.5 h-3.5 text-[#3B123F]" />
                        {t('الطاقة التشغيلية:', 'Daily Capacity:')}{' '}
                        <strong className="text-[#1D152B]">
                          {(sf.capacityMealsPerDay || 2500).toLocaleString()}
                        </strong>{' '}
                        {t('وجبة/يوم', 'meals/day')}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#3B123F]" />
                        {sf.serviceAreasCsv || sf.city}
                      </span>
                    </div>

                    {tenantRevs.length > 0 && (
                      <div className="pt-2 border-t border-[#ECE4E8] text-[11px] text-[#6B6478]">
                        “{tenantRevs[0].comment}” — {tenantRevs[0].authorName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => (uid ? setRfqTarget(sf) : onRequireAuth())}
                    className="flex-1 min-h-[42px] px-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#3B123F] text-white text-xs font-semibold hover:bg-[#501C5A] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {t('طلب عرض سعر (RFQ)', 'Request Quote')}
                  </button>
                  <button
                    type="button"
                    onClick={() => (uid ? setReviewTarget(sf) : onRequireAuth())}
                    className="min-h-[42px] px-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#ECE4E8] bg-white text-[#1D152B] text-xs font-semibold hover:bg-[#FFFEFC] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    {t('تقييم', 'Review')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onShowQr(
                        isEn ? sf.nameEn || sf.name : sf.name,
                        `${sf.city} · ${sf.countryCode}`,
                        `BASIT_PARTNER:${sf.tenantId}`,
                      )
                    }
                    className="min-h-[42px] px-3 inline-flex items-center justify-center rounded-xl border border-[#ECE4E8] bg-white text-[#3B123F] hover:bg-[#FFFEFC] cursor-pointer"
                    aria-label={t('رمز QR للمورد', 'Supplier QR')}
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Catalog Items Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#1D152B]">
            {t('كتالوج التوريد والوجبات المباشرة', 'Direct Supply & Meal Catalog')}
          </h2>
          <span className="text-xs text-[#6B6478] tabular-nums">
            {visibleCatalog.length} {t('منتج متاح', 'items available')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleCatalog.map((item) => (
            <div
              key={item.itemId}
              className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <p className="text-[11px] text-[#6B6478]">
                  {item.category} · {item.storeName}
                </p>
                <h3 className="mt-1 text-sm font-bold text-[#1D152B] leading-snug">
                  {item.title}
                </h3>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-base font-bold text-[#3B123F] tabular-nums">
                    {item.priceEGP} {t('ج.م', 'EGP')}
                  </span>
                  <span className="text-[11px] text-[#6B6478] tabular-nums">
                    {t('متاح:', 'Stock:')} {item.stockQty}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => (uid ? setCheckoutItem(item) : onRequireAuth())}
                className="w-full min-h-[42px] px-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#3B123F] text-white text-xs font-semibold hover:bg-[#501C5A] transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
                {t('طلب وتوريد مباشر', 'Order Direct')}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Active User / Merchant RFQs */}
      {rfqs.length > 0 && (
        <section className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-bold text-[#1D152B]">
            {t('طلبات عروض الأسعار النشطة (B2B RFQs)', 'Active B2B Quote Requests')}
          </h2>
          <div className="space-y-3">
            {rfqs.map((r) => {
              const qState = quoteInputs[r.rfqId] || {
                price: String(r.quotedPriceEGP || ''),
                note: r.merchantNote || '',
              };
              const isMerchantOrAdmin =
                uid === r.targetMerchantOwnerUid ||
                userProfile?.role === 'platform_owner' ||
                userProfile?.role === 'system_admin' ||
                userProfile?.role === 'kitchen_manager';
              const isRequester = uid === r.requesterUid;

              return (
                <div
                  key={r.rfqId}
                  className="p-3.5 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#1D152B]">
                      {r.requesterOrgName} → {r.targetName}
                    </span>
                    <span className="font-semibold text-[#3B123F] tabular-nums">
                      {r.dailyQty} {t('وجبة', 'meals')} · {r.frequency} · {r.status}
                    </span>
                  </div>
                  <p className="text-[#6B6478]">{r.details}</p>
                  {r.quotedPriceEGP > 0 && (
                    <p className="font-bold text-emerald-700 tabular-nums">
                      {t('العرض المقدم:', 'Quoted Price:')} {r.quotedPriceEGP}{' '}
                      {t('ج.م', 'EGP')} {r.merchantNote ? `— ${r.merchantNote}` : ''}
                    </p>
                  )}

                  {r.status === 'open' && isMerchantOrAdmin && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="number"
                        min={1}
                        value={qState.price}
                        onChange={(e) =>
                          setQuoteInputs((prev) => ({
                            ...prev,
                            [r.rfqId]: { ...qState, price: e.target.value },
                          }))
                        }
                        placeholder={t('السعر الإجمالي (ج.م)', 'Total Quote (EGP)')}
                        className="min-h-[38px] px-2.5 rounded-lg border border-[#ECE4E8] bg-white w-36"
                      />
                      <input
                        type="text"
                        value={qState.note}
                        onChange={(e) =>
                          setQuoteInputs((prev) => ({
                            ...prev,
                            [r.rfqId]: { ...qState, note: e.target.value },
                          }))
                        }
                        placeholder={t('ملاحظة المطبخ / المورد', 'Merchant terms')}
                        className="min-h-[38px] px-2.5 rounded-lg border border-[#ECE4E8] bg-white flex-1 min-w-[160px]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          void respondToMarketplaceRfq({
                            rfqId: r.rfqId,
                            status: 'quoted',
                            quotedPriceEGP: Number(qState.price) || 1000,
                            merchantNote: qState.note,
                          })
                        }
                        className="min-h-[38px] px-3 rounded-lg bg-[#3B123F] text-white font-semibold cursor-pointer"
                      >
                        {t('إرسال عرض السعر', 'Send Quote')}
                      </button>
                    </div>
                  )}

                  {r.status === 'quoted' && isRequester && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          void respondToMarketplaceRfq({
                            rfqId: r.rfqId,
                            status: 'accepted',
                          })
                        }
                        className="min-h-[38px] px-3 rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                      >
                        {t('قبول العرض', 'Accept Quote')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void respondToMarketplaceRfq({
                            rfqId: r.rfqId,
                            status: 'declined',
                          })
                        }
                        className="min-h-[38px] px-3 rounded-lg border border-red-200 text-red-700 bg-white font-semibold cursor-pointer"
                      >
                        {t('رفض', 'Decline')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Checkout Modal */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <form
            onSubmit={handleConfirmOrder}
            className="w-full sm:max-w-md bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-safe border border-[#ECE4E8] shadow-xl space-y-4 max-h-[90dvh] overflow-y-auto"
          >
            <div className="w-10 h-1.5 bg-[#ECE4E8] rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-[#1D152B]">
                {t('تأكيد طلب توريد مباشر', 'Confirm Supply Order')}
              </h3>
              <button
                type="button"
                onClick={() => setCheckoutItem(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-[#FFFEFC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs font-semibold text-[#3B123F]">{checkoutItem.title}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-semibold text-[#6B6478]">{t('الكمية', 'Quantity')}</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
                />
              </label>
              <label className="space-y-1 flex flex-col justify-end">
                <span className="flex items-center gap-2 min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsDelivery}
                    onChange={(e) => setNeedsDelivery(e.target.checked)}
                  />
                  <span>{t('توصيل لوجستي', 'With Delivery')}</span>
                </span>
              </label>
            </div>
            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-[#6B6478]">
                {t('عنوان التسليم', 'Delivery Address')}
              </span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required={needsDelivery}
                placeholder={t('المنطقة الصناعية / العنوان التفصيلي', 'Full delivery location')}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              />
            </label>
            <div className="p-3 rounded-xl bg-[#FFFEFC] border border-[#ECE4E8] text-xs flex items-center justify-between font-bold tabular-nums">
              <span>{t('الإجمالي التقديري:', 'Estimated Total:')}</span>
              <span className="text-[#3B123F]">
                {checkoutItem.priceEGP * qty +
                  (needsDelivery ? commissionRule.minDeliveryFeeEGP : 0)}{' '}
                {t('ج.م', 'EGP')}
              </span>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] rounded-xl bg-[#3B123F] text-white text-sm font-bold hover:bg-[#501C5A] cursor-pointer disabled:opacity-60"
            >
              {submitting ? t('جاري الإرسال...', 'Submitting...') : t('تأكيد الطلب', 'Place Order')}
            </button>
          </form>
        </div>
      )}

      {/* RFQ Modal */}
      {rfqTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <form
            onSubmit={handleSubmitRfq}
            className="w-full sm:max-w-md bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-safe border border-[#ECE4E8] shadow-xl space-y-3 text-xs max-h-[90dvh] overflow-y-auto"
          >
            <div className="w-10 h-1.5 bg-[#ECE4E8] rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D152B]">
                {t('طلب عرض سعر رسمي (RFQ)', 'Official RFQ Request')}
              </h3>
              <button
                type="button"
                onClick={() => setRfqTarget(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-[#FFFEFC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="font-semibold text-[#3B123F]">
              {isEn ? rfqTarget.nameEn || rfqTarget.name : rfqTarget.name}
            </p>
            <input
              type="text"
              required
              value={rfqOrg}
              onChange={(e) => setRfqOrg(e.target.value)}
              placeholder={t('اسم الشركة أو المصنع الطالب', 'Organization / Factory Name')}
              className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                required
                value={rfqPhone}
                onChange={(e) => setRfqPhone(e.target.value)}
                placeholder={t('رقم الهاتف للتواصل', 'Contact Phone')}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              />
              <input
                type="text"
                required
                value={rfqCity}
                onChange={(e) => setRfqCity(e.target.value)}
                placeholder={t('المدينة / المنطقة', 'City / Zone')}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1}
                value={rfqQty}
                onChange={(e) => setRfqQty(Math.max(1, Number(e.target.value) || 1))}
                placeholder={t('الكمية المطلوبة', 'Daily Quantity')}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              />
              <select
                value={rfqFreq}
                onChange={(e) => setRfqFreq(e.target.value as MarketplaceRfq['frequency'])}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              >
                <option value="daily">{t('يومي', 'Daily')}</option>
                <option value="weekly">{t('أسبوعي', 'Weekly')}</option>
                <option value="monthly">{t('شهري', 'Monthly')}</option>
                <option value="one_time">{t('مرة واحدة', 'One-time')}</option>
              </select>
            </div>
            <textarea
              rows={3}
              required
              value={rfqDetails}
              onChange={(e) => setRfqDetails(e.target.value)}
              placeholder={t(
                'مواصفات الوجبات أو التوريدات ومواعيد التسليم المطلوبة...',
                'Meal specs, packaging requirements & delivery schedule...',
              )}
              className="w-full p-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] rounded-xl bg-[#3B123F] text-white text-sm font-bold hover:bg-[#501C5A] cursor-pointer"
            >
              {submitting ? t('جاري الإرسال...', 'Sending...') : t('إرسال طلب التسعير', 'Submit RFQ')}
            </button>
          </form>
        </div>
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <form
            onSubmit={handleSubmitReview}
            className="w-full sm:max-w-md bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-safe border border-[#ECE4E8] shadow-xl space-y-3 text-xs max-h-[90dvh] overflow-y-auto"
          >
            <div className="w-10 h-1.5 bg-[#ECE4E8] rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D152B]">
                {t('تقييم جودة المطبخ / المورد', 'Rate Kitchen / Supplier')}
              </h3>
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-[#FFFEFC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="font-semibold text-[#3B123F]">
              {isEn ? reviewTarget.nameEn || reviewTarget.name : reviewTarget.name}
            </p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className={`min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center cursor-pointer ${
                    reviewRating >= star
                      ? 'bg-[#D4AF37] border-[#EAB308] text-[#2A104D]'
                      : 'bg-white border-[#ECE4E8] text-slate-400'
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              required
              minLength={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={t('اكتب تجربتك حول الالتزام بالمواعيد وجودة الغذاء...', 'Share feedback on punctuality and food quality...')}
              className="w-full p-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] rounded-xl bg-[#3B123F] text-white text-sm font-bold hover:bg-[#501C5A] cursor-pointer"
            >
              {t('نشر التقييم', 'Publish Review')}
            </button>
          </form>
        </div>
      )}

      {/* Partner Onboarding Modal */}
      {showOnboard && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <form
            onSubmit={handleSubmitOnboarding}
            className="w-full sm:max-w-lg bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-safe border border-[#ECE4E8] shadow-xl space-y-3 text-xs max-h-[90dvh] overflow-y-auto"
          >
            <div className="w-10 h-1.5 bg-[#ECE4E8] rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D152B]">
                {t('طلب اعتماد مطبخ مركزي / مورد / مصنع', 'Partner Onboarding Application')}
              </h3>
              <button
                type="button"
                onClick={() => setShowOnboard(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-[#FFFEFC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as OnboardingTargetRole)}
                className="min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              >
                <option value="kitchen_manager">{t('مدير مطبخ مركزي', 'Central Kitchen Manager')}</option>
                <option value="supplier">{t('مورّد معتمد', 'Supplier')}</option>
                <option value="factory_manager">{t('مدير مصنع / منشأة', 'Factory Manager')}</option>
                <option value="courier">{t('مندوب توصيل', 'Courier')}</option>
              </select>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as OnboardingEntityType)}
                className="min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              >
                <option value="central_kitchen">{t('مطبخ مركزي', 'Central Kitchen')}</option>
                <option value="supplier">{t('مورّد غذائي', 'Food Supplier')}</option>
                <option value="company_factory">{t('مصنع / شركة', 'Factory / Company')}</option>
                <option value="restaurant">{t('مطعم تموين', 'Catering Restaurant')}</option>
              </select>
            </div>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t('الاسم التجاري للمنشأة', 'Entity Commercial Name')}
              className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t('اسم المسؤول', 'Contact Person')}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('رقم الهاتف', 'Phone Number')}
                className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                className="min-h-[42px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
              >
                <option value="EG">EG</option>
                <option value="AE">AE</option>
                <option value="QA">QA</option>
                <option value="OM">OM</option>
                <option value="GB">GB</option>
              </select>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('المدينة', 'City')}
                className="min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              />
              <input
                type="text"
                required
                value={regRef}
                onChange={(e) => setRegRef(e.target.value)}
                placeholder={t('رقم السجل التجاري', 'Commercial Reg #')}
                className="min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              />
            </div>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            >
              {plans.map((p) => (
                <option key={p.planId} value={p.planId}>
                  {(isEn ? p.nameEn : p.nameAr) + ` (${p.monthlyFeeEGP} ${t('ج.م/شهر', 'EGP/mo')})`}
                </option>
              ))}
            </select>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('الطاقة الإنتاجية أو مناطق التغطية...', 'Production capacity or coverage notes...')}
              className="w-full p-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] rounded-xl bg-[#3B123F] text-white text-sm font-bold hover:bg-[#501C5A] cursor-pointer"
            >
              {t('إرسال طلب الاعتماد', 'Submit Onboarding')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
