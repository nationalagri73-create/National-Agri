import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  CheckCircle2,
  Database,
  Lock,
  LogIn,
  LogOut,
  Play,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react';
import {
  BenefitBooking,
  CharityContribution,
  CommissionRule,
  CourierProfile,
  DeliveryRequest,
  FaydOpportunity,
  KaffarahOrder,
  LogisticsServiceInquiry,
  OnboardingApplication,
  OwnerFinancialAccount,
  OwnerFinancialEntry,
  SecurityAuditLog,
  SubscriptionPlan,
  UserPrivateProfile,
  UserProfile,
  UsufructProposal,
  VipDirectOrder,
} from '../types/fayd';
import {
  approveOrRejectOpportunity,
  assignCourierToDelivery,
  decideBenefitBooking,
  decideOnboardingApplication,
  issueUsufructContractByAdmin,
  recordOwnerFinancialEntry,
  RedTeamProbeResult,
  runLiveRedTeamProbes,
  saveCommissionRule,
  seedFaydPlatformData,
  updateKaffarahExecutionStatus,
  updateLogisticsInquiryStatus,
  updateUserPrivateProfile,
  updateVipDirectOrderStatus,
  verifyCharityContribution,
} from '../services/faydFirestore';

interface GovernanceSecurityTabProps {
  authUser: User | null;
  userProfile: UserProfile | null;
  privateProfile: UserPrivateProfile | null;
  isAdmin: boolean;
  isBootAdmin: boolean;
  applications: OnboardingApplication[];
  opportunities: FaydOpportunity[];
  proposals: UsufructProposal[];
  deliveries: DeliveryRequest[];
  couriers: CourierProfile[];
  plans: SubscriptionPlan[];
  commissionRule: CommissionRule;
  auditLogs: SecurityAuditLog[];
  vipOrders: VipDirectOrder[];
  benefitBookings: BenefitBooking[];
  charityContributions: CharityContribution[];
  kaffarahOrders: KaffarahOrder[];
  logisticsInquiries: LogisticsServiceInquiry[];
  ownerAccounts: OwnerFinancialAccount[];
  ownerEntries: OwnerFinancialEntry[];
  onSignIn: () => void;
  onSignOut: () => void;
}

export const GovernanceSecurityTab: React.FC<GovernanceSecurityTabProps> = ({
  authUser,
  userProfile,
  privateProfile,
  isAdmin,
  isBootAdmin,
  applications,
  opportunities,
  proposals,
  deliveries,
  couriers,
  plans,
  commissionRule,
  auditLogs,
  vipOrders,
  benefitBookings,
  charityContributions,
  kaffarahOrders,
  logisticsInquiries,
  ownerAccounts,
  ownerEntries,
  onSignIn,
  onSignOut,
}) => {
  const [phone, setPhone] = useState(privateProfile?.phone ?? '');
  const [taxId, setTaxId] = useState(privateProfile?.nationalOrTaxId ?? '');
  const [address, setAddress] = useState(privateProfile?.address ?? '');
  const [piiMsg, setPiiMsg] = useState<string | null>(null);
  const [savingPii, setSavingPii] = useState(false);

  const [seeding, setSeeding] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  const [orderCommPct, setOrderCommPct] = useState(
    String(commissionRule.defaultOrderCommissionPct),
  );
  const [minDeliveryFee, setMinDeliveryFee] = useState(
    String(commissionRule.minDeliveryFeeEGP),
  );

  const [assignCourierMap, setAssignCourierMap] = useState<Record<string, string>>({});
  const [charityProofMap, setCharityProofMap] = useState<Record<string, string>>({});
  const [kaffarahProofMap, setKaffarahProofMap] = useState<Record<string, string>>({});
  const [vipReplyMap, setVipReplyMap] = useState<Record<string, string>>({});

  // Owner Financial Vault state
  const [finDirection, setFinDirection] = useState<'inflow' | 'outflow'>('inflow');
  const [finChannel, setFinChannel] = useState<OwnerFinancialAccount['accountId']>('bank');
  const [finSource, setFinSource] = useState('');
  const [finPurpose, setFinPurpose] = useState('');
  const [finCategory, setFinCategory] =
    useState<OwnerFinancialEntry['expenseCategory']>('none');
  const [finGross, setFinGross] = useState('1000');
  const [finCommPct, setFinCommPct] = useState('0');
  const [finBusy, setFinBusy] = useState(false);
  const [finMsg, setFinMsg] = useState<string | null>(null);

  const [probeResults, setProbeResults] = useState<RedTeamProbeResult[] | null>(
    null,
  );
  const [runningProbes, setRunningProbes] = useState(false);

  useEffect(() => {
    setPhone(privateProfile?.phone ?? '');
    setTaxId(privateProfile?.nationalOrTaxId ?? '');
    setAddress(privateProfile?.address ?? '');
  }, [privateProfile]);

  useEffect(() => {
    setOrderCommPct(String(commissionRule.defaultOrderCommissionPct));
    setMinDeliveryFee(String(commissionRule.minDeliveryFeeEGP));
  }, [commissionRule]);

  const handleSavePii = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setSavingPii(true);
    setPiiMsg(null);
    try {
      await updateUserPrivateProfile(authUser.uid, {
        email: authUser.email || privateProfile?.email || '',
        phone,
        nationalOrTaxId: taxId,
        address,
      });
      setPiiMsg('تم حفظ البيانات الشخصية الحساسة داخل /private_profile/main المعزول.');
    } catch (err) {
      setPiiMsg(err instanceof Error ? err.message : 'تعذر حفظ البيانات.');
    } finally {
      setSavingPii(false);
    }
  };

  const handleSeedData = async () => {
    if (!authUser) return;
    setSeeding(true);
    setAdminMsg(null);
    try {
      await seedFaydPlatformData(authUser.uid, authUser.email);
      setAdminMsg(
        'تمت تهيئة المتاجر والكتالوج والعروض والمزايا والخير والكفارة وباقات الاشتراك وقواعد العمولات في Firestore بنجاح.',
      );
    } catch (err) {
      setAdminMsg(err instanceof Error ? err.message : 'تعذر التهيئة.');
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setAdminMsg(null);
    try {
      await saveCommissionRule(
        {
          ...commissionRule,
          defaultOrderCommissionPct: Math.min(60, Math.max(0, Number(orderCommPct) || 10)),
          minDeliveryFeeEGP: Math.max(10, Number(minDeliveryFee) || 35),
        },
        authUser.uid,
      );
      setAdminMsg('تم تحديث قواعد العمولات المركزية بنجاح.');
    } catch (err) {
      setAdminMsg(err instanceof Error ? err.message : 'تعذر تحديث العمولات.');
    }
  };

  const handleRecordFinancialEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.email) return;
    if (finSource.trim().length < 2 || finPurpose.trim().length < 2) {
      setFinMsg('يرجى إدخال اسم الجهة والبيان (حرفان على الأقل).');
      return;
    }
    const targetAcc = ownerAccounts.find((a) => a.accountId === finChannel);
    setFinBusy(true);
    setFinMsg(null);
    try {
      await recordOwnerFinancialEntry({
        actorEmail: authUser.email,
        direction: finDirection,
        sourceOrBeneficiary: finSource.trim(),
        purpose: finPurpose.trim(),
        expenseCategory: finDirection === 'inflow' ? 'none' : finCategory,
        channel: finChannel,
        grossEGP: Math.max(1, Number(finGross) || 1),
        commissionPct: Math.min(100, Math.max(0, Number(finCommPct) || 0)),
        currentAccountBalance: targetAcc?.balanceEGP ?? 0,
        currentAccountLabel:
          targetAcc?.labelAr ||
          (finChannel === 'bank'
            ? 'الحساب البنكي الرئيسي'
            : finChannel === 'e_wallet'
              ? 'المحفظة الإلكترونية المركزية'
              : 'الخزينة النقدية'),
      });
      setFinMsg('تم ترحيل القيد المالي وتحديث رصيد الحساب بنجاح.');
      setFinSource('');
      setFinPurpose('');
    } catch (err) {
      setFinMsg(err instanceof Error ? err.message : 'تعذر تسجيل القيد المالي.');
    } finally {
      setFinBusy(false);
    }
  };

  const handleRunRedTeam = async () => {
    if (!authUser) {
      onSignIn();
      return;
    }
    setRunningProbes(true);
    try {
      const res = await runLiveRedTeamProbes(authUser.uid, isAdmin);
      setProbeResults(res);
    } finally {
      setRunningProbes(false);
    }
  };

  const pendingApps = applications.filter((a) => a.status === 'pending_review');
  const pendingOpps = opportunities.filter((o) => o.approvalStatus === 'pending_admin');
  const awaitingAdminProposals = proposals.filter(
    (p) => p.status === 'awaiting_admin' && p.siteOwnerAgreed,
  );
  const unassignedDeliveries = deliveries.filter((d) => d.status === 'requested');
  const openVipOrders = vipOrders.filter(
    (v) => v.status !== 'completed' && v.status !== 'rejected',
  );
  const pendingBookings = benefitBookings.filter((b) => b.status === 'pending');
  const unverifiedCharity = charityContributions.filter((c) => c.status === 'recorded');
  const openKaffarah = kaffarahOrders.filter(
    (k) => k.executionStatus !== 'executed_verified',
  );
  const openLogistics = logisticsInquiries.filter((l) => l.status !== 'quoted');

  return (
    <div className="space-y-5">
      {/* Identity & PII Split Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <section className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#4F2487]/10 text-[#4F2487] flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  الهوية والصلاحيات (users/&#123;uid&#125;)
                </h2>
                <p className="text-xs text-slate-500">
                  ملف تشغيلي خالٍ تماماً من أي معلومات شخصية (PII)
                </p>
              </div>
            </div>
          </div>

          {!authUser ? (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-xs text-slate-600 mb-3">
                سجّل الدخول بحساب Google الموثق (email_verified == true) للوصول المباشر إلى قاعدة البيانات.
              </p>
              <button
                type="button"
                onClick={onSignIn}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F2487] text-white text-xs font-semibold hover:bg-[#3f1c6d] cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول عبر Google
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">الاسم</span>
                  <span className="font-bold text-slate-900">
                    {userProfile?.displayName || authUser.displayName || 'مستخدم فيض'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">الدور الفعلي</span>
                  <span className="font-mono font-semibold text-[#4F2487]">
                    {isAdmin ? 'central_super_admin' : userProfile?.role || 'customer'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">توثيق البريد</span>
                  <span className="font-semibold text-emerald-700">
                    {authUser.emailVerified ? 'موثق (email_verified: true)' : 'غير موثق'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">المعرف</span>
                  <span className="font-mono text-[11px] text-slate-600 truncate max-w-[180px]">
                    {authUser.uid}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onSignOut}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            </div>
          )}
        </section>

        {/* Private PII Vault */}
        <section className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-[#4F2487]" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                خزينة البيانات الشخصية المعزولة (private_profile/main)
              </h2>
              <p className="text-xs text-slate-500">
                لا تُقرأ أو تُكتب إلا بواسطة صاحب الحساب أو الإدارة المركزية
              </p>
            </div>
          </div>

          {!authUser ? (
            <p className="text-xs text-slate-500 py-4">
              قم بتسجيل الدخول أولاً لإدارة بيانات التواصل والملف الضريبي الخاصة بك.
            </p>
          ) : (
            <form onSubmit={handleSavePii} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  البريد الإلكتروني الموثق
                </label>
                <input
                  type="email"
                  value={authUser.email || ''}
                  disabled
                  className="w-full min-h-[44px] px-3 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600"
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
                  maxLength={32}
                  placeholder="+2010xxxxxxxx"
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الرقم القومي / البطاقة الضريبية
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  maxLength={64}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  العنوان الخاص
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={240}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              {piiMsg && (
                <p className="sm:col-span-2 text-xs font-semibold text-emerald-700">
                  {piiMsg}
                </p>
              )}

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPii}
                  className="min-h-[44px] px-5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#4F2487] disabled:opacity-50 cursor-pointer"
                >
                  {savingPii ? 'جاري الحفظ...' : 'حفظ في الخزينة المعزولة'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {/* Central Super Admin Console */}
      {isAdmin && (
        <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                لوحة الإدارة المركزية (Central Admin Governance)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                اعتماد طلبات الانضمام، الفرص، إصدار عقود الانتفاع، تعيين السعاة، وضبط العمولات
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedData}
              disabled={seeding}
              className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F2487] text-white text-xs font-semibold hover:bg-[#3f1c6d] disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Database className="w-4 h-4" />
              {seeding ? 'جاري التهيئة...' : 'تهيئة البيانات الأساسية في Firestore'}
            </button>
          </div>

          {adminMsg && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{adminMsg}</span>
            </div>
          )}

          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Onboarding Approvals */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900">
                طلبات الانضمام المعلقة ({pendingApps.length})
              </h3>
              {pendingApps.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد طلبات انضمام معلقة.</p>
              ) : (
                <ul className="space-y-2.5">
                  {pendingApps.map((app) => (
                    <li
                      key={app.appId}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="text-xs font-bold text-slate-900">
                        {app.businessName} · {app.targetRole}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {app.contactName} · {app.city} · سجل: {app.commercialRegRef}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            authUser &&
                            decideOnboardingApplication({
                              app,
                              adminUid: authUser.uid,
                              decision: 'approved',
                              adminComment: 'تم الاعتماد من الإدارة المركزية',
                            })
                          }
                          className="min-h-[38px] px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          اعتماد وإنشاء الكيان
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            authUser &&
                            decideOnboardingApplication({
                              app,
                              adminUid: authUser.uid,
                              decision: 'rejected',
                              adminComment: 'لم يستوفِ المتطلبات',
                            })
                          }
                          className="min-h-[38px] px-3 rounded-lg border border-slate-300 text-red-600 text-xs font-semibold cursor-pointer"
                        >
                          رفض
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Opportunity & Usufruct Contract Approvals */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  فرص فيض بانتظار الاعتماد ({pendingOpps.length})
                </h3>
                {pendingOpps.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد فرص معلقة.</p>
                ) : (
                  <ul className="space-y-2">
                    {pendingOpps.map((opp) => (
                      <li
                        key={opp.oppId}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {opp.title}
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {opp.costOrInvestmentEGP.toLocaleString('en-US')} ج.م · {opp.city}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              authUser &&
                              approveOrRejectOpportunity(opp.oppId, 'approved', authUser.uid)
                            }
                            className="min-h-[38px] px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            اعتماد
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              authUser &&
                              approveOrRejectOpportunity(opp.oppId, 'rejected', authUser.uid)
                            }
                            className="min-h-[38px] px-3 rounded-lg border border-slate-300 text-red-600 text-xs font-semibold cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  مقترحات انتفاع جاهزة لإصدار العقد ({awaitingAdminProposals.length})
                </h3>
                {awaitingAdminProposals.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    لا توجد مقترحات معتمدة من مالك الموقع بانتظار العقد.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {awaitingAdminProposals.map((prop) => (
                      <li
                        key={prop.proposalId}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div className="text-xs">
                          <div className="font-bold text-slate-900">
                            {prop.proposerName} ({prop.proposerProfitPct}%/{prop.siteOwnerProfitPct}%/{prop.platformUsufructPct}%)
                          </div>
                          <div className="text-[11px] text-slate-500">{prop.proposalId}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            authUser && issueUsufructContractByAdmin(prop, authUser.uid)
                          }
                          className="min-h-[38px] px-3 rounded-lg bg-[#4F2487] text-white text-xs font-semibold cursor-pointer shrink-0"
                        >
                          إصدار العقد
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Commission Rules & Plans */}
            <form
              onSubmit={handleSaveCommission}
              className="border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <h3 className="text-xs font-bold text-slate-900">
                ضبط العمولات المركزية وباقات الاشتراك ({plans.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    عمولة الطلبات الافتراضية (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={orderCommPct}
                    onChange={(e) => setOrderCommPct(e.target.value)}
                    className="w-full min-h-[40px] px-3 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    الحد الأدنى لرسوم التوصيل (ج.م)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={minDeliveryFee}
                    onChange={(e) => setMinDeliveryFee(e.target.value)}
                    className="w-full min-h-[40px] px-3 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="min-h-[40px] px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                حفظ قواعد العمولات
              </button>
            </form>

            {/* Assign Courier to Requested Deliveries */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900">
                توجيه شحنات التوصيل للسعاة ({unassignedDeliveries.length})
              </h3>
              {unassignedDeliveries.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد شحنات بانتظار التوجيه.</p>
              ) : (
                <ul className="space-y-2">
                  {unassignedDeliveries.map((del) => (
                    <li
                      key={del.deliveryId}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <span className="text-xs font-mono text-slate-700 flex-1 truncate">
                        {del.deliveryId} · {del.dropoffLocation}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={assignCourierMap[del.deliveryId] ?? couriers[0]?.courierUid ?? ''}
                          onChange={(e) =>
                            setAssignCourierMap((prev) => ({
                              ...prev,
                              [del.deliveryId]: e.target.value,
                            }))
                          }
                          className="min-h-[38px] px-2 text-xs bg-white border border-slate-300 rounded-lg"
                        >
                          {couriers.length === 0 ? (
                            <option value={authUser?.uid || ''}>
                              تعيين الحساب الحالي كساعي تجريبي
                            </option>
                          ) : (
                            couriers.map((c) => (
                              <option key={c.courierUid} value={c.courierUid}>
                                {c.fullName} ({c.zone})
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const targetCourier =
                              assignCourierMap[del.deliveryId] ||
                              couriers[0]?.courierUid ||
                              authUser?.uid;
                            if (authUser && targetCourier) {
                              assignCourierToDelivery(
                                del.deliveryId,
                                targetCourier,
                                authUser.uid,
                              );
                            }
                          }}
                          className="min-h-[38px] px-3 rounded-lg bg-[#4F2487] text-white text-xs font-semibold cursor-pointer shrink-0"
                        >
                          تعيين
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* BASIT Operational Approvals */}
          <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* VIP Direct Orders (Ha-Be & Commercial Offers) */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-900">
                اعتماد طلبات باسط المباشرة و Ha-Be ({openVipOrders.length})
              </h3>
              {openVipOrders.length === 0 ? (
                <p className="text-xs text-slate-500">لا توجد طلبات مباشرة مفتوحة.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {openVipOrders.map((vo) => (
                    <li
                      key={vo.orderId}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          {vo.customerName} ({vo.totalEGP} ج.م)
                        </span>
                        <span className="font-mono text-[11px] text-[#4F2487]">
                          {vo.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">{vo.itemsSummary}</div>
                      <input
                        type="text"
                        value={vipReplyMap[vo.orderId] ?? ''}
                        onChange={(e) =>
                          setVipReplyMap((p) => ({ ...p, [vo.orderId]: e.target.value }))
                        }
                        placeholder="رد الإدارة / ملاحظة التنفيذ..."
                        className="w-full min-h-[34px] px-2.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            authUser &&
                            updateVipDirectOrderStatus(
                              vo.orderId,
                              vo.status === 'pending_owner' ? 'approved' : 'completed',
                              vipReplyMap[vo.orderId] || 'تم الاعتماد والتجهيز',
                              authUser.uid,
                            )
                          }
                          className="min-h-[34px] px-2.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          {vo.status === 'pending_owner' ? 'اعتماد الطلب' : 'إتمام التنفيذ'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            authUser &&
                            updateVipDirectOrderStatus(
                              vo.orderId,
                              'rejected',
                              vipReplyMap[vo.orderId] || 'مرفوض',
                              authUser.uid,
                            )
                          }
                          className="min-h-[34px] px-2.5 rounded-lg border border-slate-300 text-red-600 text-[11px] font-semibold cursor-pointer"
                        >
                          رفض
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Benefit Bookings & Logistics Inquiries */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  حجوزات المزايا والترفيه المعلقة ({pendingBookings.length})
                </h3>
                {pendingBookings.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد حجوزات مزايا معلقة.</p>
                ) : (
                  <ul className="space-y-2">
                    {pendingBookings.map((b) => (
                      <li
                        key={b.bookingId}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {b.userName} · {b.venueName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {b.requestedDate} · {b.peopleCount} أفراد
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              authUser &&
                              decideBenefitBooking(b.bookingId, 'approved', authUser.uid)
                            }
                            className="min-h-[34px] px-2.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold cursor-pointer"
                          >
                            اعتماد
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              authUser &&
                              decideBenefitBooking(b.bookingId, 'rejected', authUser.uid)
                            }
                            className="min-h-[34px] px-2.5 rounded-lg border border-slate-300 text-red-600 text-[11px] font-semibold cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  طلبات الخدمات اللوجستية ({openLogistics.length})
                </h3>
                {openLogistics.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد طلبات لوجستية جديدة.</p>
                ) : (
                  <ul className="space-y-2">
                    {openLogistics.map((inq) => (
                      <li
                        key={inq.inquiryId}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {inq.organizationName} ({inq.guestCount} فرد)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {inq.serviceKey} · {inq.status}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            authUser &&
                            updateLogisticsInquiryStatus(
                              inq.inquiryId,
                              inq.status === 'new' ? 'in_review' : 'quoted',
                              authUser.uid,
                            )
                          }
                          className="min-h-[34px] px-2.5 rounded-lg bg-[#4F2487] text-white text-[11px] font-semibold cursor-pointer shrink-0"
                        >
                          {inq.status === 'new' ? 'بدء المراجعة' : 'إصدار عرض سعر'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Charity & Kaffarah Execution Proof Verification (Proof >= 8 chars rule enforced) */}
            <div className="lg:col-span-2 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  توثيق مساهمات اعمل الخير ({unverifiedCharity.length})
                </h3>
                {unverifiedCharity.length === 0 ? (
                  <p className="text-xs text-slate-500">كل مساهمات الخير موثقة.</p>
                ) : (
                  <ul className="space-y-2">
                    {unverifiedCharity.map((c) => (
                      <li
                        key={c.contributionId}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="font-bold text-slate-900">
                          {c.contributorName} · {c.initiativeTitle} ({c.pledgeAmountEGP} ج.م)
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={charityProofMap[c.contributionId] ?? ''}
                            onChange={(e) =>
                              setCharityProofMap((p) => ({
                                ...p,
                                [c.contributionId]: e.target.value,
                              }))
                            }
                            placeholder="رابط أو مرجع إثبات التنفيذ (8 أحرف فأكثر)"
                            className="flex-1 min-h-[36px] px-2.5 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const proof = (charityProofMap[c.contributionId] || '').trim();
                              if (proof.length < 8) {
                                setAdminMsg('ملاحظة: رابط أو مرجع الإثبات يجب أن يكون 8 أحرف على الأقل وفق قواعد الأمان.');
                                return;
                              }
                              if (authUser) {
                                void verifyCharityContribution(
                                  c.contributionId,
                                  proof,
                                  authUser.uid,
                                );
                              }
                            }}
                            className="min-h-[36px] px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                          >
                            توثيق
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  توثيق تنفيذ كفارة اليمين ({openKaffarah.length})
                </h3>
                {openKaffarah.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد طلبات كفارة قيد التنفيذ.</p>
                ) : (
                  <ul className="space-y-2">
                    {openKaffarah.map((k) => (
                      <li
                        key={k.orderId}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="font-bold text-slate-900">
                          {k.donorName} · {k.kaffarahCount} كفارة ({k.totalMeals} وجبة · {k.totalAmountEGP} ج.م)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <input
                            type="text"
                            value={kaffarahProofMap[k.orderId] ?? ''}
                            onChange={(e) =>
                              setKaffarahProofMap((p) => ({
                                ...p,
                                [k.orderId]: e.target.value,
                              }))
                            }
                            placeholder="مرجع / رابط إثبات التوزيع الشرعي (8+ أحرف)"
                            className="flex-1 min-h-[36px] px-2.5 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const proof = (kaffarahProofMap[k.orderId] || '').trim();
                              if (proof.length < 8) {
                                setAdminMsg('ملاحظة: مرجع التوثيق الشرعي يجب أن لا يقل عن 8 أحرف.');
                                return;
                              }
                              if (authUser) {
                                void updateKaffarahExecutionStatus(
                                  k.orderId,
                                  'executed_verified',
                                  proof,
                                  authUser.uid,
                                );
                              }
                            }}
                            className="min-h-[36px] px-3 rounded-lg bg-amber-700 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                          >
                            تم التنفيذ والتوثيق
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Immutable Audit Logs */}
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/70">
            <h3 className="text-xs font-bold text-slate-900 mb-2">
              سجل التدقيق غير القابل للتعديل أو الحذف ({auditLogs.length})
            </h3>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500">لا توجد قيود تدقيق مسجلة بعد.</p>
            ) : (
              <ul className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                {auditLogs.slice(0, 10).map((log) => (
                  <li
                    key={log.logId}
                    className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-slate-200/70 last:border-0"
                  >
                    <span className="font-semibold text-slate-800">{log.actionAr}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {log.targetCollection}/{log.targetId}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Bootstrapped Owner-Only Financial Vault */}
      {isBootAdmin && (
        <section className="bg-white border border-purple-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Wallet className="w-5 h-5 text-[#4F2487] shrink-0" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  خزينة المالك المالية المركزية (Owner Financial Vault)
                </h2>
                <p className="text-xs text-slate-500">
                  معزولة بصلاحية isBootstrappedAdmin() — ترحيل فوري مع سجل تدقيق غير قابل للتعديل
                </p>
              </div>
            </div>
            <div className="text-left tabular-nums">
              <div className="text-[11px] text-slate-500">إجمالي السيولة</div>
              <div className="text-base font-bold text-[#4F2487]">
                {ownerAccounts
                  .reduce((sum, a) => sum + (a.balanceEGP || 0), 0)
                  .toLocaleString('en-US')}{' '}
                ج.م
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ownerAccounts.map((acc) => (
                <div
                  key={acc.accountId}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="text-xs text-slate-500">{acc.labelAr}</div>
                  <div className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                    {acc.balanceEGP.toLocaleString('en-US')} ج.م
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleRecordFinancialEntry}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  نوع القيد
                </label>
                <select
                  value={finDirection}
                  onChange={(e) =>
                    setFinDirection(e.target.value as 'inflow' | 'outflow')
                  }
                  className="w-full min-h-[40px] px-2.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="inflow">إيداع / تحصيل</option>
                  <option value="outflow">مصروف / سحب</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  القناة المالية
                </label>
                <select
                  value={finChannel}
                  onChange={(e) =>
                    setFinChannel(
                      e.target.value as OwnerFinancialAccount['accountId'],
                    )
                  }
                  className="w-full min-h-[40px] px-2.5 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="bank">البنك</option>
                  <option value="e_wallet">محفظة إلكترونية</option>
                  <option value="treasury">الخزينة النقدية</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  الجهة / المستفيد
                </label>
                <input
                  type="text"
                  value={finSource}
                  onChange={(e) => setFinSource(e.target.value)}
                  placeholder="مثال: شركة ها-بي إيجيبت"
                  className="w-full min-h-[40px] px-2.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  البيان
                </label>
                <input
                  type="text"
                  value={finPurpose}
                  onChange={(e) => setFinPurpose(e.target.value)}
                  placeholder="تسوية وجبات أسبوعية"
                  className="w-full min-h-[40px] px-2.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    المبلغ
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={finGross}
                    onChange={(e) => setFinGross(e.target.value)}
                    className="w-full min-h-[40px] px-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                {finDirection === 'inflow' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      عمولة %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={finCommPct}
                      onChange={(e) => setFinCommPct(e.target.value)}
                      className="w-full min-h-[40px] px-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      التصنيف
                    </label>
                    <select
                      value={finCategory}
                      onChange={(e) =>
                        setFinCategory(
                          e.target.value as OwnerFinancialEntry['expenseCategory'],
                        )
                      }
                      className="w-full min-h-[40px] px-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="raw_materials">خامات</option>
                      <option value="salaries">رواتب</option>
                      <option value="logistics">لوجستيات</option>
                      <option value="commissions">عمولات</option>
                      <option value="marketing">تسويق</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={finBusy}
                className="min-h-[40px] px-4 rounded-lg bg-[#4F2487] text-white text-xs font-semibold hover:bg-[#3f1c6d] disabled:opacity-50 cursor-pointer"
              >
                {finBusy ? 'جاري الترحيل...' : 'ترحيل القيد'}
              </button>
              {finMsg && (
                <p className="sm:col-span-2 lg:col-span-6 text-xs font-semibold text-emerald-700">
                  {finMsg}
                </p>
              )}
            </form>

            {ownerEntries.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pl-3">التاريخ</th>
                      <th className="py-2 pl-3">الاتجاه</th>
                      <th className="py-2 pl-3">الجهة</th>
                      <th className="py-2 pl-3">البيان</th>
                      <th className="py-2 pl-3">القناة</th>
                      <th className="py-2">الصافي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {ownerEntries.slice(0, 10).map((en) => (
                      <tr key={en.entryId}>
                        <td className="py-2 pl-3 font-mono">{en.entryDate}</td>
                        <td className="py-2 pl-3 font-semibold">
                          <span
                            className={
                              en.direction === 'inflow'
                                ? 'text-emerald-700'
                                : 'text-red-600'
                            }
                          >
                            {en.direction === 'inflow' ? 'إيداع' : 'مصروف'}
                          </span>
                        </td>
                        <td className="py-2 pl-3">{en.sourceOrBeneficiary}</td>
                        <td className="py-2 pl-3 text-slate-600">{en.purpose}</td>
                        <td className="py-2 pl-3">{en.channel}</td>
                        <td className="py-2 font-bold">
                          {en.netEGP.toLocaleString('en-US')} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Phase 2 Live Red-Team Security Suite */}
      <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#4F2487] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                فحص الفريق الأحمر الحي — الاثنا عشر حمولة معادية (Phase 2)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تنفيذ فعلي لـ 12 اختبار اختراق ومحاولات تجاوز الصلاحيات مباشرة أمام قواعد Firestore المنشورة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunRedTeam}
            disabled={runningProbes}
            className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#4F2487] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            {runningProbes ? 'جاري الاختبار الحي...' : 'تشغيل اختبارات الفريق الأحمر (12)'}
          </button>
        </div>

        {!probeResults ? (
          <div className="p-5 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <div>1. تصعيد الامتياز الذاتي (users/&#123;uid&#125;)</div>
            <div>2. كتابة ظل حقل الأشباح (isVerified: true)</div>
            <div>3. تسميم الكتالوج بين المستأجرين</div>
            <div>4. مطالبة مسؤول ببريد غير موثق</div>
            <div>5. استخراج بيانات الطلبات (list)</div>
            <div>6. تسريب الملف الشخصي الخاص (PII)</div>
            <div>7. التلاعب بمحفظة ساعي البريد</div>
            <div>8. اختصار حالة التسليم</div>
            <div>9. فرصة استثمارية مجانية (cost = 0)</div>
            <div>10. إصدار عقد انتفاع غير مصرح به</div>
            <div>11. فائض تقسيم الأرباح (120 != 100)</div>
            <div>12. التلاعب بسجل التدقيق</div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {probeResults.map((res) => (
              <li
                key={res.id}
                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">
                    {res.id}. {res.titleAr}
                  </span>
                  <span className="text-slate-500 mr-2 font-mono">{res.target}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-semibold ${
                      res.status === 'failed' ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {res.detail}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
