# FAYD Phase 2 — Security Specification & Red-Team Payloads

## 1. Core Data Invariants
1. **Strict Tenant Isolation**: A merchant (`tenantId = T1`) can read, list, create, update, or delete ONLY `catalog_items`, `commercial_orders`, `delivery_requests`, and `tenants/T1/*` documents owned by `T1` (`ownerUid == request.auth.uid` or active member in `/tenants/T1/members/$(uid)`). Reading or mutating any `T2` record must return `PERMISSION_DENIED`.
2. **Courier Task Isolation**: A courier (`courierUid`) may list/read/update ONLY `delivery_requests` where `assignedCourierUid == request.auth.uid`, and may update ONLY `status` (`assigned -> picked_up -> in_transit -> delivered`), `podConfirmationNote`, and `updatedAt`. Couriers cannot alter `deliveryFeeEGP`, `courierShareEGP`, or self-approve their `couriers/{uid}` record.
3. **Zero Unapproved Financial Commitments & No Free-Resource Assumptions**:
   - Every `opportunities` document MUST explicitly set `freeResourceBlocked == true`, `costOrInvestmentEGP > 0`, and `commercialTerms.size() >= 10`, and enters `pending_admin` until approved by Central Admin.
   - A `usufruct_proposals` record cannot advance to `contract_issued` unless `proposerAgreed == true`, `siteOwnerAgreed == true`, and `adminApproved == true`, and its profit split sums to `100`.
   - A `usufruct_contracts` record can ONLY be created by Central Admin (`isAdmin()`) referencing an existing agreed `usufruct_proposals` record.
4. **PII Split Collection**: `users/{uid}` holds no email/phone/address/tax ID. Private PII lives strictly in `/users/{uid}/private_profile/main`, readable/writable ONLY by `uid` or `isAdmin()`.
5. **Revenue / Commission Control**: Only Central Admin (`isAdmin()`) can create/update `subscription_plans`, `commission_rules`, and `ledger_settlements`, or approve onboarding requests.
6. **Temporal & Identity Integrity**: All `createdAt` / `updatedAt` timestamps must equal `request.time`. No user may self-assign `admin`, `merchant_owner`, or `courier` in `/users/{uid}`.

---

## 2. "Dirty Dozen" Adversarial Test Payloads
1. **Self-Privilege Escalation (`users/{uid}`)**:
   `{ "uid": "u1", "displayName": "Attacker", "role": "central_super_admin", "status": "active", "countryCode": "EG", "createdAt": "<time>", "updatedAt": "<time>" }` -> **MUST DENY**.
2. **Ghost Field Shadow Write (`onboarding_applications/{appId}`)**:
   `{ ...validApp, "status": "pending_review", "isVerified": true }` -> **MUST DENY** (`hasOnly` check).
3. **Cross-Tenant Catalog Poisoning (`catalog_items/{itemId}`)**:
   Merchant B submits `{ ...validItem, "tenantId": "tenant_A", "merchantOwnerUid": "uid_B" }` -> **MUST DENY** (`tenants/tenant_A` owner check fails).
4. **Spoofed Unverified Email Admin Claim**:
   Request with `token.email == "hamzaelhelaly08@gmail.com"` and `token.email_verified == false` -> **MUST DENY**.
5. **Cross-Tenant Order Scraping (`list commercial_orders`)**:
   Merchant B runs unrestricted `list` query without `merchantOwnerUid == uid_B` -> **MUST DENY**.
6. **PII Leak Attempt (`get /users/victimUid/private_profile/main`)**:
   Non-owner signed-in user reads another user's private profile -> **MUST DENY**.
7. **Courier Wallet Tampering (`update /couriers/c1`)**:
   Courier updates `{ "isApproved": true, "walletBalanceEGP": 99999 }` -> **MUST DENY**.
8. **State Shortcutting on Delivery (`update /delivery_requests/d1`)**:
   Courier jumps status from `assigned` directly to `delivered` or alters `courierShareEGP` -> **MUST DENY**.
9. **Free Location Assumption in Opportunity (`create /opportunities/o1`)**:
   `{ ...validOpp, "freeResourceBlocked": false, "costOrInvestmentEGP": 0, "approvalStatus": "approved" }` -> **MUST DENY**.
10. **Unauthorized Usufruct Contract Issuance (`create /usufruct_contracts/c1`)**:
    Proposer tries to issue an active contract directly before site owner & admin approval -> **MUST DENY**.
11. **Profit Split Overflow (`create /usufruct_proposals/p1`)**:
    `{ ...validProposal, "proposerProfitPct": 70, "siteOwnerProfitPct": 40, "platformUsufructPct": 10 }` (Sum = 120 != 100) -> **MUST DENY**.
12. **Audit Log Tampering (`update/delete /audit_logs/log1`)**:
    Any user or admin tries to delete or alter an existing audit log entry -> **MUST DENY**.
