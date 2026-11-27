import { Phase1PageId } from '../data/phase1Data';
import {
  BASIT_ROLE_LABELS,
  CanonicalBasitRole,
  UserProfile,
  UserRole,
} from '../types/fayd';
import { isBootstrappedAdminEmail } from './firebase';

export interface BasitPermissions {
  canonicalRole: CanonicalBasitRole;
  assignedTenantId: string | null;
  allowedPages: Phase1PageId[];
  canAccessFinance: boolean;
  canManageGovernance: boolean;
  canSwitchFactories: boolean;
  canManageOwnFactory: boolean;
  canManageKitchen: boolean;
  canManageSupplier: boolean;
}

export function resolveCanonicalRole(
  role: UserRole | undefined,
  email?: string | null,
): CanonicalBasitRole {
  if (isBootstrappedAdminEmail(email)) {
    return 'platform_owner';
  }
  switch (role) {
    case 'platform_owner':
      return 'platform_owner';
    case 'system_admin':
    case 'central_super_admin':
    case 'central_admin':
      return 'system_admin';
    case 'factory_manager':
    case 'entity_admin':
      return 'factory_manager';
    case 'kitchen_manager':
    case 'kitchen_partner':
    case 'merchant_owner':
      return 'kitchen_manager';
    case 'supplier':
      return 'supplier';
    case 'employee':
    case 'merchant_staff':
      return 'employee';
    default:
      return 'client';
  }
}

export function resolveBasitPermissions(
  profile: UserProfile | null,
  email?: string | null,
): BasitPermissions {
  const canonicalRole = resolveCanonicalRole(profile?.role, email);
  const assignedTenantId = profile?.tenantId?.trim() ? profile.tenantId.trim() : null;

  switch (canonicalRole) {
    case 'platform_owner':
      return {
        canonicalRole,
        assignedTenantId,
        allowedPages: ['home', 'marketplace', 'business', 'card', 'healthy', 'factory', 'finance'],
        canAccessFinance: true,
        canManageGovernance: true,
        canSwitchFactories: true,
        canManageOwnFactory: true,
        canManageKitchen: true,
        canManageSupplier: true,
      };
    case 'system_admin':
      return {
        canonicalRole,
        assignedTenantId,
        allowedPages: ['home', 'marketplace', 'business', 'card', 'healthy', 'factory'],
        canAccessFinance: false,
        canManageGovernance: true,
        canSwitchFactories: true,
        canManageOwnFactory: true,
        canManageKitchen: true,
        canManageSupplier: true,
      };
    case 'factory_manager':
      return {
        canonicalRole,
        assignedTenantId,
        allowedPages: ['home', 'factory', 'business', 'card'],
        canAccessFinance: false,
        canManageGovernance: false,
        canSwitchFactories: false,
        canManageOwnFactory: Boolean(assignedTenantId),
        canManageKitchen: false,
        canManageSupplier: false,
      };
    case 'kitchen_manager':
      return {
        canonicalRole,
        assignedTenantId,
        allowedPages: ['home', 'marketplace', 'business', 'healthy'],
        canAccessFinance: false,
        canManageGovernance: false,
        canSwitchFactories: false,
        canManageOwnFactory: false,
        canManageKitchen: true,
        canManageSupplier: false,
      };
    case 'supplier':
      return {
        canonicalRole,
        assignedTenantId,
        allowedPages: ['home', 'marketplace', 'business'],
        canAccessFinance: false,
        canManageGovernance: false,
        canSwitchFactories: false,
        canManageOwnFactory: false,
        canManageKitchen: false,
        canManageSupplier: true,
      };
    case 'employee':
      return {
        canonicalRole,
        assignedTenantId,
        allowedPages: ['home', 'card', 'factory', 'healthy', 'marketplace'],
        canAccessFinance: false,
        canManageGovernance: false,
        canSwitchFactories: false,
        canManageOwnFactory: false,
        canManageKitchen: false,
        canManageSupplier: false,
      };
    case 'client':
    default:
      return {
        canonicalRole: 'client',
        assignedTenantId,
        allowedPages: ['home', 'marketplace', 'business', 'card', 'healthy'],
        canAccessFinance: false,
        canManageGovernance: false,
        canSwitchFactories: false,
        canManageOwnFactory: false,
        canManageKitchen: false,
        canManageSupplier: false,
      };
  }
}

export function getCanonicalRoleDisplay(
  role: CanonicalBasitRole,
  isEn: boolean,
): string {
  const label = BASIT_ROLE_LABELS[role] || BASIT_ROLE_LABELS.client;
  return isEn ? label.en : label.ar;
}
