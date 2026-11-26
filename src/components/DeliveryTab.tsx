import React, { useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import {
  CommissionRule,
  CourierProfile,
  DeliveryRequest,
  TenantWorkspace,
} from '../types/fayd';
import {
  advanceCourierDeliveryStatus,
  createDeliveryDispatch,
  updateCourierOnlineZone,
} from '../services/faydFirestore';

interface DeliveryTabProps {
  uid: string | null;
  courierProfile: CourierProfile | null;
  myDeliveries: DeliveryRequest[];
  requestedDeliveries: DeliveryRequest[];
  ownedTenants: TenantWorkspace[];
  commissionRule: CommissionRule;
  onRequireAuth: () => void;
}

const DELIVERY_STATUS_AR: Record<string, string> = {
  requested: 'بانتظار تعيين ساعي',
  assigned: 'تم التعيين',
  picked_up: 'تم الاستلام',
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

const NEXT_STEP: Record<
  string,
  { next: 'picked_up' | 'in_transit' | 'delivered'; label: string } | undefined
> = {
  assigned: { next: 'picked_up', label: 'تأكيد استلام الشحنة (Picked Up)' },
  picked_up: { next: 'in_transit', label: 'بدء التحرك (In Transit)' },
  in_transit: { next: 'delivered', label: 'إتمام التسليم (Delivered)' },
};

export const DeliveryTab: React.FC<DeliveryTabProps> = ({
  uid,
  courierProfile,
  myDeliveries,
  requestedDeliveries,
  ownedTenants,
  commissionRule,
  onRequireAuth,
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState(
    ownedTenants[0]?.tenantId ?? '',
  );
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [packageNote, setPackageNote] = useState('');
  const [deliveryFeeEGP, setDeliveryFeeEGP] = useState(
    String(commissionRule.minDeliveryFeeEGP),
  );
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);
  const [submittingDispatch, setSubmittingDispatch] = useState(false);

  const [podNotes, setPodNotes] = useState<Record<string, string>>({});
  const [courierZone, setCourierZone] = useState(courierProfile?.zone ?? 'القاهرة الكبرى');
  const [courierMsg, setCourierMsg] = useState<string | null>(null);

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    const tenantId = selectedTenantId || ownedTenants[0]?.tenantId;
    if (!tenantId) {
      setDispatchMsg('يجب أن تمتلك متجراً أو مطبخاً نشطاً لإصدار طلب توصيل معزول.');
      return;
    }
    if (pickupLocation.trim().length < 3 || dropoffLocation.trim().length < 3) {
      setDispatchMsg('يرجى إدخال نقطة الاستلام ونقطة التسليم (3 أحرف على الأقل).');
      return;
    }

    setSubmittingDispatch(true);
    setDispatchMsg(null);
    try {
      const fee = Math.max(
        commissionRule.minDeliveryFeeEGP,
        Number(deliveryFeeEGP) || commissionRule.minDeliveryFeeEGP,
      );
      const id = await createDeliveryDispatch({
        requesterUid: uid,
        tenantId,
        pickupLocation: pickupLocation.trim(),
        dropoffLocation: dropoffLocation.trim(),
        packageNote: packageNote.trim(),
        deliveryFeeEGP: fee,
        courierSharePct: commissionRule.defaultCourierSharePct,
      });
      setDispatchMsg(`تم إنشاء طلب التوصيل المعزول (${id}) بنجاح.`);
      setPickupLocation('');
      setDropoffLocation('');
      setPackageNote('');
    } catch (err) {
      setDispatchMsg(err instanceof Error ? err.message : 'تعذر إنشاء طلب التوصيل.');
    } finally {
      setSubmittingDispatch(false);
    }
  };

  const handleCourierToggleOnline = async () => {
    if (!uid || !courierProfile) return;
    setCourierMsg(null);
    try {
      await updateCourierOnlineZone({
        courierUid: uid,
        isOnline: !courierProfile.isOnline,
        zone: courierZone.trim() || courierProfile.zone,
      });
      setCourierMsg('تم تحديث حالة التواجد والمنطقة دون المساس بالمحفظة أو الاعتماد.');
    } catch (err) {
      setCourierMsg(err instanceof Error ? err.message : 'تعذر التحديث.');
    }
  };

  const handleAdvanceStep = async (
    deliveryId: string,
    nextStatus: 'picked_up' | 'in_transit' | 'delivered',
  ) => {
    setCourierMsg(null);
    try {
      await advanceCourierDeliveryStatus({
        deliveryId,
        nextStatus,
        podConfirmationNote: podNotes[deliveryId] ?? '',
      });
      setCourierMsg(`تم تحديث حالة الشحنة ${deliveryId} بالتسلسل الآمن إلى ${DELIVERY_STATUS_AR[nextStatus]}.`);
    } catch (err) {
      setCourierMsg(err instanceof Error ? err.message : 'تعذر تحديث الحالة.');
    }
  };

  const allVisible = [...myDeliveries, ...requestedDeliveries].filter(
    (d, index, arr) => arr.findIndex((x) => x.deliveryId === d.deliveryId) === index,
  );

  return (
    <div className="space-y-5">
      {/* Courier Isolated Profile Card */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#4F2487]/10 text-[#4F2487] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                منصة مهام ساعي البريد والتوصيل المعزول
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تسلسل الحالة الإلزامي: تم التعيين ← تم الاستلام ← في الطريق ← تم التسليم (حظر القفز أو تعديل الحصة المالية)
              </p>
            </div>
          </div>

          {courierProfile && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                type="text"
                value={courierZone}
                onChange={(e) => setCourierZone(e.target.value)}
                aria-label="نطاق التوصيل"
                className="min-h-[44px] px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl w-36"
              />
              <button
                type="button"
                onClick={handleCourierToggleOnline}
                className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  courierProfile.isOnline
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {courierProfile.isOnline ? 'متاح للمهام (أونلاين)' : 'تفعيل حالة التواجد'}
              </button>
            </div>
          )}
        </div>

        {courierProfile && (
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs tabular-nums">
            <div>
              <span className="text-slate-500 block">رصيد المحفظة (محمي)</span>
              <span className="text-sm font-bold text-slate-900">
                {courierProfile.walletBalanceEGP.toLocaleString('en-US')} ج.م
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">التسليمات المكتملة</span>
              <span className="text-sm font-bold text-slate-900">
                {courierProfile.completedDeliveries}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">الاعتماد المركزي</span>
              <span className="text-sm font-bold text-emerald-700">
                {courierProfile.isApproved ? 'ساعي معتمد' : 'بانتظار الاعتماد'}
              </span>
            </div>
          </div>
        )}

        {courierMsg && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
            {courierMsg}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Active Deliveries List */}
        <section className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              شحنات التوصيل المعزولة ({allVisible.length})
            </h3>
            <span className="text-xs text-slate-500 inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              حماية التسلسل
            </span>
          </div>

          {!uid ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-slate-800">
                سجّل الدخول لعرض مهام التوصيل المرتبطة بحسابك
              </p>
              <button
                type="button"
                onClick={onRequireAuth}
                className="mt-3 min-h-[44px] px-5 rounded-xl bg-[#4F2487] text-white text-xs font-semibold cursor-pointer"
              >
                تسجيل الدخول عبر Google
              </button>
            </div>
          ) : allVisible.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              لا توجد شحنات توصيل مسندة إليك أو صادرة من متجرك حالياً.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {allVisible.map((del) => {
                const isCourierAssigned = del.assignedCourierUid === uid;
                const step = isCourierAssigned ? NEXT_STEP[del.status] : undefined;

                return (
                  <li key={del.deliveryId} className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500 font-mono">
                          {del.deliveryId} · المستأجر: {del.tenantId}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          <MapPin className="w-4 h-4 text-[#4F2487] shrink-0" />
                          <span>
                            {del.pickupLocation} ← {del.dropoffLocation}
                          </span>
                        </div>
                        {del.packageNote && (
                          <div className="mt-1 text-xs text-slate-500">
                            ملاحظة الشحنة: {del.packageNote}
                          </div>
                        )}
                      </div>

                      <div className="text-left shrink-0 tabular-nums">
                        <div className="text-sm font-bold text-slate-900">
                          {del.deliveryFeeEGP} ج.م
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          حصة الساعي {del.courierShareEGP} ج.م
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-700">
                        الحالة الحالية: {DELIVERY_STATUS_AR[del.status] || del.status}
                      </span>
                      {del.podConfirmationNote && (
                        <span className="text-slate-500">
                          إثبات التسليم: {del.podConfirmationNote}
                        </span>
                      )}
                    </div>

                    {step && (
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={podNotes[del.deliveryId] ?? ''}
                          onChange={(e) =>
                            setPodNotes((prev) => ({
                              ...prev,
                              [del.deliveryId]: e.target.value,
                            }))
                          }
                          placeholder="ملاحظة إثبات الاستلام / التسليم (POD)..."
                          maxLength={200}
                          className="flex-1 min-h-[44px] px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => handleAdvanceStep(del.deliveryId, step.next)}
                          className="min-h-[44px] px-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4F2487] text-white text-xs font-semibold hover:bg-[#3f1c6d] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {step.label}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Merchant Create Delivery Dispatch Form */}
        <section className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-[#4F2487]" />
            <h3 className="text-sm font-bold text-slate-900">
              إصدار طلب توصيل جديد (للتجار والمصانع)
            </h3>
          </div>

          <form onSubmit={handleDispatchSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المستأجر / الكيان المصدر للشحنة
              </label>
              <select
                value={selectedTenantId || ownedTenants[0]?.tenantId || ''}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                disabled={ownedTenants.length === 0}
                className="w-full min-h-[44px] px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-60"
              >
                {ownedTenants.length === 0 ? (
                  <option value="">لا يوجد كيان مملوك لحسابك بعد</option>
                ) : (
                  ownedTenants.map((t) => (
                    <option key={t.tenantId} value={t.tenantId}>
                      {t.name} ({t.tenantId})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نقطة الاستلام (Pickup)
              </label>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="مثال: مطبخ بدر المركزي - بوابة 2"
                maxLength={240}
                className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نقطة التسليم (Dropoff)
              </label>
              <input
                type="text"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                placeholder="مثال: مجمع مصانع العاشر - مبنى الإدارة"
                maxLength={240}
                className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رسوم التوصيل (ج.م)
                </label>
                <input
                  type="number"
                  min={commissionRule.minDeliveryFeeEGP}
                  value={deliveryFeeEGP}
                  onChange={(e) => setDeliveryFeeEGP(e.target.value)}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  حصة الساعي ({commissionRule.defaultCourierSharePct}%)
                </label>
                <div className="min-h-[44px] px-3 flex items-center text-xs font-bold text-emerald-700 bg-slate-50 border border-slate-200 rounded-xl tabular-nums">
                  {Math.round(
                    ((Number(deliveryFeeEGP) || commissionRule.minDeliveryFeeEGP) *
                      commissionRule.defaultCourierSharePct) /
                      100,
                  )}{' '}
                  ج.م
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                وصف الطرد / الوجبات
              </label>
              <input
                type="text"
                value={packageNote}
                onChange={(e) => setPackageNote(e.target.value)}
                placeholder="مثال: 40 وجبة ساخنة في حافظات حرارية"
                maxLength={300}
                className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>

            {dispatchMsg && (
              <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {dispatchMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submittingDispatch}
              className="w-full min-h-[48px] rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#4F2487] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submittingDispatch ? 'جاري الإصدار...' : 'إصدار طلب توصيل'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
