import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  Factory,
  GraduationCap,
  HeartHandshake,
  Hospital,
  PartyPopper,
  Presentation,
  Send,
  ShieldAlert,
  Trophy,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { BASIT_ASSETS } from '../data/seedDefaults';
import { useI18n } from '../i18n/translations';
import {
  createCharityContributionRecord,
  createKaffarahOrderRecord,
  createLogisticsInquiryRecord,
} from '../services/faydFirestore';
import {
  BusinessSectorKey,
  CharityInitiative,
  KaffarahRule,
  LogisticsServiceInquiry,
  LogisticsServiceKey,
  UserProfile,
} from '../types/fayd';

interface BusinessSectorProps {
  uid: string | null;
  userProfile: UserProfile | null;
  defaultPhone?: string;
  initiatives: CharityInitiative[];
  kaffarahRule: KaffarahRule;
  userInquiries: LogisticsServiceInquiry[];
  onRequireAuth: () => void;
}

const BUSINESS_SECTORS: {
  id: BusinessSectorKey;
  serviceKey: LogisticsServiceKey;
  ar: string;
  en: string;
  descAr: string;
  descEn: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'factories',
    serviceKey: 'institutional_events_catering',
    ar: 'المصانع والمناطق الصناعية',
    en: 'Factories & Industrial Parks',
    descAr: 'تغذية الورديات الصناعية بوجبات ساخنة ومبردة معتمدة HACCP',
    descEn: '3-shift workforce meals with HACCP-certified hot & chilled logistics',
    Icon: Factory,
  },
  {
    id: 'companies',
    serviceKey: 'central_kitchens_setup',
    ar: 'الشركات والمقرات الإدارية',
    en: 'Corporate Offices & Campuses',
    descAr: 'إدارة الكانتين المؤسسي وبرامج وجبات الموظفين الشهرية',
    descEn: 'Corporate cafeteria management & monthly employee meal programs',
    Icon: Building2,
  },
  {
    id: 'hospitals',
    serviceKey: 'supply_distribution_logistics',
    ar: 'المستشفيات والمراكز الطبية',
    en: 'Hospitals & Medical Centers',
    descAr: 'تغذية علاجية مخصصة للمرضى وطواقم الرعاية الصحية على مدار الساعة',
    descEn: 'Clinical patient nutrition and 24/7 medical staff catering',
    Icon: Hospital,
  },
  {
    id: 'schools',
    serviceKey: 'institutional_events_catering',
    ar: 'المدارس والجامعات',
    en: 'Schools & Universities',
    descAr: 'لانش بوكس مدرسي متوازن وتوريد مقاصف الجامعات الدولية',
    descEn: 'Balanced student meal boxes & university campus food operations',
    Icon: GraduationCap,
  },
  {
    id: 'clubs',
    serviceKey: 'hospitality',
    ar: 'النوادي الرياضية والاجتماعية',
    en: 'Sports & Social Clubs',
    descAr: 'تشغيل منافذ الضيافة وتغذية الفرق الرياضية والمعسكرات',
    descEn: 'Clubhouse hospitality outlets & athletic squad catering',
    Icon: Trophy,
  },
  {
    id: 'parties',
    serviceKey: 'weddings_occasions',
    ar: 'الحفلات والمناسبات الكبرى',
    en: 'Parties & Special Events',
    descAr: 'بوفيهات مفتوحة وتجهيزات فندقية متكاملة للحفلات الرسمية والعائلية',
    descEn: 'Turnkey open buffets and hospitality for VIP celebrations',
    Icon: PartyPopper,
  },
  {
    id: 'conferences',
    serviceKey: 'conferences_events',
    ar: 'المؤتمرات والمعارض الدولية',
    en: 'Conferences & Exhibitions',
    descAr: 'استراحات القهوة والغداء المؤسسي للوفود والمشاركين',
    descEn: 'Executive coffee breaks and delegate dining at scale',
    Icon: Presentation,
  },
];

export const BusinessSector: React.FC<BusinessSectorProps> = ({
  uid,
  userProfile,
  defaultPhone,
  initiatives,
  kaffarahRule,
  userInquiries,
  onRequireAuth,
}) => {
  const { isEn, t } = useI18n();
  const [imgOk, setImgOk] = useState(true);
  const [selectedSector, setSelectedSector] = useState<BusinessSectorKey>('factories');
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState(userProfile?.displayName || '');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [city, setCity] = useState('مدينة بدر');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [guestCount, setGuestCount] = useState(250);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Charity & Kaffarah institutional section
  const [pledgeAmount, setPledgeAmount] = useState(500);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState(
    initiatives[0]?.initiativeId || 'chr_workers_iftar',
  );
  const [kaffarahCount, setKaffarahCount] = useState(1);

  const activeSectorObj =
    BUSINESS_SECTORS.find((s) => s.id === selectedSector) || BUSINESS_SECTORS[0];

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setNotice(null);
    try {
      const id = await createLogisticsInquiryRecord({
        requesterUid: uid,
        serviceKey: activeSectorObj.serviceKey,
        businessSector: selectedSector,
        organizationName: orgName,
        contactName: contactName || userProfile?.displayName || 'مسؤول التعاقد',
        phone,
        eventDate,
        guestCount,
        city,
        notes,
      });
      setNotice(
        t(
          `تم تسجيل طلب التعاقد المؤسسي (${id}) لقطاع ${activeSectorObj.ar}.`,
          `Corporate catering request (${id}) submitted for ${activeSectorObj.en}.`,
        ),
      );
      setOrgName('');
      setNotes('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر إرسال الطلب', 'Submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCharityContribute = async () => {
    if (!uid) {
      onRequireAuth();
      return;
    }
    const init = initiatives.find((i) => i.initiativeId === selectedInitiativeId) || initiatives[0];
    if (!init) return;
    setSubmitting(true);
    try {
      const id = await createCharityContributionRecord({
        initiativeId: init.initiativeId,
        initiativeTitle: isEn ? init.titleEn : init.titleAr,
        contributorUid: uid,
        contributorName: userProfile?.displayName || t('مساهم خير', 'Benefactor'),
        phone: phone || defaultPhone || '+201000000000',
        contributionNote: t('مساهمة موثقة عبر باسط للأعمال', 'Verified BASIT Business contribution'),
        pledgeAmountEGP: pledgeAmount,
      });
      setNotice(
        t(`تم توثيق مساهمتك رقم ${id} بنجاح.`, `Charity contribution ${id} recorded.`),
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر تسجيل المساهمة', 'Failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleKaffarahOrder = async () => {
    if (!uid) {
      onRequireAuth();
      return;
    }
    setSubmitting(true);
    try {
      const id = await createKaffarahOrderRecord({
        requesterUid: uid,
        donorName: userProfile?.displayName || t('موكل كفارة', 'Kaffarah Sponsor'),
        phone: phone || defaultPhone || '+201000000000',
        kaffarahCount,
        unitCostEGP: kaffarahRule.unitCostEGP,
        mealsPerKaffarah: kaffarahRule.mealsPerKaffarah,
        shariaReferenceUsed: kaffarahRule.referenceCode,
        distributionNotes: t(
          'إطعام عشرة مساكين عبر مطبخ العين المركزي',
          '10-meal execution via Al-Ain Central Kitchen',
        ),
      });
      setNotice(
        t(`تم تسجيل توكيل الكفارة رقم ${id} للتنفيذ الموثق.`, `Kaffarah order ${id} submitted.`),
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر تسجيل الكفارة', 'Failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Corporate Catering Hero */}
      <section className="rounded-3xl bg-[#501C5A] text-white overflow-hidden border border-[#3B123F]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-4 sm:p-8 flex flex-col justify-center gap-2.5">
            <p className="text-[11px] sm:text-xs font-semibold text-[#D4AF37]">
              BASIT BUSINESS · {t('قطاع التغذية والتوريد المؤسسي', 'Institutional Catering & Supply')}
            </p>
            <h1 className="text-lg sm:text-3xl font-bold leading-snug text-balance">
              {t(
                'تغذية وتوريد احترافي للمصانع والشركات والمستشفيات والمدارس والنوادي',
                'Enterprise Catering for Factories, Companies, Hospitals, Schools, Clubs & Events',
              )}
            </h1>
            <p className="hidden sm:block text-sm text-purple-100/90 leading-relaxed max-w-2xl">
              {t(
                'عقود توريد مرنة، أسطول نقل مبرد وساخن، وإدارة كاملة للمؤتمرات والحفلات وفق أعلى معايير سلامة الغذاء.',
                'Flexible supply contracts, hot & chilled fleet logistics, and turnkey event catering under strict food safety standards.',
              )}
            </p>
          </div>
          <div className="lg:col-span-5 relative h-32 sm:h-44 lg:h-auto lg:min-h-[200px] bg-[#2A104D]">
            {imgOk ? (
              <img
                src={BASIT_ASSETS.businessCatering}
                alt={t('خدمات الإعاشة والضيافة للمؤسسات والحفلات', 'BASIT Corporate Buffet & Catering')}
                referrerPolicy="no-referrer"
                onError={() => setImgOk(false)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3B123F] to-[#2A104D]">
                <UtensilsCrossed className="w-10 h-10 text-[#D4AF37]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A104D]/80 via-transparent to-transparent" />
          </div>
        </div>
      </section>

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

      {/* 7 B2B Sectors Selector (Horizontal Swipe on Mobile, 2-col Grid on Desktop) + Request Form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 flex overflow-x-auto snap-x no-scrollbar gap-2.5 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
          {BUSINESS_SECTORS.map((sec) => {
            const active = sec.id === selectedSector;
            const Icon = sec.Icon;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSector(sec.id)}
                className={`min-w-[210px] sm:min-w-0 snap-start text-start p-3.5 sm:p-4 rounded-2xl border transition-colors cursor-pointer flex flex-col gap-1.5 shrink-0 ${
                  active
                    ? 'bg-[#3B123F] text-white border-[#3B123F]'
                    : 'bg-[#FFFFFF] text-[#1D152B] border-[#ECE4E8] hover:border-[#3B123F]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Icon className={`w-5 h-5 ${active ? 'text-[#D4AF37]' : 'text-[#3B123F]'}`} />
                  <span className={`text-[11px] font-semibold ${active ? 'text-[#D4AF37]' : 'text-[#6B6478]'}`}>
                    {active ? t('محدد للطلب', 'Selected') : t('اختر القطاع', 'Select')}
                  </span>
                </div>
                <h3 className="text-sm font-bold">{isEn ? sec.en : sec.ar}</h3>
                <p className={`text-xs leading-relaxed ${active ? 'text-purple-100' : 'text-[#6B6478]'}`}>
                  {isEn ? sec.descEn : sec.descAr}
                </p>
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleInquirySubmit}
          className="lg:col-span-5 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3 text-xs"
        >
          <div>
            <p className="text-[11px] font-semibold text-[#3B123F]">
              {isEn ? activeSectorObj.en : activeSectorObj.ar}
            </p>
            <h2 className="text-base font-bold text-[#1D152B]">
              {t('طلب تعاقد أو تسعير فوري', 'Request Corporate Contract / Quote')}
            </h2>
          </div>

          <input
            type="text"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder={t('اسم المنشأة / المستشفى / المدرسة / النادي', 'Organization / Venue Name')}
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
              placeholder={t('رقم الهاتف', 'Phone')}
              className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="space-y-1">
              <span className="text-[11px] text-[#6B6478] flex items-center gap-1">
                <Users className="w-3 h-3" /> {t('العدد', 'Headcount')}
              </span>
              <input
                type="number"
                min={1}
                value={guestCount}
                onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-full min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white tabular-nums"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-[#6B6478] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {t('التاريخ', 'Start Date')}
              </span>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full min-h-[40px] px-2 rounded-xl border border-[#ECE4E8] bg-white"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-[#6B6478]">{t('المدينة', 'City')}</span>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
              />
            </label>
          </div>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t(
              'تفاصيل الوجبات، عدد الورديات، أو تجهيزات الضيافة المطلوبة...',
              'Meal breakdown, shift count, or hospitality setup details...',
            )}
            className="w-full p-3 rounded-xl border border-[#ECE4E8] bg-white"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B123F] text-white text-sm font-bold hover:bg-[#501C5A] transition-colors cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4 text-[#D4AF37]" />
            {submitting
              ? t('جاري التسجيل...', 'Submitting...')
              : t('إرسال طلب التعاقد المؤسسي', 'Submit Business Request')}
          </button>
        </form>
      </section>

      {/* User's Tracked Corporate Inquiries */}
      {userInquiries.length > 0 && (
        <section className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-bold text-[#1D152B]">
            {t('متابعة طلبات التعاقد الخاصة بك', 'Your Corporate Catering Inquiries')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {userInquiries.map((inq) => (
              <div
                key={inq.inquiryId}
                className="p-3.5 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] flex items-center justify-between gap-2"
              >
                <div>
                  <p className="font-bold text-[#1D152B]">{inq.organizationName}</p>
                  <p className="text-[#6B6478] tabular-nums">
                    {inq.city} · {inq.guestCount} {t('فرد', 'guests')} · {inq.eventDate}
                  </p>
                </div>
                <span className="font-bold text-[#3B123F]">{inq.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Institutional Charity & Kaffarah Execution Channel */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#3B123F]" />
            <h3 className="text-base font-bold text-[#1D152B]">
              {t('مبادرات الإطعام والخير المؤسسية', 'Institutional Food Charity Initiatives')}
            </h3>
          </div>
          <select
            value={selectedInitiativeId}
            onChange={(e) => setSelectedInitiativeId(e.target.value)}
            className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
          >
            {initiatives.map((i) => (
              <option key={i.initiativeId} value={i.initiativeId}>
                {isEn ? i.titleEn : i.titleAr}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={50}
              value={pledgeAmount}
              onChange={(e) => setPledgeAmount(Math.max(50, Number(e.target.value) || 50))}
              className="w-32 min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white tabular-nums"
            />
            <button
              type="button"
              disabled={submitting}
              onClick={handleCharityContribute}
              className="flex-1 min-h-[42px] rounded-xl bg-[#3B123F] text-white font-semibold hover:bg-[#501C5A] cursor-pointer"
            >
              {t('توثيق مساهمة خير', 'Record Contribution')}
            </button>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#3B123F]" />
            <h3 className="text-base font-bold text-[#1D152B]">
              {t('مسار كفارة اليمين المعزول (إطعام 10 مساكين)', 'Isolated Kaffarah Execution Track')}
            </h3>
          </div>
          <p className="text-[#6B6478] leading-relaxed">
            {kaffarahRule.shariaAuthorityName} ·{' '}
            <strong className="text-[#1D152B] tabular-nums">
              {kaffarahRule.unitCostEGP} {t('ج.م / كفارة', 'EGP / unit')}
            </strong>
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={kaffarahCount}
              onChange={(e) => setKaffarahCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-white tabular-nums"
            />
            <button
              type="button"
              disabled={submitting}
              onClick={handleKaffarahOrder}
              className="flex-1 min-h-[42px] rounded-xl bg-[#D4AF37] text-[#2A104D] font-bold hover:bg-[#eab308] cursor-pointer"
            >
              {t(
                `توكيل كفارة (${kaffarahCount * kaffarahRule.unitCostEGP} ج.م)`,
                `Sponsor Kaffarah (${kaffarahCount * kaffarahRule.unitCostEGP} EGP)`,
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
