/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import {
  Briefcase,
  ClipboardList,
  LogIn,
  ShieldCheck,
  Store,
  Truck,
  Utensils,
} from 'lucide-react';
import { DeliveryTab } from './components/DeliveryTab';
import { GovernanceSecurityTab } from './components/GovernanceSecurityTab';
import { HabePortalTab } from './components/HabePortalTab';
import { MarketplaceTab } from './components/MarketplaceTab';
import { OpportunitiesTab } from './components/OpportunitiesTab';
import { OfflineIndicator, PWAInstallButton } from './components/PWAControls';
import { QrBadgeModal } from './components/QrBadgeModal';
import { WorkspaceOrdersTab } from './components/WorkspaceOrdersTab';
import {
  DEFAULT_COMMISSION_RULE,
  DEFAULT_KAFFARAH_RULE,
  SEED_CATALOG_ITEMS,
  SEED_CHARITY_INITIATIVES,
  SEED_ENTERTAINMENT_BENEFITS,
  SEED_OFFERS_ADS,
  SEED_OPPORTUNITIES,
  SEED_OWNER_ACCOUNTS,
  SEED_PAYMENT_GATEWAYS,
  SEED_PLANS,
  SEED_STOREFRONTS,
} from './data/seedDefaults';
import {
  auth,
  db,
  handleFirestoreError,
  isBootstrappedAdminEmail,
  OperationType,
  signInWithGoogle,
  signOutAccount,
  testConnection,
} from './lib/firebase';
import { ensureUserProfileAndVault } from './services/faydFirestore';
import {
  BenefitBooking,
  CatalogItem,
  CharityContribution,
  CharityInitiative,
  CommercialOrder,
  CommissionRule,
  CourierProfile,
  DeliveryRequest,
  EntertainmentBenefit,
  FaydOpportunity,
  KaffarahOrder,
  KaffarahRule,
  LogisticsServiceInquiry,
  OfferAd,
  OnboardingApplication,
  OwnerFinancialAccount,
  OwnerFinancialEntry,
  PaymentGatewayConfig,
  PaymentTransaction,
  PublicStorefront,
  SecurityAuditLog,
  SubscriptionPlan,
  TenantWorkspace,
  UserPrivateProfile,
  UserProfile,
  UsufructContract,
  UsufructProposal,
  VipDirectOrder,
} from './types/fayd';

type AppTab = 'market' | 'habe' | 'ops' | 'orders' | 'governance';
type OpsSubTab = 'delivery' | 'opportunities';

const TABS: {
  id: AppTab;
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'market', label: 'المتاجر', Icon: Store },
  { id: 'habe', label: 'ها-بي', Icon: Utensils },
  { id: 'ops', label: 'التوصيل والفرص', Icon: Truck },
  { id: 'orders', label: 'الطلبات', Icon: ClipboardList },
  { id: 'governance', label: 'الأمان', Icon: ShieldCheck },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window !== 'undefined') {
      const view = new URLSearchParams(window.location.search).get('view');
      if (view === 'al_ain_habe') return 'habe';
    }
    return 'market';
  });
  const [opsSubTab, setOpsSubTab] = useState<OpsSubTab>('delivery');
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [privateProfile, setPrivateProfile] =
    useState<UserPrivateProfile | null>(null);
  const [courierProfile, setCourierProfile] = useState<CourierProfile | null>(
    null,
  );

  // Public collections
  const [storefronts, setStorefronts] =
    useState<PublicStorefront[]>(SEED_STOREFRONTS);
  const [catalogItems, setCatalogItems] =
    useState<CatalogItem[]>(SEED_CATALOG_ITEMS);
  const [approvedOpportunities, setApprovedOpportunities] =
    useState<FaydOpportunity[]>(SEED_OPPORTUNITIES);
  const [ownOpportunities, setOwnOpportunities] = useState<FaydOpportunity[]>(
    [],
  );
  const [adminOpportunities, setAdminOpportunities] = useState<
    FaydOpportunity[]
  >([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(SEED_PLANS);
  const [commissionRule, setCommissionRule] = useState<CommissionRule>(
    DEFAULT_COMMISSION_RULE,
  );
  const [offersAds, setOffersAds] = useState<OfferAd[]>(SEED_OFFERS_ADS);
  const [benefits, setBenefits] = useState<EntertainmentBenefit[]>(
    SEED_ENTERTAINMENT_BENEFITS,
  );
  const [initiatives, setInitiatives] = useState<CharityInitiative[]>(
    SEED_CHARITY_INITIATIVES,
  );
  const [kaffarahRule, setKaffarahRule] = useState<KaffarahRule>(
    DEFAULT_KAFFARAH_RULE,
  );
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>(
    SEED_PAYMENT_GATEWAYS,
  );

  // User-scoped collections
  const [customerOrders, setCustomerOrders] = useState<CommercialOrder[]>([]);
  const [merchantOrders, setMerchantOrders] = useState<CommercialOrder[]>([]);
  const [ownedTenants, setOwnedTenants] = useState<TenantWorkspace[]>([]);
  const [courierDeliveries, setCourierDeliveries] = useState<DeliveryRequest[]>(
    [],
  );
  const [requestedDeliveries, setRequestedDeliveries] = useState<
    DeliveryRequest[]
  >([]);
  const [userVipOrders, setUserVipOrders] = useState<VipDirectOrder[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<
    PaymentTransaction[]
  >([]);
  const [userBenefitBookings, setUserBenefitBookings] = useState<
    BenefitBooking[]
  >([]);
  const [userCharityContribs, setUserCharityContribs] = useState<
    CharityContribution[]
  >([]);
  const [userKaffarahOrders, setUserKaffarahOrders] = useState<KaffarahOrder[]>(
    [],
  );
  const [userLogisticsInquiries, setUserLogisticsInquiries] = useState<
    LogisticsServiceInquiry[]
  >([]);

  const [proposerProposals, setProposerProposals] = useState<UsufructProposal[]>(
    [],
  );
  const [ownerProposals, setOwnerProposals] = useState<UsufructProposal[]>([]);
  const [adminProposals, setAdminProposals] = useState<UsufructProposal[]>([]);
  const [proposerContracts, setProposerContracts] = useState<
    UsufructContract[]
  >([]);
  const [ownerContracts, setOwnerContracts] = useState<UsufructContract[]>([]);
  const [adminContracts, setAdminContracts] = useState<UsufructContract[]>([]);

  // Admin & Bootstrapped Owner collections
  const [adminApps, setAdminApps] = useState<OnboardingApplication[]>([]);
  const [adminDeliveries, setAdminDeliveries] = useState<DeliveryRequest[]>([]);
  const [adminCouriers, setAdminCouriers] = useState<CourierProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [adminVipOrders, setAdminVipOrders] = useState<VipDirectOrder[]>([]);
  const [adminBenefitBookings, setAdminBenefitBookings] = useState<
    BenefitBooking[]
  >([]);
  const [adminCharityContribs, setAdminCharityContribs] = useState<
    CharityContribution[]
  >([]);
  const [adminKaffarahOrders, setAdminKaffarahOrders] = useState<
    KaffarahOrder[]
  >([]);
  const [adminLogisticsInquiries, setAdminLogisticsInquiries] = useState<
    LogisticsServiceInquiry[]
  >([]);
  const [ownerAccounts, setOwnerAccounts] =
    useState<OwnerFinancialAccount[]>(SEED_OWNER_ACCOUNTS);
  const [ownerEntries, setOwnerEntries] = useState<OwnerFinancialEntry[]>([]);

  const [qrModal, setQrModal] = useState<{
    title: string;
    subtitle: string;
    payload: string;
  } | null>(null);

  const isAdmin =
    Boolean(authUser?.emailVerified) &&
    (isBootstrappedAdminEmail(authUser?.email) ||
      userProfile?.role === 'central_super_admin');

  const isBootAdmin =
    Boolean(authUser?.emailVerified) &&
    isBootstrappedAdminEmail(authUser?.email);

  useEffect(() => {
    void testConnection();
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (user && user.emailVerified && user.email) {
        try {
          await ensureUserProfileAndVault({
            uid: user.uid,
            displayName: user.displayName || user.email.split('@')[0],
            email: user.email,
          });
        } catch (err) {
          console.error(err);
        }
      } else {
        setUserProfile(null);
        setPrivateProfile(null);
        setCourierProfile(null);
        setCustomerOrders([]);
        setMerchantOrders([]);
        setOwnedTenants([]);
        setCourierDeliveries([]);
        setRequestedDeliveries([]);
        setUserVipOrders([]);
        setPaymentTransactions([]);
        setUserBenefitBookings([]);
        setUserCharityContribs([]);
        setUserKaffarahOrders([]);
        setUserLogisticsInquiries([]);
        setOwnOpportunities([]);
        setAdminOpportunities([]);
        setProposerProposals([]);
        setOwnerProposals([]);
        setAdminProposals([]);
        setProposerContracts([]);
        setOwnerContracts([]);
        setAdminContracts([]);
        setAdminApps([]);
        setAdminDeliveries([]);
        setAdminCouriers([]);
        setAuditLogs([]);
        setAdminVipOrders([]);
        setAdminBenefitBookings([]);
        setAdminCharityContribs([]);
        setAdminKaffarahOrders([]);
        setAdminLogisticsInquiries([]);
        setOwnerAccounts(SEED_OWNER_ACCOUNTS);
        setOwnerEntries([]);
      }
    });
    return () => unsub();
  }, []);

  // Public Firestore listeners (strictly filtered to active/approved public collections)
  useEffect(() => {
    if (!authReady) return;
    const unsubs: Unsubscribe[] = [];

    unsubs.push(
      onSnapshot(
        query(collection(db, 'public_storefronts'), where('isActive', '==', true)),
        (snap) => {
          if (!snap.empty) {
            setStorefronts(snap.docs.map((d) => d.data() as PublicStorefront));
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'public_storefronts'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'catalog_items'), where('isAvailable', '==', true)),
        (snap) => {
          if (!snap.empty) {
            setCatalogItems(snap.docs.map((d) => d.data() as CatalogItem));
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'catalog_items'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'opportunities'),
          where('approvalStatus', '==', 'approved'),
        ),
        (snap) => {
          if (!snap.empty) {
            setApprovedOpportunities(
              snap.docs.map((d) => d.data() as FaydOpportunity),
            );
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'opportunities'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'subscription_plans'),
          where('isActive', '==', true),
        ),
        (snap) => {
          if (!snap.empty) {
            setPlans(snap.docs.map((d) => d.data() as SubscriptionPlan));
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'subscription_plans'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'offers_ads'),
          where('isApproved', '==', true),
          where('isActive', '==', true),
        ),
        (snap) => {
          if (!snap.empty) {
            setOffersAds(snap.docs.map((d) => d.data() as OfferAd));
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'offers_ads'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'entertainment_benefits'),
          where('isApproved', '==', true),
          where('isActive', '==', true),
        ),
        (snap) => {
          if (!snap.empty) {
            setBenefits(snap.docs.map((d) => d.data() as EntertainmentBenefit));
          }
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, 'entertainment_benefits'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'charity_initiatives'),
          where('isApproved', '==', true),
          where('isActive', '==', true),
        ),
        (snap) => {
          if (!snap.empty) {
            setInitiatives(snap.docs.map((d) => d.data() as CharityInitiative));
          }
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, 'charity_initiatives'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'payment_gateway_configs'),
          where('isEnabled', '==', true),
        ),
        (snap) => {
          if (!snap.empty) {
            setGateways(snap.docs.map((d) => d.data() as PaymentGatewayConfig));
          }
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, 'payment_gateway_configs'),
      ),
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'kaffarah_rules', 'official'),
        (snap) => {
          if (snap.exists()) setKaffarahRule(snap.data() as KaffarahRule);
        },
        (err) =>
          handleFirestoreError(err, OperationType.GET, 'kaffarah_rules/official'),
      ),
    );

    return () => unsubs.forEach((u) => u());
  }, [authReady]);

  // Authenticated User-Scoped Firestore Listeners
  useEffect(() => {
    if (!authReady || !authUser || !authUser.emailVerified) return;
    const uid = authUser.uid;
    const unsubs: Unsubscribe[] = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) setUserProfile(snap.data() as UserProfile);
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`),
      ),
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'private_profile', 'main'),
        (snap) => {
          if (snap.exists())
            setPrivateProfile(snap.data() as UserPrivateProfile);
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.GET,
            `users/${uid}/private_profile/main`,
          ),
      ),
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'couriers', uid),
        (snap) => {
          setCourierProfile(snap.exists() ? (snap.data() as CourierProfile) : null);
        },
        (err) => handleFirestoreError(err, OperationType.GET, `couriers/${uid}`),
      ),
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'commission_rules', 'global'),
        (snap) => {
          if (snap.exists()) setCommissionRule(snap.data() as CommissionRule);
        },
        (err) =>
          handleFirestoreError(err, OperationType.GET, 'commission_rules/global'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'tenants'), where('ownerUid', '==', uid)),
        (snap) => {
          setOwnedTenants(snap.docs.map((d) => d.data() as TenantWorkspace));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'tenants'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'commercial_orders'), where('customerUid', '==', uid)),
        (snap) => {
          setCustomerOrders(snap.docs.map((d) => d.data() as CommercialOrder));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'commercial_orders'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'commercial_orders'),
          where('merchantOwnerUid', '==', uid),
        ),
        (snap) => {
          setMerchantOrders(snap.docs.map((d) => d.data() as CommercialOrder));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'commercial_orders'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'vip_direct_orders'), where('customerUid', '==', uid)),
        (snap) => {
          setUserVipOrders(snap.docs.map((d) => d.data() as VipDirectOrder));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'vip_direct_orders'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'payment_transactions'), where('payerUid', '==', uid)),
        (snap) => {
          setPaymentTransactions(
            snap.docs.map((d) => d.data() as PaymentTransaction),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, 'payment_transactions'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'benefit_bookings'), where('uid', '==', uid)),
        (snap) => {
          setUserBenefitBookings(snap.docs.map((d) => d.data() as BenefitBooking));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'benefit_bookings'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'charity_contributions'),
          where('contributorUid', '==', uid),
        ),
        (snap) => {
          setUserCharityContribs(
            snap.docs.map((d) => d.data() as CharityContribution),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, 'charity_contributions'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'kaffarah_orders'), where('requesterUid', '==', uid)),
        (snap) => {
          setUserKaffarahOrders(snap.docs.map((d) => d.data() as KaffarahOrder));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'kaffarah_orders'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'logistics_service_inquiries'),
          where('requesterUid', '==', uid),
        ),
        (snap) => {
          setUserLogisticsInquiries(
            snap.docs.map((d) => d.data() as LogisticsServiceInquiry),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            'logistics_service_inquiries',
          ),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'delivery_requests'),
          where('assignedCourierUid', '==', uid),
        ),
        (snap) => {
          setCourierDeliveries(snap.docs.map((d) => d.data() as DeliveryRequest));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'delivery_requests'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'delivery_requests'),
          where('requesterUid', '==', uid),
        ),
        (snap) => {
          setRequestedDeliveries(
            snap.docs.map((d) => d.data() as DeliveryRequest),
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'delivery_requests'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'usufruct_proposals'), where('proposerUid', '==', uid)),
        (snap) => {
          setProposerProposals(
            snap.docs.map((d) => d.data() as UsufructProposal),
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'usufruct_proposals'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'usufruct_proposals'),
          where('opportunityOwnerUid', '==', uid),
        ),
        (snap) => {
          setOwnerProposals(snap.docs.map((d) => d.data() as UsufructProposal));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'usufruct_proposals'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'opportunities'), where('ownerUid', '==', uid)),
        (snap) => {
          setOwnOpportunities(snap.docs.map((d) => d.data() as FaydOpportunity));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'opportunities'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'usufruct_contracts'), where('proposerUid', '==', uid)),
        (snap) => {
          setProposerContracts(
            snap.docs.map((d) => d.data() as UsufructContract),
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'usufruct_contracts'),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'usufruct_contracts'),
          where('opportunityOwnerUid', '==', uid),
        ),
        (snap) => {
          setOwnerContracts(snap.docs.map((d) => d.data() as UsufructContract));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'usufruct_contracts'),
      ),
    );

    return () => unsubs.forEach((u) => u());
  }, [authReady, authUser]);

  // Bootstrapped Admin Collection Listeners
  useEffect(() => {
    if (!authReady || !isBootAdmin) return;
    const unsubs: Unsubscribe[] = [];

    unsubs.push(
      onSnapshot(
        collection(db, 'onboarding_applications'),
        (snap) => {
          setAdminApps(snap.docs.map((d) => d.data() as OnboardingApplication));
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, 'onboarding_applications'),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'opportunities'),
        (snap) => {
          setAdminOpportunities(snap.docs.map((d) => d.data() as FaydOpportunity));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'opportunities'),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'usufruct_proposals'),
        (snap) => {
          setAdminProposals(snap.docs.map((d) => d.data() as UsufructProposal));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'usufruct_proposals'),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'usufruct_contracts'),
        (snap) => {
          setAdminContracts(snap.docs.map((d) => d.data() as UsufructContract));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'usufruct_contracts'),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'delivery_requests'),
        (snap) => {
          setAdminDeliveries(snap.docs.map((d) => d.data() as DeliveryRequest));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'delivery_requests'),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'couriers'),
        (snap) => {
          setAdminCouriers(snap.docs.map((d) => d.data() as CourierProfile));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'couriers'),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'audit_logs'),
        (snap) => {
          setAuditLogs(snap.docs.map((d) => d.data() as SecurityAuditLog));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs'),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'vip_direct_orders'),
        (snap) => {
          setAdminVipOrders(snap.docs.map((d) => d.data() as VipDirectOrder));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'vip_direct_orders'),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'benefit_bookings'),
        (snap) => {
          setAdminBenefitBookings(snap.docs.map((d) => d.data() as BenefitBooking));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'benefit_bookings'),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'charity_contributions'),
        (snap) => {
          setAdminCharityContribs(
            snap.docs.map((d) => d.data() as CharityContribution),
          );
        },
        (err) =>
          handleFirestoreError(err, OperationType.LIST, 'charity_contributions'),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'kaffarah_orders'),
        (snap) => {
          setAdminKaffarahOrders(snap.docs.map((d) => d.data() as KaffarahOrder));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'kaffarah_orders'),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'logistics_service_inquiries'),
        (snap) => {
          setAdminLogisticsInquiries(
            snap.docs.map((d) => d.data() as LogisticsServiceInquiry),
          );
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            'logistics_service_inquiries',
          ),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'owner_financial_accounts'),
        (snap) => {
          if (!snap.empty) {
            setOwnerAccounts(
              snap.docs.map((d) => d.data() as OwnerFinancialAccount),
            );
          }
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            'owner_financial_accounts',
          ),
      ),
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'owner_financial_entries'),
        (snap) => {
          setOwnerEntries(snap.docs.map((d) => d.data() as OwnerFinancialEntry));
        },
        (err) =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            'owner_financial_entries',
          ),
      ),
    );

    return () => unsubs.forEach((u) => u());
  }, [authReady, isBootAdmin]);

  const handleSignIn = async () => {
    setAuthNotice(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthNotice(
        err instanceof Error
          ? err.message
          : 'تعذر إتمام تسجيل الدخول عبر Google.',
      );
    }
  };

  const opportunities = [
    ...adminOpportunities,
    ...ownOpportunities,
    ...approvedOpportunities,
  ].filter(
    (o, idx, arr) => arr.findIndex((x) => x.oppId === o.oppId) === idx,
  );

  const mergedProposals = [
    ...adminProposals,
    ...proposerProposals,
    ...ownerProposals,
  ].filter(
    (p, idx, arr) => arr.findIndex((x) => x.proposalId === p.proposalId) === idx,
  );

  const contracts = [
    ...adminContracts,
    ...proposerContracts,
    ...ownerContracts,
  ].filter(
    (c, idx, arr) => arr.findIndex((x) => x.contractId === c.contractId) === idx,
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FC] text-slate-900 pb-20 md:pb-8">
      {/* Compact Sticky Top Bar (48px on mobile <= 15% cap, 3-zone contract on desktop) */}
      <header className="sticky top-0 z-30 h-12 md:h-14 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-6">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('market');
            }}
            className="text-base md:text-lg font-bold tracking-tight text-[#4F2487] whitespace-nowrap shrink-0"
          >
            BASIT | باسط
          </a>

          <nav
            aria-label="الأقسام الرئيسية"
            className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600"
          >
            {TABS.map(({ id, label }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-[#4F2487] underline underline-offset-8 decoration-2'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            {authUser ? (
              <button
                type="button"
                onClick={() => setActiveTab('governance')}
                className="min-h-[38px] md:min-h-[40px] px-3 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0 truncate max-w-[140px]"
              >
                {userProfile?.displayName || authUser.displayName || 'حسابي'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="min-h-[38px] md:min-h-[40px] px-3.5 inline-flex items-center gap-1.5 rounded-xl bg-[#4F2487] text-white text-xs font-semibold hover:bg-[#3f1c6d] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                دخول Google
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Responsive Viewport */}
      <main id="top" className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
        {authNotice && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700"
          >
            {authNotice}
          </div>
        )}

        {activeTab === 'market' && (
          <MarketplaceTab
            uid={authUser?.uid ?? null}
            userProfile={userProfile}
            defaultPhone={privateProfile?.phone}
            storefronts={storefronts}
            catalogItems={catalogItems}
            plans={plans}
            commissionRule={commissionRule}
            offersAds={offersAds}
            benefits={benefits}
            initiatives={initiatives}
            kaffarahRule={kaffarahRule}
            onRequireAuth={handleSignIn}
            onShowQr={(title, subtitle, payload) =>
              setQrModal({ title, subtitle, payload })
            }
            onNavigateTab={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'habe' && (
          <HabePortalTab
            uid={authUser?.uid ?? null}
            userProfile={userProfile}
            defaultPhone={privateProfile?.phone}
            gateways={gateways}
            onRequireAuth={handleSignIn}
            onShowQr={(title, subtitle, payload) =>
              setQrModal({ title, subtitle, payload })
            }
          />
        )}

        {activeTab === 'ops' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-2 inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOpsSubTab('delivery')}
                className={`min-h-[40px] px-4 inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  opsSubTab === 'delivery'
                    ? 'bg-[#4F2487] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-4 h-4" />
                شبكة التوصيل والسعاة
              </button>
              <button
                type="button"
                onClick={() => setOpsSubTab('opportunities')}
                className={`min-h-[40px] px-4 inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  opsSubTab === 'opportunities'
                    ? 'bg-[#4F2487] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                فرص فيض وعقود الانتفاع
              </button>
            </div>

            {opsSubTab === 'delivery' ? (
              <DeliveryTab
                uid={authUser?.uid ?? null}
                courierProfile={courierProfile}
                myDeliveries={courierDeliveries}
                requestedDeliveries={requestedDeliveries}
                ownedTenants={ownedTenants}
                commissionRule={commissionRule}
                onRequireAuth={handleSignIn}
              />
            ) : (
              <OpportunitiesTab
                uid={authUser?.uid ?? null}
                userProfile={userProfile}
                opportunities={opportunities}
                proposals={mergedProposals}
                contracts={contracts}
                commissionRule={commissionRule}
                onRequireAuth={handleSignIn}
                onShowQr={(title, subtitle, payload) =>
                  setQrModal({ title, subtitle, payload })
                }
              />
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <WorkspaceOrdersTab
            uid={authUser?.uid ?? null}
            customerOrders={customerOrders}
            merchantOrders={merchantOrders}
            ownedTenants={ownedTenants}
            catalogItems={catalogItems}
            vipOrders={userVipOrders}
            paymentTransactions={paymentTransactions}
            benefitBookings={userBenefitBookings}
            charityContributions={userCharityContribs}
            kaffarahOrders={userKaffarahOrders}
            logisticsInquiries={userLogisticsInquiries}
            onRequireAuth={handleSignIn}
            onShowQr={(title, subtitle, payload) =>
              setQrModal({ title, subtitle, payload })
            }
          />
        )}

        {activeTab === 'governance' && (
          <GovernanceSecurityTab
            authUser={authUser}
            userProfile={userProfile}
            privateProfile={privateProfile}
            isAdmin={isAdmin}
            isBootAdmin={isBootAdmin}
            applications={adminApps}
            opportunities={opportunities}
            proposals={mergedProposals}
            deliveries={adminDeliveries}
            couriers={adminCouriers}
            plans={plans}
            commissionRule={commissionRule}
            auditLogs={auditLogs}
            vipOrders={adminVipOrders}
            benefitBookings={adminBenefitBookings}
            charityContributions={adminCharityContribs}
            kaffarahOrders={adminKaffarahOrders}
            logisticsInquiries={adminLogisticsInquiries}
            ownerAccounts={ownerAccounts}
            ownerEntries={ownerEntries}
            onSignIn={handleSignIn}
            onSignOut={signOutAccount}
          />
        )}
      </main>

      {/* Fixed Mobile Bottom Navigation Bar (Thumb Zone, 56px height) */}
      <nav
        aria-label="شريط التنقل السفلي"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-5 h-14 items-center">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  active ? 'text-[#4F2487] font-bold' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] leading-none whitespace-nowrap">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <OfflineIndicator />

      {qrModal && (
        <QrBadgeModal
          title={qrModal.title}
          subtitle={qrModal.subtitle}
          payload={qrModal.payload}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  );
}

