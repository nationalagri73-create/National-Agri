export type CountryCode = 'EG' | 'AE' | 'QA' | 'OM' | 'GB';

export type CanonicalBasitRole =
  | 'platform_owner'
  | 'system_admin'
  | 'factory_manager'
  | 'kitchen_manager'
  | 'supplier'
  | 'employee'
  | 'client';

export type LegacyRole =
  | 'visitor'
  | 'customer'
  | 'entity_admin'
  | 'merchant_owner'
  | 'merchant_staff'
  | 'kitchen_partner'
  | 'entertainment_partner'
  | 'delivery_client'
  | 'courier'
  | 'opportunity_partner'
  | 'finance_admin'
  | 'central_admin'
  | 'central_super_admin';

export type UserRole = CanonicalBasitRole | LegacyRole;

export const BASIT_ROLE_LABELS: Record<
  CanonicalBasitRole,
  { ar: string; en: string }
> = {
  platform_owner: { ar: 'مالك المنصة', en: 'Platform Owner' },
  system_admin: { ar: 'مدير النظام', en: 'System Admin' },
  factory_manager: { ar: 'مدير المصنع', en: 'Factory Manager' },
  kitchen_manager: { ar: 'مدير المطبخ المركزي', en: 'Central Kitchen Manager' },
  supplier: { ar: 'مورّد معتمد', en: 'Approved Supplier' },
  employee: { ar: 'موظف مصنع / شركة', en: 'Employee' },
  client: { ar: 'عميل أفراد / أعمال', en: 'Client' },
};

export function normalizeRoleLabel(
  role: UserRole | undefined,
  isEn: boolean,
): string {
  if (!role) return isEn ? 'Visitor' : 'زائر';
  if (role in BASIT_ROLE_LABELS) {
    const entry = BASIT_ROLE_LABELS[role as CanonicalBasitRole];
    return isEn ? entry.en : entry.ar;
  }
  const map: Record<LegacyRole, { ar: string; en: string }> = {
    visitor: { ar: 'زائر', en: 'Visitor' },
    customer: { ar: 'عميل أفراد / أعمال', en: 'Client' },
    entity_admin: { ar: 'مدير منشأة', en: 'Entity Admin' },
    merchant_owner: { ar: 'تاجر / مطبخ مركزي', en: 'Merchant / Kitchen Owner' },
    merchant_staff: { ar: 'موظف متجر', en: 'Store Staff' },
    kitchen_partner: { ar: 'شريك مطبخ مركزي', en: 'Kitchen Partner' },
    entertainment_partner: { ar: 'شريك ترفيه ومزايا', en: 'Benefits Partner' },
    delivery_client: { ar: 'عميل توصيل شركات', en: 'Logistics Client' },
    courier: { ar: 'مندوب توصيل', en: 'Courier' },
    opportunity_partner: { ar: 'شريك فرص انتفاع', en: 'Opportunity Partner' },
    finance_admin: { ar: 'مدير مالي', en: 'Finance Admin' },
    central_admin: { ar: 'مشرف مركزي', en: 'Central Admin' },
    central_super_admin: { ar: 'مدير النظام المركزي', en: 'System Admin' },
  };
  const m = map[role as LegacyRole];
  return m ? (isEn ? m.en : m.ar) : role;
}

export type EntityType =
  | 'restaurant'
  | 'store'
  | 'central_kitchen'
  | 'company_factory'
  | 'delivery_client'
  | 'supplier';

export type TenantKind =
  | 'factory'
  | 'central_kitchen'
  | 'supplier'
  | 'company'
  | 'restaurant'
  | 'store'
  | 'delivery_client';

export type OnboardingTargetRole =
  | 'merchant_owner'
  | 'delivery_client'
  | 'courier'
  | 'opportunity_partner'
  | 'factory_manager'
  | 'kitchen_manager'
  | 'supplier';

export type OnboardingEntityType =
  | 'restaurant'
  | 'store'
  | 'central_kitchen'
  | 'company_factory'
  | 'supplier'
  | 'courier_individual'
  | 'project_owner'
  | 'site_owner';

export type OrderStatus =
  | 'pending_merchant'
  | 'accepted_preparing'
  | 'ready_for_pickup'
  | 'in_delivery'
  | 'completed'
  | 'cancelled';

export type DeliveryStatus =
  | 'requested'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type OpportunityKind = 'project_expertise' | 'commercial_site';
export type OpportunityApprovalStatus =
  | 'pending_admin'
  | 'approved'
  | 'rejected'
  | 'closed';

export type ProposalStatus =
  | 'awaiting_site_owner'
  | 'awaiting_admin'
  | 'contract_issued'
  | 'rejected';

export type PaymentProviderId =
  | 'fawry'
  | 'vodafone_cash'
  | 'instapay'
  | 'cash_on_delivery';

export type VipOrderChannel =
  | 'camel_liver_vip'
  | 'cart_direct'
  | 'al_ain_offer'
  | 'factory_portal';

export type VipOrderStatus =
  | 'pending_owner'
  | 'approved'
  | 'preparing'
  | 'completed'
  | 'rejected';

export type EntertainmentCategory =
  | 'circus'
  | 'amusement_park'
  | 'club'
  | 'hotel_resort'
  | 'beach'
  | 'kids_area'
  | 'trip'
  | 'seasonal';

export type LogisticsServiceKey =
  | 'weddings_occasions'
  | 'conferences_events'
  | 'open_buffets'
  | 'hospitality'
  | 'central_kitchens_setup'
  | 'institutional_events_catering'
  | 'supply_distribution_logistics';

export type BusinessSectorKey =
  | 'factories'
  | 'companies'
  | 'hospitals'
  | 'schools'
  | 'clubs'
  | 'parties'
  | 'conferences';

export type BasitSectorKey =
  | 'marketplace'
  | 'business'
  | 'card'
  | 'healthy'
  | 'factory'
  | 'logistics'
  | 'general';

export interface UserProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  tenantId?: string;
  status: 'active' | 'pending' | 'suspended';
  countryCode: CountryCode;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivateProfile {
  uid: string;
  email: string;
  phone?: string;
  nationalOrTaxId?: string;
  address?: string;
  updatedAt?: unknown;
}

export interface OnboardingApplication {
  appId: string;
  applicantUid: string;
  targetRole: OnboardingTargetRole;
  entityType: OnboardingEntityType;
  businessName: string;
  contactName: string;
  phone: string;
  countryCode: CountryCode;
  city: string;
  commercialRegRef: string;
  selectedPlanId: string;
  notes?: string;
  status: 'pending_review' | 'needs_info' | 'approved' | 'rejected';
  adminComment?: string;
  reviewedByUid?: string;
  createdTenantId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TenantWorkspace {
  tenantId: string;
  ownerUid: string;
  name: string;
  nameEn?: string;
  entityType: EntityType;
  tenantKind?: TenantKind;
  countryCode: CountryCode;
  city: string;
  commercialRegRef: string;
  planId: string;
  customCommissionPct: number;
  deliveryEnabled: boolean;
  status: 'active' | 'suspended';
  contractStatus?:
    | 'contracted'
    | 'in_contracting'
    | 'prospective'
    | 'unlaunched_sector';
  contractedKitchenIdsCsv?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  specialtiesAr?: string;
  specialtiesEn?: string;
  capacityMealsPerDay?: number;
  serviceAreasCsv?: string;
  averageRating?: number;
  ratingCount?: number;
  cateringScheduleText?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicStorefront {
  tenantId: string;
  name: string;
  nameEn?: string;
  entityType: EntityType;
  tenantKind?: TenantKind;
  countryCode: CountryCode;
  city: string;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  specialtiesAr?: string;
  specialtiesEn?: string;
  capacityMealsPerDay?: number;
  serviceAreasCsv?: string;
  averageRating?: number;
  ratingCount?: number;
  isActive: boolean;
  updatedAt?: unknown;
}

export interface CatalogItem {
  itemId: string;
  tenantId: string;
  merchantOwnerUid: string;
  storeName: string;
  title: string;
  category: string;
  priceEGP: number;
  stockQty: number;
  isAvailable: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommercialOrder {
  orderId: string;
  tenantId: string;
  merchantOwnerUid: string;
  customerUid: string;
  customerName: string;
  itemsSummary: string;
  subtotalEGP: number;
  platformCommissionEGP: number;
  deliveryFeeEGP: number;
  netMerchantEGP: number;
  needsDelivery: boolean;
  dropoffAddress: string;
  status: OrderStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MarketplaceRfq {
  rfqId: string;
  requesterUid: string;
  requesterOrgName: string;
  phone: string;
  targetTenantId: string;
  targetMerchantOwnerUid: string;
  targetName: string;
  dailyQty: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'one_time';
  city: string;
  details: string;
  quotedPriceEGP: number;
  merchantNote: string;
  status: 'open' | 'quoted' | 'accepted' | 'declined';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MarketplaceReview {
  reviewId: string;
  tenantId: string;
  authorUid: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BasitCard {
  cardId: string;
  ownerUid: string;
  holderName: string;
  employeeCode: string;
  tenantId: string;
  factoryName: string;
  cardNumberMasked: string;
  monthlyQuotaEGP: number;
  usedAmountEGP: number;
  validFrom: string;
  validTo: string;
  status: 'active' | 'frozen' | 'expired';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BasitCardRedemption {
  redemptionId: string;
  cardId: string;
  ownerUid: string;
  tenantId: string;
  vendorName: string;
  offerTitle: string;
  amountEGP: number;
  discountSavedEGP: number;
  createdAt?: unknown;
}

export interface HealthyPlan {
  planId: string;
  targetSegment: 'individual' | 'gym' | 'sports_center';
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  caloriesPerDay: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  mealsPerDay: number;
  durationDays: number;
  priceEGP: number;
  isActive: boolean;
  updatedAt?: unknown;
}

export interface HealthySubscription {
  subId: string;
  subscriberUid: string;
  subscriberName: string;
  phone: string;
  planId: string;
  planTitle: string;
  targetSegment: 'individual' | 'gym' | 'sports_center';
  orgOrGymName: string;
  startDate: string;
  deliveryAddress: string;
  totalPriceEGP: number;
  status: 'active' | 'paused' | 'completed';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FactoryEmployee {
  empId: string;
  tenantId: string;
  employeeCode: string;
  nameAr: string;
  nameEn: string;
  departmentAr: string;
  jobTitle: string;
  shift: string;
  monthlyCardLimitEGP: number;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FactoryComplaint {
  complaintId: string;
  tenantId: string;
  authorUid: string;
  authorName: string;
  employeeCode: string;
  category:
    | 'meal_quality'
    | 'delivery_delay'
    | 'card_voucher'
    | 'kitchen_hygiene'
    | 'other';
  subject: string;
  details: string;
  status: 'open' | 'in_progress' | 'resolved';
  resolutionNote: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CourierProfile {
  courierUid: string;
  fullName: string;
  vehicleType: 'motorcycle' | 'car' | 'chilled_van' | 'truck';
  zone: string;
  isOnline: boolean;
  isApproved: boolean;
  walletBalanceEGP: number;
  completedDeliveries: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DeliveryRequest {
  deliveryId: string;
  requesterUid: string;
  tenantId: string;
  orderId?: string;
  pickupLocation: string;
  dropoffLocation: string;
  packageNote?: string;
  deliveryFeeEGP: number;
  courierShareEGP: number;
  platformDeliveryFeeEGP: number;
  assignedCourierUid: string;
  podConfirmationNote?: string;
  status: DeliveryStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FaydOpportunity {
  oppId: string;
  ownerUid: string;
  ownerName: string;
  oppKind: OpportunityKind;
  title: string;
  category: string;
  city: string;
  description: string;
  commercialTerms: string;
  costOrInvestmentEGP: number;
  freeResourceBlocked: boolean;
  approvalStatus: OpportunityApprovalStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UsufructProposal {
  proposalId: string;
  opportunityId: string;
  opportunityOwnerUid: string;
  proposerUid: string;
  proposerName: string;
  proposerProfitPct: number;
  siteOwnerProfitPct: number;
  platformUsufructPct: number;
  termsSummary: string;
  proposerAgreed: boolean;
  siteOwnerAgreed: boolean;
  adminApproved: boolean;
  contractId?: string;
  status: ProposalStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UsufructContract {
  contractId: string;
  proposalId: string;
  opportunityId: string;
  opportunityOwnerUid: string;
  proposerUid: string;
  proposerProfitPct: number;
  siteOwnerProfitPct: number;
  platformUsufructPct: number;
  commercialTerms: string;
  approvedByAdminUid: string;
  contractStatus: 'active' | 'completed' | 'terminated';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SubscriptionPlan {
  planId: string;
  nameAr: string;
  nameEn: string;
  monthlyFeeEGP: number;
  orderCommissionPct: number;
  deliveryDiscountPct: number;
  isActive: boolean;
  updatedAt?: unknown;
}

export interface CommissionRule {
  ruleId: string;
  defaultOrderCommissionPct: number;
  defaultDeliveryPlatformPct: number;
  defaultCourierSharePct: number;
  defaultUsufructPlatformPct: number;
  minDeliveryFeeEGP: number;
  updatedAt?: unknown;
}

export interface SecurityAuditLog {
  logId: string;
  actorUid: string;
  actionAr: string;
  actionEn: string;
  targetCollection: string;
  targetId: string;
  details?: string;
  createdAt?: unknown;
}

export interface OfferAd {
  offerId: string;
  tenantId: string;
  category: 'food' | 'shopping' | 'factory_merchant';
  titleAr: string;
  titleEn: string;
  discountBadgeAr: string;
  discountBadgeEn: string;
  ctaAr: string;
  ctaEn: string;
  countryCode: CountryCode;
  validFrom?: string;
  validTo?: string;
  targetScope?: 'public' | 'contracted_entity' | 'employee_tier';
  eligibleTenantIdsCsv?: string;
  terms?: string;
  isApproved: boolean;
  isActive: boolean;
  createdByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VipDirectOrderItem {
  code: string;
  title: string;
  qty: number;
  unitPriceEGP: number;
}

export interface VipDirectOrder {
  orderId: string;
  customerUid: string;
  customerName: string;
  phone: string;
  sourceChannel: VipOrderChannel;
  itemsSummary: string;
  items: VipDirectOrderItem[];
  totalEGP: number;
  paymentMethod: PaymentProviderId;
  notes: string;
  tenantId?: string;
  status: VipOrderStatus;
  ownerReply?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PaymentGatewayConfig {
  providerId: PaymentProviderId;
  displayName: string;
  isEnabled: boolean;
  mode: 'sandbox' | 'live';
  merchantPublicId: string;
  countryCode: CountryCode;
  updatedByUid: string;
  updatedAt?: unknown;
}

export interface PaymentTransaction {
  txId: string;
  payerUid: string;
  tenantId: string;
  orderId: string;
  provider: PaymentProviderId;
  mode: 'sandbox' | 'live';
  countryCode: CountryCode;
  currency: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Failed' | 'Cancelled' | 'Refunded';
  gatewayReference: string;
  idempotencyKey: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EntertainmentBenefit {
  benefitId: string;
  partnerUid: string;
  venueName: string;
  category: EntertainmentCategory;
  imageUrl: string;
  description: string;
  approvedBenefitText: string;
  eligibilityScope: 'public' | 'contracted_entity' | 'employee_tier';
  eligibleTenantIdsCsv: string;
  validFrom: string;
  validTo: string;
  terms: string;
  countryCode: CountryCode;
  isApproved: boolean;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BenefitBooking {
  bookingId: string;
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
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CharityInitiative {
  initiativeId: string;
  titleAr: string;
  titleEn: string;
  executingEntity: string;
  mechanismAr: string;
  contributionType: string;
  targetGoalCount: number;
  recordedContributionsCount: number;
  verifiedDeliveriesCount: number;
  proofMediaUrl: string;
  isApproved: boolean;
  isActive: boolean;
  createdByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CharityContribution {
  contributionId: string;
  initiativeId: string;
  initiativeTitle: string;
  contributorUid: string;
  contributorName: string;
  phone: string;
  contributionNote: string;
  pledgeAmountEGP: number;
  status: 'recorded' | 'executed_verified';
  proofUrl: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface KaffarahRule {
  ruleId: 'official';
  isOfficiallyApproved: boolean;
  shariaAuthorityName: string;
  referenceCode: string;
  unitCostEGP: number;
  mealsPerKaffarah: number;
  notesAr: string;
  updatedByUid: string;
  updatedAt?: unknown;
}

export interface KaffarahOrder {
  orderId: string;
  requesterUid: string;
  donorName: string;
  phone: string;
  kaffarahCount: number;
  totalMeals: number;
  totalAmountEGP: number;
  shariaReferenceUsed: string;
  distributionNotes: string;
  executionStatus:
    | 'pending_verification'
    | 'awaiting_execution'
    | 'executed_verified';
  executionProofUrl: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LogisticsServiceInquiry {
  inquiryId: string;
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
  status: 'new' | 'in_review' | 'quoted';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OwnerFinancialAccount {
  accountId: 'bank' | 'e_wallet' | 'treasury';
  labelAr: string;
  balanceEGP: number;
  updatedByEmail: string;
  updatedAt?: unknown;
}

export interface OwnerFinancialEntry {
  entryId: string;
  direction: 'inflow' | 'outflow';
  entryKind?: 'revenue' | 'expense' | 'receivable' | 'payable' | 'debt';
  sector?: BasitSectorKey;
  sourceOrBeneficiary: string;
  purpose: string;
  expenseCategory:
    | 'none'
    | 'salaries'
    | 'raw_materials'
    | 'marketing'
    | 'commissions'
    | 'logistics'
    | 'other';
  channel: 'bank' | 'e_wallet' | 'treasury';
  grossEGP: number;
  commissionPct: number;
  commissionEGP: number;
  netEGP: number;
  entryDate: string;
  orderRef: string;
  confirmedByOwner?: boolean;
  voiceInputUsed?: boolean;
  voiceTranscript?: string;
  createdByEmail: string;
  createdAt?: unknown;
}

export interface OwnerInvoice {
  invoiceId: string;
  invoiceNumber: string;
  sector: Exclude<BasitSectorKey, 'general'>;
  clientOrEntityName: string;
  description: string;
  amountEGP: number;
  dueDate: string;
  status: 'draft_pending_review' | 'issued' | 'paid' | 'overdue';
  confirmedByOwner?: boolean;
  createdByEmail: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OwnerClientReceivable {
  receivableId: string;
  clientName: string;
  purpose: string;
  totalAmountEGP: number;
  collectedAmountEGP: number;
  dueDate: string;
  status: 'open' | 'partial' | 'collected';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OwnerSupplierPayable {
  payableId: string;
  supplierName: string;
  purpose: string;
  totalAmountEGP: number;
  paidAmountEGP: number;
  scheduledPaymentDate: string;
  status: 'scheduled' | 'partial' | 'paid';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OwnerFinancialAuditLog {
  logId: string;
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
  createdAt?: unknown;
}

export interface VoiceDraftTransaction {
  direction: 'inflow' | 'outflow';
  entryKind: 'revenue' | 'expense' | 'receivable' | 'payable' | 'debt';
  sector: BasitSectorKey;
  sourceOrBeneficiary: string;
  purpose: string;
  expenseCategory: OwnerFinancialEntry['expenseCategory'];
  channel: OwnerFinancialAccount['accountId'];
  grossEGP: number;
  commissionPct: number;
  entryDate: string;
  transcriptNormalized: string;
  confidenceNote: string;
}

export const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function makeSafeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
      : Math.random().toString(36).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function clampStr(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}
