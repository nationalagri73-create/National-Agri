import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Building,
  CheckCircle2,
  ChefHat,
  CreditCard,
  Factory,
  MessageSquareWarning,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Users,
  Utensils,
} from 'lucide-react';
import {
  HABE_CATEGORY_LABELS,
  HABE_PRICE_CATALOG,
  HabeCategoryKey,
} from '../data/habeCatalog';
import { BASIT_ASSETS, SEED_FACTORY_WORKSPACES } from '../data/seedDefaults';
import { useI18n } from '../i18n/translations';
import {
  confirmSandboxPaymentTransaction,
  createFactoryComplaintRecord,
  createFactoryEmployeeRecord,
  createMarketplaceRfqRecord,
  createVipDirectOrderWithPayment,
  updateFactoryComplaintStatus,
} from '../services/faydFirestore';
import {
  FactoryComplaint,
  FactoryEmployee,
  OfferAd,
  PaymentGatewayConfig,
  PaymentProviderId,
  PaymentTransaction,
  PublicStorefront,
  UserProfile,
  VipDirectOrder,
  VipDirectOrderItem,
} from '../types/fayd';

interface FactorySystemPortalProps {
  uid: string | null;
  userProfile: UserProfile | null;
  defaultPhone?: string;
  storefronts: PublicStorefront[];
  factoryEmployees: FactoryEmployee[];
  factoryComplaints: FactoryComplaint[];
  offersAds: OfferAd[];
  gateways: PaymentGatewayConfig[];
  vipOrders: VipDirectOrder[];
  paymentTransactions: PaymentTransaction[];
  onRequireAuth: () => void;
}

type FactorySubView = 'meals' | 'employees' | 'offers_orders' | 'complaints' | 'kitchen_supply';

export const FactorySystemPortal: React.FC<FactorySystemPortalProps> = ({
  uid,
  userProfile,
  defaultPhone,
  storefronts,
  factoryEmployees,
  factoryComplaints,
  offersAds,
  gateways,
  vipOrders,
  paymentTransactions,
  onRequireAuth,
}) => {
  const { isEn, t } = useI18n();

  const factoryWorkspaces = useMemo(() => {
    const dynamicFactories = storefronts.filter(
      (s) => s.entityType === 'company_factory',
    );
    return dynamicFactories.length > 0 ? dynamicFactories : SEED_FACTORY_WORKSPACES;
  }, [storefronts]);

  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(
    userProfile?.tenantId && factoryWorkspaces.some((f) => f.tenantId === userProfile.tenantId)
      ? userProfile.tenantId
      : factoryWorkspaces[0]?.tenantId || 'tenant_factory_habe',
  );
  const [subView, setSubView] = useState<FactorySubView>('meals');
  const [bannerImgOk, setBannerImgOk] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Meals & Ordering state
  const [category, setCategory] = useState<HabeCategoryKey>('all');
  const [menuSearch, setMenuSearch] = useState('');
  const [empCodeInput, setEmpCodeInput] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [phoneInput, setPhoneInput] = useState(defaultPhone || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentProviderId>('cash_on_delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [pendingTx, setPendingTx] = useState<{
    txId: string;
    orderId: string;
    amount: number;
  } | null>(null);

  // New employee form state
  const [newEmpCode, setNewEmpCode] = useState('');
  const [newEmpNameAr, setNewEmpNameAr] = useState('');
  const [newEmpNameEn, setNewEmpNameEn] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('الإنتاج والتشغيل');
  const [newEmpTitle, setNewEmpTitle] = useState('فني تشغيل');
  const [newEmpShift, setNewEmpShift] = useState('الوردية الصباحية (08:00 - 16:00)');
  const [newEmpQuota, setNewEmpQuota] = useState(1500);

  // New complaint form state
  const [cmpCategory, setCmpCategory] = useState<FactoryComplaint['category']>('meal_quality');
  const [cmpSubject, setCmpSubject] = useState('');
  const [cmpDetails, setCmpDetails] = useState('');
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});

  // Kitchen Supply Request
  const centralKitchens = useMemo(
    () => storefronts.filter((s) => s.entityType === 'central_kitchen'),
    [storefronts],
  );
  const [targetKitchenId, setTargetKitchenId] = useState(
    centralKitchens[0]?.tenantId || 'tenant_kitchen_alain',
  );
  const [supplyMealsQty, setSupplyMealsQty] = useState(300);
  const [supplyNotes, setSupplyNotes] = useState('');

  const activeFactory =
    factoryWorkspaces.find((f) => f.tenantId === selectedFactoryId) ||
    factoryWorkspaces[0];
  const primaryColor = activeFactory?.primaryColor || '#3B123F';
  const accentColor = activeFactory?.accentColor || '#D4AF37';

  const currentFactoryEmployees = useMemo(
    () => factoryEmployees.filter((e) => e.tenantId === activeFactory?.tenantId),
    [factoryEmployees, activeFactory?.tenantId],
  );

  const matchedEmployee = useMemo(() => {
    const q = empCodeInput.trim().toLowerCase();
    if (!q) return null;
    return (
      currentFactoryEmployees.find(
        (e) =>
          e.employeeCode.toLowerCase() === q ||
          e.nameAr.toLowerCase().includes(q) ||
          e.nameEn.toLowerCase().includes(q),
      ) || null
    );
  }, [empCodeInput, currentFactoryEmployees]);

  const currentFactoryComplaints = useMemo(
    () => factoryComplaints.filter((c) => c.tenantId === activeFactory?.tenantId),
    [factoryComplaints, activeFactory?.tenantId],
  );

  const factoryOffers = useMemo(
    () =>
      offersAds.filter(
        (ad) =>
          ad.targetScope === 'public' ||
          !ad.eligibleTenantIdsCsv ||
          ad.eligibleTenantIdsCsv.includes(activeFactory?.tenantId || ''),
      ),
    [offersAds, activeFactory?.tenantId],
  );

  const factoryOrders = useMemo(
    () =>
      vipOrders.filter(
        (o) =>
          o.tenantId === activeFactory?.tenantId ||
          o.sourceChannel === 'factory_portal' ||
          o.sourceChannel === 'al_ain_offer',
      ),
    [vipOrders, activeFactory?.tenantId],
  );

  const filteredMenu = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    return HABE_PRICE_CATALOG.filter((item) => {
      const catOk = category === 'all' || item.category === category;
      if (!catOk) return false;
      if (!q) return true;
      return (
        item.nameAr.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q)
      );
    });
  }, [category, menuSearch]);

  const cartItems: VipDirectOrderItem[] = useMemo(() => {
    return Object.entries(cart)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => {
        const found = HABE_PRICE_CATALOG.find((x) => x.id === id);
        return found
          ? {
              code: found.code,
              title: isEn ? found.nameEn : found.nameAr,
              qty: count,
              unitPriceEGP: found.priceEGP,
            }
          : null;
      })
      .filter((x): x is VipDirectOrderItem => x !== null);
  }, [cart, isEn]);

  const cartTotal = cartItems.reduce((s, i) => s + i.unitPriceEGP * i.qty, 0);

  const isFactoryManagerOrAdmin =
    userProfile?.role === 'platform_owner' ||
    userProfile?.role === 'system_admin' ||
    userProfile?.role === 'central_super_admin' ||
    (userProfile?.role === 'factory_manager' &&
      (!userProfile.tenantId || userProfile.tenantId === activeFactory?.tenantId));

  const adjustCart = (id: string, delta: number) => {
    setCart((prev) => {
      const next = Math.max(0, (prev[id] || 0) + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const handlePlaceFactoryOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    if (cartItems.length === 0) {
      setErrorMsg(t('اختر وجبة واحدة على الأقل أولاً.', 'Please select at least one meal first.'));
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setNotice(null);
    try {
      const empLabel = matchedEmployee
        ? `${matchedEmployee.nameAr} (${matchedEmployee.employeeCode})`
        : userProfile?.displayName || t('موظف المصنع', 'Factory Staff');
      const { orderId, txId } = await createVipDirectOrderWithPayment({
        customerUid: uid,
        customerName: `${activeFactory?.name || 'Factory'} — ${empLabel}`,
        phone: phoneInput || '+201000000000',
        sourceChannel: 'factory_portal',
        items: cartItems,
        paymentMethod,
        notes: orderNotes || `Factory Portal: ${activeFactory?.tenantId}`,
        tenantId: activeFactory?.tenantId,
      });
      setPendingTx({ txId, orderId, amount: cartTotal });
      setCart({});
      setNotice(
        t(
          `تم تسجيل طلب الوجبات رقم ${orderId} لمصنع ${activeFactory?.name}.`,
          `Factory meal order ${orderId} placed for ${activeFactory?.nameEn || activeFactory?.name}.`,
        ),
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر تسجيل الطلب', 'Order failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !activeFactory) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const empId = await createFactoryEmployeeRecord({
        tenantId: activeFactory.tenantId,
        employeeCode: newEmpCode,
        nameAr: newEmpNameAr,
        nameEn: newEmpNameEn || newEmpNameAr,
        departmentAr: newEmpDept,
        jobTitle: newEmpTitle,
        shift: newEmpShift,
        monthlyCardLimitEGP: newEmpQuota,
      });
      setNotice(
        t(`تمت إضافة الموظف (${empId}) إلى سجل ${activeFactory.name}.`, `Employee (${empId}) added to factory directory.`),
      );
      setNewEmpCode('');
      setNewEmpNameAr('');
      setNewEmpNameEn('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر إضافة الموظف (يتطلب صلاحية إدارة المصنع)', 'Failed to add employee'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !activeFactory) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const id = await createFactoryComplaintRecord({
        tenantId: activeFactory.tenantId,
        authorUid: uid,
        authorName: userProfile?.displayName || t('موظف المصنع', 'Factory Staff'),
        employeeCode: matchedEmployee?.employeeCode || empCodeInput || '',
        category: cmpCategory,
        subject: cmpSubject,
        details: cmpDetails,
      });
      setNotice(
        t(`تم تسجيل الشكوى/الملاحظة رقم ${id} وإشعار إدارة المصنع.`, `Complaint ${id} submitted to factory management.`),
      );
      setCmpSubject('');
      setCmpDetails('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر إرسال الشكوى', 'Submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestKitchenSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !activeFactory) {
      onRequireAuth();
      return;
    }
    const kitchen = centralKitchens.find((k) => k.tenantId === targetKitchenId);
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const rfqId = await createMarketplaceRfqRecord({
        requesterUid: uid,
        requesterOrgName: activeFactory.name,
        phone: phoneInput || '+201000000000',
        targetTenantId: targetKitchenId,
        targetMerchantOwnerUid: 'seed_admin',
        targetName: kitchen ? (isEn ? kitchen.nameEn || kitchen.name : kitchen.name) : targetKitchenId,
        dailyQty: supplyMealsQty,
        frequency: 'daily',
        city: activeFactory.city,
        details: supplyNotes || `طلب توريد وجبات ورديات لمصنع ${activeFactory.name}`,
      });
      setNotice(
        t(`تم إرسال طلب التشغيل للمطبخ المركزي (${rfqId}).`, `Central kitchen supply request (${rfqId}) sent.`),
      );
      setSupplyNotes('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر إرسال الطلب', 'Failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Factory White-Label Selector Bar */}
      <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1D152B]">
          <Building className="w-4 h-4 text-[#3B123F]" />
          <span>{t('اختر بوابة المصنع المستقلة (White-Label):', 'Select Independent Factory Portal:')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {factoryWorkspaces.map((f) => {
            const active = f.tenantId === activeFactory?.tenantId;
            return (
              <button
                key={f.tenantId}
                type="button"
                onClick={() => setSelectedFactoryId(f.tenantId)}
                style={
                  active
                    ? { backgroundColor: f.primaryColor || '#3B123F', color: '#FFFFFF' }
                    : undefined
                }
                className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  active ? '' : 'bg-[#FFFEFC] text-[#1D152B] border border-[#ECE4E8] hover:bg-white'
                }`}
              >
                {isEn ? f.nameEn || f.name : f.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Branded Factory Hero */}
      {activeFactory && (
        <section
          className="rounded-3xl text-white overflow-hidden border"
          style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-4 sm:p-8 flex flex-col justify-between gap-3">
              <div>
                <p className="text-[11px] sm:text-xs font-bold" style={{ color: accentColor }}>
                  FACTORY SYSTEM · {activeFactory.city} · {activeFactory.countryCode}
                </p>
                <h1 className="mt-1 text-lg sm:text-3xl font-bold leading-snug">
                  {isEn ? activeFactory.nameEn || activeFactory.name : activeFactory.name}
                </h1>
                <p className="hidden sm:block mt-2 text-sm text-white/90 leading-relaxed max-w-2xl">
                  {isEn
                    ? activeFactory.specialtiesEn || activeFactory.specialtiesAr
                    : activeFactory.specialtiesAr}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-white/90 tabular-nums">
                <span>
                  {t('الموظفون:', 'Staff:')}{' '}
                  <strong style={{ color: accentColor }}>{currentFactoryEmployees.length}</strong>
                </span>
                <span>
                  {t('الطاقة اليومية:', 'Daily:')}{' '}
                  <strong style={{ color: accentColor }}>
                    {(activeFactory.capacityMealsPerDay || 450).toLocaleString()}
                  </strong>
                </span>
                <span>
                  {t('شكاوى مفتوحة:', 'Open:')}{' '}
                  <strong style={{ color: accentColor }}>
                    {currentFactoryComplaints.filter((c) => c.status !== 'resolved').length}
                  </strong>
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 relative h-28 sm:h-44 lg:h-auto lg:min-h-[190px] bg-black/25">
              {bannerImgOk ? (
                <img
                  src={activeFactory.logoUrl || BASIT_ASSETS.factoryCanteen}
                  alt={activeFactory.name}
                  referrerPolicy="no-referrer"
                  onError={() => setBannerImgOk(false)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Factory className="w-12 h-12" style={{ color: accentColor }} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>
          </div>
        </section>
      )}

      {/* Sub-navigation inside Factory Portal (Horizontal Swipe on Mobile) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'meals', ar: 'الوجبات وطلبات الموظفين', en: 'Meals & Ordering', Icon: Utensils },
            { id: 'employees', ar: 'الموظفون والكروت', en: 'Employees & Cards', Icon: Users },
            { id: 'offers_orders', ar: 'العروض وسجل الطلبات', en: 'Offers & Orders', Icon: Tag },
            { id: 'complaints', ar: 'الشكاوى والتنبيهات', en: 'Complaints & Alerts', Icon: Bell },
            { id: 'kitchen_supply', ar: 'ربط المطبخ المركزي', en: 'Central Kitchen Supply', Icon: ChefHat },
          ] as const
        ).map(({ id, ar, en, Icon }) => {
          const active = subView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSubView(id)}
              style={active ? { backgroundColor: primaryColor, color: '#FFFFFF' } : undefined}
              className={`min-h-[42px] px-3.5 inline-flex items-center gap-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                active ? '' : 'text-[#1D152B] hover:bg-[#FFFEFC]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {isEn ? en : ar}
            </button>
          );
        })}
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

      {/* VIEW 1: MEALS & EMPLOYEE MOBILE ACCESS */}
      {subView === 'meals' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#6B6478] absolute top-3 start-3" />
                  <input
                    type="text"
                    value={empCodeInput}
                    onChange={(e) => setEmpCodeInput(e.target.value)}
                    placeholder={t('تحقق بكود الموظف (مثال HB-001 أو BD-101)', 'Verify Employee Code (e.g. HB-001)')}
                    className="w-full min-h-[42px] ps-9 pe-3 rounded-xl border border-[#ECE4E8] bg-white"
                  />
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#6B6478] absolute top-3 start-3" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder={t('ابحث في قائمة الوجبات...', 'Search meals catalog...')}
                    className="w-full min-h-[42px] ps-9 pe-3 rounded-xl border border-[#ECE4E8] bg-white"
                  />
                </div>
              </div>

              {matchedEmployee && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-emerald-900">
                      {isEn ? matchedEmployee.nameEn : matchedEmployee.nameAr} · {matchedEmployee.employeeCode}
                    </p>
                    <p className="text-emerald-700">
                      {matchedEmployee.departmentAr} · {matchedEmployee.shift}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-900 tabular-nums">
                    {t('سقف الكارت الشهري:', 'Card Limit:')} {matchedEmployee.monthlyCardLimitEGP} {t('ج.م', 'EGP')}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {(Object.keys(HABE_CATEGORY_LABELS) as HabeCategoryKey[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={
                      category === cat
                        ? { backgroundColor: primaryColor, color: '#FFFFFF' }
                        : undefined
                    }
                    className={`min-h-[38px] px-3.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                      category === cat
                        ? ''
                        : 'bg-[#FFFEFC] text-[#1D152B] border border-[#ECE4E8]'
                    }`}
                  >
                    {HABE_CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredMenu.slice(0, 24).map((item) => {
                const count = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4 flex flex-col justify-between gap-2.5 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[#6B6478]">
                        <span className="font-mono">{item.code}</span>
                        <span className="font-bold text-[#1D152B] tabular-nums">
                          {item.priceEGP} {t('ج.م', 'EGP')}
                        </span>
                      </div>
                      <h3 className="mt-1 font-bold text-[#1D152B] leading-snug">
                        {isEn ? item.nameEn : item.nameAr}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => adjustCart(item.id, 1)}
                        style={{ backgroundColor: primaryColor }}
                        className="flex-1 min-h-[42px] px-3 rounded-xl text-white font-semibold cursor-pointer active:scale-[0.98] transition-transform"
                      >
                        {t('إضافة للسلة', 'Add')} {count > 0 ? `(${count})` : ''}
                      </button>
                      {count > 0 && (
                        <button
                          type="button"
                          onClick={() => adjustCart(item.id, -1)}
                          className="min-h-[42px] min-w-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white font-bold cursor-pointer"
                        >
                          -
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Checkout Panel */}
          <form
            id="factory-checkout-form"
            onSubmit={handlePlaceFactoryOrder}
            className="lg:col-span-4 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3 text-xs lg:sticky lg:top-16"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D152B] inline-flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#3B123F]" />
                {t('سلة وجبات المصنع', 'Factory Meal Cart')}
              </h3>
              <span className="font-bold text-[#3B123F] tabular-nums">
                {cartTotal} {t('ج.م', 'EGP')}
              </span>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-[#6B6478] py-3">
                {t('لم تتم إضافة وجبات بعد.', 'No meals selected yet.')}
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cartItems.map((ci) => (
                  <div key={ci.code} className="flex items-center justify-between gap-2 py-1 border-b border-[#ECE4E8]">
                    <span className="truncate">{ci.title} × {ci.qty}</span>
                    <span className="font-bold tabular-nums shrink-0">
                      {ci.unitPriceEGP * ci.qty} {t('ج.م', 'EGP')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <input
              type="tel"
              required
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={t('رقم موبايل الموظف', 'Employee Mobile Number')}
              className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentProviderId)}
              className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            >
              {gateways.map((g) => (
                <option key={g.providerId} value={g.providerId}>
                  {g.displayName}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder={t('ملاحظات الوردية أو بوابة التسليم', 'Shift or gate delivery note')}
              className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />

            <button
              type="submit"
              disabled={submitting || cartItems.length === 0}
              style={{ backgroundColor: primaryColor }}
              className="w-full min-h-[44px] rounded-xl text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {t('تأكيد طلب الوجبة', 'Submit Meal Order')}
            </button>

            {pendingTx && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <p className="font-bold text-amber-900">
                  {t('تأكيد الدفع الاختباري:', 'Sandbox Payment Confirm:')} {pendingTx.amount} {t('ج.م', 'EGP')}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await confirmSandboxPaymentTransaction(pendingTx.txId, 'Paid');
                    setPendingTx(null);
                    setNotice(t('تم اعتماد سداد الطلب بنجاح.', 'Order payment marked Paid.'));
                  }}
                  className="w-full min-h-[38px] rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  {t('تأكيد السداد الفوري', 'Confirm Sandbox Payment')}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* VIEW 2: EMPLOYEES & CARDS */}
      {subView === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1D152B]">
                {t('سجل موظفي المصنع وحدود كروت باسط', 'Factory Staff Directory & BASIT Card Quotas')}
              </h2>
              <span className="font-bold text-[#3B123F] tabular-nums">
                {currentFactoryEmployees.length} {t('موظف', 'employees')}
              </span>
            </div>
            {/* Mobile Tap List Rows (Zero horizontal overflow on 375px screens) */}
            <div className="md:hidden divide-y divide-[#ECE4E8]">
              {currentFactoryEmployees.map((emp) => (
                <div key={emp.empId} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-[#1D152B] truncate">
                      {isEn ? emp.nameEn : emp.nameAr}
                    </div>
                    <div className="text-[11px] text-[#6B6478] truncate">
                      {emp.employeeCode} · {emp.departmentAr} · {emp.shift}
                    </div>
                  </div>
                  <div className="text-end shrink-0 tabular-nums">
                    <div className="font-bold text-[#3B123F]">
                      {emp.monthlyCardLimitEGP} {t('ج.م', 'EGP')}
                    </div>
                    <div className="text-[10px] text-[#6B6478]">{t('حد شهري', 'Monthly')}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="border-b border-[#ECE4E8] text-[#6B6478]">
                    <th className="py-2 px-2 text-start">{t('الكود', 'Code')}</th>
                    <th className="py-2 px-2 text-start">{t('الاسم', 'Name')}</th>
                    <th className="py-2 px-2 text-start">{t('القسم / الوردية', 'Dept / Shift')}</th>
                    <th className="py-2 px-2 text-end">{t('حد الكارت', 'Monthly Card')}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentFactoryEmployees.map((emp) => (
                    <tr key={emp.empId} className="border-b border-[#ECE4E8]/60">
                      <td className="py-2.5 px-2 font-mono font-bold text-[#3B123F]">
                        {emp.employeeCode}
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-[#1D152B]">
                        {isEn ? emp.nameEn : emp.nameAr}
                      </td>
                      <td className="py-2.5 px-2 text-[#6B6478]">
                        {emp.departmentAr} · {emp.shift}
                      </td>
                      <td className="py-2.5 px-2 text-end font-bold tabular-nums">
                        {emp.monthlyCardLimitEGP} {t('ج.م', 'EGP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form
            onSubmit={handleAddEmployee}
            className="lg:col-span-4 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#3B123F]" />
              <h3 className="text-base font-bold text-[#1D152B]">
                {t('إضافة موظف وتفعيل حصة الكارت', 'Add Factory Employee & Card Quota')}
              </h3>
            </div>
            {!isFactoryManagerOrAdmin && (
              <p className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                {t('إضافة الموظفين متاحة لمدير المصنع أو مدير النظام.', 'Only Factory Managers or System Admins can add employees.')}
              </p>
            )}
            <input
              type="text"
              required
              value={newEmpCode}
              onChange={(e) => setNewEmpCode(e.target.value)}
              placeholder={t('كود الموظف (مثال EMP-404)', 'Employee Code')}
              className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
            <input
              type="text"
              required
              value={newEmpNameAr}
              onChange={(e) => setNewEmpNameAr(e.target.value)}
              placeholder={t('الاسم بالعربية', 'Full Name (AR)')}
              className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
            <input
              type="text"
              value={newEmpNameEn}
              onChange={(e) => setNewEmpNameEn(e.target.value)}
              placeholder={t('الاسم بالإنجليزية', 'Full Name (EN)')}
              className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={newEmpDept}
                onChange={(e) => setNewEmpDept(e.target.value)}
                placeholder={t('القسم', 'Department')}
                className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              />
              <input
                type="text"
                required
                value={newEmpTitle}
                onChange={(e) => setNewEmpTitle(e.target.value)}
                placeholder={t('المسمى الوظيفي', 'Job Title')}
                className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={newEmpShift}
                onChange={(e) => setNewEmpShift(e.target.value)}
                placeholder={t('الوردية', 'Shift')}
                className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
              />
              <input
                type="number"
                min={0}
                max={50000}
                value={newEmpQuota}
                onChange={(e) => setNewEmpQuota(Math.max(0, Number(e.target.value) || 0))}
                placeholder={t('رصيد الكارت الشهري', 'Monthly Quota')}
                className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white tabular-nums"
              />
            </div>
            <button
              type="submit"
              disabled={!isFactoryManagerOrAdmin || submitting}
              style={{ backgroundColor: primaryColor }}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl text-white font-bold cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {t('حفظ الموظف في قاعدة المصنع', 'Save Factory Employee')}
            </button>
          </form>
        </div>
      )}

      {/* VIEW 3: OFFERS & ORDERS */}
      {subView === 'offers_orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-bold text-[#1D152B]">
              {t('عروض ومزايا موظفي المصنع المعتمدة', 'Approved Factory Employee Offers')}
            </h2>
            {factoryOffers.map((ad) => (
              <div key={ad.offerId} className="p-3.5 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#3B123F]">
                    {isEn ? ad.discountBadgeEn : ad.discountBadgeAr}
                  </span>
                  <span className="text-[#6B6478]">{ad.validTo || '2026-12-31'}</span>
                </div>
                <p className="font-bold text-[#1D152B]">{isEn ? ad.titleEn : ad.titleAr}</p>
                {ad.terms && <p className="text-[#6B6478]">{ad.terms}</p>}
              </div>
            ))}
          </div>

          <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-bold text-[#1D152B]">
              {t('طلبات الوجبات وسجل الدفع للمصنع', 'Factory Meal Orders & Payments')}
            </h2>
            {factoryOrders.length === 0 ? (
              <p className="text-[#6B6478]">
                {t('لا توجد طلبات مسجلة لهذا المصنع بعد.', 'No orders recorded for this factory yet.')}
              </p>
            ) : (
              factoryOrders.map((ord) => {
                const tx = paymentTransactions.find((p) => p.orderId === ord.orderId);
                return (
                  <div key={ord.orderId} className="p-3 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>{ord.customerName}</span>
                      <span className="tabular-nums text-[#3B123F]">{ord.totalEGP} {t('ج.م', 'EGP')}</span>
                    </div>
                    <p className="text-[#6B6478]">{ord.itemsSummary}</p>
                    <p className="text-[11px] font-semibold text-[#1D152B]">
                      {t('حالة الطلب:', 'Order:')} {ord.status} · {t('الدفع:', 'Payment:')} {tx?.status || 'Pending'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: COMPLAINTS & ALERTS */}
      {subView === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs">
          <form
            onSubmit={handleSubmitComplaint}
            className="lg:col-span-5 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-[#3B123F]" />
              <h2 className="text-base font-bold text-[#1D152B]">
                {t('تقديم شكوى أو تنبيه تشغيل داخل المصنع', 'Submit Factory Complaint / Alert')}
              </h2>
            </div>
            <select
              value={cmpCategory}
              onChange={(e) => setCmpCategory(e.target.value as FactoryComplaint['category'])}
              className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            >
              <option value="meal_quality">{t('جودة الوجبة', 'Meal Quality')}</option>
              <option value="delivery_delay">{t('تأخير توصيل الوردية', 'Shift Delivery Delay')}</option>
              <option value="card_voucher">{t('رصيد كارت باسط / قسيمة', 'BASIT Card / Voucher')}</option>
              <option value="kitchen_hygiene">{t('سلامة الغذاء والنظافة', 'Kitchen Hygiene')}</option>
              <option value="other">{t('أخرى', 'Other')}</option>
            </select>
            <input
              type="text"
              required
              minLength={3}
              value={cmpSubject}
              onChange={(e) => setCmpSubject(e.target.value)}
              placeholder={t('عنوان الشكوى أو التنبيه', 'Subject')}
              className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
            <textarea
              rows={3}
              required
              minLength={5}
              value={cmpDetails}
              onChange={(e) => setCmpDetails(e.target.value)}
              placeholder={t('اشرح التفاصيل والموعد أو الوردية...', 'Describe details, shift, or voucher issue...')}
              className="w-full p-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: primaryColor }}
              className="w-full min-h-[44px] rounded-xl text-white font-bold cursor-pointer"
            >
              {t('إرسال لإدارة المصنع', 'Submit to Factory Manager')}
            </button>
          </form>

          <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-bold text-[#1D152B]">
              {t('سجل الشكاوى والتنبيهات النشطة', 'Factory Complaints & Notifications Feed')}
            </h2>
            {currentFactoryComplaints.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#ECE4E8] text-[#6B6478] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#3B123F]" />
                <span>{t('لا توجد شكاوى مفتوحة حالياً لهذا المصنع.', 'No open complaints for this factory.')}</span>
              </div>
            ) : (
              currentFactoryComplaints.map((c) => (
                <div key={c.complaintId} className="p-3.5 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#1D152B]">{c.subject}</span>
                    <span className="font-bold text-[#3B123F]">{c.status}</span>
                  </div>
                  <p className="text-[#6B6478]">{c.details}</p>
                  {c.resolutionNote && (
                    <p className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {c.resolutionNote}
                    </p>
                  )}
                  {isFactoryManagerOrAdmin && c.status !== 'resolved' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={resolutionDrafts[c.complaintId] || ''}
                        onChange={(e) =>
                          setResolutionDrafts((prev) => ({
                            ...prev,
                            [c.complaintId]: e.target.value,
                          }))
                        }
                        placeholder={t('رد الإدارة وخطة المعالجة', 'Manager resolution note')}
                        className="flex-1 min-h-[36px] px-2.5 rounded-lg border border-[#ECE4E8] bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          void updateFactoryComplaintStatus({
                            complaintId: c.complaintId,
                            status: 'resolved',
                            resolutionNote:
                              resolutionDrafts[c.complaintId] ||
                              t('تمت المعالجة والاعتماد من مدير المصنع', 'Resolved by Factory Manager'),
                          })
                        }
                        className="min-h-[36px] px-3 rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                      >
                        {t('إغلاق وحل', 'Resolve')}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 5: CENTRAL KITCHEN SUPPLY & CAPACITY */}
      {subView === 'kitchen_supply' && (
        <form
          onSubmit={handleRequestKitchenSupply}
          className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-4 text-xs max-w-2xl"
        >
          <div>
            <h2 className="text-base font-bold text-[#1D152B]">
              {t('ربط المصنع بالمطابخ المركزية والطاقة الإنتاجية', 'Factory-to-Central-Kitchen Supply & Capacity Link')}
            </h2>
            <p className="text-[#6B6478]">
              {t('اختر المطبخ المركزي المتعاقد معه واطلب كميات الورديات اليومية مباشرة.', 'Select a certified central kitchen and request daily factory shift allocations.')}
            </p>
          </div>
          <select
            value={targetKitchenId}
            onChange={(e) => setTargetKitchenId(e.target.value)}
            className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
          >
            {centralKitchens.map((k) => (
              <option key={k.tenantId} value={k.tenantId}>
                {(isEn ? k.nameEn || k.name : k.name) +
                  ` (${k.capacityMealsPerDay || 5000} ${t('وجبة/يوم', 'meals/day')})`}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={10}
            value={supplyMealsQty}
            onChange={(e) => setSupplyMealsQty(Math.max(10, Number(e.target.value) || 10))}
            placeholder={t('عدد الوجبات اليومية المطلوبة', 'Daily Meals Required')}
            className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white tabular-nums"
          />
          <textarea
            rows={3}
            value={supplyNotes}
            onChange={(e) => setSupplyNotes(e.target.value)}
            placeholder={t('مواعيد تسليم الورديات الصباحية والمسائية...', 'Morning & night shift delivery slots...')}
            className="w-full p-3 rounded-xl border border-[#ECE4E8] bg-white"
          />
          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: primaryColor }}
            className="min-h-[44px] px-5 rounded-xl text-white font-bold cursor-pointer"
          >
            {t('إرسال طلب التوريد للمطبخ المركزي', 'Send Supply Request to Kitchen')}
          </button>
        </form>
      )}

      {/* Thumb-Zone Quick Checkout Bar on Mobile when Cart has Items */}
      {subView === 'meals' && cartItems.length > 0 && (
        <div className="md:hidden fixed bottom-[62px] left-3 right-3 z-30">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('factory-checkout-form');
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            style={{ backgroundColor: primaryColor }}
            className="w-full min-h-[46px] px-4 rounded-2xl text-white shadow-lg flex items-center justify-between text-xs font-bold active:scale-[0.98] transition-transform cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              {t('عرض السلة وإتمام الطلب', 'Review & Submit Order')} ({cartItems.reduce((s, i) => s + i.qty, 0)})
            </span>
            <span className="tabular-nums text-sm" style={{ color: accentColor }}>
              {cartTotal} {t('ج.م', 'EGP')}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
