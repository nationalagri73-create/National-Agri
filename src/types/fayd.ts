export type CountryCode = 'EG' | 'AE' | 'QA' | 'OM' | 'GB';

export type UserRole =
  | 'visitor'
  | 'customer'
  | 'employee'
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

export type EntityType =
  | 'restaurant'
  | 'store'
  | 'central_kitchen'
  | 'company_factory'
  | 'delivery_client';

export type OnboardingTargetRole =
  | 'merchant_owner'
  | 'delivery_client'
  | 'courier'
  | 'opportunity_partner';

export type OnboardingEntityType =
  | 'restaurant'
  | 'store'
  | 'central_kitchen'
  | 'company_factory'
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

export type VipOrderChannel = 'camel_liver_vip' | 'cart_direct' | 'al_ain_offer';
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
  entityType: EntityType;
  countryCode: CountryCode;
  city: string;
  commercialRegRef: string;
  planId: string;
  customCommissionPct: number;
  deliveryEnabled: boolean;
  status: 'active' | 'suspended';
  contractStatus?: 'contracted' | 'in_contracting' | 'prospective' | 'unlaunched_sector';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicStorefront {
  tenantId: string;
  name: string;
  entityType: EntityType;
  countryCode: CountryCode;
  city: string;
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
  executionStatus: 'pending_verification' | 'awaiting_execution' | 'executed_verified';
  executionProofUrl: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LogisticsServiceInquiry {
  inquiryId: string;
  requesterUid: string;
  serviceKey: LogisticsServiceKey;
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
  createdByEmail: string;
  createdAt?: unknown;
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
