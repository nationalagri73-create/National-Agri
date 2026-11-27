import React, { useState } from 'react';
import {
  Bell,
  Building,
  CreditCard,
  Factory,
  FileText,
  Landmark,
  Layers,
  Lock,
  ShieldAlert,
  Smartphone,
  Utensils,
  Wallet,
} from 'lucide-react';
import {
  PHASE1_FACTORIES,
  PHASE1_PHOTOS,
} from '../../data/phase1Data';
import { useI18n } from '../../i18n/translations';
import { BasitPermissions } from '../../lib/rbac';
import { BottomDetailSheet, BrandLogo, SectorHeroCard } from './SharedUI';

export const FactoryPage: React.FC<{
  permissions: BasitPermissions;
}> = ({ permissions }) => {
  const { isEn, t } = useI18n();
  const [selectedFactoryId, setSelectedFactoryId] = useState(
    permissions.assignedTenantId || PHASE1_FACTORIES[0].id,
  );
  const [subTab, setSubTab] = useState<'meals' | 'cards' | 'alerts'>('meals');

  const isTenantScopedRole =
    permissions.canonicalRole === 'factory_manager' ||
    permissions.canonicalRole === 'employee';

  // Enforce strict tenant isolation: a factory manager/employee without an assigned tenantId
  // cannot view arbitrary factories.
  if (isTenantScopedRole && !permissions.assignedTenantId) {
    return (
      <div className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] p-5 space-y-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#3B123F] text-[#F2D36B] flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-base font-bold text-[#1F0B22]">
          {t('الحساب غير مربوط بمصنع بعد', 'Account Not Linked to a Factory Yet')}
        </h1>
        <p className="text-xs text-[#68516B] leading-relaxed">
          {t(
            'لضمان عزل بيانات المصانع ومنع تداخلها، يرجى ربط حسابك بمعرّف المصنع المخصص (tenantId) من قبل مدير النظام أو مالك المنصة.',
            'To enforce strict factory tenant isolation, your account must be linked to an assigned factory tenantId by an admin before accessing factory data.',
          )}
        </p>
      </div>
    );
  }

  const effectiveFactoryId = permissions.canSwitchFactories
    ? selectedFactoryId
    : permissions.assignedTenantId || PHASE1_FACTORIES[0].id;

  const factory =
    PHASE1_FACTORIES.find((f) => f.id === effectiveFactoryId) ||
    PHASE1_FACTORIES[0];

  return (
    <div className="space-y-5">
      {/* Factory Selector Pills: ONLY visible to Platform Owner / System Admin */}
      {permissions.canSwitchFactories ? (
        <div className="flex flex-wrap items-center gap-2">
          {PHASE1_FACTORIES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFactoryId(f.id)}
              className={`min-h-[42px] px-3.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                effectiveFactoryId === f.id
                  ? 'bg-[#3B123F] text-[#F2D36B]'
                  : 'bg-[#FFFFFF] border border-[#ECE4E8] text-[#1F0B22]'
              }`}
            >
              {isEn ? f.nameEn : f.nameAr}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#D4AF37]/60 px-3.5 py-2.5 flex items-center gap-2 text-xs font-bold text-[#3B123F]">
          <Lock className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span className="truncate">
            {t(
              `نطاق معزول لمصنعك فقط (${permissions.assignedTenantId})`,
              `Tenant-Isolated Factory Portal (${permissions.assignedTenantId})`,
            )}
          </span>
        </div>
      )}

      {/* Branded Factory Workspace Banner */}
      <section className="rounded-3xl bg-[#3B123F] text-white overflow-hidden border border-[#501C5A] shadow-sm">
        <div className="relative h-28 bg-[#3B123F]">
          <img
            src={PHASE1_PHOTOS.factoryCanteen}
            alt={isEn ? factory.nameEn : factory.nameAr}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3B123F] via-[#3B123F]/30 to-transparent pointer-events-none" />
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo sizeClass="w-11 h-11" alt={factory.nameAr} />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#F2D36B]">FACTORY SYSTEM</p>
              <h1 className="text-base font-bold truncate">
                {isEn ? factory.nameEn : factory.nameAr}
              </h1>
              <p className="text-xs text-[#FFFFFF]/80 truncate">
                {isEn ? factory.zoneEn : factory.zoneAr}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center tabular-nums">
            <div className="rounded-xl bg-white/10 border border-white/10 p-2.5 min-w-0">
              <p className="text-[10px] text-[#FFFFFF]/80 truncate">{t('الموظفون', 'Staff')}</p>
              <p className="text-sm font-bold text-[#F2D36B]">{factory.activeWorkers}</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/10 p-2.5 min-w-0">
              <p className="text-[10px] text-[#FFFFFF]/80 truncate">{t('وجبات اليوم', 'Meals')}</p>
              <p className="text-sm font-bold text-white">{factory.dailyMeals}</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/10 p-2.5 min-w-0">
              <p className="text-[10px] text-[#FFFFFF]/80 truncate">{t('الكروت', 'Cards')}</p>
              <p className="text-sm font-bold text-[#F2D36B]">{factory.activeCards}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Factory Workspace Segmented Control */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl">
        {(
          [
            { id: 'meals', ar: 'الوجبات', en: 'Meals', icon: Utensils },
            { id: 'cards', ar: 'الكروت', en: 'Cards', icon: CreditCard },
            { id: 'alerts', ar: 'التنبيهات', en: 'Alerts', icon: Bell },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`min-h-[44px] px-1.5 inline-flex items-center justify-center gap-1 rounded-xl text-xs font-bold transition-colors cursor-pointer min-w-0 ${
                subTab === tab.id
                  ? 'bg-[#3B123F] text-[#F2D36B]'
                  : 'text-[#1F0B22] hover:bg-[#FFFEFC]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{isEn ? tab.en : tab.ar}</span>
            </button>
          );
        })}
      </div>

      {/* Factory Sub-Content */}
      {subTab === 'meals' && (
        <div className="space-y-3">
          {factory.todayMeals.map((meal, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] p-4 flex items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#501C5A] break-words">
                  {isEn ? meal.shiftEn : meal.shiftAr} ·{' '}
                  {isEn ? factory.shiftWindowEn : factory.shiftWindowAr}
                </p>
                <h2 className="text-sm font-bold text-[#1F0B22] break-words">
                  {isEn ? meal.titleEn : meal.titleAr}
                </h2>
              </div>
              <span className="text-xs font-bold text-[#3B123F] tabular-nums shrink-0">
                {meal.kcal} kcal
              </span>
            </div>
          ))}
        </div>
      )}

      {subTab === 'cards' && (
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#1F0B22]">
            <Factory className="w-4 h-4 text-[#3B123F] shrink-0" />
            <span>{t('إدارة كروت موظفي المصنع', 'Factory Staff Benefits Matrix')}</span>
          </div>
          <p className="text-[#68516B] leading-relaxed break-words">
            {t(
              `إجمالي الكروت المفعلة داخل ${factory.nameAr}: ${factory.activeCards} كارت مزايا مرتبط بجدول الورديات ومقيد بهذا المصنع فقط.`,
              `Active BASIT Cards inside ${factory.nameEn}: ${factory.activeCards} cards strictly scoped to this factory.`,
            )}
          </p>
        </div>
      )}

      {subTab === 'alerts' && (
        <div className="space-y-2.5">
          {factory.alerts.map((alert, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] p-4 space-y-1 text-xs"
            >
              <p className="text-[11px] font-bold text-[#501C5A]">
                {isEn ? alert.timeEn : alert.timeAr}
              </p>
              <p className="text-sm font-bold text-[#1F0B22] break-words">
                {isEn ? alert.titleEn : alert.titleAr}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const FinancePage: React.FC<{
  permissions: BasitPermissions;
}> = ({ permissions }) => {
  const { isEn, t } = useI18n();
  const [selectedSector, setSelectedSector] = useState<
    'all' | 'marketplace' | 'business' | 'factory' | 'healthy'
  >('all');
  const [activeModule, setActiveModule] = useState<string | null>(null);

  if (!permissions.canAccessFinance) {
    return (
      <div className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#3B123F] text-[#F2D36B] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-base font-bold text-[#1F0B22]">
          {t('صلاحية مالك المنصة مطلوبة', 'Platform Owner Access Only')}
        </h1>
        <p className="text-xs text-[#68516B] leading-relaxed">
          {t(
            'الإدارة المالية للمالك محمية بقواعد Firestore والمنصة ولا يمكن الوصول إليها إلا بحساب مالك المنصة المعتمد.',
            'Owner Financial Management is enforced by Firestore Rules and restricted exclusively to the verified Platform Owner.',
          )}
        </p>
      </div>
    );
  }

  const modules = [
    {
      id: 'ledger',
      titleAr: 'سجل الإيرادات والمصروفات',
      titleEn: 'Revenue & Expense Ledger',
      descAr: 'تصنيف التدفقات حسب القطاع والجهة والقناة المالية.',
      descEn: 'Classify inflows & outflows by sector, counterparty & channel.',
      icon: Layers,
    },
    {
      id: 'invoices',
      titleAr: 'الفواتير والتحصيل والمدفوعات',
      titleEn: 'Invoices, Receipts & Payouts',
      descAr: 'متابعة فواتير التوريد ومستحقات الموردين والمطابخ.',
      descEn: 'Track B2B invoices, collections & supplier disbursements.',
      icon: FileText,
    },
    {
      id: 'debts',
      titleAr: 'الذمم والالتزامات والمديونيات',
      titleEn: 'Receivables, Payables & Debts',
      descAr: 'مراقبة الأرصدة الآجلة ومواعيد الاستحقاق لكل منشأة.',
      descEn: 'Monitor aging balances and settlement due dates.',
      icon: Building,
    },
  ];

  const channels = [
    {
      titleAr: 'الخزينة النقدية',
      titleEn: 'Cash Treasury',
      subAr: 'نقدي ومقبوضات فورية',
      subEn: 'Direct cash vault',
      icon: Wallet,
    },
    {
      titleAr: 'الحساب البنكي',
      titleEn: 'Bank Accounts',
      subAr: 'تحويلات مؤسسية وشيكات',
      subEn: 'Corporate bank transfers',
      icon: Landmark,
    },
    {
      titleAr: 'المحافظ الإلكترونية',
      titleEn: 'E-Wallets',
      subAr: 'تحصيل سريع وقنوات رقمية',
      subEn: 'Instant mobile wallets',
      icon: Smartphone,
    },
  ];

  const activeDetail = modules.find((m) => m.id === activeModule) || null;

  return (
    <div className="space-y-5">
      <SectorHeroCard
        code="OWNER FINANCIAL MANAGEMENT"
        title={t('الإدارة المالية للمالك', 'Owner Financial Management Hub')}
        description={t(
          'إدارة مركزية مقصورة على مالك المنصة لمراقبة الخزينة والحسابات البنكية والمحافظ والفواتير.',
          'Platform-Owner-exclusive mobile hub for treasury, banks, wallets & invoices.',
        )}
        image={PHASE1_PHOTOS.logisticsHub}
        imageAlt={t('الإدارة المالية للمنصة', 'BASIT Owner Financial Hub')}
      />

      {/* Channel Architecture */}
      <section className="space-y-2.5">
        <h2 className="text-base font-bold text-[#1F0B22]">
          {t('قنوات التدفق المالي المعتمدة', 'Financial Channels Architecture')}
        </h2>
        <div className="grid grid-cols-1 gap-2.5">
          {channels.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.titleEn}
                className="rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] p-3.5 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#3B123F] text-[#F2D36B] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#1F0B22] truncate">
                    {isEn ? ch.titleEn : ch.titleAr}
                  </h3>
                  <p className="text-[11px] text-[#68516B] truncate">
                    {isEn ? ch.subEn : ch.subAr}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bounded Wrap Sector Scope Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all', ar: 'كافة القطاعات', en: 'All Sectors' },
            { id: 'marketplace', ar: 'السوق', en: 'Marketplace' },
            { id: 'business', ar: 'الأعمال', en: 'Business' },
            { id: 'factory', ar: 'المصانع', en: 'Factories' },
            { id: 'healthy', ar: 'هيلثي', en: 'Healthy' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedSector(tab.id)}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold cursor-pointer ${
              selectedSector === tab.id
                ? 'bg-[#3B123F] text-[#F2D36B]'
                : 'bg-[#FFFFFF] border border-[#ECE4E8] text-[#1F0B22]'
            }`}
          >
            {isEn ? tab.en : tab.ar}
          </button>
        ))}
      </div>

      {/* Financial Modules List */}
      <section className="space-y-2.5">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => setActiveModule(mod.id)}
              className="w-full min-h-[72px] rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] p-4 flex items-center justify-between gap-3 text-start hover:border-[#3B123F]/40 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#3B123F] text-[#F2D36B] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#1F0B22] truncate">
                    {isEn ? mod.titleEn : mod.titleAr}
                  </h3>
                  <p className="text-xs text-[#68516B] truncate">
                    {isEn ? mod.descEn : mod.descAr}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#501C5A] shrink-0">
                {t('عرض', 'Open')}
              </span>
            </button>
          );
        })}
      </section>

      <BottomDetailSheet
        open={Boolean(activeDetail)}
        title={activeDetail ? (isEn ? activeDetail.titleEn : activeDetail.titleAr) : ''}
        subtitle={t('محمي بصلاحية مالك المنصة فقط', 'Protected by Platform-Owner RBAC')}
        onClose={() => setActiveModule(null)}
      >
        {activeDetail && (
          <div className="space-y-3 text-xs">
            <p className="text-[#68516B] leading-relaxed break-words">
              {isEn ? activeDetail.descEn : activeDetail.descAr}
            </p>
            <div className="p-3.5 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] text-[#1F0B22]">
              {t(
                `نطاق التصفية الحالي: ${selectedSector}`,
                `Selected scope filter: ${selectedSector}`,
              )}
            </div>
            <button
              type="button"
              onClick={() => setActiveModule(null)}
              className="w-full min-h-[46px] rounded-xl bg-[#D4AF37] text-[#3B123F] text-sm font-bold cursor-pointer"
            >
              {t('إغلاق', 'Close')}
            </button>
          </div>
        )}
      </BottomDetailSheet>
    </div>
  );
};
