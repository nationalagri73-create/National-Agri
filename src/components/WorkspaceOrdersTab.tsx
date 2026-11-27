import React, { useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  CreditCard,
  HeartHandshake,
  Plus,
  QrCode,
  Scale,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react';
import {
  BenefitBooking,
  CatalogItem,
  CharityContribution,
  CommercialOrder,
  KaffarahOrder,
  LogisticsServiceInquiry,
  OrderStatus,
  PaymentTransaction,
  TenantWorkspace,
  VipDirectOrder,
} from '../types/fayd';
import {
  confirmSandboxPaymentTransaction,
  createCatalogItemRecord,
  updateOrderStatus,
} from '../services/faydFirestore';

interface WorkspaceOrdersTabProps {
  uid: string | null;
  customerOrders: CommercialOrder[];
  merchantOrders: CommercialOrder[];
  ownedTenants: TenantWorkspace[];
  catalogItems: CatalogItem[];
  vipOrders: VipDirectOrder[];
  paymentTransactions: PaymentTransaction[];
  benefitBookings: BenefitBooking[];
  charityContributions: CharityContribution[];
  kaffarahOrders: KaffarahOrder[];
  logisticsInquiries: LogisticsServiceInquiry[];
  onRequireAuth: () => void;
  onShowQr: (title: string, subtitle: string, payload: string) => void;
}

const ORDER_STATUS_AR: Record<OrderStatus, string> = {
  pending_merchant: 'بانتظار قبول المتجر',
  accepted_preparing: 'قيد التجهيز',
  ready_for_pickup: 'جاهز للاستلام',
  in_delivery: 'قيد التوصيل',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const NEXT_ORDER_STATUS: Partial<
  Record<OrderStatus, { next: OrderStatus; label: string }>
> = {
  pending_merchant: { next: 'accepted_preparing', label: 'قبول وبدء التجهيز' },
  accepted_preparing: { next: 'ready_for_pickup', label: 'جاهز للاستلام' },
  ready_for_pickup: { next: 'in_delivery', label: 'تسليم للتوصيل' },
  in_delivery: { next: 'completed', label: 'إتمام الطلب' },
};

const VIP_STATUS_AR: Record<VipDirectOrder['status'], string> = {
  pending_owner: 'بانتظار مراجعة الإدارة',
  approved: 'معتمد',
  preparing: 'قيد التجهيز',
  completed: 'مكتمل',
  rejected: 'مرفوض',
};

export const WorkspaceOrdersTab: React.FC<WorkspaceOrdersTabProps> = ({
  uid,
  customerOrders,
  merchantOrders,
  ownedTenants,
  catalogItems,
  vipOrders,
  paymentTransactions,
  benefitBookings,
  charityContributions,
  kaffarahOrders,
  logisticsInquiries,
  onRequireAuth,
  onShowQr,
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState(
    ownedTenants[0]?.tenantId ?? '',
  );
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState('وجبات وإعاشة');
  const [itemPrice, setItemPrice] = useState('120');
  const [itemStock, setItemStock] = useState('50');
  const [catalogMsg, setCatalogMsg] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [txBusyId, setTxBusyId] = useState<string | null>(null);

  const activeTenant =
    ownedTenants.find((t) => t.tenantId === selectedTenantId) || ownedTenants[0];

  const tenantCatalog = activeTenant
    ? catalogItems.filter((c) => c.tenantId === activeTenant.tenantId)
    : [];

  const handleSandboxConfirm = async (txId: string, nextStatus: 'Paid' | 'Cancelled') => {
    setTxBusyId(txId);
    try {
      await confirmSandboxPaymentTransaction(txId, nextStatus);
    } finally {
      setTxBusyId(null);
    }
  };

  const handleAddCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    if (!activeTenant) {
      setCatalogMsg('لا يوجد متجر مملوك لك لإضافة منتجات إليه.');
      return;
    }
    if (itemTitle.trim().length < 2) {
      setCatalogMsg('أدخل اسم المنتج أو الوجبة (حرفين على الأقل).');
      return;
    }
    const price = Number(itemPrice);
    const stock = Number(itemStock);
    if (!Number.isFinite(price) || price < 1) {
      setCatalogMsg('أدخل سعراً صحيحاً أكبر من 0.');
      return;
    }

    setSavingItem(true);
    setCatalogMsg(null);
    try {
      const id = await createCatalogItemRecord({
        tenantId: activeTenant.tenantId,
        merchantOwnerUid: uid,
        storeName: activeTenant.name,
        title: itemTitle.trim(),
        category: itemCategory.trim() || 'وجبات وإعاشة',
        priceEGP: price,
        stockQty: Math.max(0, stock || 0),
      });
      setCatalogMsg(`تمت إضافة الصنف (${id}) داخل نطاق المستأجر ${activeTenant.tenantId}.`);
      setItemTitle('');
    } catch (err) {
      setCatalogMsg(err instanceof Error ? err.message : 'تعذر إضافة الصنف.');
    } finally {
      setSavingItem(false);
    }
  };

  if (!uid) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center">
        <ClipboardList className="w-8 h-8 text-[#3B123F] mx-auto" />
        <h2 className="mt-3 text-base font-bold text-slate-900">
          الطلبات ومساحة عمل التاجر المعزولة
        </h2>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          قم بتسجيل الدخول لعرض طلباتك التجارية، طلبات باسط المباشرة، مدفوعاتك، حجوزات المزايا، أو إدارة كتالوج متجرك المعزول.
        </p>
        <button
          type="button"
          onClick={onRequireAuth}
          className="mt-4 min-h-[44px] px-5 rounded-xl bg-[#3B123F] text-white text-xs font-semibold cursor-pointer"
        >
          تسجيل الدخول عبر Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Customer Orders & VIP Direct Orders Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Commercial Orders */}
          <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  طلباتي التجارية ({customerOrders.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  استعلام معزول بشرط customerUid == uid
                </p>
              </div>
            </div>

            {customerOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                لم تقم بإنشاء أي طلبات تجارية حتى الآن.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {customerOrders.map((ord) => (
                  <li key={ord.orderId} className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-slate-500">
                          {ord.orderId} · {ord.tenantId}
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-900">
                          {ord.itemsSummary}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {ord.dropoffAddress}
                        </div>
                      </div>
                      <div className="text-left shrink-0 tabular-nums">
                        <div className="text-sm font-bold text-slate-900">
                          {(ord.subtotalEGP + ord.deliveryFeeEGP).toLocaleString('en-US')} ج.م
                        </div>
                        <div className="text-xs font-semibold text-[#3B123F]">
                          {ORDER_STATUS_AR[ord.status] || ord.status}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          onShowQr(
                            'بطاقة استلام الطلب',
                            `${ord.itemsSummary} · ${ORDER_STATUS_AR[ord.status]}`,
                            `BASIT:ORDER:${ord.orderId}:${ord.tenantId}`,
                          )
                        }
                        className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        رمز QR للطلب
                      </button>

                      {ord.status === 'pending_merchant' && (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(ord.orderId, 'cancelled')}
                          className="min-h-[40px] px-3 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          إلغاء الطلب
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* VIP Direct Orders (Ha-Be & Direct Offers) + Sandbox Payments */}
          <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#3B123F]" />
                  طلبات باسط المباشرة و Ha-Be ({vipOrders.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  تتبع حالة التنفيذ ومعاملات الدفع التجريبية (Sandbox)
                </p>
              </div>
            </div>

            {vipOrders.length === 0 && paymentTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                لا توجد طلبات مباشرة أو معاملات دفع مسجلة بعد.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {vipOrders.map((vo) => {
                  const tx = paymentTransactions.find((t) => t.orderId === vo.orderId);
                  return (
                    <li key={vo.orderId} className="p-4 sm:p-5 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-mono text-slate-500">
                            {vo.orderId} · {vo.sourceChannel}
                          </div>
                          <div className="mt-1 text-sm font-bold text-slate-900">
                            {vo.itemsSummary}
                          </div>
                          {vo.notes && (
                            <div className="mt-1 text-xs text-slate-500">{vo.notes}</div>
                          )}
                          {vo.ownerReply && (
                            <div className="mt-1 text-xs font-semibold text-emerald-700">
                              رد الإدارة: {vo.ownerReply}
                            </div>
                          )}
                        </div>
                        <div className="text-left shrink-0 tabular-nums">
                          <div className="text-sm font-bold text-slate-900">
                            {vo.totalEGP.toLocaleString('en-US')} ج.م
                          </div>
                          <div className="text-xs font-semibold text-[#3B123F]">
                            {VIP_STATUS_AR[vo.status]}
                          </div>
                        </div>
                      </div>

                      {tx && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="font-semibold text-slate-800">
                              بوابة الدفع: {tx.provider} ({tx.mode})
                            </span>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {tx.gatewayReference} · الحالة: {tx.status}
                            </div>
                          </div>
                          {tx.status === 'Pending' && tx.mode === 'sandbox' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={txBusyId === tx.txId}
                                onClick={() => handleSandboxConfirm(tx.txId, 'Paid')}
                                className="min-h-[36px] px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                              >
                                تأكيد الدفع (Sandbox)
                              </button>
                              <button
                                type="button"
                                disabled={txBusyId === tx.txId}
                                onClick={() => handleSandboxConfirm(tx.txId, 'Cancelled')}
                                className="min-h-[36px] px-2.5 rounded-lg border border-slate-300 text-red-600 text-xs font-semibold cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Merchant Isolated Tenant Workspace */}
        <section className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-[#3B123F]" />
                مساحة التاجر المعزولة ({ownedTenants.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إدارة كتالوج وطلبات المستأجر المملوك لك فقط
              </p>
            </div>

            {ownedTenants.length > 0 && (
              <select
                value={activeTenant?.tenantId || ''}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="min-h-[40px] px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {ownedTenants.map((t) => (
                  <option key={t.tenantId} value={t.tenantId}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {ownedTenants.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              حسابك لا يمتلك مساحة تاجر معتمدة حالياً. يمكنك التقديم من تبويب المتاجر وسيتم تفعيل المساحة بعد اعتماد الإدارة.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              <div className="p-4 sm:p-5">
                <h3 className="text-xs font-bold text-slate-800 mb-3">
                  الطلبات الواردة للمستأجر ({merchantOrders.length})
                </h3>
                {merchantOrders.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد طلبات واردة حالياً.</p>
                ) : (
                  <ul className="space-y-3">
                    {merchantOrders.map((ord) => {
                      const nextAction = NEXT_ORDER_STATUS[ord.status];
                      return (
                        <li
                          key={ord.orderId}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {ord.customerName} · {ord.itemsSummary}
                              </div>
                              <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                                صافي التاجر: {ord.netMerchantEGP} ج.م · عمولة المنصة: {ord.platformCommissionEGP} ج.م
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-[#3B123F] shrink-0">
                              {ORDER_STATUS_AR[ord.status]}
                            </span>
                          </div>

                          {nextAction && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(ord.orderId, nextAction.next)}
                                className="min-h-[40px] px-3 rounded-xl bg-[#3B123F] text-white text-xs font-semibold hover:bg-[#501C5A] cursor-pointer"
                              >
                                {nextAction.label}
                              </button>
                              {ord.status !== 'completed' && ord.status !== 'cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => updateOrderStatus(ord.orderId, 'cancelled')}
                                  className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-red-600 text-xs font-semibold hover:bg-red-50 cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <form onSubmit={handleAddCatalogItem} className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">
                    إضافة صنف جديد لكتالوج {activeTenant?.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    ({tenantCatalog.length} أصناف)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="اسم الصنف أو الوجبة"
                    maxLength={140}
                    className="sm:col-span-2 min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                  <input
                    type="text"
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    placeholder="التصنيف"
                    maxLength={64}
                    className="min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={1}
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="السعر"
                      className="min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl tabular-nums"
                    />
                    <input
                      type="number"
                      min={0}
                      value={itemStock}
                      onChange={(e) => setItemStock(e.target.value)}
                      placeholder="الكمية"
                      className="min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl tabular-nums"
                    />
                  </div>
                </div>

                {catalogMsg && (
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{catalogMsg}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingItem}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#3B123F] disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {savingItem ? 'جاري الحفظ...' : 'إضافة الصنف للكتالوج'}
                </button>
              </form>
            </div>
          )}
        </section>
      </div>

      {/* Ecosystem Activity Strip: Benefits, Charity, Kaffarah, Logistics RFQs */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#3B123F]" />
            حجوزات المزايا ({benefitBookings.length})
          </h3>
          {benefitBookings.length === 0 ? (
            <p className="text-xs text-slate-500">لا توجد حجوزات ترفيهية مسجلة.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {benefitBookings.map((b) => (
                <li key={b.bookingId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">{b.venueName}</div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {b.requestedDate} · {b.peopleCount} أفراد · {b.status}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-emerald-700" />
            مساهمات الخير ({charityContributions.length})
          </h3>
          {charityContributions.length === 0 ? (
            <p className="text-xs text-slate-500">لا توجد مساهمات خيرية مسجلة.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {charityContributions.map((c) => (
                <li key={c.contributionId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">{c.initiativeTitle}</div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {c.pledgeAmountEGP.toLocaleString('en-US')} ج.م · {c.status}
                  </div>
                  {c.proofUrl && (
                    <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 truncate">
                      إثبات التنفيذ: {c.proofUrl}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-700" />
            توكيلات كفارة اليمين ({kaffarahOrders.length})
          </h3>
          {kaffarahOrders.length === 0 ? (
            <p className="text-xs text-slate-500">لا توجد توكيلات كفارة مسجلة.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {kaffarahOrders.map((k) => (
                <li key={k.orderId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 tabular-nums">
                    {k.kaffarahCount} كفارة · {k.totalMeals} وجبة
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {k.totalAmountEGP.toLocaleString('en-US')} ج.م · {k.executionStatus}
                  </div>
                  {k.executionProofUrl && (
                    <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 truncate">
                      التوثيق: {k.executionProofUrl}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-[#3B123F]" />
            طلبات التموين واللوجستيات ({logisticsInquiries.length})
          </h3>
          {logisticsInquiries.length === 0 ? (
            <p className="text-xs text-slate-500">لا توجد طلبات عروض أسعار لوجستية.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {logisticsInquiries.map((inq) => (
                <li key={inq.inquiryId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">{inq.organizationName}</div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {inq.serviceKey} · {inq.guestCount} فرد · {inq.status}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

