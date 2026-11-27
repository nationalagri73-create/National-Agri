# BASIT | باسط — Security Specification & Invariants

## 1. Roles & Strict Server-Enforced RBAC
1. `platform_owner`: Full access including `owner_financial_*` ledger, invoices, P&L, reports, and voice-to-ledger confirmation.
2. `system_admin`: Central platform governance (onboarding approvals, role assignments, marketplace/business/factory oversight, complaints resolution). Denied from `owner_financial_*` unless also `platform_owner`.
3. `factory_manager`: Strictly isolated to assigned `tenantId` for factory employees, white-label branding, factory orders, BASIT cards, and factory complaints.
4. `kitchen_manager`: Strictly isolated to assigned `tenantId` for central kitchen profile, capacity, catalog items, orders, and RFQs.
5. `supplier`: Strictly isolated to assigned `tenantId` for supply catalog, bulk orders, and RFQs.
6. `employee`: Authenticated factory/company employee; restricted to own orders, own `basit_cards`, own `benefit_bookings`, and factory complaints under their `tenantId`.
7. `client`: Authenticated customer/B2B buyer; restricted to own `commercial_orders`, `marketplace_rfqs`, `marketplace_reviews`, `logistics_service_inquiries`, and `healthy_subscriptions`.

## 2. Core Data Invariants
- **No Unverified Auth**: All authenticated access requires `request.auth != null && request.auth.token.email_verified == true`.
- **No Self-Privilege Escalation**: Users creating `/users/{uid}` may only create low-privilege roles (`client`, `customer`, `employee`, `visitor`). Only `platform_owner`/`system_admin` can assign elevated roles or `tenantId`.
- **Strict Tenant Isolation**: `factory_manager`, `kitchen_manager`, and `supplier` mutations on `tenants/{T}`, `catalog_items`, `factory_employees`, `commercial_orders`, `marketplace_rfqs`, and `factory_complaints` require matching `tenantId` ownership or active membership.
- **No Auto-Approval in Owner Finance**: Every `owner_financial_entries` and `owner_invoices` entry requires explicit review & confirmation (`confirmedByOwner == true` or `status` checked) by `isPlatformOwner()`, and every mutation logs an immutable `owner_financial_audit_logs` record (`update, delete: if false`).
- **Temporal & Schema Integrity**: Every create/update validates full key allowlists (`hasAll` + `hasOnly`), `createdAt == request.time` immutability, and strict numeric bounds.
