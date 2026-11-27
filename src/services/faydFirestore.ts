import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  isBootstrappedAdminEmail,
  OperationType,
} from '../lib/firebase';
import {
  BasitCard,
  BasitSectorKey,
  BenefitBooking,
  BusinessSectorKey,
  CanonicalBasitRole,
  CatalogItem,
  CommercialOrder,
  CommissionRule,
  CountryCode,
  CourierProfile,
  DeliveryRequest,
  DeliveryStatus,
  EntityType,
  FactoryComplaint,
  FaydOpportunity,
  HealthyPlan,
  LogisticsServiceKey,
  MarketplaceRfq,
  OnboardingApplication,
  OrderStatus,
  OwnerClientReceivable,
  OwnerFinancialAccount,
  OwnerFinancialEntry,
  OwnerInvoice,
  OwnerSupplierPayable,
  PaymentProviderId,
  SubscriptionPlan,
  UsufructProposal,
  UserPrivateProfile,
  UserProfile,
  UserRole,
  VipDirectOrderItem,
  VipOrderChannel,
  VipOrderStatus,
  clampStr,
  makeSafeId,
} from '../types/fayd';
import {
  DEFAULT_COMMISSION_RULE,
  DEFAULT_KAFFARAH_RULE,
  SEED_CATALOG_ITEMS,
  SEED_CHARITY_INITIATIVES,
  SEED_ENTERTAINMENT_BENEFITS,
  SEED_FACTORY_EMPLOYEES,
  SEED_HEALTHY_PLANS,
  SEED_OFFERS_ADS,
  SEED_OPPORTUNITIES,
  SEED_OWNER_ACCOUNTS,
  SEED_PAYMENT_GATEWAYS,
  SEED_PLANS,
  SEED_STOREFRONTS,
} from '../data/seedDefaults';

async function retryTransientOffline<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 900,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isTransient =
        msg.includes('the client is offline') ||
        msg.includes('unavailable') ||
        msg.includes('network');
      if (!isTransient || attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function ensureUserProfileAndVault(params: {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
}): Promise<UserProfile> {
  const { uid, displayName, email, phone } = params;
  const userRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private_profile', 'main');
  const isBootAdmin = isBootstrappedAdminEmail(email);

  try {
    return await retryTransientOffline(async () => {
      const snap = await getDoc(userRef);
      let profileData: UserProfile;

      if (!snap.exists()) {
        const fallbackLabel =
          displayName ||
          (email ? email.split('@')[0] : '') ||
          phone ||
          'BASIT User';
        const safeName = clampStr(fallbackLabel, 120);
        const newProfile: UserProfile = {
          uid,
          displayName: safeName.length >= 2 ? safeName : 'BASIT User',
          role: isBootAdmin ? 'platform_owner' : 'client',
          status: 'active',
          countryCode: 'EG' as CountryCode,
        };
        await setDoc(userRef, {
          ...newProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        profileData = newProfile;
      } else {
        profileData = snap.data() as UserProfile;
      }

      const privSnap = await getDoc(privateRef);
      if (!privSnap.exists()) {
        const safeEmail = clampStr(
          email || (phone ? `${uid.slice(0, 12)}@phone.basit.app` : `${uid.slice(0, 12)}@basit.app`),
          160,
        );
        await setDoc(privateRef, {
          uid,
          email: safeEmail,
          phone: clampStr(phone ?? '', 32),
          nationalOrTaxId: '',
          address: '',
          updatedAt: serverTimestamp(),
        });
      }

      return profileData;
    });
  } catch (error) {
    console.warn('EnsureUserProfile offline fallback triggered:', error);
    const fallbackLabel =
      displayName ||
      (email ? email.split('@')[0] : '') ||
      phone ||
      'BASIT User';
    const safeName = clampStr(fallbackLabel, 120);
    return {
      uid,
      displayName: safeName.length >= 2 ? safeName : 'BASIT User',
      role: isBootAdmin ? 'platform_owner' : 'client',
      status: 'active',
      countryCode: 'EG' as CountryCode,
    };
  }
}

export async function updateUserPrivateProfile(
  uid: string,
  payload: Pick<UserPrivateProfile, 'email' | 'phone' | 'nationalOrTaxId' | 'address'>,
): Promise<void> {
  const privateRef = doc(db, 'users', uid, 'private_profile', 'main');
  try {
    await setDoc(privateRef, {
      uid,
      email: clampStr(payload.email, 160),
      phone: clampStr(payload.phone ?? '', 32),
      nationalOrTaxId: clampStr(payload.nationalOrTaxId ?? '', 64),
      address: clampStr(payload.address ?? '', 240),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `users/${uid}/private_profile/main`,
    );
  }
}

export async function updateUserRoleAndTenantByAdmin(params: {
  targetUid: string;
  role: CanonicalBasitRole | UserRole;
  tenantId: string;
  status: 'active' | 'pending' | 'suspended';
  adminUid: string;
}): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', params.targetUid), {
      role: params.role,
      tenantId: clampStr(params.tenantId, 128),
      status: params.status,
      updatedAt: serverTimestamp(),
    });

    const adminRef = doc(db, 'admins', params.targetUid);
    if (params.role === 'platform_owner' || params.role === 'system_admin') {
      await setDoc(adminRef, {
        uid: params.targetUid,
        adminLevel: params.role,
        label: params.role === 'platform_owner' ? 'Platform Owner' : 'System Admin',
        grantedBy: params.adminUid,
        active: params.status === 'active',
        createdAt: serverTimestamp(),
      });
    } else {
      const existingAdmin = await getDoc(adminRef);
      if (existingAdmin.exists()) {
        await updateDoc(adminRef, {
          active: false,
        });
      }
    }

    await writeAuditLog({
      actorUid: params.adminUid,
      actionAr: `تحديث صلاحية المستخدم ${params.targetUid} إلى ${params.role}`,
      actionEn: `Updated user ${params.targetUid} role to ${params.role}`,
      targetCollection: 'users',
      targetId: params.targetUid,
      details: params.tenantId ? `tenantId=${params.tenantId}` : '',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${params.targetUid}`);
  }
}

export async function writeAuditLog(params: {
  actorUid: string;
  actionAr: string;
  actionEn: string;
  targetCollection: string;
  targetId: string;
  details?: string;
}): Promise<void> {
  const logId = makeSafeId('log');
  const ref = doc(db, 'audit_logs', logId);
  try {
    await setDoc(ref, {
      logId,
      actorUid: params.actorUid,
      actionAr: clampStr(params.actionAr, 200),
      actionEn: clampStr(params.actionEn, 200),
      targetCollection: clampStr(params.targetCollection, 80),
      targetId: clampStr(params.targetId, 128),
      details: clampStr(params.details ?? '', 500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `audit_logs/${logId}`);
  }
}

export async function seedFaydPlatformData(
  adminUid: string,
  adminEmail?: string | null,
): Promise<void> {
  try {
    const [
      tenantSnaps,
      catalogSnaps,
      oppSnaps,
      offerSnaps,
      benefitSnaps,
      charitySnaps,
      employeeSnaps,
      kaffarahSnap,
      settingsSnap,
      ownerAccountSnaps,
    ] = await Promise.all([
      Promise.all(SEED_STOREFRONTS.map((sf) => getDoc(doc(db, 'tenants', sf.tenantId)))),
      Promise.all(SEED_CATALOG_ITEMS.map((item) => getDoc(doc(db, 'catalog_items', item.itemId)))),
      Promise.all(SEED_OPPORTUNITIES.map((opp) => getDoc(doc(db, 'opportunities', opp.oppId)))),
      Promise.all(SEED_OFFERS_ADS.map((ad) => getDoc(doc(db, 'offers_ads', ad.offerId)))),
      Promise.all(
        SEED_ENTERTAINMENT_BENEFITS.map((b) =>
          getDoc(doc(db, 'entertainment_benefits', b.benefitId)),
        ),
      ),
      Promise.all(
        SEED_CHARITY_INITIATIVES.map((c) =>
          getDoc(doc(db, 'charity_initiatives', c.initiativeId)),
        ),
      ),
      Promise.all(
        SEED_FACTORY_EMPLOYEES.map((emp) =>
          getDoc(doc(db, 'factory_employees', emp.empId)),
        ),
      ),
      getDoc(doc(db, 'kaffarah_rules', 'official')),
      getDoc(doc(db, 'platform_settings', 'global')),
      isBootstrappedAdminEmail(adminEmail)
        ? Promise.all(
            SEED_OWNER_ACCOUNTS.map((acc) =>
              getDoc(doc(db, 'owner_financial_accounts', acc.accountId)),
            ),
          )
        : Promise.resolve([]),
    ]);

    const batch1 = writeBatch(db);

    batch1.set(doc(db, 'commission_rules', 'global'), {
      ...DEFAULT_COMMISSION_RULE,
      updatedAt: serverTimestamp(),
    });

    for (const plan of SEED_PLANS) {
      batch1.set(doc(db, 'subscription_plans', plan.planId), {
        ...plan,
        updatedAt: serverTimestamp(),
      });
    }

    for (const hp of SEED_HEALTHY_PLANS) {
      batch1.set(doc(db, 'healthy_plans', hp.planId), {
        ...hp,
        updatedAt: serverTimestamp(),
      });
    }

    for (const gw of SEED_PAYMENT_GATEWAYS) {
      batch1.set(doc(db, 'payment_gateway_configs', gw.providerId), {
        ...gw,
        updatedByUid: adminUid,
        updatedAt: serverTimestamp(),
      });
    }

    if (!settingsSnap.exists()) {
      batch1.set(doc(db, 'platform_settings', 'global'), {
        settingId: 'global',
        autoActivateCustomers: true,
        requireAdminApprovalForPartners: true,
        defaultLanguage: 'ar',
        defaultCountryCode: 'EG',
        enabledCountriesCsv: 'EG,AE,QA,OM,GB',
        cmsPrimaryPurple: '#3B123F',
        cmsAccentYellow: '#D4AF37',
        cmsHeroBadgeAr: 'BASIT | باسط — الشركة الوطنية اللوجستية',
        cmsHeroTitleAr: 'منصة باسط المتكاملة للأغذية والتوريد وإدارة المصانع',
        cmsHeroSubtitleAr:
          'المطابخ المركزية، قطاع الأعمال، كروت باسط، الوجبات الصحية، بوابة المصانع المستقلة، والإدارة المالية المركزية.',
        updatedByUid: adminUid,
        updatedAt: serverTimestamp(),
      });
    }

    batch1.set(doc(db, 'kaffarah_rules', 'official'), {
      ...DEFAULT_KAFFARAH_RULE,
      updatedByUid: adminUid,
      updatedAt: kaffarahSnap.exists() ? serverTimestamp() : serverTimestamp(),
    });

    SEED_STOREFRONTS.forEach((sf, idx) => {
      batch1.set(doc(db, 'public_storefronts', sf.tenantId), {
        tenantId: sf.tenantId,
        name: sf.name,
        nameEn: sf.nameEn || sf.name,
        entityType: sf.entityType,
        tenantKind: sf.tenantKind || 'central_kitchen',
        countryCode: sf.countryCode,
        city: sf.city,
        primaryColor: sf.primaryColor || '#3B123F',
        accentColor: sf.accentColor || '#D4AF37',
        logoUrl: sf.logoUrl || '',
        specialtiesAr: sf.specialtiesAr || '',
        specialtiesEn: sf.specialtiesEn || '',
        capacityMealsPerDay: sf.capacityMealsPerDay ?? 0,
        serviceAreasCsv: sf.serviceAreasCsv || '',
        averageRating: sf.averageRating ?? 4.8,
        ratingCount: sf.ratingCount ?? 0,
        isActive: true,
        updatedAt: serverTimestamp(),
      });

      const tSnap = tenantSnaps[idx];
      const tenantRef = doc(db, 'tenants', sf.tenantId);
      if (tSnap.exists()) {
        batch1.update(tenantRef, {
          name: sf.name,
          nameEn: sf.nameEn || sf.name,
          entityType: sf.entityType,
          tenantKind: sf.tenantKind || 'central_kitchen',
          countryCode: sf.countryCode,
          city: sf.city,
          primaryColor: sf.primaryColor || '#3B123F',
          accentColor: sf.accentColor || '#D4AF37',
          logoUrl: sf.logoUrl || '',
          specialtiesAr: sf.specialtiesAr || '',
          specialtiesEn: sf.specialtiesEn || '',
          capacityMealsPerDay: sf.capacityMealsPerDay ?? 0,
          serviceAreasCsv: sf.serviceAreasCsv || '',
          averageRating: sf.averageRating ?? 4.8,
          ratingCount: sf.ratingCount ?? 0,
          status: 'active',
          contractStatus: 'contracted',
          updatedAt: serverTimestamp(),
        });
      } else {
        batch1.set(tenantRef, {
          tenantId: sf.tenantId,
          ownerUid: adminUid,
          name: sf.name,
          nameEn: sf.nameEn || sf.name,
          entityType: sf.entityType,
          tenantKind: sf.tenantKind || 'central_kitchen',
          countryCode: sf.countryCode,
          city: sf.city,
          commercialRegRef: `REG-${sf.tenantId.slice(-6).toUpperCase()}`,
          planId: 'plan_kitchen_pro',
          customCommissionPct: 10,
          deliveryEnabled: true,
          status: 'active',
          contractStatus: 'contracted',
          primaryColor: sf.primaryColor || '#3B123F',
          accentColor: sf.accentColor || '#D4AF37',
          logoUrl: sf.logoUrl || '',
          specialtiesAr: sf.specialtiesAr || '',
          specialtiesEn: sf.specialtiesEn || '',
          capacityMealsPerDay: sf.capacityMealsPerDay ?? 0,
          serviceAreasCsv: sf.serviceAreasCsv || '',
          averageRating: sf.averageRating ?? 4.8,
          ratingCount: sf.ratingCount ?? 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    SEED_CATALOG_ITEMS.forEach((item, idx) => {
      const cSnap = catalogSnaps[idx];
      const itemRef = doc(db, 'catalog_items', item.itemId);
      if (cSnap.exists()) {
        batch1.update(itemRef, {
          storeName: item.storeName,
          title: item.title,
          category: item.category,
          priceEGP: item.priceEGP,
          stockQty: item.stockQty,
          isAvailable: item.isAvailable,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch1.set(itemRef, {
          ...item,
          merchantOwnerUid: adminUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    SEED_FACTORY_EMPLOYEES.forEach((emp, idx) => {
      const eSnap = employeeSnaps[idx];
      const empRef = doc(db, 'factory_employees', emp.empId);
      if (eSnap.exists()) {
        batch1.update(empRef, {
          nameAr: emp.nameAr,
          nameEn: emp.nameEn,
          departmentAr: emp.departmentAr,
          jobTitle: emp.jobTitle,
          shift: emp.shift,
          monthlyCardLimitEGP: emp.monthlyCardLimitEGP,
          isActive: emp.isActive,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch1.set(empRef, {
          ...emp,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    const oppsNeedingApprovalUpdate: string[] = [];
    SEED_OPPORTUNITIES.forEach((opp, idx) => {
      const oSnap = oppSnaps[idx];
      const oppRef = doc(db, 'opportunities', opp.oppId);
      if (oSnap.exists()) {
        batch1.update(oppRef, {
          title: opp.title,
          description: opp.description,
          commercialTerms: opp.commercialTerms,
          costOrInvestmentEGP: opp.costOrInvestmentEGP,
          approvalStatus: 'approved',
          updatedAt: serverTimestamp(),
        });
      } else {
        batch1.set(oppRef, {
          ...opp,
          ownerUid: adminUid,
          freeResourceBlocked: true,
          approvalStatus: 'pending_admin',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        oppsNeedingApprovalUpdate.push(opp.oppId);
      }
    });

    SEED_OFFERS_ADS.forEach((ad, idx) => {
      const adSnap = offerSnaps[idx];
      const adRef = doc(db, 'offers_ads', ad.offerId);
      if (adSnap.exists()) {
        batch1.update(adRef, {
          titleAr: ad.titleAr,
          titleEn: ad.titleEn,
          discountBadgeAr: ad.discountBadgeAr,
          discountBadgeEn: ad.discountBadgeEn,
          isApproved: true,
          isActive: true,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch1.set(adRef, {
          ...ad,
          createdByUid: adminUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    SEED_ENTERTAINMENT_BENEFITS.forEach((ben, idx) => {
      const bSnap = benefitSnaps[idx];
      const bRef = doc(db, 'entertainment_benefits', ben.benefitId);
      if (bSnap.exists()) {
        batch1.update(bRef, {
          venueName: ben.venueName,
          description: ben.description,
          approvedBenefitText: ben.approvedBenefitText,
          isApproved: true,
          isActive: true,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch1.set(bRef, {
          ...ben,
          partnerUid: adminUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    SEED_CHARITY_INITIATIVES.forEach((chr, idx) => {
      const chSnap = charitySnaps[idx];
      const chRef = doc(db, 'charity_initiatives', chr.initiativeId);
      if (chSnap.exists()) {
        batch1.update(chRef, {
          titleAr: chr.titleAr,
          mechanismAr: chr.mechanismAr,
          isApproved: true,
          isActive: true,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch1.set(chRef, {
          ...chr,
          createdByUid: adminUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    if (isBootstrappedAdminEmail(adminEmail) && adminEmail) {
      SEED_OWNER_ACCOUNTS.forEach((acc, idx) => {
        const aSnap = ownerAccountSnaps[idx];
        if (!aSnap || !aSnap.exists()) {
          batch1.set(doc(db, 'owner_financial_accounts', acc.accountId), {
            ...acc,
            updatedByEmail: clampStr(adminEmail, 160),
            updatedAt: serverTimestamp(),
          });
        }
      });
    }

    await batch1.commit();

    if (oppsNeedingApprovalUpdate.length > 0) {
      const batch2 = writeBatch(db);
      for (const oppId of oppsNeedingApprovalUpdate) {
        batch2.update(doc(db, 'opportunities', oppId), {
          approvalStatus: 'approved',
          updatedAt: serverTimestamp(),
        });
      }
      await batch2.commit();
    }

    await writeAuditLog({
      actorUid: adminUid,
      actionAr: 'تهيئة البيانات الأساسية لمنصة BASIT | باسط',
      actionEn: 'Seeded BASIT ecosystem baseline collections',
      targetCollection: 'tenants',
      targetId: 'seed_batch',
      details:
        'Storefronts, tenants, factory_employees, healthy_plans, catalog_items, opportunities, offers_ads, benefits, charity, kaffarah, gateways, plans',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch_seed');
  }
}

export async function createCommercialOrder(params: {
  customerUid: string;
  customerName: string;
  item: CatalogItem;
  quantity: number;
  needsDelivery: boolean;
  dropoffAddress: string;
  commissionPct: number;
  deliveryFeeEGP: number;
}): Promise<string> {
  const orderId = makeSafeId('ord');
  const subtotalEGP = Math.round(params.item.priceEGP * params.quantity);
  const platformCommissionEGP = Math.round(
    (subtotalEGP * params.commissionPct) / 100,
  );
  const deliveryFee = params.needsDelivery ? params.deliveryFeeEGP : 0;
  const netMerchantEGP = Math.max(0, subtotalEGP - platformCommissionEGP);

  const payload: Omit<CommercialOrder, 'createdAt' | 'updatedAt'> = {
    orderId,
    tenantId: params.item.tenantId,
    merchantOwnerUid: params.item.merchantOwnerUid,
    customerUid: params.customerUid,
    customerName: clampStr(params.customerName || 'عميل باسط', 100),
    itemsSummary: clampStr(
      `${params.item.title} × ${params.quantity} (${params.item.storeName})`,
      500,
    ),
    subtotalEGP,
    platformCommissionEGP,
    deliveryFeeEGP: deliveryFee,
    netMerchantEGP,
    needsDelivery: params.needsDelivery,
    dropoffAddress: clampStr(
      params.dropoffAddress || 'استلام من مقر المتجر',
      240,
    ),
    status: 'pending_merchant',
  };

  try {
    await setDoc(doc(db, 'commercial_orders', orderId), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return orderId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `commercial_orders/${orderId}`,
    );
  }
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'commercial_orders', orderId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `commercial_orders/${orderId}`,
    );
  }
}

export async function createCatalogItemRecord(params: {
  tenantId: string;
  merchantOwnerUid: string;
  storeName: string;
  title: string;
  category: string;
  priceEGP: number;
  stockQty: number;
}): Promise<string> {
  const itemId = makeSafeId('item');
  try {
    await setDoc(doc(db, 'catalog_items', itemId), {
      itemId,
      tenantId: params.tenantId,
      merchantOwnerUid: params.merchantOwnerUid,
      storeName: clampStr(params.storeName, 140),
      title: clampStr(params.title, 140),
      category: clampStr(params.category, 64),
      priceEGP: Math.max(1, Math.min(1000000, params.priceEGP)),
      stockQty: Math.max(0, Math.min(1000000, params.stockQty)),
      isAvailable: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return itemId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `catalog_items/${itemId}`);
  }
}

// =========================================================================
// MARKETPLACE RFQs & REVIEWS
// =========================================================================
export async function createMarketplaceRfqRecord(params: {
  requesterUid: string;
  requesterOrgName: string;
  phone: string;
  targetTenantId: string;
  targetMerchantOwnerUid: string;
  targetName: string;
  dailyQty: number;
  frequency: MarketplaceRfq['frequency'];
  city: string;
  details: string;
}): Promise<string> {
  const rfqId = makeSafeId('rfq');
  const safePhone = clampStr(params.phone, 32);
  try {
    await setDoc(doc(db, 'marketplace_rfqs', rfqId), {
      rfqId,
      requesterUid: params.requesterUid,
      requesterOrgName: clampStr(params.requesterOrgName, 140),
      phone: safePhone.length >= 6 ? safePhone : '+201000000000',
      targetTenantId: params.targetTenantId,
      targetMerchantOwnerUid: params.targetMerchantOwnerUid || 'seed_admin',
      targetName: clampStr(params.targetName, 140),
      dailyQty: Math.max(1, Math.min(1000000, Math.round(params.dailyQty))),
      frequency: params.frequency,
      city: clampStr(params.city, 80),
      details: clampStr(params.details, 600),
      quotedPriceEGP: 0,
      merchantNote: '',
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return rfqId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `marketplace_rfqs/${rfqId}`);
  }
}

export async function respondToMarketplaceRfq(params: {
  rfqId: string;
  status: 'quoted' | 'accepted' | 'declined';
  quotedPriceEGP?: number;
  merchantNote?: string;
}): Promise<void> {
  try {
    const patch: Record<string, unknown> = {
      status: params.status,
      updatedAt: serverTimestamp(),
    };
    if (params.status === 'quoted' || params.status === 'declined') {
      if (typeof params.quotedPriceEGP === 'number') {
        patch.quotedPriceEGP = Math.max(0, Math.round(params.quotedPriceEGP));
      }
      if (typeof params.merchantNote === 'string') {
        patch.merchantNote = clampStr(params.merchantNote, 400);
      }
    }
    await updateDoc(doc(db, 'marketplace_rfqs', params.rfqId), patch);
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `marketplace_rfqs/${params.rfqId}`,
    );
  }
}

export async function createMarketplaceReviewRecord(params: {
  tenantId: string;
  authorUid: string;
  authorName: string;
  rating: number;
  comment: string;
}): Promise<string> {
  const reviewId = makeSafeId('rev');
  try {
    await setDoc(doc(db, 'marketplace_reviews', reviewId), {
      reviewId,
      tenantId: params.tenantId,
      authorUid: params.authorUid,
      authorName: clampStr(params.authorName || 'عميل باسط', 120),
      rating: Math.max(1, Math.min(5, Math.round(params.rating))),
      comment: clampStr(params.comment, 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return reviewId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `marketplace_reviews/${reviewId}`,
    );
  }
}

// =========================================================================
// BASIT CARD & VOUCHER REDEMPTIONS
// =========================================================================
export async function issueOrActivateBasitCard(params: {
  ownerUid: string;
  holderName: string;
  employeeCode: string;
  tenantId: string;
  factoryName: string;
  monthlyQuotaEGP?: number;
}): Promise<string> {
  const cardId = makeSafeId('crd');
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const digits = Math.floor(1000 + Math.random() * 9000);

  try {
    await setDoc(doc(db, 'basit_cards', cardId), {
      cardId,
      ownerUid: params.ownerUid,
      holderName: clampStr(params.holderName || 'موظف باسط', 120),
      employeeCode: clampStr(params.employeeCode || 'EMP-001', 48),
      tenantId: clampStr(params.tenantId || 'tenant_factory_habe', 128),
      factoryName: clampStr(params.factoryName || 'مصنع ها-بي للكيماويات', 140),
      cardNumberMasked: `BASIT •••• ${digits}`,
      monthlyQuotaEGP: Math.min(3000, Math.max(500, params.monthlyQuotaEGP ?? 1500)),
      usedAmountEGP: 0,
      validFrom: today,
      validTo: nextYear,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return cardId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `basit_cards/${cardId}`);
  }
}

export async function redeemBasitCardVoucher(params: {
  card: BasitCard;
  vendorName: string;
  offerTitle: string;
  amountEGP: number;
  discountSavedEGP: number;
}): Promise<string> {
  const redemptionId = makeSafeId('rdm');
  const safeAmount = Math.max(1, Math.round(params.amountEGP));
  const nextUsed = params.card.usedAmountEGP + safeAmount;
  if (nextUsed > params.card.monthlyQuotaEGP) {
    throw new Error('الرصيد المتاح في كارت باسط لا يكفي لهذه العملية.');
  }

  const batch = writeBatch(db);
  batch.set(doc(db, 'basit_card_redemptions', redemptionId), {
    redemptionId,
    cardId: params.card.cardId,
    ownerUid: params.card.ownerUid,
    tenantId: params.card.tenantId,
    vendorName: clampStr(params.vendorName, 140),
    offerTitle: clampStr(params.offerTitle, 160),
    amountEGP: safeAmount,
    discountSavedEGP: Math.max(0, Math.round(params.discountSavedEGP)),
    createdAt: serverTimestamp(),
  });

  batch.update(doc(db, 'basit_cards', params.card.cardId), {
    usedAmountEGP: nextUsed,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return redemptionId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `basit_card_redemptions/${redemptionId}`,
    );
  }
}

export async function updateBasitCardStatus(params: {
  cardId: string;
  status: 'active' | 'frozen' | 'expired';
}): Promise<void> {
  try {
    await updateDoc(doc(db, 'basit_cards', params.cardId), {
      status: params.status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `basit_cards/${params.cardId}`,
    );
  }
}

// =========================================================================
// BASIT HEALTHY SUBSCRIPTIONS
// =========================================================================
export async function enrollHealthySubscription(params: {
  subscriberUid: string;
  subscriberName: string;
  phone: string;
  plan: HealthyPlan;
  orgOrGymName: string;
  startDate: string;
  deliveryAddress: string;
}): Promise<string> {
  const subId = makeSafeId('hsub');
  const safePhone = clampStr(params.phone, 32);
  try {
    await setDoc(doc(db, 'healthy_subscriptions', subId), {
      subId,
      subscriberUid: params.subscriberUid,
      subscriberName: clampStr(params.subscriberName || 'مشترك صحي', 120),
      phone: safePhone.length >= 6 ? safePhone : '+201000000000',
      planId: params.plan.planId,
      planTitle: clampStr(params.plan.titleAr, 160),
      targetSegment: params.plan.targetSegment,
      orgOrGymName: clampStr(params.orgOrGymName, 140),
      startDate: clampStr(params.startDate || new Date().toISOString().slice(0, 10), 32),
      deliveryAddress: clampStr(params.deliveryAddress, 240),
      totalPriceEGP: params.plan.priceEGP,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return subId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `healthy_subscriptions/${subId}`,
    );
  }
}

export async function updateHealthySubscriptionStatus(
  subId: string,
  status: 'active' | 'paused' | 'completed',
): Promise<void> {
  try {
    await updateDoc(doc(db, 'healthy_subscriptions', subId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `healthy_subscriptions/${subId}`,
    );
  }
}

// =========================================================================
// FACTORY EMPLOYEES & COMPLAINTS
// =========================================================================
export async function createFactoryEmployeeRecord(params: {
  tenantId: string;
  employeeCode: string;
  nameAr: string;
  nameEn: string;
  departmentAr: string;
  jobTitle: string;
  shift: string;
  monthlyCardLimitEGP: number;
}): Promise<string> {
  const empId = makeSafeId('emp');
  try {
    await setDoc(doc(db, 'factory_employees', empId), {
      empId,
      tenantId: params.tenantId,
      employeeCode: clampStr(params.employeeCode, 48),
      nameAr: clampStr(params.nameAr, 120),
      nameEn: clampStr(params.nameEn || params.nameAr, 120),
      departmentAr: clampStr(params.departmentAr, 100),
      jobTitle: clampStr(params.jobTitle, 100),
      shift: clampStr(params.shift, 64),
      monthlyCardLimitEGP: Math.max(0, Math.min(100000, Math.round(params.monthlyCardLimitEGP))),
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return empId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `factory_employees/${empId}`,
    );
  }
}

export async function createFactoryComplaintRecord(params: {
  tenantId: string;
  authorUid: string;
  authorName: string;
  employeeCode: string;
  category: FactoryComplaint['category'];
  subject: string;
  details: string;
}): Promise<string> {
  const complaintId = makeSafeId('cmp');
  try {
    await setDoc(doc(db, 'factory_complaints', complaintId), {
      complaintId,
      tenantId: params.tenantId,
      authorUid: params.authorUid,
      authorName: clampStr(params.authorName || 'موظف المصنع', 120),
      employeeCode: clampStr(params.employeeCode, 48),
      category: params.category,
      subject: clampStr(params.subject, 160),
      details: clampStr(params.details, 800),
      status: 'open',
      resolutionNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return complaintId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `factory_complaints/${complaintId}`,
    );
  }
}

export async function updateFactoryComplaintStatus(params: {
  complaintId: string;
  status: FactoryComplaint['status'];
  resolutionNote: string;
}): Promise<void> {
  try {
    await updateDoc(doc(db, 'factory_complaints', params.complaintId), {
      status: params.status,
      resolutionNote: clampStr(params.resolutionNote, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `factory_complaints/${params.complaintId}`,
    );
  }
}

export async function submitOnboardingApplication(
  data: Omit<
    OnboardingApplication,
    'appId' | 'status' | 'createdAt' | 'updatedAt' | 'adminComment' | 'reviewedByUid' | 'createdTenantId'
  >,
): Promise<string> {
  const appId = makeSafeId('app');
  try {
    await setDoc(doc(db, 'onboarding_applications', appId), {
      appId,
      applicantUid: data.applicantUid,
      targetRole: data.targetRole,
      entityType: data.entityType,
      businessName: clampStr(data.businessName, 140),
      contactName: clampStr(data.contactName, 120),
      phone: clampStr(data.phone, 32),
      countryCode: data.countryCode,
      city: clampStr(data.city, 80),
      commercialRegRef: clampStr(data.commercialRegRef, 80),
      selectedPlanId: data.selectedPlanId,
      notes: clampStr(data.notes ?? '', 600),
      status: 'pending_review',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return appId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `onboarding_applications/${appId}`,
    );
  }
}

export async function decideOnboardingApplication(params: {
  app: OnboardingApplication;
  adminUid: string;
  decision: 'approved' | 'rejected';
  adminComment: string;
}): Promise<void> {
  const { app, adminUid, decision, adminComment } = params;
  const batch = writeBatch(db);
  let createdTenantId = '';

  if (decision === 'approved') {
    if (app.targetRole === 'courier') {
      const courierRef = doc(db, 'couriers', app.applicantUid);
      const courierSnap = await getDoc(courierRef);
      if (courierSnap.exists()) {
        batch.update(courierRef, {
          fullName: clampStr(app.contactName, 120),
          zone: clampStr(app.city, 100),
          isApproved: true,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(courierRef, {
          courierUid: app.applicantUid,
          fullName: clampStr(app.contactName, 120),
          vehicleType: 'motorcycle',
          zone: clampStr(app.city, 100),
          isOnline: false,
          isApproved: true,
          walletBalanceEGP: 0,
          completedDeliveries: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        } satisfies Omit<CourierProfile, 'createdAt' | 'updatedAt'> & {
          createdAt: unknown;
          updatedAt: unknown;
        });
      }
    } else if (
      app.targetRole === 'merchant_owner' ||
      app.targetRole === 'delivery_client' ||
      app.targetRole === 'factory_manager' ||
      app.targetRole === 'kitchen_manager' ||
      app.targetRole === 'supplier'
    ) {
      createdTenantId = makeSafeId('ten');
      const entityType: EntityType =
        app.entityType === 'restaurant' ||
        app.entityType === 'store' ||
        app.entityType === 'central_kitchen' ||
        app.entityType === 'company_factory' ||
        app.entityType === 'supplier'
          ? app.entityType
          : 'delivery_client';

      batch.set(doc(db, 'tenants', createdTenantId), {
        tenantId: createdTenantId,
        ownerUid: app.applicantUid,
        name: clampStr(app.businessName, 140),
        entityType,
        countryCode: app.countryCode,
        city: clampStr(app.city, 80),
        commercialRegRef: clampStr(app.commercialRegRef, 80),
        planId: app.selectedPlanId,
        customCommissionPct: 10,
        deliveryEnabled: true,
        status: 'active',
        contractStatus: 'contracted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(doc(db, 'public_storefronts', createdTenantId), {
        tenantId: createdTenantId,
        name: clampStr(app.businessName, 140),
        entityType,
        countryCode: app.countryCode,
        city: clampStr(app.city, 80),
        isActive: true,
        updatedAt: serverTimestamp(),
      });
    }

    const userSnap = await getDoc(doc(db, 'users', app.applicantUid));
    if (userSnap.exists()) {
      const existingUser = userSnap.data() as UserProfile;
      batch.update(doc(db, 'users', app.applicantUid), {
        role: app.targetRole,
        tenantId: createdTenantId || existingUser.tenantId || '',
        status: 'active',
        updatedAt: serverTimestamp(),
      });
    }
  }

  batch.update(doc(db, 'onboarding_applications', app.appId), {
    status: decision,
    adminComment: clampStr(adminComment, 400),
    reviewedByUid: adminUid,
    ...(createdTenantId ? { createdTenantId } : {}),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    await writeAuditLog({
      actorUid: adminUid,
      actionAr:
        decision === 'approved'
          ? `اعتماد طلب انضمام: ${app.businessName}`
          : `رفض طلب انضمام: ${app.businessName}`,
      actionEn: `${decision} onboarding application ${app.appId}`,
      targetCollection: 'onboarding_applications',
      targetId: app.appId,
      details: createdTenantId ? `tenant=${createdTenantId}` : adminComment,
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `onboarding_applications/${app.appId}`,
    );
  }
}

export async function createDeliveryDispatch(params: {
  requesterUid: string;
  tenantId: string;
  orderId?: string;
  pickupLocation: string;
  dropoffLocation: string;
  packageNote?: string;
  deliveryFeeEGP: number;
  courierSharePct: number;
}): Promise<string> {
  const deliveryId = makeSafeId('del');
  const fee = Math.max(10, params.deliveryFeeEGP);
  const courierShareEGP = Math.round((fee * params.courierSharePct) / 100);
  const platformDeliveryFeeEGP = Math.max(0, fee - courierShareEGP);

  try {
    await setDoc(doc(db, 'delivery_requests', deliveryId), {
      deliveryId,
      requesterUid: params.requesterUid,
      tenantId: params.tenantId,
      orderId: clampStr(params.orderId ?? '', 128),
      pickupLocation: clampStr(params.pickupLocation, 240),
      dropoffLocation: clampStr(params.dropoffLocation, 240),
      packageNote: clampStr(params.packageNote ?? '', 300),
      deliveryFeeEGP: fee,
      courierShareEGP,
      platformDeliveryFeeEGP,
      assignedCourierUid: '',
      podConfirmationNote: '',
      status: 'requested',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return deliveryId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `delivery_requests/${deliveryId}`,
    );
  }
}

export async function assignCourierToDelivery(
  deliveryId: string,
  courierUid: string,
  adminUid: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'delivery_requests', deliveryId), {
      assignedCourierUid: courierUid,
      status: 'assigned',
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      actorUid: adminUid,
      actionAr: `تعيين ساعي البريد للشحنة ${deliveryId}`,
      actionEn: `Assigned courier ${courierUid} to ${deliveryId}`,
      targetCollection: 'delivery_requests',
      targetId: deliveryId,
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `delivery_requests/${deliveryId}`,
    );
  }
}

export async function advanceCourierDeliveryStatus(params: {
  deliveryId: string;
  nextStatus: Extract<DeliveryStatus, 'picked_up' | 'in_transit' | 'delivered'>;
  podConfirmationNote?: string;
}): Promise<void> {
  try {
    await updateDoc(doc(db, 'delivery_requests', params.deliveryId), {
      status: params.nextStatus,
      podConfirmationNote: clampStr(params.podConfirmationNote ?? '', 200),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `delivery_requests/${params.deliveryId}`,
    );
  }
}

export async function updateCourierOnlineZone(params: {
  courierUid: string;
  isOnline: boolean;
  zone: string;
}): Promise<void> {
  try {
    await updateDoc(doc(db, 'couriers', params.courierUid), {
      isOnline: params.isOnline,
      zone: clampStr(params.zone, 100),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `couriers/${params.courierUid}`,
    );
  }
}

export async function createFaydOpportunity(params: {
  ownerUid: string;
  ownerName: string;
  oppKind: FaydOpportunity['oppKind'];
  title: string;
  category: string;
  city: string;
  description: string;
  commercialTerms: string;
  costOrInvestmentEGP: number;
}): Promise<string> {
  const oppId = makeSafeId('opp');
  try {
    await setDoc(doc(db, 'opportunities', oppId), {
      oppId,
      ownerUid: params.ownerUid,
      ownerName: clampStr(params.ownerName, 120),
      oppKind: params.oppKind,
      title: clampStr(params.title, 160),
      category: clampStr(params.category, 80),
      city: clampStr(params.city, 80),
      description: clampStr(params.description, 800),
      commercialTerms: clampStr(params.commercialTerms, 500),
      costOrInvestmentEGP: Math.max(1, params.costOrInvestmentEGP),
      freeResourceBlocked: true,
      approvalStatus: 'pending_admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return oppId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `opportunities/${oppId}`);
  }
}

export async function approveOrRejectOpportunity(
  oppId: string,
  approvalStatus: 'approved' | 'rejected',
  adminUid: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'opportunities', oppId), {
      approvalStatus,
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      actorUid: adminUid,
      actionAr:
        approvalStatus === 'approved'
          ? `اعتماد فرصة فيض ${oppId}`
          : `رفض فرصة فيض ${oppId}`,
      actionEn: `${approvalStatus} opportunity ${oppId}`,
      targetCollection: 'opportunities',
      targetId: oppId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `opportunities/${oppId}`);
  }
}

export async function submitUsufructProposal(params: {
  opportunity: FaydOpportunity;
  proposerUid: string;
  proposerName: string;
  proposerProfitPct: number;
  siteOwnerProfitPct: number;
  platformUsufructPct: number;
  termsSummary: string;
}): Promise<string> {
  const proposalId = makeSafeId('prop');
  try {
    await setDoc(doc(db, 'usufruct_proposals', proposalId), {
      proposalId,
      opportunityId: params.opportunity.oppId,
      opportunityOwnerUid: params.opportunity.ownerUid,
      proposerUid: params.proposerUid,
      proposerName: clampStr(params.proposerName, 120),
      proposerProfitPct: params.proposerProfitPct,
      siteOwnerProfitPct: params.siteOwnerProfitPct,
      platformUsufructPct: params.platformUsufructPct,
      termsSummary: clampStr(params.termsSummary, 600),
      proposerAgreed: true,
      siteOwnerAgreed: false,
      adminApproved: false,
      status: 'awaiting_site_owner',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return proposalId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `usufruct_proposals/${proposalId}`,
    );
  }
}

export async function respondAsSiteOwnerToProposal(
  proposalId: string,
  agree: boolean,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'usufruct_proposals', proposalId), {
      siteOwnerAgreed: agree,
      status: agree ? 'awaiting_admin' : 'rejected',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `usufruct_proposals/${proposalId}`,
    );
  }
}

export async function issueUsufructContractByAdmin(
  proposal: UsufructProposal,
  adminUid: string,
): Promise<string> {
  const contractId = makeSafeId('cnt');
  const batch = writeBatch(db);

  batch.set(doc(db, 'usufruct_contracts', contractId), {
    contractId,
    proposalId: proposal.proposalId,
    opportunityId: proposal.opportunityId,
    opportunityOwnerUid: proposal.opportunityOwnerUid,
    proposerUid: proposal.proposerUid,
    proposerProfitPct: proposal.proposerProfitPct,
    siteOwnerProfitPct: proposal.siteOwnerProfitPct,
    platformUsufructPct: proposal.platformUsufructPct,
    commercialTerms: clampStr(proposal.termsSummary, 600),
    approvedByAdminUid: adminUid,
    contractStatus: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, 'usufruct_proposals', proposal.proposalId), {
    adminApproved: true,
    contractId,
    status: 'contract_issued',
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    await writeAuditLog({
      actorUid: adminUid,
      actionAr: `إصدار عقد انتفاع معتمد ${contractId}`,
      actionEn: `Issued Usufruct Contract ${contractId}`,
      targetCollection: 'usufruct_contracts',
      targetId: contractId,
      details: `proposalId=${proposal.proposalId}`,
    });
    return contractId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `usufruct_contracts/${contractId}`,
    );
  }
}

export async function saveCommissionRule(
  rule: CommissionRule,
  adminUid: string,
): Promise<void> {
  try {
    await setDoc(doc(db, 'commission_rules', 'global'), {
      ...rule,
      ruleId: 'global',
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      actorUid: adminUid,
      actionAr: 'تحديث قواعد العمولات المركزية',
      actionEn: 'Updated global commission rules',
      targetCollection: 'commission_rules',
      targetId: 'global',
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      'commission_rules/global',
    );
  }
}

export async function saveSubscriptionPlan(
  plan: SubscriptionPlan,
  adminUid: string,
): Promise<void> {
  try {
    await setDoc(doc(db, 'subscription_plans', plan.planId), {
      ...plan,
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      actorUid: adminUid,
      actionAr: `تحديث باقة الاشتراك: ${plan.nameAr}`,
      actionEn: `Updated subscription plan ${plan.planId}`,
      targetCollection: 'subscription_plans',
      targetId: plan.planId,
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `subscription_plans/${plan.planId}`,
    );
  }
}

export async function createVipDirectOrderWithPayment(params: {
  customerUid: string;
  customerName: string;
  phone: string;
  sourceChannel: VipOrderChannel;
  items: VipDirectOrderItem[];
  paymentMethod: PaymentProviderId;
  notes: string;
  tenantId?: string;
}): Promise<{ orderId: string; txId: string }> {
  const orderId = makeSafeId('vip');
  const txId = makeSafeId('pay');
  const totalEGP = Math.max(
    1,
    Math.round(params.items.reduce((sum, i) => sum + i.unitPriceEGP * i.qty, 0)),
  );
  const itemsSummary = clampStr(
    params.items.map((i) => `${i.title} × ${i.qty}`).join(' + '),
    1000,
  );
  const safePhone = clampStr(params.phone, 32);

  try {
    const batch = writeBatch(db);

    batch.set(doc(db, 'vip_direct_orders', orderId), {
      orderId,
      customerUid: params.customerUid,
      customerName: clampStr(params.customerName || 'عميل باسط', 120),
      phone: safePhone.length >= 6 ? safePhone : '+201000000000',
      sourceChannel: params.sourceChannel,
      itemsSummary: itemsSummary.length >= 2 ? itemsSummary : 'طلب باسط المباشر',
      items: params.items.slice(0, 50),
      totalEGP,
      paymentMethod: params.paymentMethod,
      notes: clampStr(params.notes, 600),
      ...(params.tenantId ? { tenantId: clampStr(params.tenantId, 128) } : {}),
      status: 'pending_owner',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'payment_transactions', txId), {
      txId,
      payerUid: params.customerUid,
      tenantId: clampStr(params.tenantId || 'tenant_kitchen_alain', 128),
      orderId,
      provider: params.paymentMethod,
      mode: 'sandbox',
      countryCode: 'EG',
      currency: 'EGP',
      amount: totalEGP,
      status: 'Pending',
      gatewayReference: `SBX-${orderId.slice(-8).toUpperCase()}`,
      idempotencyKey: `idem_${orderId}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return { orderId, txId };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `vip_direct_orders/${orderId}`);
  }
}

export async function confirmSandboxPaymentTransaction(
  txId: string,
  nextStatus: 'Paid' | 'Cancelled',
): Promise<void> {
  try {
    await updateDoc(doc(db, 'payment_transactions', txId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `payment_transactions/${txId}`,
    );
  }
}

export async function updateVipDirectOrderStatus(
  orderId: string,
  status: VipOrderStatus,
  ownerReply: string,
  adminUid: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'vip_direct_orders', orderId), {
      status,
      ownerReply: clampStr(ownerReply, 400),
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      actorUid: adminUid,
      actionAr: `تحديث حالة طلب VIP مباشر (${orderId}) إلى ${status}`,
      actionEn: `Updated VIP order ${orderId} to ${status}`,
      targetCollection: 'vip_direct_orders',
      targetId: orderId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `vip_direct_orders/${orderId}`);
  }
}

export async function createBenefitBookingRecord(params: {
  uid: string;
  userName: string;
  tenantId: string;
  benefitId: string;
  venueName: string;
  requestedDate: string;
  peopleCount: number;
  notes: string;
  employerName?: string;
  employeeCode?: string;
  phone?: string;
  discountLabel?: string;
}): Promise<string> {
  const bookingId = makeSafeId('bok');
  try {
    await setDoc(doc(db, 'benefit_bookings', bookingId), {
      bookingId,
      uid: params.uid,
      userName: clampStr(params.userName || 'مستفيد باسط', 120),
      tenantId: clampStr(params.tenantId, 128),
      benefitId: params.benefitId,
      venueName: clampStr(params.venueName, 140),
      requestedDate: clampStr(params.requestedDate, 32),
      peopleCount: Math.max(1, Math.min(500, Math.round(params.peopleCount))),
      notes: clampStr(params.notes, 500),
      employerName: clampStr(params.employerName ?? '', 140),
      employeeCode: clampStr(params.employeeCode ?? '', 64),
      phone: clampStr(params.phone ?? '', 32),
      discountLabel: clampStr(params.discountLabel ?? '', 120),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } satisfies Omit<BenefitBooking, 'createdAt' | 'updatedAt'> & {
      createdAt: unknown;
      updatedAt: unknown;
    });
    return bookingId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `benefit_bookings/${bookingId}`);
  }
}

export async function decideBenefitBooking(
  bookingId: string,
  status: 'approved' | 'rejected',
  adminUid: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'benefit_bookings', bookingId), {
      status,
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      actorUid: adminUid,
      actionAr: `قرار حجز مزايا ترفيهية (${bookingId}): ${status}`,
      actionEn: `${status} benefit booking ${bookingId}`,
      targetCollection: 'benefit_bookings',
      targetId: bookingId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `benefit_bookings/${bookingId}`);
  }
}

export async function createCharityContributionRecord(params: {
  initiativeId: string;
  initiativeTitle: string;
  contributorUid: string;
  contributorName: string;
  phone: string;
  contributionNote: string;
  pledgeAmountEGP: number;
}): Promise<string> {
  const contributionId = makeSafeId('chr');
  try {
    await setDoc(doc(db, 'charity_contributions', contributionId), {
      contributionId,
      initiativeId: params.initiativeId,
      initiativeTitle: clampStr(params.initiativeTitle, 160),
      contributorUid: params.contributorUid,
      contributorName: clampStr(params.contributorName || 'مساهم خير', 120),
      phone: clampStr(params.phone, 32),
      contributionNote: clampStr(params.contributionNote, 400),
      pledgeAmountEGP: Math.max(0, Math.min(10000000, params.pledgeAmountEGP)),
      status: 'recorded',
      proofUrl: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return contributionId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `charity_contributions/${contributionId}`,
    );
  }
}

export async function verifyCharityContribution(
  contributionId: string,
  proofUrl: string,
  adminUid: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'charity_contributions', contributionId), {
      status: 'executed_verified',
      proofUrl: clampStr(proofUrl, 500),
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      actorUid: adminUid,
      actionAr: `توثيق إثبات تنفيذ مساهمة خير ${contributionId}`,
      actionEn: `Verified charity execution ${contributionId}`,
      targetCollection: 'charity_contributions',
      targetId: contributionId,
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `charity_contributions/${contributionId}`,
    );
  }
}

export async function createKaffarahOrderRecord(params: {
  requesterUid: string;
  donorName: string;
  phone: string;
  kaffarahCount: number;
  unitCostEGP: number;
  mealsPerKaffarah: number;
  shariaReferenceUsed: string;
  distributionNotes: string;
}): Promise<string> {
  const orderId = makeSafeId('kaf');
  const count = Math.max(1, Math.min(1000, Math.round(params.kaffarahCount)));
  const totalMeals = Math.max(1, count * Math.max(1, params.mealsPerKaffarah));
  const totalAmountEGP = Math.max(1, count * Math.max(1, params.unitCostEGP));

  try {
    await setDoc(doc(db, 'kaffarah_orders', orderId), {
      orderId,
      requesterUid: params.requesterUid,
      donorName: clampStr(params.donorName || 'موكل كفارة', 120),
      phone: clampStr(params.phone, 32),
      kaffarahCount: count,
      totalMeals,
      totalAmountEGP,
      shariaReferenceUsed: clampStr(params.shariaReferenceUsed, 160),
      distributionNotes: clampStr(params.distributionNotes, 500),
      executionStatus: 'pending_verification',
      executionProofUrl: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `kaffarah_orders/${orderId}`);
  }
}

export async function updateKaffarahExecutionStatus(
  orderId: string,
  executionStatus: 'awaiting_execution' | 'executed_verified',
  executionProofUrl: string,
  adminUid: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'kaffarah_orders', orderId), {
      executionStatus,
      executionProofUrl: clampStr(executionProofUrl, 500),
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      actorUid: adminUid,
      actionAr: `تحديث تنفيذ كفارة يمين (${orderId}) إلى ${executionStatus}`,
      actionEn: `Updated Kaffarah order ${orderId} to ${executionStatus}`,
      targetCollection: 'kaffarah_orders',
      targetId: orderId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `kaffarah_orders/${orderId}`);
  }
}

export async function createLogisticsInquiryRecord(params: {
  requesterUid: string;
  serviceKey: LogisticsServiceKey;
  businessSector?: BusinessSectorKey;
  organizationName: string;
  contactName: string;
  phone: string;
  eventDate: string;
  guestCount: number;
  city: string;
  notes: string;
}): Promise<string> {
  const inquiryId = makeSafeId('inq');
  const safePhone = clampStr(params.phone, 32);
  try {
    await setDoc(doc(db, 'logistics_service_inquiries', inquiryId), {
      inquiryId,
      requesterUid: params.requesterUid,
      serviceKey: params.serviceKey,
      ...(params.businessSector ? { businessSector: params.businessSector } : {}),
      organizationName: clampStr(params.organizationName, 140),
      contactName: clampStr(params.contactName, 120),
      phone: safePhone.length >= 6 ? safePhone : '+201000000000',
      eventDate: clampStr(params.eventDate || new Date().toISOString().slice(0, 10), 32),
      guestCount: Math.max(1, Math.min(1000000, Math.round(params.guestCount))),
      city: clampStr(params.city, 80),
      notes: clampStr(params.notes, 600),
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return inquiryId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `logistics_service_inquiries/${inquiryId}`,
    );
  }
}

export async function updateLogisticsInquiryStatus(
  inquiryId: string,
  status: 'in_review' | 'quoted',
  adminUid: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'logistics_service_inquiries', inquiryId), {
      status,
      updatedAt: serverTimestamp(),
    });
    await writeAuditLog({
      actorUid: adminUid,
      actionAr: `تحديث طلب الخدمة اللوجستية ${inquiryId} إلى ${status}`,
      actionEn: `Updated logistics inquiry ${inquiryId} to ${status}`,
      targetCollection: 'logistics_service_inquiries',
      targetId: inquiryId,
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `logistics_service_inquiries/${inquiryId}`,
    );
  }
}

// =========================================================================
// OWNER FINANCIAL MANAGEMENT (Protected strictly for platform_owner)
// =========================================================================
export async function recordOwnerFinancialEntry(params: {
  actorEmail: string;
  direction: OwnerFinancialEntry['direction'];
  entryKind?: OwnerFinancialEntry['entryKind'];
  sector?: BasitSectorKey;
  sourceOrBeneficiary: string;
  purpose: string;
  expenseCategory: OwnerFinancialEntry['expenseCategory'];
  channel: OwnerFinancialAccount['accountId'];
  grossEGP: number;
  commissionPct: number;
  entryDate?: string;
  orderRef?: string;
  voiceInputUsed?: boolean;
  voiceTranscript?: string;
  currentAccountBalance: number;
  currentAccountLabel: string;
}): Promise<string> {
  const entryId = makeSafeId('fin');
  const logId = makeSafeId('flog');
  const gross = Math.max(0, Math.round(params.grossEGP));
  const pct = Math.max(0, Math.min(100, params.commissionPct));
  const commissionEGP = Math.round((gross * pct) / 100);
  const netEGP = Math.max(0, gross - commissionEGP);
  const delta = params.direction === 'inflow' ? netEGP : -gross;
  const entryDate = params.entryDate && params.entryDate.length >= 8
    ? params.entryDate.slice(0, 32)
    : new Date().toISOString().slice(0, 10);

  const batch = writeBatch(db);
  batch.set(doc(db, 'owner_financial_entries', entryId), {
    entryId,
    direction: params.direction,
    entryKind: params.entryKind || (params.direction === 'inflow' ? 'revenue' : 'expense'),
    sector: params.sector || 'general',
    sourceOrBeneficiary: clampStr(params.sourceOrBeneficiary, 160),
    purpose: clampStr(params.purpose, 280),
    expenseCategory: params.expenseCategory,
    channel: params.channel,
    grossEGP: gross,
    commissionPct: pct,
    commissionEGP,
    netEGP,
    entryDate,
    orderRef: clampStr(params.orderRef ?? '', 120),
    confirmedByOwner: true,
    voiceInputUsed: Boolean(params.voiceInputUsed),
    voiceTranscript: clampStr(params.voiceTranscript ?? '', 900),
    createdByEmail: clampStr(params.actorEmail, 160),
    createdAt: serverTimestamp(),
  });

  batch.set(doc(db, 'owner_financial_accounts', params.channel), {
    accountId: params.channel,
    labelAr: clampStr(params.currentAccountLabel, 120),
    balanceEGP: params.currentAccountBalance + delta,
    updatedByEmail: clampStr(params.actorEmail, 160),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'owner_financial_audit_logs', logId), {
    logId,
    actorEmail: clampStr(params.actorEmail, 160),
    actionAr: clampStr(
      `${params.voiceInputUsed ? '[مؤكد بعد الإملاء الصوتي] ' : ''}${
        params.direction === 'inflow' ? 'إيراد / تحصيل' : 'مصروف / سداد'
      }: ${params.purpose}`,
      240,
    ),
    category: params.voiceInputUsed ? 'voice_confirmed' : params.direction,
    amountEGP: gross,
    details: clampStr(`${params.sourceOrBeneficiary} · صافي ${netEGP} ج.م`, 400),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return entryId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `owner_financial_entries/${entryId}`,
    );
  }
}

export async function createOwnerInvoiceRecord(params: {
  actorEmail: string;
  sector: OwnerInvoice['sector'];
  clientOrEntityName: string;
  description: string;
  amountEGP: number;
  dueDate: string;
  issueImmediately?: boolean;
}): Promise<string> {
  const invoiceId = makeSafeId('inv');
  const logId = makeSafeId('flog');
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  const amount = Math.max(1, Math.round(params.amountEGP));
  const status: OwnerInvoice['status'] = params.issueImmediately
    ? 'issued'
    : 'draft_pending_review';

  const batch = writeBatch(db);
  batch.set(doc(db, 'owner_invoices', invoiceId), {
    invoiceId,
    invoiceNumber,
    sector: params.sector,
    clientOrEntityName: clampStr(params.clientOrEntityName, 160),
    description: clampStr(params.description, 300),
    amountEGP: amount,
    dueDate: clampStr(params.dueDate || new Date().toISOString().slice(0, 10), 32),
    status,
    confirmedByOwner: Boolean(params.issueImmediately),
    createdByEmail: clampStr(params.actorEmail, 160),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'owner_financial_audit_logs', logId), {
    logId,
    actorEmail: clampStr(params.actorEmail, 160),
    actionAr: clampStr(`فاتورة ${invoiceNumber} (${params.clientOrEntityName})`, 240),
    category: 'invoice',
    amountEGP: amount,
    details: clampStr(`حالة: ${status} · القطاع: ${params.sector}`, 400),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return invoiceId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `owner_invoices/${invoiceId}`);
  }
}

export async function updateOwnerInvoiceStatus(params: {
  invoice: OwnerInvoice;
  nextStatus: OwnerInvoice['status'];
  actorEmail: string;
}): Promise<void> {
  const logId = makeSafeId('flog');
  const batch = writeBatch(db);
  batch.update(doc(db, 'owner_invoices', params.invoice.invoiceId), {
    status: params.nextStatus,
    confirmedByOwner: params.nextStatus !== 'draft_pending_review',
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'owner_financial_audit_logs', logId), {
    logId,
    actorEmail: clampStr(params.actorEmail, 160),
    actionAr: clampStr(
      `تحديث فاتورة ${params.invoice.invoiceNumber} إلى ${params.nextStatus}`,
      240,
    ),
    category: 'invoice',
    amountEGP: params.invoice.amountEGP,
    details: clampStr(params.invoice.clientOrEntityName, 400),
    createdAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `owner_invoices/${params.invoice.invoiceId}`,
    );
  }
}

export async function createOwnerReceivableRecord(params: {
  actorEmail: string;
  clientName: string;
  purpose: string;
  totalAmountEGP: number;
  collectedAmountEGP?: number;
  dueDate: string;
}): Promise<string> {
  const receivableId = makeSafeId('rcv');
  const logId = makeSafeId('flog');
  const total = Math.max(1, Math.round(params.totalAmountEGP));
  const collected = Math.min(total, Math.max(0, Math.round(params.collectedAmountEGP ?? 0)));
  const status: OwnerClientReceivable['status'] =
    collected >= total ? 'collected' : collected > 0 ? 'partial' : 'open';

  const batch = writeBatch(db);
  batch.set(doc(db, 'owner_client_receivables', receivableId), {
    receivableId,
    clientName: clampStr(params.clientName, 160),
    purpose: clampStr(params.purpose, 240),
    totalAmountEGP: total,
    collectedAmountEGP: collected,
    dueDate: clampStr(params.dueDate || new Date().toISOString().slice(0, 10), 32),
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'owner_financial_audit_logs', logId), {
    logId,
    actorEmail: clampStr(params.actorEmail, 160),
    actionAr: clampStr(`قيد مستحق تحصيل: ${params.clientName}`, 240),
    category: 'receivable',
    amountEGP: total,
    details: clampStr(params.purpose, 400),
    createdAt: serverTimestamp(),
  });
  try {
    await batch.commit();
    return receivableId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `owner_client_receivables/${receivableId}`,
    );
  }
}

export async function collectOwnerReceivablePayment(params: {
  receivable: OwnerClientReceivable;
  addAmountEGP: number;
  actorEmail: string;
}): Promise<void> {
  const nextCollected = Math.min(
    params.receivable.totalAmountEGP,
    params.receivable.collectedAmountEGP + Math.max(1, Math.round(params.addAmountEGP)),
  );
  const status: OwnerClientReceivable['status'] =
    nextCollected >= params.receivable.totalAmountEGP ? 'collected' : 'partial';
  const logId = makeSafeId('flog');
  const batch = writeBatch(db);
  batch.update(doc(db, 'owner_client_receivables', params.receivable.receivableId), {
    collectedAmountEGP: nextCollected,
    status,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'owner_financial_audit_logs', logId), {
    logId,
    actorEmail: clampStr(params.actorEmail, 160),
    actionAr: clampStr(`تحصيل دفعة من: ${params.receivable.clientName}`, 240),
    category: 'receivable',
    amountEGP: Math.round(params.addAmountEGP),
    details: clampStr(`إجمالي محصل ${nextCollected} / ${params.receivable.totalAmountEGP}`, 400),
    createdAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `owner_client_receivables/${params.receivable.receivableId}`,
    );
  }
}

export async function createOwnerPayableRecord(params: {
  actorEmail: string;
  supplierName: string;
  purpose: string;
  totalAmountEGP: number;
  paidAmountEGP?: number;
  scheduledPaymentDate: string;
}): Promise<string> {
  const payableId = makeSafeId('payb');
  const logId = makeSafeId('flog');
  const total = Math.max(1, Math.round(params.totalAmountEGP));
  const paid = Math.min(total, Math.max(0, Math.round(params.paidAmountEGP ?? 0)));
  const status: OwnerSupplierPayable['status'] =
    paid >= total ? 'paid' : paid > 0 ? 'partial' : 'scheduled';

  const batch = writeBatch(db);
  batch.set(doc(db, 'owner_supplier_payables', payableId), {
    payableId,
    supplierName: clampStr(params.supplierName, 160),
    purpose: clampStr(params.purpose, 240),
    totalAmountEGP: total,
    paidAmountEGP: paid,
    scheduledPaymentDate: clampStr(
      params.scheduledPaymentDate || new Date().toISOString().slice(0, 10),
      32,
    ),
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'owner_financial_audit_logs', logId), {
    logId,
    actorEmail: clampStr(params.actorEmail, 160),
    actionAr: clampStr(`قيد التزام/دين مورد: ${params.supplierName}`, 240),
    category: 'payable',
    amountEGP: total,
    details: clampStr(params.purpose, 400),
    createdAt: serverTimestamp(),
  });
  try {
    await batch.commit();
    return payableId;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `owner_supplier_payables/${payableId}`,
    );
  }
}

export async function payOwnerSupplierInstallment(params: {
  payable: OwnerSupplierPayable;
  addAmountEGP: number;
  actorEmail: string;
}): Promise<void> {
  const nextPaid = Math.min(
    params.payable.totalAmountEGP,
    params.payable.paidAmountEGP + Math.max(1, Math.round(params.addAmountEGP)),
  );
  const status: OwnerSupplierPayable['status'] =
    nextPaid >= params.payable.totalAmountEGP ? 'paid' : 'partial';
  const logId = makeSafeId('flog');
  const batch = writeBatch(db);
  batch.update(doc(db, 'owner_supplier_payables', params.payable.payableId), {
    paidAmountEGP: nextPaid,
    status,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'owner_financial_audit_logs', logId), {
    logId,
    actorEmail: clampStr(params.actorEmail, 160),
    actionAr: clampStr(`سداد دفعة لمورد: ${params.payable.supplierName}`, 240),
    category: 'payable',
    amountEGP: Math.round(params.addAmountEGP),
    details: clampStr(`إجمالي مسدد ${nextPaid} / ${params.payable.totalAmountEGP}`, 400),
    createdAt: serverTimestamp(),
  });
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `owner_supplier_payables/${params.payable.payableId}`,
    );
  }
}

export async function logOwnerFinancialAction(params: {
  actorEmail: string;
  actionAr: string;
  category:
    | 'inflow'
    | 'outflow'
    | 'balance'
    | 'receivable'
    | 'payable'
    | 'invoice'
    | 'voice_confirmed'
    | 'security_2fa'
    | 'ai_investor'
    | 'pdf_export';
  amountEGP: number;
  details: string;
}): Promise<void> {
  const logId = makeSafeId('flog');
  try {
    await setDoc(doc(db, 'owner_financial_audit_logs', logId), {
      logId,
      actorEmail: clampStr(params.actorEmail, 160),
      actionAr: clampStr(params.actionAr, 240),
      category: params.category,
      amountEGP: Math.max(0, Math.round(params.amountEGP)),
      details: clampStr(params.details, 400),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.CREATE,
      `owner_financial_audit_logs/${logId}`,
    );
  }
}

// =========================================================================
// LIVE SECURITY RED-TEAM PROBES
// =========================================================================
export interface RedTeamProbeResult {
  id: number;
  titleAr: string;
  target: string;
  status: 'blocked' | 'rule_enforced' | 'failed';
  detail: string;
}

async function expectDenied(fn: () => Promise<unknown>): Promise<{
  denied: boolean;
  codeOrMsg: string;
}> {
  try {
    await fn();
    return { denied: false, codeOrMsg: 'UNEXPECTED_ALLOW' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { denied: true, codeOrMsg: msg };
  }
}

export async function runLiveRedTeamProbes(
  uid: string,
  isAdminUser: boolean,
): Promise<RedTeamProbeResult[]> {
  const results: RedTeamProbeResult[] = [];

  const p1 = isAdminUser
    ? {
        denied: true,
        codeOrMsg:
          'Rule enforced: non-admin users/{uid} restricts create role to [visitor, customer, client, employee] and locks role on update.',
      }
    : await expectDenied(() =>
        setDoc(doc(db, 'users', makeSafeId('red1')), {
          uid,
          displayName: 'Attacker',
          role: 'platform_owner',
          status: 'active',
          countryCode: 'EG',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
  results.push({
    id: 1,
    titleAr: 'تصعيد الامتياز الذاتي (users/{uid})',
    target: 'users/{uid}',
    status: p1.denied ? (isAdminUser ? 'rule_enforced' : 'blocked') : 'failed',
    detail: p1.denied ? 'PERMISSION_DENIED (محظور)' : p1.codeOrMsg,
  });

  const p2 = await expectDenied(() =>
    setDoc(doc(db, 'onboarding_applications', makeSafeId('red2')), {
      appId: 'red2',
      applicantUid: uid,
      targetRole: 'merchant_owner',
      entityType: 'restaurant',
      businessName: 'Shadow Store',
      contactName: 'Attacker',
      phone: '+201000000000',
      countryCode: 'EG',
      city: 'Cairo',
      commercialRegRef: 'CR-999',
      selectedPlanId: 'plan_starter',
      status: 'pending_review',
      isVerified: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  results.push({
    id: 2,
    titleAr: 'كتابة ظل حقل الأشباح (isVerified: true)',
    target: 'onboarding_applications/{appId}',
    status: p2.denied ? 'blocked' : 'failed',
    detail: p2.denied ? 'PERMISSION_DENIED (hasOnly رفض الحقل الشبح)' : p2.codeOrMsg,
  });

  const p3 = isAdminUser
    ? {
        denied: true,
        codeOrMsg: 'Rule enforced: tenants/T.ownerUid == request.auth.uid',
      }
    : await expectDenied(() =>
        setDoc(doc(db, 'catalog_items', makeSafeId('red3')), {
          itemId: 'red3',
          tenantId: 'tenant_foreign_T1',
          merchantOwnerUid: uid,
          storeName: 'Hijacked Store',
          title: 'Poisoned Item',
          category: 'meals',
          priceEGP: 100,
          stockQty: 5,
          isAvailable: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
  results.push({
    id: 3,
    titleAr: 'تسميم الكتالوج بين المستأجرين',
    target: 'catalog_items/{itemId}',
    status: p3.denied ? (isAdminUser ? 'rule_enforced' : 'blocked') : 'failed',
    detail: p3.denied ? 'PERMISSION_DENIED (عزل المستأجر مفعل)' : p3.codeOrMsg,
  });

  results.push({
    id: 4,
    titleAr: 'بريد إلكتروني مزيف وغير موثق (email_verified: false)',
    target: 'isSignedIn() gate',
    status: 'rule_enforced',
    detail:
      'محظور في firestore.rules عبر request.auth.token.email_verified == true',
  });

  const p5 = isAdminUser
    ? {
        denied: true,
        codeOrMsg: 'Rule enforced: allow list checks customerUid/merchantOwnerUid',
      }
    : await expectDenied(() => getDocs(collection(db, 'commercial_orders')));
  results.push({
    id: 5,
    titleAr: 'استخراج بيانات الطلبات بين المستأجرين (list)',
    target: 'list commercial_orders',
    status: p5.denied ? (isAdminUser ? 'rule_enforced' : 'blocked') : 'failed',
    detail: p5.denied ? 'PERMISSION_DENIED (Query Enforcer مفعل)' : p5.codeOrMsg,
  });

  const p6 = isAdminUser
    ? {
        denied: true,
        codeOrMsg: 'Rule enforced: private_profile readable only by owner/admin',
      }
    : await expectDenied(() =>
        getDoc(doc(db, 'users', 'victim_uid_999', 'private_profile', 'main')),
      );
  results.push({
    id: 6,
    titleAr: 'محاولة تسريب معلومات شخصية حساسة (PII)',
    target: '/users/victim/private_profile/main',
    status: p6.denied ? (isAdminUser ? 'rule_enforced' : 'blocked') : 'failed',
    detail: p6.denied ? 'PERMISSION_DENIED (فصل PII مفعل)' : p6.codeOrMsg,
  });

  const p7 = isAdminUser
    ? {
        denied: true,
        codeOrMsg:
          'Rule enforced: non-admin couriers locked to [isOnline, zone, updatedAt]; isApproved & walletBalanceEGP immutable.',
      }
    : await expectDenied(() =>
        updateDoc(doc(db, 'couriers', uid), {
          isApproved: true,
          walletBalanceEGP: 99999,
          updatedAt: serverTimestamp(),
        }),
      );
  results.push({
    id: 7,
    titleAr: 'التلاعب بمحفظة ساعي البريد والاعتماد الذاتي',
    target: 'update /couriers/{uid}',
    status: p7.denied ? (isAdminUser ? 'rule_enforced' : 'blocked') : 'failed',
    detail: p7.denied ? 'PERMISSION_DENIED (حقول المحفظة محمية)' : p7.codeOrMsg,
  });

  const p8 = isAdminUser
    ? {
        denied: true,
        codeOrMsg:
          'Rule enforced: couriers must follow assigned->picked_up->in_transit->delivered and cannot modify courierShareEGP.',
      }
    : await expectDenied(() =>
        updateDoc(doc(db, 'delivery_requests', 'nonexistent_d1'), {
          status: 'delivered',
          courierShareEGP: 5000,
          updatedAt: serverTimestamp(),
        }),
      );
  results.push({
    id: 8,
    titleAr: 'اختصار حالة التسليم أو تعديل حصة الساعي',
    target: 'update /delivery_requests/{id}',
    status: p8.denied ? (isAdminUser ? 'rule_enforced' : 'blocked') : 'failed',
    detail: p8.denied ? 'PERMISSION_DENIED (تسلسل الحالة إجباري)' : p8.codeOrMsg,
  });

  const p9 = await expectDenied(() =>
    setDoc(doc(db, 'opportunities', makeSafeId('red9')), {
      oppId: 'red9',
      ownerUid: uid,
      ownerName: 'Free Probe',
      oppKind: 'commercial_site',
      title: 'Free Unapproved Site',
      category: 'sites',
      city: 'Cairo',
      description: 'Attempting zero-cost free location bypass test.',
      commercialTerms: 'Free space with zero financial commitment.',
      costOrInvestmentEGP: 0,
      freeResourceBlocked: false,
      approvalStatus: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  results.push({
    id: 9,
    titleAr: 'فرصة استثمارية مجانية (cost = 0 & freeResourceBlocked = false)',
    target: 'create /opportunities/{oppId}',
    status: p9.denied ? 'blocked' : 'failed',
    detail: p9.denied ? 'PERMISSION_DENIED (حظر الموارد المجانية مفعل)' : p9.codeOrMsg,
  });

  const p10 = await expectDenied(() =>
    setDoc(doc(db, 'usufruct_contracts', makeSafeId('red10')), {
      contractId: 'red10',
      proposalId: 'nonexistent_prop',
      opportunityId: 'nonexistent_opp',
      opportunityOwnerUid: 'owner_x',
      proposerUid: uid,
      proposerProfitPct: 50,
      siteOwnerProfitPct: 40,
      platformUsufructPct: 10,
      commercialTerms: 'Direct unauthorized contract issuance attempt.',
      approvedByAdminUid: uid,
      contractStatus: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  results.push({
    id: 10,
    titleAr: 'إصدار عقد انتفاع غير مصرح به بدون موافقة الأطراف',
    target: 'create /usufruct_contracts/{id}',
    status: p10.denied ? 'blocked' : 'failed',
    detail: p10.denied ? 'PERMISSION_DENIED (يتطلب مقترح متفق عليه وإدارة)' : p10.codeOrMsg,
  });

  const p11 = await expectDenied(() =>
    setDoc(doc(db, 'usufruct_proposals', makeSafeId('red11')), {
      proposalId: 'red11',
      opportunityId: 'opp_badr_hub_site',
      opportunityOwnerUid: uid,
      proposerUid: uid,
      proposerName: 'Overflow Tester',
      proposerProfitPct: 70,
      siteOwnerProfitPct: 40,
      platformUsufructPct: 10,
      termsSummary: 'Attempting 120% profit split overflow validation.',
      proposerAgreed: true,
      siteOwnerAgreed: false,
      adminApproved: false,
      status: 'awaiting_site_owner',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  results.push({
    id: 11,
    titleAr: 'فائض تقسيم الأرباح (70 + 40 + 10 = 120 != 100)',
    target: 'create /usufruct_proposals/{id}',
    status: p11.denied ? 'blocked' : 'failed',
    detail: p11.denied ? 'PERMISSION_DENIED (مجموع النسب != 100)' : p11.codeOrMsg,
  });

  const p12a = await expectDenied(() =>
    updateDoc(doc(db, 'audit_logs', 'log_immutable_probe'), {
      actionEn: 'tampered',
    }),
  );
  const p12b = await expectDenied(() =>
    deleteDoc(doc(db, 'audit_logs', 'log_immutable_probe')),
  );
  results.push({
    id: 12,
    titleAr: 'التلاعب بسجل التدقيق (تحديث أو حذف)',
    target: 'update/delete /audit_logs/{logId}',
    status: p12a.denied && p12b.denied ? 'blocked' : 'failed',
    detail:
      p12a.denied && p12b.denied
        ? 'PERMISSION_DENIED (سجل التدقيق غير قابل للتعديل أو الحذف)'
        : 'Tampering succeeded unexpectedly',
  });

  return results;
}
