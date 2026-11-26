import React, { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  QrCode,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  UserPlus,
  Utensils,
  X,
} from 'lucide-react';
import {
  CatalogItem,
  CharityInitiative,
  CommissionRule,
  CountryCode,
  EntertainmentBenefit,
  KaffarahRule,
  OfferAd,
  OnboardingEntityType,
  OnboardingTargetRole,
  PaymentProviderId,
  PublicStorefront,
  SubscriptionPlan,
  UserProfile,
} from '../types/fayd';
import {
  createCommercialOrder,
  createVipDirectOrderWithPayment,
  submitOnboardingApplication,
} from '../services/faydFirestore';
import { BasitEcosystemPanels } from './BasitEcosystemPanels';

interface MarketplaceTabProps {
  uid: string | null;
  userProfile: UserProfile | null;
  defaultPhone?: string;
  storefronts: PublicStorefront[];
  catalogItems: CatalogItem[];
  plans: SubscriptionPlan[];
  commissionRule: CommissionRule;
  offersAds: OfferAd[];
  benefits: EntertainmentBenefit[];
  initiatives: CharityInitiative[];
  kaffarahRule: KaffarahRule;
  onRequireAuth: () => void;
  onShowQr: (title: string, subtitle: string, payload: string) => void;
  onNavigateTab: (tab: 'orders' | 'governance' | 'habe') => void;
}

const ENTITY_LABELS: Record<string, string> = {
  central_kitchen: 'مطبخ مركزي',
  restaurant: 'مطعم',
  store: 'متجر / ماركت',
  company_factory: 'شركة / مصنع',
  delivery_client: 'عميل توصيل',
};

type MarketSubSection = 'store' | 'benefits' | 'good_deeds' | 'logistics';

export const MarketplaceTab: React.FC<MarketplaceTabProps> = ({
  uid,
  userProfile,
  defaultPhone,
  storefronts,
  catalogItems,
  plans,
  commissionRule,
  offersAds,
  benefits,
  initiatives,
  kaffarahRule,
  onRequireAuth,
  onShowQr,
  onNavigateTab,
}) => {
  const [subSection, setSubSection] = useState<MarketSubSection>('store');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [checkoutItem, setCheckoutItem] = useState<CatalogItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [needsDelivery, setNeedsDelivery] = useState(true);
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  const [vipOfferModal, setVipOfferModal] = useState<OfferAd | null>(null);
  const [vipPhone, setVipPhone] = useState(defaultPhone || '');
  const [vipAmount, setVipAmount] = useState('450');
  const [vipMethod, setVipMethod] =
    useState<PaymentProviderId>('vodafone_cash');
  const [vipNotes, setVipNotes] = useState('');
  const [vipBusy, setVipBusy] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [targetRole, setTargetRole] =
    useState<OnboardingTargetRole>('merchant_owner');
  const [entityType, setEntityType] =
    useState<OnboardingEntityType>('restaurant');
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('القاهرة');
  const [countryCode, setCountryCode] = useState<CountryCode>('EG');
  const [commercialRegRef, setCommercialRegRef] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(
    plans[0]?.planId ?? 'plan_starter',
  );
  const [notes, setNotes] = useState('');
  const [onboardingMsg, setOnboardingMsg] = useState<string | null>(null);
  const [submittingApp, setSubmittingApp] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalogItems.forEach((item) => set.add(item.category));
    return ['all', ...Array.from(set)];
  }, [catalogItems]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalogItems.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory)
        return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.storeName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [catalogItems, selectedCategory, search]);

  const handleOpenCheckout = (item: CatalogItem) => {
    setOrderNotice(null);
    setCheckoutItem(item);
    setQuantity(1);
    setNeedsDelivery(true);
    setDropoffAddress('');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    if (!checkoutItem) return;
    if (needsDelivery && dropoffAddress.trim().length < 3) {
      setOrderNotice('يرجى إدخال عنوان التوصيل (3 أحرف على الأقل).');
      return;
    }

    setSubmittingOrder(true);
    setOrderNotice(null);
    try {
      const orderId = await createCommercialOrder({
        customerUid: uid,
        customerName: userProfile?.displayName || 'عميل باسط',
        item: checkoutItem,
        quantity,
        needsDelivery,
        dropoffAddress: needsDelivery
          ? dropoffAddress.trim()
          : 'استلام مباشر من الفرع',
        commissionPct: commissionRule.defaultOrderCommissionPct,
        deliveryFeeEGP: commissionRule.minDeliveryFeeEGP,
      });
      setCheckoutItem(null);
      onShowQr(
        'تم إرسال الطلب التجاري بنجاح',
        `رقم الطلب: ${orderId} · معزول للمتجر ${checkoutItem.storeName}`,
        `BASIT:ORDER:${orderId}:${checkoutItem.tenantId}`,
      );
      onNavigateTab('orders');
    } catch (err) {
      setOrderNotice(
        err instanceof Error ? err.message : 'تعذر إرسال الطلب.',
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handlePlaceVipOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    if (!vipOfferModal) return;
    const p = (vipPhone.trim() || defaultPhone || '').trim();
    if (p.length < 6) {
      setOrderNotice('يرجى إدخال رقم هاتف صحيح (6 أرقام على الأقل).');
      return;
    }
    setVipBusy(true);
    setOrderNotice(null);
    try {
      const { orderId } = await createVipDirectOrderWithPayment({
        customerUid: uid,
        customerName: userProfile?.displayName || 'عميل باسط VIP',
        phone: p,
        sourceChannel:
          vipOfferModal.offerId === 'offer_camel_liver_vip'
            ? 'camel_liver_vip'
            : 'cart_direct',
        items: [
          {
            code: vipOfferModal.offerId.slice(0, 16),
            title: vipOfferModal.titleAr,
            qty: 1,
            unitPriceEGP: Math.max(1, Number(vipAmount) || 450),
          },
        ],
        paymentMethod: vipMethod,
        notes: vipNotes.trim() || vipOfferModal.discountBadgeAr,
        tenantId: vipOfferModal.tenantId || 'tenant_kitchen_alain',
      });
      setVipOfferModal(null);
      setVipNotes('');
      onShowQr(
        'تم تسجيل طلب العرض المباشر VIP',
        `رقم الطلب: ${orderId}`,
        `BASIT:VIP:${orderId}`,
      );
      onNavigateTab('orders');
    } catch (err) {
      setOrderNotice(err instanceof Error ? err.message : 'تعذر إرسال الطلب.');
    } finally {
      setVipBusy(false);
    }
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    if (
      businessName.trim().length < 2 ||
      contactName.trim().length < 2 ||
      phone.trim().length < 6 ||
      city.trim().length < 2 ||
      commercialRegRef.trim().length < 2
    ) {
      setOnboardingMsg('يرجى استكمال جميع الحقول المطلوبة بشكل صحيح.');
      return;
    }

    setSubmittingApp(true);
    setOnboardingMsg(null);
    try {
      const appId = await submitOnboardingApplication({
        applicantUid: uid,
        targetRole,
        entityType,
        businessName: businessName.trim(),
        contactName: contactName.trim(),
        phone: phone.trim(),
        countryCode,
        city: city.trim(),
        commercialRegRef: commercialRegRef.trim(),
        selectedPlanId: selectedPlanId || 'plan_starter',
        notes: notes.trim(),
      });
      setOnboardingMsg(
        `تم إرسال طلب الانضمام (${appId}) بحالة pending_review للمراجعة والاعتماد من الإدارة المركزية.`,
      );
      setBusinessName('');
      setContactName('');
      setPhone('');
      setCommercialRegRef('');
      setNotes('');
    } catch (err) {
      setOnboardingMsg(err instanceof Error ? err.message : 'تعذر إرسال الطلب.');
    } finally {
      setSubmittingApp(false);
    }
  };

  const checkoutSubtotal = checkoutItem ? checkoutItem.priceEGP * quantity : 0;
  const checkoutDelivery = needsDelivery ? commissionRule.minDeliveryFeeEGP : 0;
  const checkoutTotal = checkoutSubtotal + checkoutDelivery;

  return (
    <div className="space-y-5">
      {/* BASIT National Hero & Segmented Sub-Navigation */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              باسط | BASIT — المنظومة الوطنية اللوجستية وسوق فيض
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
              <span className="tabular-nums">{storefronts.length} واجهة متجر نشطة</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{catalogItems.length} منتج ووجبة</span>
              <span aria-hidden="true">·</span>
              <span>عزل تام لكل مستأجر (Tenant Isolation)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('habe')}
              className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Utensils className="w-4 h-4" />
              نقطة موظفي Ha-Be
            </button>
            <button
              type="button"
              onClick={() => {
                setOnboardingMsg(null);
                setShowOnboarding(true);
              }}
              className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F2487] text-white text-xs font-semibold hover:bg-[#3f1c6d] transition-colors cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              انضمام شريك / ساعي
            </button>
          </div>
        </div>

        {/* Clean 4-Section Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          {(
            [
              { id: 'store', label: 'المتاجر والعروض' },
              { id: 'benefits', label: 'المزايا والترفيه' },
              { id: 'good_deeds', label: 'اعمل الخير وكفارة اليمين' },
              { id: 'logistics', label: 'الخدمات اللوجستية (7)' },
            ] as const
          ).map((tab) => {
            const active = subSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubSection(tab.id)}
                className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {subSection !== 'store' ? (
        <BasitEcosystemPanels
          section={subSection}
          uid={uid}
          userProfile={userProfile}
          defaultPhone={defaultPhone}
          benefits={benefits}
          initiatives={initiatives}
          kaffarahRule={kaffarahRule}
          onRequireAuth={onRequireAuth}
          onShowQr={onShowQr}
        />
      ) : (
        <>
          {/* Approved Commercial Offers Strip */}
          {offersAds.length > 0 && (
            <section aria-label="العروض المعتمدة">
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#4F2487]" />
                  عروض باسط المعتمدة
                </h2>
                <span className="text-xs text-slate-500 tabular-nums">
                  {offersAds.length} عروض سارية
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {offersAds.map((ad) => (
                  <article
                    key={ad.offerId}
                    className="bg-white border border-purple-200/80 rounded-2xl p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="text-[11px] font-bold text-[#4F2487]">
                        {ad.discountBadgeAr}
                      </div>
                      <h3 className="mt-1 text-sm font-bold text-slate-900 leading-snug">
                        {ad.titleAr}
                      </h3>
                      {ad.terms && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          {ad.terms}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (ad.offerId === 'offer_alain_habe_92') {
                          onNavigateTab('habe');
                        } else {
                          setVipOfferModal(ad);
                        }
                      }}
                      className="min-h-[40px] px-3.5 rounded-xl bg-[#4F2487] text-white text-xs font-semibold hover:bg-[#3f1c6d] cursor-pointer"
                    >
                      {ad.ctaAr}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}


      {/* Storefronts Horizontal Strip */}
      <section aria-label="المتاجر والمطابخ المعتمدة">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-sm font-bold text-slate-900">الكيانات والمطابخ المعتمدة</h2>
          <span className="text-xs text-slate-500 tabular-nums">
            عمولة المنصة الافتراضية {commissionRule.defaultOrderCommissionPct}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {storefronts.map((sf) => (
            <div
              key={sf.tenantId}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between gap-2"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4F2487]/10 text-[#4F2487] flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 leading-snug">
                    {sf.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {ENTITY_LABELS[sf.entityType] || sf.entityType} · {sf.city} · {sf.countryCode}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono truncate">{sf.tenantId}</span>
                <span className="text-emerald-700 font-semibold shrink-0">نشط</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Catalog Search & Filter */}
      <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن وجبة، منتج، أو مطبخ مركزي..."
              aria-label="بحث في الكتالوج"
              className="w-full min-h-[44px] pr-10 pl-9 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4F2487]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="مسح البحث"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="تصنيف المنتجات"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[40px] px-3.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#4F2487] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  {cat === 'all' ? 'الكل' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            لا توجد عناصر مطابقة لبحثك حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-5">
            {filteredItems.map((item) => (
              <article
                key={item.itemId}
                className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-4 hover:border-[#4F2487]/40 transition-colors bg-white"
              >
                <div>
                  <div className="text-xs text-slate-500">
                    {item.category} · {item.storeName}
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                    <span>المتاح: {item.stockQty}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-semibold">
                      {item.isAvailable ? 'متوفر للطلب' : 'غير متاح'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-500">السعر</div>
                    <div className="text-lg font-bold text-slate-900 tabular-nums">
                      {item.priceEGP.toLocaleString('en-US')} ج.م
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenCheckout(item)}
                    className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#4F2487] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    اطلب الآن
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
        </>
      )}

      {/* Mobile Bottom-Sheet Checkout */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <form
            onSubmit={handlePlaceOrder}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تأكيد الطلب التجاري
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {checkoutItem.title} · {checkoutItem.storeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutItem(null)}
                aria-label="إغلاق"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-sm font-semibold text-slate-800">الكمية</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="min-h-[40px] min-w-[40px] rounded-lg bg-white border border-slate-300 font-bold text-slate-900 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                    className="min-h-[40px] min-w-[40px] rounded-lg bg-white border border-slate-300 font-bold text-slate-900 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer min-h-[48px]">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Truck className="w-4 h-4 text-[#4F2487]" />
                  طلب توصيل عبر سعاة فيض ({commissionRule.minDeliveryFeeEGP} ج.م)
                </span>
                <input
                  type="checkbox"
                  checked={needsDelivery}
                  onChange={(e) => setNeedsDelivery(e.target.checked)}
                  className="w-5 h-5 accent-[#4F2487]"
                />
              </label>

              {needsDelivery && (
                <div>
                  <label
                    htmlFor="checkout-address"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    عنوان التسليم التفصيلي
                  </label>
                  <input
                    id="checkout-address"
                    type="text"
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    placeholder="مثال: مدينة بدر - المنطقة الصناعية الثالثة - مصنع 14"
                    maxLength={240}
                    className="w-full min-h-[44px] px-3 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F2487]"
                  />
                </div>
              )}

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>قيمة الأصناف</span>
                  <span>{checkoutSubtotal.toLocaleString('en-US')} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>رسوم التوصيل</span>
                  <span>{checkoutDelivery.toLocaleString('en-US')} ج.م</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>الإجمالي المستحق</span>
                  <span>{checkoutTotal.toLocaleString('en-US')} ج.م</span>
                </div>
              </div>

              {orderNotice && (
                <p role="alert" className="text-xs font-semibold text-red-600">
                  {orderNotice}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingOrder}
              className="mt-5 w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F2487] text-white text-sm font-semibold hover:bg-[#3f1c6d] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              {submittingOrder
                ? 'جاري تسجيل الطلب...'
                : uid
                  ? 'إرسال الطلب الآن'
                  : 'تسجيل الدخول لإتمام الطلب'}
            </button>
          </form>
        </div>
      )}

      {/* Partner / Merchant / Courier Onboarding Bottom Sheet */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <form
            onSubmit={handleSubmitOnboarding}
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl max-h-[92vh] overflow-y-auto"
          >
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#4F2487]" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    طلب انضمام شريك أو ساعي معتمد
                  </h3>
                  <p className="text-xs text-slate-500">
                    يدخل بحالة pending_review ولا يُفعّل إلا باعتماد الإدارة المركزية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboarding(false)}
                aria-label="إغلاق"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الدور المطلوب
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => {
                    const role = e.target.value as OnboardingTargetRole;
                    setTargetRole(role);
                    if (role === 'courier') setEntityType('courier_individual');
                    else if (role === 'opportunity_partner') setEntityType('site_owner');
                    else if (role === 'delivery_client') setEntityType('company_factory');
                    else setEntityType('restaurant');
                  }}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value="merchant_owner">صاحب مطعم / مطبخ / متجر</option>
                  <option value="delivery_client">شركة / مصنع (عميل توصيل)</option>
                  <option value="courier">ساعي بريد / مندوب توصيل</option>
                  <option value="opportunity_partner">شريك فرص فيض</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نوع الكيان
                </label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value as OnboardingEntityType)}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value="restaurant">مطعم</option>
                  <option value="central_kitchen">مطبخ مركزي</option>
                  <option value="store">متجر / ماركت</option>
                  <option value="company_factory">شركة / مصنع</option>
                  <option value="courier_individual">مندوب فردي</option>
                  <option value="project_owner">صاحب مشروع وخبرة</option>
                  <option value="site_owner">مالك موقع تجاري</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم النشاط التجاري / الجهة
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="مثال: مطبخ النور المركزي"
                  maxLength={140}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم المسؤول / مقدم الطلب
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="الاسم الثلاثي"
                  maxLength={120}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2010xxxxxxxx"
                  maxLength={32}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  السجل التجاري / الرقم الضريبي
                </label>
                <input
                  type="text"
                  value={commercialRegRef}
                  onChange={(e) => setCommercialRegRef(e.target.value)}
                  placeholder="CR-2026-104"
                  maxLength={80}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  المدينة
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={80}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الدولة والباقة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                    className="min-h-[44px] px-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="EG">مصر (EG)</option>
                    <option value="AE">الإمارات (AE)</option>
                    <option value="QA">قطر (QA)</option>
                    <option value="OM">عمان (OM)</option>
                    <option value="GB">بريطانيا (GB)</option>
                  </select>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="min-h-[44px] px-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    {plans.map((p) => (
                      <option key={p.planId} value={p.planId}>
                        {p.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ملاحظات إضافية (اختياري)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={600}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            {onboardingMsg && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{onboardingMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingApp}
              className="mt-5 w-full min-h-[48px] rounded-xl bg-[#4F2487] text-white text-sm font-semibold hover:bg-[#3f1c6d] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submittingApp
                ? 'جاري الإرسال...'
                : uid
                  ? 'إرسال طلب الانضمام للمراجعة'
                  : 'تسجيل الدخول لإرسال الطلب'}
            </button>
          </form>
        </div>
      )}

      {/* VIP Direct Commercial Offer Modal */}
      {vipOfferModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <form
            onSubmit={handlePlaceVipOffer}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-[#4F2487]">
                  {vipOfferModal.discountBadgeAr}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {vipOfferModal.titleAr}
                </h3>
                {vipOfferModal.terms && (
                  <p className="text-xs text-slate-500 mt-1">{vipOfferModal.terms}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setVipOfferModal(null)}
                aria-label="إغلاق"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم الهاتف للتواصل والتأكيد
                </label>
                <input
                  type="tel"
                  value={vipPhone}
                  onChange={(e) => setVipPhone(e.target.value)}
                  placeholder="+2010xxxxxxxx"
                  maxLength={32}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    القيمة التقديرية (ج.م)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={vipAmount}
                    onChange={(e) => setVipAmount(e.target.value)}
                    className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    وسيلة الدفع
                  </label>
                  <select
                    value={vipMethod}
                    onChange={(e) =>
                      setVipMethod(e.target.value as PaymentProviderId)
                    }
                    className="w-full min-h-[44px] px-2.5 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="vodafone_cash">فودافون كاش</option>
                    <option value="instapay">إنستاباي (InstaPay)</option>
                    <option value="fawry">فوري (Fawry)</option>
                    <option value="cash_on_delivery">دفع عند الاستلام</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  تفاصيل الطلب / الملاحظات
                </label>
                <input
                  type="text"
                  value={vipNotes}
                  onChange={(e) => setVipNotes(e.target.value)}
                  placeholder="مثال: الكمية المطلوبة وعنوان الاستلام"
                  maxLength={600}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              {orderNotice && (
                <p role="alert" className="text-xs font-semibold text-red-600">
                  {orderNotice}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={vipBusy}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F2487] text-white text-sm font-semibold hover:bg-[#3f1c6d] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              {vipBusy
                ? 'جاري تسجيل طلب العرض...'
                : uid
                  ? 'تأكيد طلب العرض المباشر'
                  : 'تسجيل الدخول لإتمام الطلب'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
