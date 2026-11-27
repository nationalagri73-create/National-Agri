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
  Users,
  Wallet,
} from 'lucide-react';
import { useI18n } from '../i18n/translations';
import {
  BASIT_ROLE_LABELS,
  BenefitBooking,
  CanonicalBasitRole,
  CharityContribution,
  CommissionRule,
  CourierProfile,
  DeliveryRequest,
  FaydOpportunity,
  KaffarahOrder,
  LogisticsServiceInquiry,
  OnboardingApplication,
  PublicStorefront,
  SecurityAuditLog,
  SubscriptionPlan,
  UserPrivateProfile,
  UserProfile,
  UsufructProposal,
  VipDirectOrder,
  normalizeRoleLabel,
} from '../types/fayd';
import {
  approveOrRejectOpportunity,
  assignCourierToDelivery,
  decideBenefitBooking,
  decideOnboardingApplication,
  issueUsufructContractByAdmin,
  RedTeamProbeResult,
  runLiveRedTeamProbes,
  saveCommissionRule,
  seedFaydPlatformData,
  updateKaffarahExecutionStatus,
  updateLogisticsInquiryStatus,
  updateUserPrivateProfile,
  updateUserRoleAndTenantByAdmin,
  updateVipDirectOrderStatus,
  verifyCharityContribution,
} from '../services/faydFirestore';

interface GovernanceSecurityTabProps {
  authUser: User | null;
  userProfile: UserProfile | null;
  privateProfile: UserPrivateProfile | null;
  isAdmin: boolean;
  isBootAdmin: boolean;
  isPlatformOwner: boolean;
  allUsers: UserProfile[];
  storefronts: PublicStorefront[];
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
  onSignIn: () => void;
  onSignOut: () => void;
  onNavigateFinance?: () => void;
}

const CANONICAL_ROLES: CanonicalBasitRole[] = [
  'platform_owner',
  'system_admin',
  'factory_manager',
  'kitchen_manager',
  'supplier',
  'employee',
  'client',
];

export const GovernanceSecurityTab: React.FC<GovernanceSecurityTabProps> = ({
  authUser,
  userProfile,
  privateProfile,
  isAdmin,
  isBootAdmin,
  isPlatformOwner,
  allUsers,
  storefronts,
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
  onSignIn,
  onSignOut,
  onNavigateFinance,
}) => {
  const { isEn, t } = useI18n();
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

  // Role & Tenant Assignment Drafts
  const [roleDrafts, setRoleDrafts] = useState<
    Record<string, { role: string; tenantId: string; status: UserProfile['status'] }>
  >({});
  const [savingUserUid, setSavingUserUid] = useState<string | null>(null);

  const [assignCourierMap, setAssignCourierMap] = useState<Record<string, string>>({});
  const [charityProofMap, setCharityProofMap] = useState<Record<string, string>>({});
  const [kaffarahProofMap, setKaffarahProofMap] = useState<Record<string, string>>({});
  const [vipReplyMap, setVipReplyMap] = useState<Record<string, string>>({});

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
      setPiiMsg(
        t(
          'تم حفظ البيانات الشخصية الحساسة داخل الخزينة المعزولة بنجاح.',
          'Sensitive personal info saved to isolated private vault.',
        ),
      );
    } catch (err) {
      setPiiMsg(
        err instanceof Error
          ? err.message
          : t('تعذر حفظ البيانات.', 'Failed to save private profile.'),
      );
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
        t(
          'تمت تهيئة المطابخ والمصانع والكتالوج والباقات الصحية والمزايا والخير والكفارة وقواعد العمولات في Firestore بنجاح.',
          'BASIT stores, factories, catalogs, healthy plans, benefits, charity, kaffarah, and commission rules seeded to Firestore.',
        ),
      );
    } catch (err) {
      setAdminMsg(err instanceof Error ? err.message : t('تعذر التهيئة.', 'Seeding failed.'));
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
      setAdminMsg(t('تم تحديث قواعد العمولات المركزية بنجاح.', 'Global commission rules updated.'));
    } catch (err) {
      setAdminMsg(err instanceof Error ? err.message : t('تعذر تحديث العمولات.', 'Update failed.'));
    }
  };

  const handleAssignRole = async (target: UserProfile) => {
    if (!authUser) return;
    const draft = roleDrafts[target.uid] || {
      role: target.role,
      tenantId: target.tenantId || '',
      status: target.status,
    };
    setSavingUserUid(target.uid);
    setAdminMsg(null);
    try {
      await updateUserRoleAndTenantByAdmin({
        targetUid: target.uid,
        role: draft.role as CanonicalBasitRole,
        tenantId: draft.tenantId,
        status: draft.status,
        adminUid: authUser.uid,
      });
      setAdminMsg(
        t(
          `تم تحديث صلاحية ${target.displayName} إلى ${normalizeRoleLabel(draft.role as CanonicalBasitRole, false)}.`,
          `Updated ${target.displayName} role to ${draft.role}.`,
        ),
      );
    } catch (err) {
      setAdminMsg(err instanceof Error ? err.message : t('تعذر تحديث الصلاحية.', 'Role update failed.'));
    } finally {
      setSavingUserUid(null);
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
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#1F0B22]">
            {t('الهوية والصلاحيات والحوكمة المؤسسية', 'Identity, Roles & Enterprise Governance')}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            <span>{t('7 أدوار قياسية معزولة', '7 isolated canonical roles')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('فصل تام للبيانات الشخصية (PII)', 'Strict PII vault separation')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('سجل تدقيق غير قابل للتعديل', 'Immutable audit trail')}</span>
          </div>
        </div>

        {isPlatformOwner && onNavigateFinance && (
          <button
            type="button"
            onClick={onNavigateFinance}
            className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B123F] text-white text-xs font-semibold hover:bg-[#501C5A] cursor-pointer shrink-0"
          >
            <Wallet className="w-4 h-4 text-[#D4AF37]" />
            {t('فتح نظام المالك المالي', 'Open Owner Financial Vault')}
          </button>
        )}
      </div>

      {/* Identity & PII Split Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <section className="lg:col-span-5 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#3B123F]/10 text-[#3B123F] flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1F0B22]">
                  {t('الهوية والصلاحيات (users/{uid})', 'Identity & Role (users/{uid})')}
                </h2>
                <p className="text-xs text-slate-500">
                  {t('ملف تشغيلي خالٍ تماماً من أي معلومات شخصية (PII)', 'Operational record with zero PII fields')}
                </p>
              </div>
            </div>
          </div>

          {!authUser ? (
            <div className="mt-4 p-4 rounded-xl bg-[#FFFEFC] border border-[#ECE4E8] text-center">
              <p className="text-xs text-slate-600 mb-3">
                {t(
                  'سجّل الدخول بحساب Google الموثق للوصول المباشر إلى قاعدة البيانات.',
                  'Sign in with a verified Google account to access Firestore workflows.',
                )}
              </p>
              <button
                type="button"
                onClick={onSignIn}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B123F] text-white text-xs font-semibold hover:bg-[#501C5A] cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {t('تسجيل الدخول عبر Google', 'Sign in with Google')}
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FFFEFC] border border-[#ECE4E8] space-y-2">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">{t('الاسم', 'Name')}</span>
                  <span className="font-bold text-[#1F0B22]">
                    {userProfile?.displayName || authUser.displayName || 'BASIT User'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">{t('الدور الفعلي', 'Active Role')}</span>
                  <span className="font-semibold text-[#3B123F]">
                    {isPlatformOwner
                      ? normalizeRoleLabel('platform_owner', isEn)
                      : normalizeRoleLabel(userProfile?.role, isEn)}
                  </span>
                </div>
                {userProfile?.tenantId && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">{t('المنشأة المرتبطة', 'Assigned Workspace')}</span>
                    <span className="font-mono text-[11px] text-[#1F0B22]">
                      {userProfile.tenantId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">{t('توثيق البريد', 'Email Verification')}</span>
                  <span className="font-semibold text-emerald-700">
                    {authUser.emailVerified
                      ? t('موثق', 'Verified')
                      : t('غير موثق', 'Unverified')}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">{t('المعرف', 'UID')}</span>
                  <span className="font-mono text-[11px] text-slate-600 truncate max-w-[180px]">
                    {authUser.uid}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onSignOut}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#ECE4E8] text-xs font-semibold text-slate-700 hover:bg-[#FFFEFC] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                {t('تسجيل الخروج', 'Sign Out')}
              </button>
            </div>
          )}
        </section>

        {/* Private PII Vault */}
        <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-[#3B123F]" />
            <div>
              <h2 className="text-sm font-bold text-[#1F0B22]">
                {t('خزينة البيانات الشخصية المعزولة (private_profile/main)', 'Isolated Private PII Vault')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('لا تُقرأ أو تُكتب إلا بواسطة صاحب الحساب أو الإدارة المركزية', 'Readable & writable only by account owner or central admin')}
              </p>
            </div>
          </div>

          {!authUser ? (
            <p className="text-xs text-slate-500 py-4">
              {t('قم بتسجيل الدخول أولاً لإدارة بيانات التواصل والملف الضريبي الخاصة بك.', 'Sign in first to manage your private contact and tax profile.')}
            </p>
          ) : (
            <form onSubmit={handleSavePii} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('البريد الإلكتروني الموثق', 'Verified Email')}
                </label>
                <input
                  type="email"
                  value={authUser.email || ''}
                  disabled
                  className="w-full min-h-[44px] px-3 text-xs bg-slate-100 border border-[#ECE4E8] rounded-xl text-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('رقم الهاتف', 'Phone Number')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={32}
                  placeholder="+2010xxxxxxxx"
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-[#ECE4E8] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('الرقم القومي / البطاقة الضريبية', 'National / Tax ID')}
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  maxLength={64}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-[#ECE4E8] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('العنوان الخاص', 'Address')}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={240}
                  className="w-full min-h-[44px] px-3 text-xs bg-white border border-[#ECE4E8] rounded-xl"
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
                  className="min-h-[44px] px-5 rounded-xl bg-[#1F0B22] text-white text-xs font-semibold hover:bg-[#3B123F] disabled:opacity-50 cursor-pointer"
                >
                  {savingPii ? t('جاري الحفظ...', 'Saving...') : t('حفظ في الخزينة المعزولة', 'Save to Private Vault')}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {/* Central Admin Governance */}
      {isAdmin && (
        <section className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#ECE4E8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#1F0B22]">
                {t('لوحة الإدارة المركزية (Central Governance)', 'Central Admin Governance Console')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  'تعيين الأدوار الـ 7 وربط المصانع، اعتماد طلبات الانضمام والفرص، السعاة، والعمولات',
                  'Assign the 7 BASIT roles & factories, approve onboarding/deals, couriers & commissions',
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedData}
              disabled={seeding}
              className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B123F] text-white text-xs font-semibold hover:bg-[#501C5A] disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Database className="w-4 h-4 text-[#D4AF37]" />
              {seeding
                ? t('جاري التهيئة...', 'Seeding...')
                : t('تهيئة البيانات الأساسية في Firestore', 'Seed BASIT Platform Data')}
            </button>
          </div>

          {adminMsg && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{adminMsg}</span>
            </div>
          )}

          {/* 7-Role Access & Workspace Assignment Matrix (Bootstrapped Admin) */}
          {isBootAdmin && (
            <div className="p-5 border-b border-[#ECE4E8]">
              <h3 className="text-xs font-bold text-[#1F0B22] flex items-center gap-1.5 mb-3">
                <Users className="w-4 h-4 text-[#3B123F]" />
                {t(
                  `توزيع صلاحيات المستخدمين والربط بالمصانع والمطابخ (${allUsers.length})`,
                  `User Role & Workspace Assignment (${allUsers.length})`,
                )}
              </h3>

              {allUsers.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {t('لم يسجل مستخدمون إضافيون بعد.', 'No additional user profiles registered yet.')}
                </p>
              ) : (
                <>
                  {/* Mobile Card List (md:hidden) */}
                  <div className="md:hidden space-y-2.5">
                    {allUsers.map((u) => {
                      const draft = roleDrafts[u.uid] || {
                        role: u.role,
                        tenantId: u.tenantId || '',
                        status: u.status,
                      };
                      return (
                        <div
                          key={u.uid}
                          className="p-3.5 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] space-y-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-[#1F0B22] truncate">{u.displayName}</div>
                              <div className="text-[11px] font-mono text-slate-500 truncate">{u.uid.slice(0, 14)}…</div>
                            </div>
                            <button
                              type="button"
                              disabled={savingUserUid === u.uid}
                              onClick={() => handleAssignRole(u)}
                              className="min-h-[44px] px-4 rounded-xl bg-[#3B123F] text-white text-xs font-bold hover:bg-[#501C5A] disabled:opacity-50 cursor-pointer shrink-0"
                            >
                              {savingUserUid === u.uid ? '...' : t('حفظ', 'Apply')}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <select
                              value={draft.role}
                              onChange={(e) =>
                                setRoleDrafts((prev) => ({
                                  ...prev,
                                  [u.uid]: { ...draft, role: e.target.value },
                                }))
                              }
                              className="w-full min-h-[44px] px-3 text-xs bg-white border border-[#ECE4E8] rounded-xl"
                            >
                              {CANONICAL_ROLES.map((cr) => (
                                <option key={cr} value={cr}>
                                  {isEn ? BASIT_ROLE_LABELS[cr].en : BASIT_ROLE_LABELS[cr].ar}
                                </option>
                              ))}
                            </select>

                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={draft.tenantId}
                                onChange={(e) =>
                                  setRoleDrafts((prev) => ({
                                    ...prev,
                                    [u.uid]: { ...draft, tenantId: e.target.value },
                                  }))
                                }
                                className="w-full min-h-[44px] px-2.5 text-xs bg-white border border-[#ECE4E8] rounded-xl"
                              >
                                <option value="">{t('بدون ربط', 'Unassigned')}</option>
                                {storefronts.map((sf) => (
                                  <option key={sf.tenantId} value={sf.tenantId}>
                                    {isEn ? sf.nameEn || sf.name : sf.name}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={draft.status}
                                onChange={(e) =>
                                  setRoleDrafts((prev) => ({
                                    ...prev,
                                    [u.uid]: {
                                      ...draft,
                                      status: e.target.value as UserProfile['status'],
                                    },
                                  }))
                                }
                                className="w-full min-h-[44px] px-2.5 text-xs bg-white border border-[#ECE4E8] rounded-xl"
                              >
                                <option value="active">{t('نشط', 'Active')}</option>
                                <option value="pending">{t('معلق', 'Pending')}</option>
                                <option value="suspended">{t('موقوف', 'Suspended')}</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table (hidden md:block) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#ECE4E8] text-slate-500">
                          <th className="py-2 px-2 text-start">{t('المستخدم', 'User')}</th>
                          <th className="py-2 px-2 text-start">{t('الدور', 'Role')}</th>
                          <th className="py-2 px-2 text-start">{t('المنشأة / المصنع', 'Tenant / Factory')}</th>
                          <th className="py-2 px-2 text-start">{t('الحالة', 'Status')}</th>
                          <th className="py-2 px-2 text-start">{t('حفظ', 'Save')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ECE4E8]/70">
                        {allUsers.map((u) => {
                          const draft = roleDrafts[u.uid] || {
                            role: u.role,
                            tenantId: u.tenantId || '',
                            status: u.status,
                          };
                          return (
                            <tr key={u.uid}>
                              <td className="py-2.5 px-2">
                                <div className="font-bold text-[#1F0B22]">{u.displayName}</div>
                                <div className="text-[11px] font-mono text-slate-500">{u.uid.slice(0, 14)}…</div>
                              </td>
                              <td className="py-2.5 px-2">
                                <select
                                  value={draft.role}
                                  onChange={(e) =>
                                    setRoleDrafts((prev) => ({
                                      ...prev,
                                      [u.uid]: { ...draft, role: e.target.value },
                                    }))
                                  }
                                  className="min-h-[36px] px-2 text-xs bg-white border border-[#ECE4E8] rounded-lg"
                                >
                                  {CANONICAL_ROLES.map((cr) => (
                                    <option key={cr} value={cr}>
                                      {isEn ? BASIT_ROLE_LABELS[cr].en : BASIT_ROLE_LABELS[cr].ar}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2.5 px-2">
                                <select
                                  value={draft.tenantId}
                                  onChange={(e) =>
                                    setRoleDrafts((prev) => ({
                                      ...prev,
                                      [u.uid]: { ...draft, tenantId: e.target.value },
                                    }))
                                  }
                                  className="min-h-[36px] px-2 text-xs bg-white border border-[#ECE4E8] rounded-lg max-w-[180px]"
                                >
                                  <option value="">{t('بدون ربط محدد', 'Unassigned')}</option>
                                  {storefronts.map((sf) => (
                                    <option key={sf.tenantId} value={sf.tenantId}>
                                      {isEn ? sf.nameEn || sf.name : sf.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2.5 px-2">
                                <select
                                  value={draft.status}
                                  onChange={(e) =>
                                    setRoleDrafts((prev) => ({
                                      ...prev,
                                      [u.uid]: {
                                        ...draft,
                                        status: e.target.value as UserProfile['status'],
                                      },
                                    }))
                                  }
                                  className="min-h-[36px] px-2 text-xs bg-white border border-[#ECE4E8] rounded-lg"
                                >
                                  <option value="active">{t('نشط', 'Active')}</option>
                                  <option value="pending">{t('معلق', 'Pending')}</option>
                                  <option value="suspended">{t('موقوف', 'Suspended')}</option>
                                </select>
                              </td>
                              <td className="py-2.5 px-2">
                                <button
                                  type="button"
                                  disabled={savingUserUid === u.uid}
                                  onClick={() => handleAssignRole(u)}
                                  className="min-h-[36px] px-3 rounded-lg bg-[#1F0B22] text-white text-[11px] font-semibold hover:bg-[#3B123F] disabled:opacity-50 cursor-pointer"
                                >
                                  {savingUserUid === u.uid ? '...' : t('تحديث', 'Apply')}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Onboarding Approvals */}
            <div className="border border-[#ECE4E8] rounded-xl p-4 space-y-3 bg-[#FFFEFC]/60">
              <h3 className="text-xs font-bold text-[#1F0B22]">
                {t(`طلبات الانضمام المعلقة (${pendingApps.length})`, `Pending Partner Applications (${pendingApps.length})`)}
              </h3>
              {pendingApps.length === 0 ? (
                <p className="text-xs text-slate-500">{t('لا توجد طلبات انضمام معلقة.', 'No pending applications.')}</p>
              ) : (
                <ul className="space-y-2.5">
                  {pendingApps.map((app) => (
                    <li
                      key={app.appId}
                      className="p-3 rounded-xl bg-white border border-[#ECE4E8] space-y-2"
                    >
                      <div className="text-xs font-bold text-[#1F0B22]">
                        {app.businessName} · {app.targetRole}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {app.contactName} · {app.city} · {app.commercialRegRef}
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
                          {t('اعتماد وإنشاء الكيان', 'Approve & Create Workspace')}
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
                          className="min-h-[38px] px-3 rounded-lg border border-[#ECE4E8] text-red-600 text-xs font-semibold cursor-pointer"
                        >
                          {t('رفض', 'Reject')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Opportunity & Usufruct Contract Approvals */}
            <div className="border border-[#ECE4E8] rounded-xl p-4 space-y-4 bg-[#FFFEFC]/60">
              <div>
                <h3 className="text-xs font-bold text-[#1F0B22] mb-2">
                  {t(`فرص بانتظار الاعتماد (${pendingOpps.length})`, `Pending Opportunities (${pendingOpps.length})`)}
                </h3>
                {pendingOpps.length === 0 ? (
                  <p className="text-xs text-slate-500">{t('لا توجد فرص معلقة.', 'No pending opportunities.')}</p>
                ) : (
                  <ul className="space-y-2">
                    {pendingOpps.map((opp) => (
                      <li
                        key={opp.oppId}
                        className="p-3 rounded-xl bg-white border border-[#ECE4E8] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#1F0B22] truncate">
                            {opp.title}
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {opp.costOrInvestmentEGP.toLocaleString('en-US')} EGP · {opp.city}
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
                            {t('اعتماد', 'Approve')}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              authUser &&
                              approveOrRejectOpportunity(opp.oppId, 'rejected', authUser.uid)
                            }
                            className="min-h-[38px] px-3 rounded-lg border border-[#ECE4E8] text-red-600 text-xs font-semibold cursor-pointer"
                          >
                            {t('رفض', 'Reject')}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-3 border-t border-[#ECE4E8]">
                <h3 className="text-xs font-bold text-[#1F0B22] mb-2">
                  {t(`مقترحات انتفاع جاهزة لإصدار العقد (${awaitingAdminProposals.length})`, `Usufruct Proposals Ready (${awaitingAdminProposals.length})`)}
                </h3>
                {awaitingAdminProposals.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {t('لا توجد مقترحات معتمدة من مالك الموقع بانتظار العقد.', 'No proposals awaiting contract.')}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {awaitingAdminProposals.map((prop) => (
                      <li
                        key={prop.proposalId}
                        className="p-3 rounded-xl bg-white border border-[#ECE4E8] flex items-center justify-between gap-2"
                      >
                        <div className="text-xs">
                          <div className="font-bold text-[#1F0B22]">
                            {prop.proposerName} ({prop.proposerProfitPct}%/{prop.siteOwnerProfitPct}%/{prop.platformUsufructPct}%)
                          </div>
                          <div className="text-[11px] text-slate-500">{prop.proposalId}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            authUser && issueUsufructContractByAdmin(prop, authUser.uid)
                          }
                          className="min-h-[38px] px-3 rounded-lg bg-[#3B123F] text-white text-xs font-semibold cursor-pointer shrink-0"
                        >
                          {t('إصدار العقد', 'Issue Contract')}
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
              className="border border-[#ECE4E8] rounded-xl p-4 space-y-3 bg-[#FFFEFC]/60"
            >
              <h3 className="text-xs font-bold text-[#1F0B22]">
                {t(`ضبط العمولات المركزية وباقات الاشتراك (${plans.length})`, `Global Commission & Plans (${plans.length})`)}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    {t('عمولة الطلبات الافتراضية (%)', 'Default Order Commission (%)')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={orderCommPct}
                    onChange={(e) => setOrderCommPct(e.target.value)}
                    className="w-full min-h-[40px] px-3 text-xs bg-white border border-[#ECE4E8] rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    {t('الحد الأدنى لرسوم التوصيل (ج.م)', 'Min Delivery Fee (EGP)')}
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={minDeliveryFee}
                    onChange={(e) => setMinDeliveryFee(e.target.value)}
                    className="w-full min-h-[40px] px-3 text-xs bg-white border border-[#ECE4E8] rounded-lg tabular-nums"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="min-h-[40px] px-4 rounded-lg bg-[#1F0B22] text-white text-xs font-semibold cursor-pointer"
              >
                {t('حفظ قواعد العمولات', 'Save Commission Rules')}
              </button>
            </form>

            {/* Assign Courier */}
            <div className="border border-[#ECE4E8] rounded-xl p-4 space-y-3 bg-[#FFFEFC]/60">
              <h3 className="text-xs font-bold text-[#1F0B22]">
                {t(`توجيه شحنات التوصيل للسعاة (${unassignedDeliveries.length})`, `Dispatch Assignment (${unassignedDeliveries.length})`)}
              </h3>
              {unassignedDeliveries.length === 0 ? (
                <p className="text-xs text-slate-500">{t('لا توجد شحنات بانتظار التوجيه.', 'No unassigned deliveries.')}</p>
              ) : (
                <ul className="space-y-2">
                  {unassignedDeliveries.map((del) => (
                    <li
                      key={del.deliveryId}
                      className="p-2.5 rounded-lg bg-white border border-[#ECE4E8] flex flex-col sm:flex-row sm:items-center gap-2"
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
                          className="min-h-[38px] px-2 text-xs bg-white border border-[#ECE4E8] rounded-lg"
                        >
                          {couriers.length === 0 ? (
                            <option value={authUser?.uid || ''}>
                              {t('تعيين الحساب الحالي كساعي', 'Assign current account')}
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
                          className="min-h-[38px] px-3 rounded-lg bg-[#3B123F] text-white text-xs font-semibold cursor-pointer shrink-0"
                        >
                          {t('تعيين', 'Assign')}
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
            <div className="border border-[#ECE4E8] rounded-xl p-4 space-y-2.5 bg-[#FFFEFC]/60">
              <h3 className="text-xs font-bold text-[#1F0B22]">
                {t(`اعتماد الطلبات المؤسسية والمصانع المباشرة (${openVipOrders.length})`, `Direct Factory & Enterprise Orders (${openVipOrders.length})`)}
              </h3>
              {openVipOrders.length === 0 ? (
                <p className="text-xs text-slate-500">{t('لا توجد طلبات مباشرة مفتوحة.', 'No open direct orders.')}</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {openVipOrders.map((vo) => (
                    <li
                      key={vo.orderId}
                      className="p-2.5 rounded-lg bg-white border border-[#ECE4E8] space-y-2 text-xs"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-bold text-[#1F0B22]">
                          {vo.customerName} ({vo.totalEGP} EGP)
                        </span>
                        <span className="font-mono text-[11px] text-[#3B123F]">
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
                        placeholder={t('رد الإدارة / ملاحظة التنفيذ...', 'Admin reply / fulfillment note...')}
                        className="w-full min-h-[34px] px-2.5 text-xs bg-white border border-[#ECE4E8] rounded-lg"
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
                          {vo.status === 'pending_owner' ? t('اعتماد الطلب', 'Approve') : t('إتمام التنفيذ', 'Complete')}
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
                          className="min-h-[34px] px-2.5 rounded-lg border border-[#ECE4E8] text-red-600 text-[11px] font-semibold cursor-pointer"
                        >
                          {t('رفض', 'Reject')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-[#ECE4E8] rounded-xl p-4 space-y-3 bg-[#FFFEFC]/60">
              <div>
                <h3 className="text-xs font-bold text-[#1F0B22] mb-2">
                  {t(`حجوزات المزايا والترفيه المعلقة (${pendingBookings.length})`, `Pending Benefit Bookings (${pendingBookings.length})`)}
                </h3>
                {pendingBookings.length === 0 ? (
                  <p className="text-xs text-slate-500">{t('لا توجد حجوزات مزايا معلقة.', 'No pending bookings.')}</p>
                ) : (
                  <ul className="space-y-2">
                    {pendingBookings.map((b) => (
                      <li
                        key={b.bookingId}
                        className="p-2.5 rounded-lg bg-white border border-[#ECE4E8] flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#1F0B22]">
                            {b.userName} · {b.venueName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {b.requestedDate} · {b.peopleCount} {t('أفراد', 'guests')}
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
                            {t('اعتماد', 'Approve')}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              authUser &&
                              decideBenefitBooking(b.bookingId, 'rejected', authUser.uid)
                            }
                            className="min-h-[34px] px-2.5 rounded-lg border border-[#ECE4E8] text-red-600 text-[11px] font-semibold cursor-pointer"
                          >
                            {t('رفض', 'Reject')}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-2.5 border-t border-[#ECE4E8]">
                <h3 className="text-xs font-bold text-[#1F0B22] mb-2">
                  {t(`طلبات باسط للأعمال واللوجستيات (${openLogistics.length})`, `B2B & Logistics Inquiries (${openLogistics.length})`)}
                </h3>
                {openLogistics.length === 0 ? (
                  <p className="text-xs text-slate-500">{t('لا توجد طلبات لوجستية جديدة.', 'No open inquiries.')}</p>
                ) : (
                  <ul className="space-y-2">
                    {openLogistics.map((inq) => (
                      <li
                        key={inq.inquiryId}
                        className="p-2.5 rounded-lg bg-white border border-[#ECE4E8] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[#1F0B22] truncate">
                            {inq.organizationName} ({inq.guestCount})
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
                          className="min-h-[34px] px-2.5 rounded-lg bg-[#3B123F] text-white text-[11px] font-semibold cursor-pointer shrink-0"
                        >
                          {inq.status === 'new' ? t('بدء المراجعة', 'Review') : t('إصدار عرض سعر', 'Quote')}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Charity & Kaffarah Execution Proof Verification */}
            <div className="lg:col-span-2 border border-[#ECE4E8] rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FFFEFC]/60">
              <div>
                <h3 className="text-xs font-bold text-[#1F0B22] mb-2">
                  {t(`توثيق مساهمات اعمل الخير (${unverifiedCharity.length})`, `Charity Verification (${unverifiedCharity.length})`)}
                </h3>
                {unverifiedCharity.length === 0 ? (
                  <p className="text-xs text-slate-500">{t('كل مساهمات الخير موثقة.', 'All charity contributions verified.')}</p>
                ) : (
                  <ul className="space-y-2">
                    {unverifiedCharity.map((c) => (
                      <li
                        key={c.contributionId}
                        className="p-2.5 rounded-lg bg-white border border-[#ECE4E8] space-y-2 text-xs"
                      >
                        <div className="font-bold text-[#1F0B22]">
                          {c.contributorName} · {c.initiativeTitle} ({c.pledgeAmountEGP} EGP)
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
                            placeholder={t('مرجع إثبات التنفيذ (8+ أحرف)', 'Proof ref (8+ chars)')}
                            className="flex-1 min-h-[36px] px-2.5 text-xs bg-white border border-[#ECE4E8] rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const proof = (charityProofMap[c.contributionId] || '').trim();
                              if (proof.length < 8) {
                                setAdminMsg(t('مرجع الإثبات يجب أن يكون 8 أحرف على الأقل.', 'Proof ref must be at least 8 chars.'));
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
                            {t('توثيق', 'Verify')}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-[#1F0B22] mb-2">
                  {t(`توثيق تنفيذ كفارة اليمين (${openKaffarah.length})`, `Kaffarah Execution Proof (${openKaffarah.length})`)}
                </h3>
                {openKaffarah.length === 0 ? (
                  <p className="text-xs text-slate-500">{t('لا توجد طلبات كفارة قيد التنفيذ.', 'No pending Kaffarah orders.')}</p>
                ) : (
                  <ul className="space-y-2">
                    {openKaffarah.map((k) => (
                      <li
                        key={k.orderId}
                        className="p-2.5 rounded-lg bg-white border border-[#ECE4E8] space-y-2 text-xs"
                      >
                        <div className="font-bold text-[#1F0B22]">
                          {k.donorName} · {k.kaffarahCount} × ({k.totalMeals} {t('وجبة', 'meals')} · {k.totalAmountEGP} EGP)
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
                            placeholder={t('مرجع التوزيع الشرعي (8+ أحرف)', 'Distribution proof ref (8+ chars)')}
                            className="flex-1 min-h-[36px] px-2.5 text-xs bg-white border border-[#ECE4E8] rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const proof = (kaffarahProofMap[k.orderId] || '').trim();
                              if (proof.length < 8) {
                                setAdminMsg(t('مرجع التوثيق يجب أن لا يقل عن 8 أحرف.', 'Proof ref must be at least 8 chars.'));
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
                            {t('تم التنفيذ والتوثيق', 'Verify Execution')}
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
          <div className="px-5 py-4 border-t border-[#ECE4E8] bg-[#FFFEFC]">
            <h3 className="text-xs font-bold text-[#1F0B22] mb-2">
              {t(`سجل التدقيق غير القابل للتعديل أو الحذف (${auditLogs.length})`, `Immutable Audit Log (${auditLogs.length})`)}
            </h3>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500">{t('لا توجد قيود تدقيق مسجلة بعد.', 'No audit logs recorded yet.')}</p>
            ) : (
              <ul className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                {auditLogs.slice(0, 12).map((log) => (
                  <li
                    key={log.logId}
                    className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-[#ECE4E8]/70 last:border-0"
                  >
                    <span className="font-semibold text-[#1F0B22]">
                      {isEn ? log.actionEn : log.actionAr}
                    </span>
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

      {/* Live Red-Team Security Suite */}
      <section className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#ECE4E8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#3B123F] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-[#1F0B22]">
                {t('فحص الأمان والعزل الحي أمام قواعد Firestore', 'Live Firestore Security & Isolation Probes (12)')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  'تنفيذ فعلي لـ 12 اختبار اختراق ومحاولات تجاوز الصلاحيات مباشرة أمام قواعد الأمان المنشورة',
                  'Executes 12 live permission-boundary probes against deployed Firestore rules',
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunRedTeam}
            disabled={runningProbes}
            className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F0B22] text-white text-xs font-semibold hover:bg-[#3B123F] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            {runningProbes
              ? t('جاري الاختبار الحي...', 'Running Live Probes...')
              : t('تشغيل اختبارات الحماية (12)', 'Run 12 Security Probes')}
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
          <ul className="divide-y divide-[#ECE4E8]">
            {probeResults.map((res) => (
              <li
                key={res.id}
                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-[#1F0B22]">
                    {res.id}. {res.titleAr}
                  </span>
                  <span className="text-slate-500 mx-2 font-mono">{res.target}</span>
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
