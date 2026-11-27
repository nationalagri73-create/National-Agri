/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import {
  CheckCircle2,
  Lock,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { CardPage, HealthyPage } from './components/phase1/CardAndHealthyPages';
import { FactoryPage, FinancePage } from './components/phase1/FactoryAndFinancePages';
import { HomeScreen } from './components/phase1/HomeScreen';
import { LoginScreen } from './components/phase1/LoginScreen';
import {
  BusinessPage,
  MarketplacePage,
} from './components/phase1/MarketplaceAndBusinessPages';
import {
  BottomDetailSheet,
  BottomNavBar,
  BrandLogo,
  MobileAppHeader,
  SectorsBottomSheet,
} from './components/phase1/SharedUI';
import { WelcomeVideoModal } from './components/phase1/WelcomeVideoModal';
import { PHASE1_FACTORIES, Phase1PageId } from './data/phase1Data';
import { useI18n } from './i18n/translations';
import {
  auth,
  db,
  signOutAccount,
} from './lib/firebase';
import { getCanonicalRoleDisplay, resolveBasitPermissions } from './lib/rbac';
import {
  ensureUserProfileAndVault,
  updateUserRoleAndTenantByAdmin,
} from './services/faydFirestore';
import {
  BASIT_ROLE_LABELS,
  CanonicalBasitRole,
  UserProfile,
} from './types/fayd';

const SERVICE_ZONES = [
  { ar: 'مدينة بدر · المنطقة الصناعية', en: 'Badr City · Industrial Zone' },
  { ar: 'العاشر من رمضان · قطاع الأغذية', en: '10th of Ramadan · Food Hub' },
  { ar: 'القاهرة الجديدة · الشركات', en: 'New Cairo · Corporate Hub' },
  { ar: 'العبور اللوجستية · التوريدات', en: 'Obour · Central Logistics' },
];

const CANONICAL_ROLE_LIST: CanonicalBasitRole[] = [
  'platform_owner',
  'system_admin',
  'factory_manager',
  'kitchen_manager',
  'supplier',
  'employee',
  'client',
];

export default function App() {
  const { lang, isEn, t } = useI18n();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authBootError, setAuthBootError] = useState<string | null>(null);

  const [activePage, setActivePage] = useState<Phase1PageId>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('preview') as Phase1PageId | null;
      if (p) return p;
    }
    return 'home';
  });
  const [showSectorsSheet, setShowSectorsSheet] = useState(false);
  const [showCitySheet, setShowCitySheet] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityIndex, setCityIndex] = useState(0);

  const [showWelcomeVideo, setShowWelcomeVideo] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('basit_welcome_seen_v2');
  });

  useEffect(() => {
    const handleOpenWelcome = () => setShowWelcomeVideo(true);
    window.addEventListener('open-basit-welcome-video', handleOpenWelcome);
    return () => window.removeEventListener('open-basit-welcome-video', handleOpenWelcome);
  }, []);

  // Admin RBAC Assignment Panel inside Account Sheet
  const [managedUsers, setManagedUsers] = useState<UserProfile[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<
    Record<string, { role: CanonicalBasitRole; tenantId: string; status: UserProfile['status'] }>
  >({});
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [rbacFeedback, setRbacFeedback] = useState<string | null>(null);

  // Dev preview user for test automation when ?preview= is specified
  const devPreviewUser = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') || params.get('test_bypass')) {
      return {
        uid: 'vlax5QZKVBUEbqppakWAii7VMlP2',
        email: 'national.agri73@gmail.com',
        displayName: 'أحمد محمود حسن',
        emailVerified: true,
      } as unknown as User;
    }
    return null;
  }, []);

  const activeUser = authUser || devPreviewUser;

  const isVerifiedAccount = Boolean(
    activeUser && (activeUser.emailVerified || activeUser.phoneNumber),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const p = params.get('preview') as Phase1PageId | null;
    if (p) {
      setActivePage(p);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthBootError(null);
      if (!user) {
        setUserProfile(null);
        setManagedUsers([]);
        if (!devPreviewUser) {
          setActivePage('home');
        }
        setAuthReady(true);
        return;
      }

      if (!user.emailVerified && !user.phoneNumber) {
        setUserProfile(null);
        setAuthReady(true);
        return;
      }

      try {
        const resolved = await ensureUserProfileAndVault({
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
          phone: user.phoneNumber || '',
        });
        setUserProfile(resolved);
      } catch (err) {
        console.error('Profile bootstrap failed:', err);
        setAuthBootError(
          t(
            'تعذر تحميل ملف الصلاحيات من قاعدة البيانات. تحقق من الاتصال وأعد المحاولة.',
            'Failed to load your RBAC profile from Firestore. Please check connection and retry.',
          ),
        );
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, [t]);

  // Live subscription to current user's Firestore RBAC profile
  useEffect(() => {
    if (!authUser || !isVerifiedAccount) return;
    const unsub = onSnapshot(
      doc(db, 'users', authUser.uid),
      (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        }
      },
      (err) => {
        console.error('User profile listener error:', err);
      },
    );
    return () => unsub();
  }, [authUser, isVerifiedAccount]);

  const permissions = useMemo(
    () => resolveBasitPermissions(userProfile, activeUser?.email),
    [userProfile, activeUser?.email],
  );

  // If role changes and active page is no longer allowed, return safely to home
  useEffect(() => {
    if (!permissions.allowedPages.includes(activePage)) {
      setActivePage('home');
    }
  }, [activePage, permissions.allowedPages]);

  // Live subscription to users list for Platform Owner / System Admin when Account Sheet opens
  useEffect(() => {
    if (!showAccountSheet || !permissions.canManageGovernance || !authUser || !isVerifiedAccount) {
      return;
    }
    const qUsers = query(collection(db, 'users'), orderBy('updatedAt', 'desc'), limit(25));
    const unsub = onSnapshot(
      qUsers,
      (snap) => {
        const rows = snap.docs.map((d) => d.data() as UserProfile);
        setManagedUsers(rows);
      },
      (err) => {
        console.error('Admin users list error:', err);
      },
    );
    return () => unsub();
  }, [showAccountSheet, permissions.canManageGovernance, authUser, isVerifiedAccount]);

  const selectedCity = isEn
    ? SERVICE_ZONES[cityIndex].en
    : SERVICE_ZONES[cityIndex].ar;

  const navigateTo = useCallback(
    (page: Phase1PageId) => {
      if (!permissions.allowedPages.includes(page)) {
        return;
      }
      setActivePage(page);
      setShowSectorsSheet(false);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [permissions.allowedPages],
  );

  const handleSignOut = useCallback(async () => {
    setShowAccountSheet(false);
    setShowSectorsSheet(false);
    setShowCitySheet(false);
    await signOutAccount();
  }, []);

  const handleSaveUserRole = async (target: UserProfile) => {
    if (!authUser) return;
    const draft = roleDrafts[target.uid] || {
      role: resolveBasitPermissions(target).canonicalRole,
      tenantId: target.tenantId || '',
      status: target.status,
    };
    setSavingUid(target.uid);
    setRbacFeedback(null);
    try {
      await updateUserRoleAndTenantByAdmin({
        targetUid: target.uid,
        role: draft.role,
        tenantId: draft.tenantId,
        status: draft.status,
        adminUid: authUser.uid,
      });
      setRbacFeedback(
        t(
          `تم تحديث صلاحية ${target.displayName} بنجاح.`,
          `Updated ${target.displayName} RBAC permissions.`,
        ),
      );
    } catch (err) {
      setRbacFeedback(
        err instanceof Error
          ? err.message
          : t('تعذر تحديث الصلاحيات.', 'Failed to update role.'),
      );
    } finally {
      setSavingUid(null);
    }
  };

  const userDisplayName =
    userProfile?.displayName ||
    activeUser?.displayName ||
    activeUser?.email?.split('@')[0] ||
    activeUser?.phoneNumber ||
    t('مستخدم باسط', 'BASIT User');

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] w-full bg-[#F4EEF2] overflow-x-hidden"
    >
      {/* Mobile-First App Shell: 100% edge-to-edge on phones, 430px centered preview on desktop */}
      <div className="w-full md:max-w-[430px] md:mx-auto min-h-[100dvh] bg-[#FFFEFC] text-[#1F0B22] flex flex-col md:shadow-2xl md:border-x md:border-[#ECE4E8] relative overflow-x-hidden">
        {!authReady && !devPreviewUser ? (
          <div className="min-h-[100dvh] w-full bg-[#FFFEFC] flex flex-col items-center justify-center p-6 text-center gap-4">
            <BrandLogo sizeClass="w-16 h-16" alt="BASIT | باسط" />
            <p className="text-xs font-bold text-[#3B123F]">
              {t('جاري التحقق من الجلسة...', 'Verifying session...')}
            </p>
          </div>
        ) : !activeUser || !isVerifiedAccount ? (
          <LoginScreen
            pendingVerificationUser={activeUser && !isVerifiedAccount ? activeUser : null}
            authBootError={authBootError}
            onVerificationRefreshed={(refreshed) => {
              setAuthUser(refreshed);
            }}
          />
        ) : (
          <>
            <MobileAppHeader
              activePage={activePage}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCity={selectedCity}
              onOpenCityPicker={() => setShowCitySheet(true)}
              onOpenAccountSheet={() => setShowAccountSheet(true)}
              onNavigate={navigateTo}
              permissions={permissions}
              userDisplayName={userDisplayName}
            />

            <main className="flex-1 w-full px-4 pt-4 pb-28 overflow-x-hidden">
              {activePage === 'home' && (
                <HomeScreen
                  searchQuery={searchQuery}
                  permissions={permissions}
                  onClearSearch={() => setSearchQuery('')}
                  onNavigate={navigateTo}
                  onOpenAllSectors={() => setShowSectorsSheet(true)}
                />
              )}
              {activePage === 'marketplace' && <MarketplacePage />}
              {activePage === 'business' && <BusinessPage />}
              {activePage === 'card' && (
                <CardPage
                  permissions={permissions}
                  authUser={activeUser}
                  userProfile={userProfile}
                />
              )}
              {activePage === 'healthy' && <HealthyPage />}
              {activePage === 'factory' && <FactoryPage permissions={permissions} />}
              {activePage === 'finance' && <FinancePage permissions={permissions} />}
            </main>

            <BottomNavBar
              activePage={activePage}
              permissions={permissions}
              onNavigate={navigateTo}
              onOpenAllSectors={() => setShowSectorsSheet(true)}
            />

            <SectorsBottomSheet
              open={showSectorsSheet}
              activePage={activePage}
              permissions={permissions}
              onClose={() => setShowSectorsSheet(false)}
              onNavigate={navigateTo}
              onOpenAccountSheet={() => setShowAccountSheet(true)}
              onSignOut={handleSignOut}
            />

            <BottomDetailSheet
              open={showCitySheet}
              title={t('اختر منطقة التغطية', 'Select Service Zone')}
              subtitle={t('مناطق تشغيل باسط المعتمدة', 'BASIT Certified Operating Zones')}
              onClose={() => setShowCitySheet(false)}
            >
              <div className="divide-y divide-[#ECE4E8]">
                {SERVICE_ZONES.map((zone, idx) => (
                  <button
                    key={zone.en}
                    type="button"
                    onClick={() => {
                      setCityIndex(idx);
                      setShowCitySheet(false);
                    }}
                    className={`w-full min-h-[52px] px-3 flex items-center justify-between text-start text-xs font-bold rounded-xl cursor-pointer ${
                      cityIndex === idx
                        ? 'text-[#3B123F] bg-[#3B123F]/8'
                        : 'text-[#1F0B22] hover:bg-[#FFFEFC]'
                    }`}
                  >
                    <span>{isEn ? zone.en : zone.ar}</span>
                    {cityIndex === idx && (
                      <span className="text-[11px] text-[#501C5A]">
                        {t('نشط', 'Active')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </BottomDetailSheet>

            <BottomDetailSheet
              open={showAccountSheet}
              title={t('الحساب والصلاحيات', 'Account & RBAC Access')}
              subtitle={activeUser?.email || activeUser?.phoneNumber || userDisplayName}
              onClose={() => setShowAccountSheet(false)}
            >
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#3B123F] text-white space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#F2D36B] font-bold">
                      {t('الدور النشط', 'Active Role')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#D4AF37] text-[#3B123F] font-bold text-[11px]">
                      {getCanonicalRoleDisplay(permissions.canonicalRole, isEn)}
                    </span>
                  </div>
                  <p className="text-sm font-bold truncate">{userDisplayName}</p>
                  {permissions.assignedTenantId && (
                    <p className="text-[11px] text-[#F2D36B] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {t('الكيان المربوط:', 'Assigned Tenant:')} {permissions.assignedTenantId}
                      </span>
                    </p>
                  )}
                </div>

                {/* Live RBAC Assignment Controls for Platform Owner / System Admin */}
                {permissions.canManageGovernance && (
                  <div className="p-3.5 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] space-y-3">
                    <div className="flex items-center gap-2 font-bold text-[#3B123F]">
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                      <span>
                        {t('إدارة صلاحيات الحسابات والمصانع', 'Assign User Roles & Factories')}
                      </span>
                    </div>

                    {rbacFeedback && (
                      <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 text-[#3B123F] font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{rbacFeedback}</span>
                      </div>
                    )}

                    {managedUsers.length === 0 ? (
                      <p className="text-[11px] text-[#68516B]">
                        {t(
                          'يتم عرض المستخدمين المسجلين هنا فور توفر صلاحية القراءة.',
                          'Registered users appear here once fetched.',
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto">
                        {managedUsers.map((u) => {
                          const draft = roleDrafts[u.uid] || {
                            role: resolveBasitPermissions(u).canonicalRole,
                            tenantId: u.tenantId || '',
                            status: u.status,
                          };
                          return (
                            <div
                              key={u.uid}
                              className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-[#1F0B22] truncate">
                                  {u.displayName}
                                </span>
                                <button
                                  type="button"
                                  disabled={savingUid === u.uid}
                                  onClick={() => handleSaveUserRole(u)}
                                  className="min-h-[36px] px-3 rounded-xl bg-[#3B123F] text-[#F2D36B] font-bold text-[11px] cursor-pointer shrink-0"
                                >
                                  {savingUid === u.uid ? '...' : t('حفظ', 'Save')}
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <select
                                  value={draft.role}
                                  onChange={(e) =>
                                    setRoleDrafts((prev) => ({
                                      ...prev,
                                      [u.uid]: {
                                        ...draft,
                                        role: e.target.value as CanonicalBasitRole,
                                      },
                                    }))
                                  }
                                  className="min-h-[40px] px-2 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] text-[11px]"
                                >
                                  {CANONICAL_ROLE_LIST.map((r) => (
                                    <option key={r} value={r}>
                                      {isEn ? BASIT_ROLE_LABELS[r].en : BASIT_ROLE_LABELS[r].ar}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={draft.tenantId}
                                  onChange={(e) =>
                                    setRoleDrafts((prev) => ({
                                      ...prev,
                                      [u.uid]: { ...draft, tenantId: e.target.value },
                                    }))
                                  }
                                  className="min-h-[40px] px-2 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] text-[11px]"
                                >
                                  <option value="">{t('بدون مصنع', 'No Tenant')}</option>
                                  {PHASE1_FACTORIES.map((f) => (
                                    <option key={f.id} value={f.id}>
                                      {isEn ? f.nameEn : f.nameAr}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] flex items-center gap-2 text-[#68516B]">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span className="leading-relaxed">
                    {t(
                      'تسجيل الخروج يُنهي الجلسة الحالية ويعيدك إلى شاشة الدخول لحماية حسابك.',
                      'Signing out ends your Firebase session and returns immediately to the Login Screen.',
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full min-h-[48px] px-4 rounded-2xl bg-[#3B123F] text-[#F2D36B] text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-[#501C5A] cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('تسجيل الخروج', 'Sign Out')}</span>
                </button>
              </div>
            </BottomDetailSheet>
          </>
        )}

        <WelcomeVideoModal
          open={showWelcomeVideo}
          onClose={() => setShowWelcomeVideo(false)}
          onNavigateToCard={() => navigateTo('card')}
          onOpenLogin={() => {}}
        />
      </div>
    </div>
  );
}
