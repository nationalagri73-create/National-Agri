import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  HeartHandshake,
  Scale,
  Send,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { LOGISTICS_COMPLEMENTARY_SERVICES } from '../data/habeCatalog';
import {
  createBenefitBookingRecord,
  createCharityContributionRecord,
  createKaffarahOrderRecord,
  createLogisticsInquiryRecord,
} from '../services/faydFirestore';
import {
  CharityInitiative,
  EntertainmentBenefit,
  KaffarahRule,
  LogisticsServiceKey,
  UserProfile,
} from '../types/fayd';

interface BasitEcosystemPanelsProps {
  section: 'benefits' | 'good_deeds' | 'logistics';
  uid: string | null;
  userProfile: UserProfile | null;
  defaultPhone?: string;
  benefits: EntertainmentBenefit[];
  initiatives: CharityInitiative[];
  kaffarahRule: KaffarahRule;
  onRequireAuth: () => void;
  onShowQr: (title: string, subtitle: string, payload: string) => void;
}

export const BasitEcosystemPanels: React.FC<BasitEcosystemPanelsProps> = ({
  section,
  uid,
  userProfile,
  defaultPhone,
  benefits,
  initiatives,
  kaffarahRule,
  onRequireAuth,
  onShowQr,
}) => {
  // Benefit booking modal state
  const [bookingTarget, setBookingTarget] =
    useState<EntertainmentBenefit | null>(null);
  const [requestedDate, setRequestedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [peopleCount, setPeopleCount] = useState(2);
  const [employerName, setEmployerName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [bookingPhone, setBookingPhone] = useState(defaultPhone || '');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingBusy, setBookingBusy] = useState(false);

  // Charity modal state
  const [charityTarget, setCharityTarget] =
    useState<CharityInitiative | null>(null);
  const [charityPhone, setCharityPhone] = useState(defaultPhone || '');
  const [pledgeAmount, setPledgeAmount] = useState('184');
  const [charityNote, setCharityNote] = useState('');
  const [charityBusy, setCharityBusy] = useState(false);

  // Kaffarah form state (strictly separated)
  const [kaffarahCount, setKaffarahCount] = useState(1);
  const [kaffarahPhone, setKaffarahPhone] = useState(defaultPhone || '');
  const [kaffarahNotes, setKaffarahNotes] = useState('');
  const [kaffarahBusy, setKaffarahBusy] = useState(false);

  // Logistics RFQ modal state
  const [logisticsKey, setLogisticsKey] =
    useState<LogisticsServiceKey | null>(null);
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [rfqPhone, setRfqPhone] = useState(defaultPhone || '');
  const [eventDate, setEventDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [guestCount, setGuestCount] = useState('150');
  const [rfqCity, setRfqCity] = useState('القاهرة');
  const [rfqNotes, setRfqNotes] = useState('');
  const [rfqBusy, setRfqBusy] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);

  const handleBookBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    if (!bookingTarget) return;
    setBookingBusy(true);
    setNotice(null);
    try {
      const bookingId = await createBenefitBookingRecord({
        uid,
        userName: userProfile?.displayName || 'مستفيد باسط',
        tenantId: userProfile?.tenantId || 'public',
        benefitId: bookingTarget.benefitId,
        venueName: bookingTarget.venueName,
        requestedDate,
        peopleCount,
        notes: bookingNotes,
        employerName,
        employeeCode,
        phone: bookingPhone,
        discountLabel: bookingTarget.approvedBenefitText,
      });
      setBookingTarget(null);
      setNotice(`تم تسجيل طلب حجز المزايا (${bookingId}) بنجاح وبانتظار التأكيد.`);
      onShowQr(
        'طلب حجز مزايا باسط',
        `${bookingTarget.venueName} · ${peopleCount} أفراد`,
        `BASIT:BENEFIT:${bookingId}`,
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'تعذر تسجيل الحجز.');
    } finally {
      setBookingBusy(false);
    }
  };

  const handleSubmitCharity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    if (!charityTarget) return;
    if (charityPhone.trim().length < 6) {
      setNotice('يرجى إدخال رقم هاتف للتوثيق (6 أرقام على الأقل).');
      return;
    }
    setCharityBusy(true);
    setNotice(null);
    try {
      const id = await createCharityContributionRecord({
        initiativeId: charityTarget.initiativeId,
        initiativeTitle: charityTarget.titleAr,
        contributorUid: uid,
        contributorName: userProfile?.displayName || 'مساهم خير',
        phone: charityPhone.trim(),
        contributionNote: charityNote.trim(),
        pledgeAmountEGP: Number(pledgeAmount) || 0,
      });
      setCharityTarget(null);
      setCharityNote('');
      setNotice(
        `تم تسجيل مساهمة الخير (${id}) بنجاح وستظهر ضمن قسم الخير مع إثبات التنفيذ بعد التوزيع.`,
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'تعذر تسجيل المساهمة.');
    } finally {
      setCharityBusy(false);
    }
  };

  const handleSubmitKaffarah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    if (kaffarahPhone.trim().length < 6) {
      setNotice('يرجى إدخال رقم هاتف صحيح للتواصل وتوثيق إثبات الإطعام.');
      return;
    }
    setKaffarahBusy(true);
    setNotice(null);
    try {
      const orderId = await createKaffarahOrderRecord({
        requesterUid: uid,
        donorName: userProfile?.displayName || 'موكل كفارة',
        phone: kaffarahPhone.trim(),
        kaffarahCount,
        unitCostEGP: kaffarahRule.unitCostEGP,
        mealsPerKaffarah: kaffarahRule.mealsPerKaffarah,
        shariaReferenceUsed: kaffarahRule.referenceCode,
        distributionNotes: kaffarahNotes.trim(),
      });
      setKaffarahNotes('');
      setNotice(
        `تم توثيق توكيل كفارة اليمين (${orderId}) منفصلاً تماماً عن التبرعات العامة لإطعام ${kaffarahCount * kaffarahRule.mealsPerKaffarah} مسكيناً.`,
      );
    } catch (err) {
      setNotice(
        err instanceof Error
          ? err.message
          : 'تعذر تسجيل الكفارة — تأكد من تهيئة قاعدة الكفارة الرسمية في لوحة الإدارة.',
      );
    } finally {
      setKaffarahBusy(false);
    }
  };

  const handleSubmitLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    if (!logisticsKey) return;
    if (
      orgName.trim().length < 2 ||
      contactName.trim().length < 2 ||
      rfqPhone.trim().length < 6
    ) {
      setNotice('يرجى إدخال اسم الجهة والمسؤول ورقم الهاتف (6 أرقام على الأقل).');
      return;
    }
    setRfqBusy(true);
    setNotice(null);
    try {
      const id = await createLogisticsInquiryRecord({
        requesterUid: uid,
        serviceKey: logisticsKey,
        organizationName: orgName.trim(),
        contactName: contactName.trim(),
        phone: rfqPhone.trim(),
        eventDate,
        guestCount: Number(guestCount) || 50,
        city: rfqCity.trim() || 'القاهرة',
        notes: rfqNotes.trim(),
      });
      setLogisticsKey(null);
      setOrgName('');
      setRfqNotes('');
      setNotice(`تم إرسال طلب عرض السعر اللوجستي (${id}) لإدارة التموين بنجاح.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'تعذر إرسال طلب الخدمة.');
    } finally {
      setRfqBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {section === 'benefits' && (
        <section className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#4F2487]" />
              المزايا الترفيهية والخصومات الحصرية لموظفي باسط والشركات
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              منتجعات، مدن ألعاب، سيرك، ورحلات عائلية معتمدة مع حجز مباشر برمز الموظف أو للجمهور
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.map((b) => (
              <article
                key={b.benefitId}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="text-[11px] font-semibold text-[#4F2487]">
                    {b.eligibilityScope === 'contracted_entity'
                      ? 'للشركات والموظفين المتعاقدين'
                      : 'متاح لجميع أعضاء باسط'}
                  </div>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    {b.venueName}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {b.description}
                  </p>
                  <div className="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs font-bold text-[#4F2487]">
                    {b.approvedBenefitText}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    ساري حتى {b.validTo || '2026-12-31'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBookingTarget(b)}
                    className="min-h-[42px] px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#4F2487] cursor-pointer"
                  >
                    حجز الميزة
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {section === 'good_deeds' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Charity Initiatives (Good Deeds) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-600" />
                مسار اعمل الخير والتكافل العام
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                مسار مستقل لتجهيز وإطعام الوجبات والكراتين الغذائية مع توثيق التنفيذ الفعلي
              </p>
            </div>

            {initiatives.map((chr) => (
              <article
                key={chr.initiativeId}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {chr.titleAr}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      الجهة المنفذة: {chr.executingEntity}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 shrink-0">
                    {chr.contributionType}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {chr.mechanismAr}
                </p>
                <div className="flex items-center justify-between text-xs tabular-nums pt-2 border-t border-slate-100">
                  <span className="text-slate-500">
                    منفذ وموثق: {chr.verifiedDeliveriesCount} / {chr.targetGoalCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCharityTarget(chr)}
                    className="min-h-[42px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                  >
                    ساهم بالخير
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Kaffarah Al-Yamin (Strictly Isolated Sharia Track) */}
          <form
            onSubmit={handleSubmitKaffarah}
            className="lg:col-span-6 bg-white border border-amber-200 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-start gap-2.5">
              <Scale className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  كفارة اليمين المعتمدة شرعياً (مسار مفصول)
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {kaffarahRule.shariaAuthorityName} · مرجع: {kaffarahRule.referenceCode}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              {kaffarahRule.notesAr}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">عدد المساكين / كفارة</span>
                <span className="text-base font-bold text-slate-900">
                  {kaffarahRule.mealsPerKaffarah} مساكين
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">تكلفة الكفارة الواحدة</span>
                <span className="text-base font-bold text-slate-900">
                  {kaffarahRule.unitCostEGP} ج.م
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  عدد الكفارات المطلوب إخراجها
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={kaffarahCount}
                  onChange={(e) =>
                    setKaffarahCount(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  رقم الهاتف لاستلام إثبات الإطعام
                </label>
                <input
                  type="tel"
                  value={kaffarahPhone}
                  onChange={(e) => setKaffarahPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  maxLength={32}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                توجيهات التوزيع / النية الموثقة (اختياري)
              </label>
              <input
                type="text"
                value={kaffarahNotes}
                onChange={(e) => setKaffarahNotes(e.target.value)}
                placeholder="مثال: توكيل مطبخ باسط المركزي بإطعام 10 مساكين"
                maxLength={500}
                className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold tabular-nums">
              <span>
                إجمالي الوجبات: {kaffarahCount * kaffarahRule.mealsPerKaffarah} وجبة
              </span>
              <span className="text-sm text-[#4F2487]">
                الإجمالي: {(kaffarahCount * kaffarahRule.unitCostEGP).toLocaleString('en-US')} ج.م
              </span>
            </div>

            <button
              type="submit"
              disabled={kaffarahBusy}
              className="w-full min-h-[48px] rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#4F2487] disabled:opacity-50 cursor-pointer"
            >
              {kaffarahBusy
                ? 'جاري التوثيق...'
                : uid
                  ? 'توكيل تنفيذ كفارة اليمين'
                  : 'تسجيل الدخول لتوكيل الكفارة'}
            </button>
          </form>
        </section>
      )}

      {section === 'logistics' && (
        <section className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#4F2487]" />
              الخدمات اللوجستية الـ 7 المكملة (الشركة الوطنية اللوجستية)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              اطلب عرض سعر فوري لأي من منظومات التموين، الضيافة، وتأسيس المطابخ المركزية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LOGISTICS_COMPLEMENTARY_SERVICES.map((srv) => (
              <article
                key={srv.key}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {srv.titleAr}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {srv.descAr}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLogisticsKey(srv.key)}
                  className="min-h-[42px] px-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#4F2487] cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  طلب عرض سعر وتنفيذ
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Benefit Booking Modal */}
      {bookingTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <form
            onSubmit={handleBookBenefit}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  حجز ميزة: {bookingTarget.venueName}
                </h3>
                <p className="text-xs text-[#4F2487] font-semibold mt-0.5">
                  {bookingTarget.approvedBenefitText}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingTarget(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <Calendar className="w-3.5 h-3.5 inline ml-1" />
                  التاريخ المطلوب
                </label>
                <input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="w-full min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  عدد الأفراد
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={peopleCount}
                  onChange={(e) =>
                    setPeopleCount(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-full min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
                placeholder="جهة العمل (اختياري)"
                className="min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="كود الموظف (اختياري)"
                className="min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <input
              type="tel"
              value={bookingPhone}
              onChange={(e) => setBookingPhone(e.target.value)}
              placeholder="رقم الهاتف للتأكيد"
              className="w-full min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl"
            />
            <input
              type="text"
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="ملاحظات الحجز"
              className="w-full min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl"
            />

            <button
              type="submit"
              disabled={bookingBusy}
              className="w-full min-h-[48px] rounded-xl bg-[#4F2487] text-white text-sm font-semibold cursor-pointer"
            >
              {bookingBusy ? 'جاري الإرسال...' : 'تأكيد طلب الحجز'}
            </button>
          </form>
        </div>
      )}

      {/* Charity Contribution Modal */}
      {charityTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <form
            onSubmit={handleSubmitCharity}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">
                مساهمة خير: {charityTarget.titleAr}
              </h3>
              <button
                type="button"
                onClick={() => setCharityTarget(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                قيمة المساهمة (ج.م)
              </label>
              <input
                type="number"
                min={0}
                value={pledgeAmount}
                onChange={(e) => setPledgeAmount(e.target.value)}
                className="w-full min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                رقم الهاتف لإرسال إثبات التوزيع
              </label>
              <input
                type="tel"
                value={charityPhone}
                onChange={(e) => setCharityPhone(e.target.value)}
                placeholder="010xxxxxxxx"
                className="w-full min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <input
              type="text"
              value={charityNote}
              onChange={(e) => setCharityNote(e.target.value)}
              placeholder="ملاحظة أو تخصيص المساهمة"
              className="w-full min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl"
            />

            <button
              type="submit"
              disabled={charityBusy}
              className="w-full min-h-[48px] rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
            >
              {charityBusy ? 'جاري التسجيل...' : 'تسجيل مساهمة الخير'}
            </button>
          </form>
        </div>
      )}

      {/* Logistics Service RFQ Modal */}
      {logisticsKey && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <form
            onSubmit={handleSubmitLogistics}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">
                طلب عرض سعر:{' '}
                {
                  LOGISTICS_COMPLEMENTARY_SERVICES.find(
                    (s) => s.key === logisticsKey,
                  )?.titleAr
                }
              </h3>
              <button
                type="button"
                onClick={() => setLogisticsKey(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="اسم الشركة / المصنع / الجهة"
              className="w-full min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="اسم المسؤول"
                className="min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="tel"
                value={rfqPhone}
                onChange={(e) => setRfqPhone(e.target.value)}
                placeholder="رقم الهاتف"
                className="min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="min-h-[44px] px-2 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="number"
                min={1}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                placeholder="العدد"
                className="min-h-[44px] px-2 text-xs border border-slate-300 rounded-xl tabular-nums"
              />
              <input
                type="text"
                value={rfqCity}
                onChange={(e) => setRfqCity(e.target.value)}
                placeholder="المدينة"
                className="min-h-[44px] px-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <input
              type="text"
              value={rfqNotes}
              onChange={(e) => setRfqNotes(e.target.value)}
              placeholder="تفاصيل المتطلبات أو نوع التجهيز المطلوب"
              className="w-full min-h-[44px] px-3 text-xs border border-slate-300 rounded-xl"
            />

            <button
              type="submit"
              disabled={rfqBusy}
              className="w-full min-h-[48px] rounded-xl bg-[#4F2487] text-white text-sm font-semibold cursor-pointer"
            >
              {rfqBusy ? 'جاري الإرسال...' : 'إرسال طلب عرض السعر'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
