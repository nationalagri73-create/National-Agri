import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  CreditCard,
  Factory,
  Globe,
  Home,
  LayoutGrid,
  Lock,
  LogOut,
  MapPin,
  Salad,
  Search,
  ShieldCheck,
  Store,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import {
  BASIT_LOGO_URL,
  BASIT_SECTORS,
  Phase1PageId,
} from '../../data/phase1Data';
import { useI18n } from '../../i18n/translations';
import { BasitPermissions, getCanonicalRoleDisplay } from '../../lib/rbac';

export function getSectorIcon(id: Phase1PageId) {
  switch (id) {
    case 'marketplace':
      return Store;
    case 'business':
      return Building2;
    case 'card':
      return CreditCard;
    case 'healthy':
      return Salad;
    case 'factory':
      return Factory;
    case 'finance':
      return Wallet;
    default:
      return Home;
  }
}

export const BrandLogo: React.FC<{
  sizeClass?: string;
  alt?: string;
}> = ({ sizeClass = 'w-9 h-9', alt = 'BASIT Logo' }) => (
  <img
    src={BASIT_LOGO_URL}
    alt={alt}
    referrerPolicy="no-referrer"
    className={`${sizeClass} rounded-full object-cover border border-[#D4AF37] bg-[#FFFFFF] shrink-0`}
  />
);

export const MobileAppHeader: React.FC<{
  activePage: Phase1PageId;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCity: string;
  onOpenCityPicker: () => void;
  onOpenAccountSheet: () => void;
  onNavigate: (page: Phase1PageId) => void;
  permissions: BasitPermissions;
  userDisplayName: string;
}> = ({
  activePage,
  searchQuery,
  onSearchChange,
  selectedCity,
  onOpenCityPicker,
  onOpenAccountSheet,
  onNavigate,
  permissions,
  userDisplayName,
}) => {
  const { isEn, toggleLang, t } = useI18n();
  const activeMeta = BASIT_SECTORS.find((s) => s.id === activePage);
  const BackArrow = isEn ? ArrowLeft : ArrowRight;
  const roleLabel = getCanonicalRoleDisplay(permissions.canonicalRole, isEn);

  if (activePage === 'home') {
    return (
      <header className="bg-gradient-to-b from-[#3B123F] to-[#501C5A] text-white rounded-b-[26px] px-4 pt-safe pb-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={onOpenAccountSheet}
              aria-label={t('حسابي والصلاحيات', 'Account & Permissions')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full active:scale-[0.95] transition-transform cursor-pointer shrink-0"
            >
              <BrandLogo sizeClass="w-10 h-10" alt="BASIT | باسط" />
            </button>

            <button
              type="button"
              onClick={onOpenCityPicker}
              className="min-h-[44px] flex flex-col justify-center text-start min-w-0 flex-1 cursor-pointer"
            >
              <span className="text-[10px] font-semibold text-[#F2D36B] leading-tight truncate">
                {userDisplayName} · {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-white min-w-0">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span className="truncate">{selectedCity}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#F2D36B] shrink-0" />
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleLang}
              aria-label={t('تبديل اللغة', 'Switch Language')}
              className="min-h-[42px] min-w-[42px] px-2 inline-flex items-center justify-center gap-1 rounded-xl bg-white/10 border border-[#F2D36B]/30 text-[11px] font-bold text-[#F2D36B] active:scale-[0.96] transition-transform cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>{isEn ? 'ع' : 'EN'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenAccountSheet}
              aria-label={t('الملف الشخصي والخروج', 'Account & Sign Out')}
              className="min-h-[42px] min-w-[42px] px-2 inline-flex items-center justify-center rounded-xl bg-[#D4AF37] text-[#3B123F] active:scale-[0.96] transition-transform cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Integrated Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#68516B] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(
              'ابحث عن مطبخ، خدمة إعاشة، كارت، أو مصنع...',
              'Search kitchens, catering, cards, or factories...',
            )}
            className="w-full min-h-[46px] ps-10 pe-4 rounded-2xl bg-[#FFFFFF] text-sm text-[#1F0B22] placeholder:text-[#68516B] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 min-h-[56px] pt-safe px-3 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#ECE4E8] flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        aria-label={t('العودة للرئيسية', 'Back to Home')}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#3B123F] hover:bg-[#FFFEFC] active:scale-[0.95] transition-transform cursor-pointer shrink-0"
      >
        <BackArrow className="w-5 h-5" />
      </button>

      <div className="min-w-0 text-center flex-1 py-1">
        <h2 className="text-sm font-bold text-[#1F0B22] truncate">
          {activeMeta
            ? isEn
              ? activeMeta.titleEn
              : activeMeta.titleAr
            : 'BASIT | باسط'}
        </h2>
        {activeMeta && (
          <p className="text-[10px] font-bold text-[#501C5A] truncate">
            {activeMeta.code}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={toggleLang}
        aria-label={t('تبديل اللغة', 'Switch Language')}
        className="min-h-[44px] min-w-[44px] px-2 flex items-center justify-center gap-1 rounded-xl text-xs font-bold text-[#3B123F] hover:bg-[#FFFEFC] cursor-pointer shrink-0"
      >
        <Globe className="w-4 h-4" />
        <span>{isEn ? 'ع' : 'EN'}</span>
      </button>
    </header>
  );
};

export const BottomNavBar: React.FC<{
  activePage: Phase1PageId;
  permissions: BasitPermissions;
  onNavigate: (page: Phase1PageId) => void;
  onOpenAllSectors: () => void;
}> = ({ activePage, permissions, onNavigate, onOpenAllSectors }) => {
  const { t } = useI18n();
  const isHubActive =
    activePage === 'healthy' || activePage === 'factory' || activePage === 'finance';

  const coreCandidates: Array<{
    key: Phase1PageId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'home', label: t('الرئيسية', 'Home'), icon: Home },
    { key: 'marketplace', label: t('السوق', 'Market'), icon: Store },
    { key: 'business', label: t('الأعمال', 'Business'), icon: Building2 },
    { key: 'card', label: t('الكارت', 'Card'), icon: CreditCard },
  ];

  // Fill up to 4 main buttons + 1 More button, prioritizing permitted pages
  const visibleTabs = coreCandidates.filter((c) =>
    permissions.allowedPages.includes(c.key),
  );
  if (visibleTabs.length < 4 && permissions.allowedPages.includes('factory')) {
    visibleTabs.push({ key: 'factory', label: t('المصنع', 'Factory'), icon: Factory });
  }
  if (visibleTabs.length < 4 && permissions.allowedPages.includes('healthy')) {
    visibleTabs.push({ key: 'healthy', label: t('هيلثي', 'Healthy'), icon: Salad });
  }

  const colCountClass =
    visibleTabs.length === 4
      ? 'grid-cols-5'
      : visibleTabs.length === 3
        ? 'grid-cols-4'
        : 'grid-cols-3';

  return (
    <nav
      aria-label={t('التنقل السفلي', 'Bottom Navigation')}
      className="fixed bottom-0 inset-x-0 z-40 w-full md:max-w-[430px] mx-auto bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#ECE4E8] pb-safe shadow-lg"
    >
      <div className={`grid ${colCountClass} h-[64px] items-center px-1`}>
        {visibleTabs.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className="min-h-[48px] min-w-0 px-0.5 flex flex-col items-center justify-center gap-1 rounded-2xl cursor-pointer active:scale-[0.95] transition-transform"
            >
              <div
                className={`w-10 h-7 rounded-full flex items-center justify-center transition-colors ${
                  active ? 'bg-[#3B123F] text-[#F2D36B]' : 'text-[#68516B]'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <span
                className={`text-[10px] leading-none truncate max-w-full ${
                  active ? 'font-bold text-[#3B123F]' : 'font-semibold text-[#68516B]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          key="sectors"
          type="button"
          onClick={onOpenAllSectors}
          className="min-h-[48px] min-w-0 px-0.5 flex flex-col items-center justify-center gap-1 rounded-2xl cursor-pointer active:scale-[0.95] transition-transform"
        >
          <div
            className={`w-10 h-7 rounded-full flex items-center justify-center transition-colors ${
              isHubActive ? 'bg-[#3B123F] text-[#F2D36B]' : 'text-[#68516B]'
            }`}
          >
            <LayoutGrid className="w-[18px] h-[18px]" />
          </div>
          <span
            className={`text-[10px] leading-none truncate max-w-full ${
              isHubActive ? 'font-bold text-[#3B123F]' : 'font-semibold text-[#68516B]'
            }`}
          >
            {t('المزيد', 'More')}
          </span>
        </button>
      </div>
    </nav>
  );
};

export const SectorsBottomSheet: React.FC<{
  open: boolean;
  activePage: Phase1PageId;
  permissions: BasitPermissions;
  onClose: () => void;
  onNavigate: (page: Phase1PageId) => void;
  onOpenAccountSheet: () => void;
  onSignOut: () => void;
}> = ({
  open,
  activePage,
  permissions,
  onClose,
  onNavigate,
  onOpenAccountSheet,
  onSignOut,
}) => {
  const { isEn, t } = useI18n();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1F0B22]/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-[430px] bg-[#FFFFFF] rounded-t-3xl p-5 pb-safe border-t border-[#ECE4E8] shadow-2xl max-h-[85dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-[#D4AF37]/60 mx-auto mb-3" />

        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#ECE4E8]">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo sizeClass="w-9 h-9" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#1F0B22] truncate">
                {t('قطاعات باسط المتاحة لدورك', 'BASIT Sectors & Access')}
              </h3>
              <p className="text-[11px] text-[#68516B] truncate">
                {getCanonicalRoleDisplay(permissions.canonicalRole, isEn)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('إغلاق', 'Close')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-[#FFFEFC] cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 text-[#68516B]" />
          </button>
        </div>

        <div className="mt-2 divide-y divide-[#ECE4E8]/80">
          {BASIT_SECTORS.map((sector) => {
            const Icon = getSectorIcon(sector.id);
            const isSelected = activePage === sector.id;
            const isPermitted = permissions.allowedPages.includes(sector.id);
            return (
              <button
                key={sector.id}
                type="button"
                disabled={!isPermitted}
                onClick={() => {
                  if (!isPermitted) return;
                  onNavigate(sector.id);
                  onClose();
                }}
                className={`w-full min-h-[60px] py-2.5 px-2 flex items-center justify-between gap-3 text-start rounded-xl transition-colors ${
                  !isPermitted
                    ? 'opacity-50 cursor-not-allowed'
                    : isSelected
                      ? 'bg-[#3B123F]/8 cursor-pointer'
                      : 'hover:bg-[#FFFEFC] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      !isPermitted
                        ? 'bg-[#FFFEFC] border border-[#ECE4E8] text-[#68516B]'
                        : isSelected
                          ? 'bg-[#3B123F] text-[#F2D36B]'
                          : 'bg-[#FFFEFC] border border-[#ECE4E8] text-[#3B123F]'
                    }`}
                  >
                    {isPermitted ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#1F0B22] truncate">
                      {isEn ? sector.titleEn : sector.titleAr}
                    </div>
                    <div className="text-[11px] text-[#68516B] truncate">
                      {isPermitted
                        ? isEn
                          ? sector.shortEn
                          : sector.shortAr
                        : t('مقصور على الصلاحية المخولة', 'Restricted by RBAC role')}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#501C5A] shrink-0">
                  {isPermitted ? t('فتح', 'Open') : t('مغلق', 'Locked')}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-[#ECE4E8] grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAccountSheet();
            }}
            className="min-h-[44px] px-3 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] text-xs font-bold text-[#3B123F] inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>{t('الحساب والصلاحيات', 'Role & Profile')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="min-h-[44px] px-3 rounded-xl bg-[#3B123F] text-[#F2D36B] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('تسجيل الخروج', 'Sign Out')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const BottomDetailSheet: React.FC<{
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, title, subtitle, onClose, children }) => {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1F0B22]/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-[430px] bg-[#FFFFFF] rounded-t-3xl p-5 pb-safe border-t border-[#ECE4E8] shadow-2xl max-h-[85dvh] overflow-y-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-[#D4AF37]/60 mx-auto" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#1F0B22] leading-snug break-words">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#68516B] mt-0.5 break-words">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('إغلاق', 'Close')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-[#FFFEFC] shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5 text-[#68516B]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const SectorHeroCard: React.FC<{
  code: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ code, title, description, image, imageAlt, actionLabel, onAction }) => (
  <section className="rounded-3xl bg-[#3B123F] text-white overflow-hidden border border-[#501C5A] shadow-sm">
    <div className="relative h-36 bg-[#3B123F]">
      <img
        src={image}
        alt={imageAlt}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#3B123F] via-[#3B123F]/25 to-transparent pointer-events-none" />
    </div>
    <div className="p-4 space-y-2.5">
      <p className="text-[11px] font-bold tracking-wide text-[#F2D36B]">
        {code}
      </p>
      <h1 className="text-lg font-bold leading-snug text-white break-words">
        {title}
      </h1>
      <p className="text-xs text-[#FFFFFF]/85 leading-relaxed break-words">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onAction}
            className="w-full min-h-[48px] px-5 inline-flex items-center justify-center rounded-2xl bg-[#D4AF37] text-[#3B123F] text-xs font-bold hover:bg-[#F2D36B] active:scale-[0.98] transition-all cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  </section>
);
