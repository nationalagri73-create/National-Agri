import React, { useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import {
  HABE_CATEGORY_LABELS,
  HABE_EGYPT_EMPLOYEES,
  HABE_PRICE_CATALOG,
  HabeCatalogItem,
  HabeCategoryKey,
  HabeEmployee,
} from '../data/habeCatalog';
import {
  confirmSandboxPaymentTransaction,
  createVipDirectOrderWithPayment,
} from '../services/faydFirestore';
import {
  PaymentGatewayConfig,
  PaymentProviderId,
  UserProfile,
} from '../types/fayd';

interface HabePortalTabProps {
  uid: string | null;
  userProfile: UserProfile | null;
  defaultPhone?: string;
  gateways: PaymentGatewayConfig[];
  onRequireAuth: () => void;
  onShowQr: (title: string, subtitle: string, payload: string) => void;
}

export const HabePortalTab: React.FC<HabePortalTabProps> = ({
  uid,
  userProfile,
  defaultPhone,
  gateways,
  onRequireAuth,
  onShowQr,
}) => {
  const [category, setCategory] = useState<HabeCategoryKey>('all');
  const [search, setSearch] = useState('');
  const [empQuery, setEmpQuery] = useState('');
  const [verifiedEmp, setVerifiedEmp] = useState<HabeEmployee | null>(null);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentProviderId>('vodafone_cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingSandboxTx, setPendingSandboxTx] = useState<{
    txId: string;
    orderId: string;
    amount: number;
  } | null>(null);

  const filteredEmployees = useMemo(() => {
    const q = empQuery.trim().toLowerCase();
    if (!q) return [];
    return HABE_EGYPT_EMPLOYEES.filter(
      (e) =>
        e.code.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.nameAr.toLowerCase().includes(q) ||
        e.nameEn.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [empQuery]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return HABE_PRICE_CATALOG.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.nameAr.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q)
      );
    });
  }, [category, search]);

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = HABE_PRICE_CATALOG.find((x) => x.id === id);
        return item ? { item, qty } : null;
      })
      .filter((x): x is { item: HabeCatalogItem; qty: number } => Boolean(x));
  }, [cart]);

  const cartTotalEGP = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.item.priceEGP * l.qty, 0),
    [cartLines],
  );
  const cartCount = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.qty, 0),
    [cartLines],
  );

  const addQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = Math.max(0, Math.min(50, (prev[id] ?? 0) + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const handleSelectEmployee = (emp: HabeEmployee) => {
    setVerifiedEmp(emp);
    setEmpQuery(`${emp.code} — ${emp.nameAr}`);
    if (!customerName) setCustomerName(emp.nameAr);
    if (!phone && emp.compNumber) setPhone(emp.compNumber);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    if (cartLines.length === 0) return;

    const finalName =
      customerName.trim() ||
      verifiedEmp?.nameAr ||
      userProfile?.displayName ||
      'موظف ها-بي';
    const finalPhone = (phone.trim() || defaultPhone || '').trim();
    if (finalPhone.length < 6) {
      setNotice('يرجى إدخال رقم هاتف صحيح (6 أرقام على الأقل).');
      return;
    }

    setSubmitting(true);
    setNotice(null);
    try {
      const empNotePrefix = verifiedEmp
        ? `[موظف Ha-Be: ${verifiedEmp.code} / ${verifiedEmp.departmentAr}] `
        : '';
      const { orderId, txId } = await createVipDirectOrderWithPayment({
        customerUid: uid,
        customerName: finalName,
        phone: finalPhone,
        sourceChannel: 'al_ain_offer',
        items: cartLines.map((l) => ({
          code: l.item.code,
          title: l.item.nameAr,
          qty: l.qty,
          unitPriceEGP: l.item.priceEGP,
        })),
        paymentMethod,
        notes: `${empNotePrefix}${notes.trim()}`.trim(),
        tenantId: 'tenant_kitchen_alain',
      });

      setCart({});
      setShowCheckout(false);
      setPendingSandboxTx({ txId, orderId, amount: cartTotalEGP });
      setNotice(
        `تم تسجيل طلب Ha-Be رقم ${orderId} وإصدار معاملة الدفع (${txId}) في وضع Sandbox.`,
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'تعذر إرسال الطلب.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSandboxPay = async () => {
    if (!pendingSandboxTx) return;
    try {
      await confirmSandboxPaymentTransaction(pendingSandboxTx.txId, 'Paid');
      onShowQr(
        'تم سداد واعتماد طلب ها-بي',
        `رقم الطلب: ${pendingSandboxTx.orderId} · القيمة: ${pendingSandboxTx.amount} ج.م`,
        `BASIT:HABE:${pendingSandboxTx.orderId}:${pendingSandboxTx.txId}`,
      );
      setPendingSandboxTx(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'تعذر تأكيد السداد.');
    }
  };

  const enabledGateways = gateways.length
    ? gateways.filter((g) => g.isEnabled)
    : [
        { providerId: 'vodafone_cash' as const, displayName: 'فودافون كاش' },
        { providerId: 'instapay' as const, displayName: 'إنستاباي' },
        { providerId: 'fawry' as const, displayName: 'فوري' },
        {
          providerId: 'cash_on_delivery' as const,
          displayName: 'عند الاستلام / خصم الراتب',
        },
      ];

  return (
    <div className="space-y-5">
      {/* Ha-Be Header & Employee Verification */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-600/10 text-red-600 flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                نقطة موظفي Ha-Be (ها-بي) — باسط والعين
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                منيو التعاقد المؤسسي المعتمد ({HABE_PRICE_CATALOG.length} صنفاً) · دليل موظفي المصنع والإدارة ({HABE_EGYPT_EMPLOYEES.length} موظفاً)
              </p>
            </div>
          </div>

          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => setShowCheckout(true)}
              className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
            >
              <ShoppingBag className="w-4 h-4" />
              إتمام الطلب ({cartCount} صنف · {cartTotalEGP.toLocaleString('en-US')} ج.م)
            </button>
          )}
        </div>

        {/* Employee Code Quick Lookup */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="habe-emp-search"
              className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
            >
              <BadgeCheck className="w-4 h-4 text-[#4F2487]" />
              تحقق سريع بكود الموظف (اختياري للمزايا والخصم على الراتب)
            </label>
            {verifiedEmp && (
              <button
                type="button"
                onClick={() => {
                  setVerifiedEmp(null);
                  setEmpQuery('');
                }}
                className="text-[11px] font-semibold text-red-600 cursor-pointer"
              >
                إلغاء التحديد
              </button>
            )}
          </div>

          <input
            id="habe-emp-search"
            type="text"
            value={empQuery}
            onChange={(e) => {
              setEmpQuery(e.target.value);
              if (verifiedEmp) setVerifiedEmp(null);
            }}
            placeholder="اكتب كود الموظف مثل HB-024 أو GER-001 أو اسم الموظف..."
            className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
          />

          {!verifiedEmp && filteredEmployees.length > 0 && (
            <ul className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-xl overflow-hidden">
              {filteredEmployees.map((emp) => (
                <li key={emp.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full px-3.5 py-2.5 text-right hover:bg-slate-50 flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{emp.nameAr}</span>
                      <span className="text-slate-500 mr-2">
                        ({emp.departmentAr})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#4F2487] shrink-0">
                      {emp.code}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {verifiedEmp && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
              <span>
                موظف موثق: <strong>{verifiedEmp.nameAr}</strong> · {verifiedEmp.jobTitle}
              </span>
              <span className="font-mono font-bold">{verifiedEmp.code}</span>
            </div>
          )}
        </div>

        {notice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notice}</span>
            </div>
            {pendingSandboxTx && (
              <button
                type="button"
                onClick={handleConfirmSandboxPay}
                className="min-h-[38px] px-3.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 cursor-pointer shrink-0"
              >
                تأكيد السداد التجريبي (Sandbox Paid)
              </button>
            )}
          </div>
        )}
      </section>

      {/* Menu Filter + Search */}
      <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالكود (CBK-01, FCT-04) أو اسم الوجبة..."
              className="w-full min-h-[44px] pr-10 pl-9 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(Object.keys(HABE_CATEGORY_LABELS) as HabeCategoryKey[]).map(
              (catKey) => {
                const active = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`min-h-[40px] px-3.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#4F2487] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    {HABE_CATEGORY_LABELS[catKey]}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 sm:p-5">
          {filteredItems.map((item) => {
            const qty = cart[item.id] ?? 0;
            return (
              <article
                key={item.id}
                className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-white"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="font-mono font-bold text-[#4F2487]">
                      {item.code}
                    </span>
                    <span>{HABE_CATEGORY_LABELS[item.category]}</span>
                  </div>
                  <h3 className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
                    {item.nameAr}
                  </h3>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-base font-bold text-slate-900 tabular-nums">
                    {item.priceEGP} ج.م
                  </div>

                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => addQty(item.id, 1)}
                      className="min-h-[40px] px-3.5 inline-flex items-center gap-1 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#4F2487] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      أضف للطلب
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => addQty(item.id, -1)}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => addQty(item.id, 1)}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-[#4F2487] text-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Ha-Be Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <form
            onSubmit={handleCheckoutSubmit}
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl max-h-[92vh] overflow-y-auto"
          >
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تأكيد طلب موظفي Ha-Be / باسط المباشر
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  يُرسل مباشرة لإدارة باسط وتُفتح معاملة دفع موثقة
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <ul className="divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-xl px-3">
                {cartLines.map(({ item, qty }) => (
                  <li
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {item.nameAr}
                      </div>
                      <div className="text-slate-500 tabular-nums">
                        {qty} × {item.priceEGP} ج.م = {qty * item.priceEGP} ج.م
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addQty(item.id, -qty)}
                      className="text-red-600 p-1.5 cursor-pointer"
                      aria-label="حذف الصنف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={
                      customerName ||
                      verifiedEmp?.nameAr ||
                      userProfile?.displayName ||
                      ''
                    }
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="اسم الموظف أو العميل"
                    maxLength={120}
                    className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    رقم الهاتف للتسليم (مطلوب)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    maxLength={32}
                    className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <CreditCard className="w-3.5 h-3.5 inline ml-1 text-[#4F2487]" />
                  وسيلة السداد المعتمدة
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentProviderId)
                  }
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  {enabledGateways.map((gw) => (
                    <option key={gw.providerId} value={gw.providerId}>
                      {gw.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ملاحظات التجهيز أو موقع المصنع / الدور
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: البوابة الرئيسية - الوردية الصباحية"
                  maxLength={500}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-sm font-bold text-slate-900 tabular-nums">
                <span>الإجمالي المستحق</span>
                <span>{cartTotalEGP.toLocaleString('en-US')} ج.م</span>
              </div>

              {notice && (
                <p role="alert" className="text-xs font-semibold text-red-600">
                  {notice}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              {submitting
                ? 'جاري التسجيل...'
                : uid
                  ? 'تأكيد وإرسال الطلب الآن'
                  : 'تسجيل الدخول لإتمام الطلب'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
