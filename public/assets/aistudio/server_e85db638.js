// server.ts
import "dotenv/config";
import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

// src/types/rbac.ts
var ALL_CANONICAL_ROLES = [
  "super_admin",
  "platform_admin",
  "client_owner",
  "client_manager",
  "client_employee",
  "kitchen_owner",
  "kitchen_manager",
  "kitchen_staff",
  "finance_manager",
  "customer"
];
var ALL_PERMISSION_METADATA = [
  {
    key: "platform:approve_entities",
    group: "platform",
    labelAr: "\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0648\u0627\u0644\u0645\u0637\u0627\u0628\u062E \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u0629",
    labelEn: "Approve Companies & Central Kitchens"
  },
  {
    key: "platform:manage_users",
    group: "platform",
    labelAr: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0648\u062A\u062C\u0645\u064A\u062F/\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A",
    labelEn: "Manage Users & Suspend/Activate"
  },
  {
    key: "platform:manage_roles",
    group: "platform",
    labelAr: "\u062A\u0639\u062F\u064A\u0644 \u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A",
    labelEn: "Configure Roles & Permission Matrix"
  },
  {
    key: "platform:manage_offers_cms",
    group: "platform",
    labelAr: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0627\u0644\u062E\u0635\u0648\u0645\u0627\u062A \u0648\u0627\u0644\u0647\u0648\u064A\u0629",
    labelEn: "Manage Offers, Discounts & Identity"
  },
  {
    key: "platform:view_audit_logs",
    group: "platform",
    labelAr: "\u0645\u0631\u0627\u062C\u0639\u0629 \u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u063A\u064A\u0631 \u0627\u0644\u0642\u0627\u0628\u0644 \u0644\u0644\u062A\u0639\u062F\u064A\u0644",
    labelEn: "View Immutable Audit Logs"
  },
  {
    key: "platform:manage_orders",
    group: "platform",
    labelAr: "\u0627\u0644\u0631\u0642\u0627\u0628\u0629 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0648\u0627\u0644\u0634\u0643\u0627\u0648\u0649 \u0648\u0627\u0644\u062A\u0642\u064A\u064A\u0645\u0627\u062A",
    labelEn: "Track All Orders & Complaints"
  },
  {
    key: "entity:manage_profile",
    group: "entity",
    labelAr: "\u0625\u062F\u0627\u0631\u0629 \u0645\u0644\u0641 \u0627\u0644\u0634\u0631\u0643\u0629/\u0627\u0644\u0645\u0635\u0646\u0639 \u0648\u0627\u0644\u0639\u0642\u0648\u062F",
    labelEn: "Manage Company/Factory Profile & Contracts"
  },
  {
    key: "entity:invite_employees",
    group: "entity",
    labelAr: "\u062F\u0639\u0648\u0629 \u0648\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0638\u0641\u064A \u0627\u0644\u0643\u064A\u0627\u0646",
    labelEn: "Invite Entity Employees"
  },
  {
    key: "entity:assign_member_permissions",
    group: "entity",
    labelAr: "\u062A\u0639\u064A\u064A\u0646 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u062F\u0627\u062E\u0644 \u0627\u0644\u0643\u064A\u0627\u0646",
    labelEn: "Assign Member Permissions in Entity"
  },
  {
    key: "entity:place_orders",
    group: "entity",
    labelAr: "\u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0625\u0639\u0627\u0634\u0629 \u0648\u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0644\u0644\u0643\u064A\u0627\u0646",
    labelEn: "Place Entity Catering Orders"
  },
  {
    key: "entity:view_orders",
    group: "entity",
    labelAr: "\u0639\u0631\u0636 \u0637\u0644\u0628\u0627\u062A \u0648\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0643\u064A\u0627\u0646 \u0641\u0642\u0637",
    labelEn: "View Scoped Entity Orders"
  },
  {
    key: "kitchen:manage_menu",
    group: "kitchen",
    labelAr: "\u0625\u062F\u0627\u0631\u0629 \u0645\u0646\u064A\u0648 \u0648\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u0637\u0628\u062E \u0627\u0644\u0645\u0631\u0643\u0632\u064A",
    labelEn: "Manage Central Kitchen Menu & Pricing"
  },
  {
    key: "kitchen:manage_orders",
    group: "kitchen",
    labelAr: "\u062A\u0646\u0641\u064A\u0630 \u0648\u062A\u062D\u062F\u064A\u062B \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0637\u0628\u062E \u0627\u0644\u0645\u0631\u0643\u0632\u064A \u0641\u0642\u0637",
    labelEn: "Manage Central Kitchen Orders"
  },
  {
    key: "kitchen:manage_staff",
    group: "kitchen",
    labelAr: "\u062F\u0639\u0648\u0629 \u0648\u062A\u062D\u062F\u064A\u062F \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0637\u0627\u0642\u0645 \u0627\u0644\u0645\u0637\u0628\u062E",
    labelEn: "Manage Central Kitchen Staff"
  },
  {
    key: "finance:view_reports",
    group: "finance",
    labelAr: "\u0639\u0631\u0636 \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631 \u0648\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0645\u0639\u0632\u0648\u0644\u0629",
    labelEn: "View Isolated Financial Reports"
  },
  {
    key: "finance:manage_settlements",
    group: "finance",
    labelAr: "\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u062A\u0633\u0648\u064A\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u0639\u0645\u0648\u0644\u0627\u062A",
    labelEn: "Manage Ledger Settlements"
  },
  {
    key: "customer:browse_and_order",
    group: "customer",
    labelAr: "\u062A\u0635\u0641\u062D \u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0634\u062E\u0635\u064A",
    labelEn: "Browse, Order & Review"
  }
];
var DEFAULT_ROLE_PERMISSION_MATRIX = {
  super_admin: ALL_PERMISSION_METADATA.map((p) => p.key),
  platform_admin: [
    "platform:approve_entities",
    "platform:manage_users",
    "platform:manage_offers_cms",
    "platform:view_audit_logs",
    "platform:manage_orders",
    "entity:view_orders",
    "kitchen:manage_orders",
    "finance:view_reports",
    "customer:browse_and_order"
  ],
  client_owner: [
    "entity:manage_profile",
    "entity:invite_employees",
    "entity:assign_member_permissions",
    "entity:place_orders",
    "entity:view_orders",
    "finance:view_reports",
    "customer:browse_and_order"
  ],
  client_manager: [
    "entity:invite_employees",
    "entity:assign_member_permissions",
    "entity:place_orders",
    "entity:view_orders",
    "customer:browse_and_order"
  ],
  client_employee: [
    "entity:place_orders",
    "entity:view_orders",
    "customer:browse_and_order"
  ],
  kitchen_owner: [
    "kitchen:manage_menu",
    "kitchen:manage_orders",
    "kitchen:manage_staff",
    "entity:manage_profile",
    "entity:invite_employees",
    "entity:assign_member_permissions",
    "finance:view_reports",
    "customer:browse_and_order"
  ],
  kitchen_manager: [
    "kitchen:manage_menu",
    "kitchen:manage_orders",
    "kitchen:manage_staff",
    "entity:invite_employees",
    "entity:assign_member_permissions",
    "customer:browse_and_order"
  ],
  kitchen_staff: [
    "kitchen:manage_orders",
    "customer:browse_and_order"
  ],
  finance_manager: [
    "finance:view_reports",
    "finance:manage_settlements"
  ],
  customer: [
    "customer:browse_and_order"
  ]
};
function hasEffectivePermission(matrix, role, customPermissions, required) {
  if (role === "super_admin") return true;
  if (customPermissions && customPermissions.length > 0) {
    return customPermissions.includes(required);
  }
  const rolePerms = matrix[role] || DEFAULT_ROLE_PERMISSION_MATRIX[role] || [];
  return rolePerms.includes(required);
}
function sanitizeRoleMatrix(candidate) {
  const validKeys = new Set(ALL_PERMISSION_METADATA.map((p) => p.key));
  const next = { ...DEFAULT_ROLE_PERMISSION_MATRIX };
  for (const role of ALL_CANONICAL_ROLES) {
    if (role === "super_admin") {
      next.super_admin = [...DEFAULT_ROLE_PERMISSION_MATRIX.super_admin];
      continue;
    }
    const incomingList = candidate[role];
    if (Array.isArray(incomingList)) {
      next[role] = Array.from(
        new Set(incomingList.filter((k) => validKeys.has(k)))
      );
    } else {
      next[role] = [...DEFAULT_ROLE_PERMISSION_MATRIX[role]];
    }
  }
  return next;
}
var EXECUTIVE_ACCOUNTS = [
  {
    uid: "server_owner_hamza",
    username: "hamza",
    usernameAliases: ["@hamza", "hamza.elhelaly"],
    email: "hamzaelhelaly08@gmail.com",
    phone: "",
    fullNameAr: "\u062D\u0645\u0632\u0629 \u0627\u0644\u0647\u0644\u0627\u0644\u064A",
    fullNameEn: "Hamza Elhelaly",
    canonicalRole: "super_admin",
    tenantId: "",
    canApproveHabe: true,
    envInitialPasswordKey: "ADMIN_HAMZA_INITIAL_PASSWORD"
  },
  {
    uid: "exec_ahmed_adly",
    username: "ahmed.adly",
    usernameAliases: ["@ahmed.adly", "ahmed_adly", "hb-024"],
    email: "ahmed.adly@basit-catering.local",
    phone: "+201274799290",
    fullNameAr: "\u0645\u0639\u062A\u0645\u062F \u0631\u0648\u0627\u062A\u0628 \u0648\u0625\u062F\u0627\u0631\u0629 H-A-B-E",
    fullNameEn: "H-A-B-E HR & Payroll Approver",
    canonicalRole: "client_owner",
    employeeCode: "HB-024",
    tenantId: "tenant_client_habe",
    canApproveHabe: true,
    envInitialPasswordKey: "ADMIN_ADLY_INITIAL_PASSWORD"
  },
  {
    uid: "exec_ahmed_wahid",
    username: "ahmed.wahid",
    usernameAliases: ["@ahmed.wahid", "ahmed.wahed", "@ahmed.wahed", "ahmed_wahid", "hb-025"],
    email: "ahmed.wahid@basit-catering.local",
    phone: "+201103611414",
    fullNameAr: "\u0645\u0639\u062A\u0645\u062F \u0631\u0648\u0627\u062A\u0628 \u0648\u0625\u062F\u0627\u0631\u0629 H-A-B-E",
    fullNameEn: "H-A-B-E HR & Payroll Approver",
    canonicalRole: "client_owner",
    employeeCode: "HB-025",
    tenantId: "tenant_client_habe",
    canApproveHabe: true,
    envInitialPasswordKey: "ADMIN_WAHID_INITIAL_PASSWORD"
  }
];
var EXECUTIVE_HABE_APPROVER_EMAILS = EXECUTIVE_ACCOUNTS.filter((e) => e.canApproveHabe).map(
  (e) => e.email.toLowerCase()
);

// src/data/habeDirectoryCore.ts
var HABE_CORPORATE_SHEET_30 = [
  { id: "hb_001", code: "HB-001", username: "@adel.bichara", nameEn: "Adel Bichara", nameAr: "\u0639\u0627\u062F\u0644 \u0628\u0646\u064A\u0627\u0645\u064A\u0646 \u062F\u064A\u0645\u062A\u0631\u064A \u0628\u0634\u0627\u0631\u0629", department: "Higher Management", departmentAr: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0644\u064A\u0627", jobTitle: "Managing Partner", compNumber: "01103664555", sourceGroup: "corporate_sheet" },
  { id: "hb_002", code: "HB-002", username: "@noha.ghanem", nameEn: "Noha Ghanem", nameAr: "\u0646\u0647\u0649 \u063A\u0627\u0646\u0645", department: "Higher Management", departmentAr: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0644\u064A\u0627", jobTitle: "General Manager", compNumber: "01287162556", sourceGroup: "corporate_sheet" },
  { id: "hb_003", code: "HB-003", username: "@hatem.fattah", nameEn: "Hatem Abou Bakr Mohamed Abdel Fattah", nameAr: "\u062D\u0627\u062A\u0645 \u0623\u0628\u0648 \u0628\u0643\u0631 \u0645\u062D\u0645\u062F \u0639\u0628\u062F \u0627\u0644\u0641\u062A\u0627\u062D", department: "Finance", departmentAr: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629", jobTitle: "Financial Manager", compNumber: "01279081113", sourceGroup: "corporate_sheet" },
  { id: "hb_004", code: "HB-004", username: "@haytham.ibrahem", nameEn: "Haytham Hosny Abbas Ibrahem", nameAr: "\u0647\u064A\u062B\u0645 \u062D\u0633\u0646\u064A \u0639\u0628\u0627\u0633 \u0625\u0628\u0631\u0627\u0647\u064A\u0645", department: "Finance", departmentAr: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629", jobTitle: "Accounting Manager", compNumber: "01287162565", sourceGroup: "corporate_sheet" },
  { id: "hb_005", code: "HB-005", username: "@hossam.ahmed", nameEn: "Hossam Mohamed Ahmed Mohamed", nameAr: "\u062D\u0633\u0627\u0645 \u0645\u062D\u0645\u062F \u0623\u062D\u0645\u062F \u0645\u062D\u0645\u062F", department: "Finance", departmentAr: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629", jobTitle: "Accountant", compNumber: "01204168664", sourceGroup: "corporate_sheet" },
  { id: "hb_006", code: "HB-006", username: "@mohamed.tohamy", nameEn: "Mohamed Hassan Mohamed Tohamy", nameAr: "\u0645\u062D\u0645\u062F \u062D\u0633\u0646 \u0645\u062D\u0645\u062F \u062A\u0647\u0627\u0645\u064A", department: "Finance", departmentAr: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629", jobTitle: "Accountant", compNumber: "01279109994", sourceGroup: "corporate_sheet" },
  { id: "hb_007", code: "HB-007", username: "@abdelrahman.hatem", nameEn: "Abdel Rahman Hatem Mohamed Mohamed", nameAr: "\u0639\u0628\u062F \u0627\u0644\u0631\u062D\u0645\u0646 \u062D\u0627\u062A\u0645 \u0645\u062D\u0645\u062F \u0645\u062D\u0645\u062F", department: "Finance", departmentAr: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629", jobTitle: "Treasurer", compNumber: "01287162575", sourceGroup: "corporate_sheet" },
  { id: "hb_008", code: "HB-008", username: "@mohamed.refaat", nameEn: "Mohamed Refaat sayed ahmed", nameAr: "\u0645\u062D\u0645\u062F \u0631\u0641\u0639\u062A \u0633\u064A\u062F \u0623\u062D\u0645\u062F", department: "Finance", departmentAr: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629", jobTitle: "Accountant", compNumber: "01273334536", sourceGroup: "corporate_sheet" },
  { id: "hb_009", code: "HB-009", username: "@abdelrahman.morsy", nameEn: "Abdel Rahman Mohamed El Morsy", nameAr: "\u0639\u0628\u062F \u0627\u0644\u0631\u062D\u0645\u0646 \u0645\u062D\u0645\u062F \u0627\u0644\u0645\u0631\u0633\u064A", department: "Finance", departmentAr: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629", jobTitle: "Accountant", compNumber: "01149882219", sourceGroup: "corporate_sheet" },
  { id: "hb_010", code: "HB-010", username: "@ahmed.zakaria", nameEn: "Ahmed Zakaria Gamal", nameAr: "\u0623\u062D\u0645\u062F \u0632\u0643\u0631\u064A\u0627 \u062C\u0645\u0627\u0644", department: "Sales", departmentAr: "\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", jobTitle: "Area Sales Manager", compNumber: "01272775463", sourceGroup: "corporate_sheet" },
  { id: "hb_011", code: "HB-011", username: "@mostafa.atef", nameEn: "Mostafa Atef Abdel Fattah", nameAr: "\u0645\u0635\u0637\u0641\u0649 \u0639\u0627\u0637\u0641 \u0639\u0628\u062F \u0627\u0644\u0641\u062A\u0627\u062D", department: "Sales", departmentAr: "\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", jobTitle: "Area sales manager", compNumber: "01102452225", sourceGroup: "corporate_sheet" },
  { id: "hb_012", code: "HB-012", username: "@ahmed.badeaa", nameEn: "Ahmed Saied Abdelbadeaa", nameAr: "\u0623\u062D\u0645\u062F \u0633\u0639\u064A\u062F \u0639\u0628\u062F \u0627\u0644\u0628\u062F\u064A\u0639", department: "Sales", departmentAr: "\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", jobTitle: "Area sales manager", compNumber: "01155548766", sourceGroup: "corporate_sheet" },
  { id: "hb_013", code: "HB-013", username: "@nadine.mostafa", nameEn: "Nadine Mohamed Mostafa", nameAr: "\u0646\u0627\u062F\u064A\u0646 \u0645\u062D\u0645\u062F \u0645\u0635\u0637\u0641\u0649", department: "Sales", departmentAr: "\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", jobTitle: "Sales Coordinator", compNumber: "01050130494", sourceGroup: "corporate_sheet" },
  { id: "hb_014", code: "HB-014", username: "@mariam.mohamed", nameEn: "Mariam Mohamed", nameAr: "\u0645\u0631\u064A\u0645 \u0645\u062D\u0645\u062F", department: "Sales", departmentAr: "\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", jobTitle: "Marketing Specialist", compNumber: "01102382226", sourceGroup: "corporate_sheet" },
  { id: "hb_015", code: "HB-015", username: "@ahmed.saeed", nameEn: "Ahmed Saeed Ahmed", nameAr: "\u0623\u062D\u0645\u062F \u0633\u0639\u064A\u062F \u0623\u062D\u0645\u062F", department: "Sales", departmentAr: "\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", jobTitle: "Area sales manager", compNumber: "01288074334", sourceGroup: "corporate_sheet" },
  { id: "hb_016", code: "HB-016", username: "@antoine.monier", nameEn: "Antoine Sameh Monier", nameAr: "\u0623\u0646\u0637\u0648\u0627\u0646 \u0633\u0627\u0645\u062D \u0645\u0646\u064A\u0631", department: "Sales", departmentAr: "\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", jobTitle: "Area Sales Manager", compNumber: "01228572578", sourceGroup: "corporate_sheet" },
  { id: "hb_017", code: "HB-017", username: "@diana.rizkallah", nameEn: "Diana Bassem Berty Rizkallah", nameAr: "\u062F\u064A\u0627\u0646\u0627 \u0628\u0627\u0633\u0645 \u0628\u0631\u062A\u064A \u0631\u0632\u0642 \u0627\u0644\u0644\u0647", department: "Sales", departmentAr: "\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", jobTitle: "Business development manager", compNumber: "01272772590", sourceGroup: "corporate_sheet" },
  { id: "hb_018", code: "HB-018", username: "@mohamed.ashraf", nameEn: "Mohamed Ashraf", nameAr: "\u0645\u062D\u0645\u062F \u0623\u0634\u0631\u0641", department: "Sales", departmentAr: "\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", jobTitle: "Area Sales Manager", compNumber: "01159488000", sourceGroup: "corporate_sheet" },
  { id: "hb_019", code: "HB-019", username: "@monica.aziz", nameEn: "Monica Emad Aziz", nameAr: "\u0645\u0648\u0646\u064A\u0643\u0627 \u0639\u0645\u0627\u062F \u0639\u0632\u064A\u0632", department: "Purchases", departmentAr: "\u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0648\u0633\u0644\u0627\u0633\u0644 \u0627\u0644\u0625\u0645\u062F\u0627\u062F", jobTitle: "Senior Supply Chain Leader", compNumber: "01204168082", sourceGroup: "corporate_sheet" },
  { id: "hb_020", code: "HB-020", username: "@ayman.fanous", nameEn: "Ayman Fathy Azmy Fanous", nameAr: "\u0623\u064A\u0645\u0646 \u0641\u062A\u062D\u064A \u0639\u0632\u0645\u064A \u0641\u0627\u0646\u0648\u0633", department: "Purchases", departmentAr: "\u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0648\u0633\u0644\u0627\u0633\u0644 \u0627\u0644\u0625\u0645\u062F\u0627\u062F", jobTitle: "Senior Procurement Leader", compNumber: "01103751744", sourceGroup: "corporate_sheet" },
  { id: "hb_021", code: "HB-021", username: "@may.kamal", nameEn: "May Kamal", nameAr: "\u0645\u064A \u0643\u0645\u0627\u0644", department: "Purchases", departmentAr: "\u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0648\u0633\u0644\u0627\u0633\u0644 \u0627\u0644\u0625\u0645\u062F\u0627\u062F", jobTitle: "Supply Chain Leader", compNumber: "01019993429", sourceGroup: "corporate_sheet" },
  { id: "hb_022", code: "HB-022", username: "@rayan.kamal", nameEn: "Rayan Arafat Kamal", nameAr: "\u0631\u064A\u0627\u0646 \u0639\u0631\u0641\u0627\u062A \u0643\u0645\u0627\u0644", department: "Q.C", departmentAr: "\u0636\u0628\u0637 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u0645\u0639\u0645\u0644", jobTitle: "Q.C&Lab Manager", compNumber: "01103042996", sourceGroup: "corporate_sheet" },
  { id: "hb_023", code: "HB-023", username: "@khaled.ela", nameEn: "khaled Mostafa Ela", nameAr: "\u062E\u0627\u0644\u062F \u0645\u0635\u0637\u0641\u0649 \u0639\u0644\u0627\u0621", department: "Q.C", departmentAr: "\u0636\u0628\u0637 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u0645\u0639\u0645\u0644", jobTitle: "Technical Manager", compNumber: "01287162528", sourceGroup: "corporate_sheet" },
  { id: "hb_024", code: "HB-024", username: "@ahmed.adly", nameEn: "Ahmed Adly Fouad Mohamed", nameAr: "\u0623\u062D\u0645\u062F \u0639\u062F\u0644\u064A \u0641\u0624\u0627\u062F \u0645\u062D\u0645\u062F", department: "Administrative Affairs", departmentAr: "\u0627\u0644\u0634\u0624\u0648\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0628\u0634\u0631\u064A\u0629", jobTitle: "HR Manager", compNumber: "01274799290", sourceGroup: "corporate_sheet" },
  { id: "hb_025", code: "HB-025", username: "@ahmed.wahed", nameEn: "Ahmed Wahed Mahmoud", nameAr: "\u0623\u062D\u0645\u062F \u0648\u062D\u064A\u062F \u0645\u062D\u0645\u0648\u062F", department: "Administrative Affairs", departmentAr: "\u0627\u0644\u0634\u0624\u0648\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0628\u0634\u0631\u064A\u0629", jobTitle: "HR Specialist", compNumber: "01103611414", sourceGroup: "corporate_sheet" },
  { id: "hb_026", code: "HB-026", username: "@rania.rageb", nameEn: "Rania Rageb", nameAr: "\u0631\u0627\u0646\u064A\u0627 \u0631\u062C\u0628", department: "Administrative Affairs", departmentAr: "\u0627\u0644\u0634\u0624\u0648\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0628\u0634\u0631\u064A\u0629", jobTitle: "Talent Acquisition", compNumber: "01103042995", sourceGroup: "corporate_sheet" },
  { id: "hb_027", code: "HB-027", username: "@abdelhamed.shehata", nameEn: "Abdelhamed Mohamed Shehata", nameAr: "\u0639\u0628\u062F \u0627\u0644\u062D\u0645\u064A\u062F \u0645\u062D\u0645\u062F \u0634\u062D\u0627\u062A\u0629", department: "storehouse", departmentAr: "\u0627\u0644\u0645\u062E\u0627\u0632\u0646", jobTitle: "Warehouse Manager", compNumber: "01288073398", sourceGroup: "corporate_sheet" },
  { id: "hb_028", code: "HB-028", username: "@amr.elsayed", nameEn: "Amr Elsayed Sayed", nameAr: "\u0639\u0645\u0631\u0648 \u0627\u0644\u0633\u064A\u062F \u0633\u064A\u062F", department: "Collections Department", departmentAr: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u062D\u0635\u064A\u0644", jobTitle: "Collector", compNumber: "01103673600", sourceGroup: "corporate_sheet" },
  { id: "hb_029", code: "HB-029", username: "@salah.omar", nameEn: "Salah Eldin Omar", nameAr: "\u0635\u0644\u0627\u062D \u0627\u0644\u062F\u064A\u0646 \u0639\u0645\u0631", department: "Collections Department", departmentAr: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u062D\u0635\u064A\u0644", jobTitle: "Collector", compNumber: "01019993647", sourceGroup: "corporate_sheet" },
  { id: "hb_030", code: "HB-030", username: "@gamal.abdelnasser", nameEn: "Gamal Abdel Nasser Abdel Hamid", nameAr: "\u062C\u0645\u0627\u0644 \u0639\u0628\u062F \u0627\u0644\u0646\u0627\u0635\u0631 \u0639\u0628\u062F \u0627\u0644\u062D\u0645\u064A\u062F", department: "Collections Department", departmentAr: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u062D\u0635\u064A\u0644", jobTitle: "Collection Manager", compNumber: "01019993576", sourceGroup: "corporate_sheet" }
];
var PLANT_SEED_TOP_29 = [
  { code: "GER-001", nameAr: "\u0645/ \u0633\u0627\u0645\u062D \u0642\u0627\u0633\u0645 \u0627\u0644\u0634\u0646\u0627\u0648\u064A", departmentAr: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A \u0648\u0627\u0644\u062A\u0634\u063A\u064A\u0644", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0648\u0642\u0639 \u0648\u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0628\u0634\u0631\u064A\u0629", phone: "01198765432" },
  { code: "GER-002", nameAr: "\u0645/ \u062A\u0627\u0645\u0631 \u0639\u0628\u062F \u0627\u0644\u0639\u0627\u0644 \u0645\u0628\u0631\u0648\u0643", departmentAr: "\u0642\u0633\u0645 \u0627\u0644\u0623\u0641\u0631\u0627\u0646 \u0627\u0644\u062F\u0648\u0627\u0631\u0629 \u0648\u0627\u0644\u0643\u0644\u0646\u0643\u0631", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0631\u0626\u064A\u0633 \u0645\u0647\u0646\u062F\u0633\u064A \u0627\u0644\u0623\u0641\u0631\u0627\u0646", phone: "01011223341" },
  { code: "GER-003", nameAr: "\u0623\u062D\u0645\u062F \u0635\u0627\u0628\u0631 \u0627\u0644\u062F\u0633\u0648\u0642\u064A", departmentAr: "\u0642\u0633\u0645 \u0627\u0644\u0623\u0641\u0631\u0627\u0646 \u0627\u0644\u062F\u0648\u0627\u0631\u0629 \u0648\u0627\u0644\u0643\u0644\u0646\u0643\u0631", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0645\u0634\u0631\u0641 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0641\u0631\u0646 \u0631\u0642\u0645 1", phone: "01011223342" },
  { code: "GER-004", nameAr: "\u0645\u062D\u0645\u0648\u062F \u062C\u0627\u062F \u0627\u0644\u0643\u0631\u064A\u0645 \u0639\u0644\u064A", departmentAr: "\u0642\u0633\u0645 \u0627\u0644\u0623\u0641\u0631\u0627\u0646 \u0627\u0644\u062F\u0648\u0627\u0631\u0629 \u0648\u0627\u0644\u0643\u0644\u0646\u0643\u0631", shift: "\u0648\u0631\u062F\u064A\u0629 \u0645\u0633\u0627\u0626\u064A\u0629", jobTitle: "\u0641\u0646\u064A \u062A\u062D\u0643\u0645 \u062D\u0631\u0627\u0631\u064A", phone: "01011223343" },
  { code: "GER-005", nameAr: "\u0631\u0645\u0636\u0627\u0646 \u062D\u0633\u0646\u064A \u0627\u0644\u0628\u0634\u0628\u064A\u0634\u064A", departmentAr: "\u0642\u0633\u0645 \u0627\u0644\u0623\u0641\u0631\u0627\u0646 \u0627\u0644\u062F\u0648\u0627\u0631\u0629 \u0648\u0627\u0644\u0643\u0644\u0646\u0643\u0631", shift: "\u0648\u0631\u062F\u064A\u0629 \u0644\u064A\u0644\u064A\u0629", jobTitle: "\u0645\u0634\u063A\u0644 \u0631\u0627\u0641\u0639\u0629 \u0627\u0644\u0643\u0644\u0646\u0643\u0631", phone: "01011223344" },
  { code: "GER-006", nameAr: "\u0639\u0644\u0627\u0621 \u0625\u0633\u0645\u0627\u0639\u064A\u0644 \u0627\u0644\u0637\u0648\u062E\u064A", departmentAr: "\u0642\u0633\u0645 \u0627\u0644\u0623\u0641\u0631\u0627\u0646 \u0627\u0644\u062F\u0648\u0627\u0631\u0629 \u0648\u0627\u0644\u0643\u0644\u0646\u0643\u0631", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0641\u0646\u064A \u0635\u064A\u0627\u0646\u0629 \u062D\u0631\u0627\u0631\u064A\u0627\u062A", phone: "01011223345" },
  { code: "GER-007", nameAr: "\u0633\u064A\u062F \u0639\u0628\u062F \u0627\u0644\u0641\u062A\u0627\u062D \u0645\u0631\u0633\u064A", departmentAr: "\u0642\u0633\u0645 \u0627\u0644\u0623\u0641\u0631\u0627\u0646 \u0627\u0644\u062F\u0648\u0627\u0631\u0629 \u0648\u0627\u0644\u0643\u0644\u0646\u0643\u0631", shift: "\u0648\u0631\u062F\u064A\u0629 \u0645\u0633\u0627\u0626\u064A\u0629", jobTitle: "\u0645\u0633\u0627\u0639\u062F \u0645\u0634\u063A\u0644 \u0623\u0641\u0631\u0627\u0646", phone: "01011223346" },
  { code: "GER-008", nameAr: "\u0625\u0628\u0631\u0627\u0647\u064A\u0645 \u0634\u0648\u0642\u064A \u0631\u0636\u0648\u0627\u0646", departmentAr: "\u0642\u0633\u0645 \u0637\u0648\u0627\u062D\u064A\u0646 \u0627\u0644\u0623\u0633\u0645\u0646\u062A", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0645\u0634\u0631\u0641 \u0637\u0648\u0627\u062D\u064A\u0646 \u0627\u0644\u062E\u0627\u0645", phone: "01011223347" },
  { code: "GER-009", nameAr: "\u0648\u0644\u064A\u062F \u0639\u0628\u062F \u0627\u0644\u0648\u0647\u0627\u0628 \u0631\u0634\u0627\u062F", departmentAr: "\u0642\u0633\u0645 \u0637\u0648\u0627\u062D\u064A\u0646 \u0627\u0644\u0623\u0633\u0645\u0646\u062A", shift: "\u0648\u0631\u062F\u064A\u0629 \u0645\u0633\u0627\u0626\u064A\u0629", jobTitle: "\u0641\u0646\u064A \u0637\u0648\u0627\u062D\u064A\u0646 \u0623\u0633\u0645\u0646\u062A \u0628\u0648\u0631\u062A\u0644\u0627\u0646\u062F\u064A", phone: "01011223348" },
  { code: "GER-010", nameAr: "\u062D\u0633\u0646 \u0645\u062A\u0648\u0644\u064A \u0627\u0644\u0634\u0631\u0642\u0627\u0648\u064A", departmentAr: "\u0642\u0633\u0645 \u0637\u0648\u0627\u062D\u064A\u0646 \u0627\u0644\u0623\u0633\u0645\u0646\u062A", shift: "\u0648\u0631\u062F\u064A\u0629 \u0644\u064A\u0644\u064A\u0629", jobTitle: "\u0645\u0634\u063A\u0644 \u0633\u064A\u0648\u0631 \u0646\u0642\u0644 \u0627\u0644\u062D\u062C\u0631 \u0627\u0644\u062C\u064A\u0631\u064A", phone: "01011223349" },
  { code: "GER-011", nameAr: "\u0645/ \u062E\u0627\u0644\u062F \u0639\u0628\u062F \u0627\u0644\u0645\u0646\u0639\u0645 \u062F\u0631\u0648\u064A\u0634", departmentAr: "\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629 \u0648\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0645\u062F\u064A\u0631 \u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u0629", phone: "01011223350" },
  { code: "GER-012", nameAr: "\u0637\u0627\u0631\u0642 \u0645\u0635\u0637\u0641\u0649 \u0627\u0644\u0628\u0646\u062F\u0627\u0631\u064A", departmentAr: "\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629 \u0648\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0645\u0647\u0646\u062F\u0633 \u0643\u0647\u0631\u0628\u0627\u0621 \u062C\u0647\u062F \u0645\u062A\u0648\u0633\u0637", phone: "01011223351" },
  { code: "GER-013", nameAr: "\u0639\u0635\u0627\u0645 \u0645\u062C\u062F\u064A \u0627\u0644\u0646\u062C\u0627\u0631", departmentAr: "\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629 \u0648\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0641\u0646\u064A \u0645\u064A\u0643\u0627\u0646\u064A\u0643\u0627 \u0647\u064A\u062F\u0631\u0648\u0644\u064A\u0643", phone: "01011223352" },
  { code: "GER-014", nameAr: "\u0633\u0627\u0645\u062D \u0644\u0637\u0641\u064A \u0627\u0644\u0628\u062D\u064A\u0631\u064A", departmentAr: "\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629 \u0648\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0645\u0633\u0627\u0626\u064A\u0629", jobTitle: "\u0641\u0646\u064A \u0644\u062D\u0627\u0645 \u0636\u063A\u0637 \u0639\u0627\u0644\u064A", phone: "01011223353" },
  { code: "GER-015", nameAr: "\u0645\u062F\u062D\u062A \u0633\u0645\u064A\u0631 \u0632\u0643\u0631\u064A\u0627", departmentAr: "\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629 \u0648\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0644\u064A\u0644\u064A\u0629", jobTitle: "\u0641\u0646\u064A \u0623\u062C\u0647\u0632\u0629 \u0642\u064A\u0627\u0633 \u0648\u062A\u062D\u0643\u0645 PLC", phone: "01011223354" },
  { code: "GER-016", nameAr: "\u0647\u0627\u0646\u064A \u0641\u0631\u064A\u062F \u063A\u0628\u0627\u0634\u064A", departmentAr: "\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629 \u0648\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0641\u0646\u064A \u062A\u0632\u064A\u064A\u062A \u0648\u062A\u0634\u062D\u064A\u0645 \u062A\u0631\u0648\u0633", phone: "01011223355" },
  { code: "GER-017", nameAr: "\u064A\u0627\u0633\u0631 \u0645\u062D\u0645\u062F \u0627\u0644\u062C\u0632\u0627\u0631", departmentAr: "\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629 \u0648\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0645\u0633\u0627\u0626\u064A\u0629", jobTitle: "\u0641\u0646\u064A \u062A\u0628\u0631\u064A\u062F \u0648\u062A\u0643\u064A\u064A\u0641 \u0635\u0646\u0627\u0639\u064A", phone: "01011223356" },
  { code: "GER-018", nameAr: "\u0639\u0645\u0631\u0648 \u0631\u0634\u0627\u062F \u0647\u0646\u062F\u0627\u0648\u064A", departmentAr: "\u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A\u0629 \u0648\u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0626\u064A\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0644\u064A\u0644\u064A\u0629", jobTitle: "\u0641\u0646\u064A \u0637\u0648\u0627\u0631\u0626 \u0635\u064A\u0627\u0646\u0629 \u0644\u064A\u0644\u064A\u0629", phone: "01011223357" },
  { code: "GER-019", nameAr: "\u0623\u0634\u0631\u0641 \u0639\u0628\u062F \u0627\u0644\u0639\u0632\u064A\u0632 \u0627\u0644\u0641\u064A\u0648\u0645\u064A", departmentAr: "\u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0627\u062A \u0648\u0645\u062D\u0637\u0629 \u0627\u0644\u062A\u0639\u0628\u0626\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0645\u062F\u064A\u0631 \u0645\u062D\u0637\u0629 \u062A\u0639\u0628\u0626\u0629 \u0627\u0644\u0623\u0633\u0645\u0646\u062A \u0627\u0644\u0633\u0627\u0626\u0628 \u0648\u0627\u0644\u0645\u0643\u064A\u0633", phone: "01011223358" },
  { code: "GER-020", nameAr: "\u0645\u062C\u062F\u064A \u0646\u0628\u064A\u0644 \u0639\u062B\u0645\u0627\u0646", departmentAr: "\u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0627\u062A \u0648\u0645\u062D\u0637\u0629 \u0627\u0644\u062A\u0639\u0628\u0626\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0645\u0634\u0631\u0641 \u0645\u0648\u0627\u0632\u064A\u0646 \u0634\u0627\u062D\u0646\u0627\u062A \u0627\u0644\u062A\u0635\u062F\u064A\u0631", phone: "01011223359" },
  { code: "GER-021", nameAr: "\u0646\u0628\u064A\u0644 \u062D\u0627\u0645\u062F \u0628\u062F\u0648\u064A", departmentAr: "\u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0627\u062A \u0648\u0645\u062D\u0637\u0629 \u0627\u0644\u062A\u0639\u0628\u0626\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0645\u0633\u0627\u0626\u064A\u0629", jobTitle: "\u0645\u0634\u063A\u0644 \u0645\u0627\u0643\u064A\u0646\u0629 \u0627\u0644\u062A\u0639\u0628\u0626\u0629 \u0631\u0648\u062A\u0648 \u0628\u0627\u0643\u0631", phone: "01011223360" },
  { code: "GER-022", nameAr: "\u0635\u0644\u0627\u062D \u0643\u0645\u0627\u0644 \u0627\u0644\u0645\u0646\u0634\u0627\u0648\u064A", departmentAr: "\u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0627\u062A \u0648\u0645\u062D\u0637\u0629 \u0627\u0644\u062A\u0639\u0628\u0626\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0644\u064A\u0644\u064A\u0629", jobTitle: "\u0633\u0627\u0626\u0642 \u0641\u0648\u0631\u0643\u0644\u0641\u062A \u0634\u062D\u0646 \u0634\u0627\u062D\u0646\u0627\u062A", phone: "01011223361" },
  { code: "GER-023", nameAr: "\u0639\u0627\u062F\u0644 \u064A\u0648\u0633\u0641 \u0627\u0644\u0628\u0631\u0646\u0633", departmentAr: "\u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0627\u062A \u0648\u0645\u062D\u0637\u0629 \u0627\u0644\u062A\u0639\u0628\u0626\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0623\u0645\u064A\u0646 \u0645\u062E\u0627\u0632\u0646 \u0642\u0637\u0639 \u0627\u0644\u063A\u064A\u0627\u0631", phone: "01011223362" },
  { code: "GER-024", nameAr: "\u0628\u0627\u0633\u0645 \u0641\u0648\u0632\u064A \u0627\u0644\u062C\u0646\u062F\u064A", departmentAr: "\u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0627\u062A \u0648\u0645\u062D\u0637\u0629 \u0627\u0644\u062A\u0639\u0628\u0626\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0645\u0633\u0627\u0626\u064A\u0629", jobTitle: "\u0645\u0633\u0624\u0648\u0644 \u0645\u064A\u0632\u0627\u0646 \u0628\u064A\u0644\u062A \u0643\u0648\u0646\u062A\u064A\u0646\u064A\u0648\u0633", phone: "01011223363" },
  { code: "GER-025", nameAr: "\u0643\u064A\u0645\u064A\u0627\u0626\u064A/ \u0645\u0631\u0648\u0627\u0646 \u0634\u0627\u0643\u0631 \u0632\u064A\u062F\u0627\u0646", departmentAr: "\u0645\u062E\u062A\u0628\u0631 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u062A\u062D\u0627\u0644\u064A\u0644 \u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0626\u064A\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0645\u062F\u064A\u0631 \u062A\u0648\u0643\u064A\u062F \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u0645\u062E\u062A\u0628\u0631\u0627\u062A", phone: "01011223364" },
  { code: "GER-026", nameAr: "\u0643\u064A\u0645\u064A\u0627\u0626\u064A/ \u0625\u0633\u0644\u0627\u0645 \u0646\u0635\u0631 \u0627\u0644\u062F\u064A\u0646", departmentAr: "\u0645\u062E\u062A\u0628\u0631 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u062A\u062D\u0627\u0644\u064A\u0644 \u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0626\u064A\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0643\u064A\u0645\u064A\u0627\u0626\u064A \u062A\u062D\u0644\u064A\u0644 \u0639\u064A\u0646\u0627\u062A \u0627\u0644\u0643\u0644\u0646\u0643\u0631 \u0648\u0627\u0644\u062C\u0628\u0633", phone: "01011223365" },
  { code: "GER-027", nameAr: "\u0623\u062D\u0645\u062F \u0645\u0627\u0647\u0631 \u0627\u0644\u0634\u0631\u0628\u064A\u0646\u064A", departmentAr: "\u0645\u062E\u062A\u0628\u0631 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0627\u0644\u062A\u062D\u0627\u0644\u064A\u0644 \u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0626\u064A\u0629", shift: "\u0648\u0631\u062F\u064A\u0629 \u0645\u0633\u0627\u0626\u064A\u0629", jobTitle: "\u0641\u0646\u064A \u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0645\u0642\u0627\u0648\u0645\u0629 \u0627\u0644\u0636\u063A\u0637 \u0648\u0627\u0644\u0646\u0639\u0648\u0645\u0629", phone: "01011223366" },
  { code: "GER-028", nameAr: "\u0645/ \u062A\u0627\u0645\u0631 \u0648\u062C\u064A\u0647 \u0633\u0644\u0627\u0645\u0629", departmentAr: "\u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u0635\u062D\u0629 \u0627\u0644\u0645\u0647\u0646\u064A\u0629 HSE", shift: "\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", jobTitle: "\u0645\u062F\u064A\u0631 \u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u0628\u064A\u0626\u0629 \u0648\u0645\u0637\u0627\u0628\u0642\u0629 HACCP", phone: "01011223367" },
  { code: "GER-029", nameAr: "\u0634\u0631\u064A\u0641 \u0645\u062C\u062F\u064A \u0639\u0628\u062F \u0627\u0644\u0646\u0628\u064A", departmentAr: "\u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u0635\u062D\u0629 \u0627\u0644\u0645\u0647\u0646\u064A\u0629 HSE", shift: "\u0648\u0631\u062F\u064A\u0629 \u0645\u0633\u0627\u0626\u064A\u0629", jobTitle: "\u0645\u0641\u062A\u0634 \u0633\u0644\u0627\u0645\u0629 \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u0628\u064A\u0626\u064A\u0629 \u0628\u0627\u0644\u0645\u0648\u0642\u0639", phone: "01011223368" }
];
var FIRST_NAMES = ["\u0645\u062D\u0645\u0648\u062F", "\u0639\u0644\u064A", "\u062D\u0633\u064A\u0646", "\u0633\u0639\u064A\u062F", "\u0645\u0635\u0637\u0641\u0649", "\u0634\u0631\u064A\u0641", "\u0643\u0631\u064A\u0645", "\u064A\u0627\u0633\u064A\u0646", "\u0639\u0644\u0627\u0621", "\u0639\u0627\u0637\u0641", "\u0636\u064A\u0627\u0621", "\u0647\u064A\u062B\u0645", "\u0623\u064A\u0645\u0646", "\u0635\u0644\u0627\u062D"];
var MID_NAMES = ["\u0639\u0628\u062F \u0627\u0644\u0631\u062D\u0645\u0646", "\u0641\u062A\u062D\u064A", "\u0625\u0633\u0645\u0627\u0639\u064A\u0644", "\u0639\u062B\u0645\u0627\u0646", "\u0627\u0644\u0628\u062F\u0631\u064A", "\u0631\u0645\u0636\u0627\u0646", "\u0634\u0639\u0628\u0627\u0646", "\u0627\u0644\u0633\u064A\u062F", "\u062C\u0644\u0627\u0644", "\u0641\u0627\u0631\u0648\u0642", "\u0645\u0645\u062F\u0648\u062D"];
var FAMILIES = ["\u0627\u0644\u0645\u0635\u0631\u064A", "\u0627\u0644\u0647\u0644\u0627\u0644\u064A", "\u0627\u0644\u0634\u0646\u0627\u0648\u064A", "\u0627\u0644\u0633\u0648\u064A\u0633\u064A", "\u0627\u0644\u0645\u0646\u0648\u0641\u064A", "\u0627\u0644\u0635\u0639\u064A\u062F\u064A", "\u0627\u0644\u0634\u0631\u0642\u0627\u0648\u064A", "\u0627\u0644\u0628\u062D\u064A\u0631\u064A", "\u0627\u0644\u062F\u0645\u064A\u0627\u0637\u064A", "\u0627\u0644\u062F\u064A\u0628"];
var PLANT_DEPTS = [
  "\u062E\u0637 \u0627\u0644\u0625\u0646\u062A\u0627\u062C \u0627\u0644\u0631\u0626\u064A\u0633\u064A 1",
  "\u0642\u0633\u0645 \u0627\u0644\u0623\u0641\u0631\u0627\u0646 \u0648\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u062E\u0627\u0645",
  "\u0642\u0637\u0627\u0639 \u0627\u0644\u0645\u062D\u0627\u062C\u0631 \u0648\u0633\u062D\u0642 \u0627\u0644\u062D\u062C\u0631",
  "\u0637\u0648\u0627\u062D\u064A\u0646 \u0627\u0644\u0623\u0633\u0645\u0646\u062A \u0648\u0627\u0644\u0633\u064A\u0644\u0648\u0647\u0627\u062A",
  "\u0627\u0644\u0634\u062D\u0646 \u0648\u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u062F\u0627\u062E\u0644\u064A",
  "\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0645\u0639\u0627\u0648\u0646\u0629 \u0648\u0627\u0644\u0645\u0631\u0627\u0641\u0642"
];
var PLANT_SHIFTS = ["\u0648\u0631\u062F\u064A\u0629 \u0635\u0628\u0627\u062D\u064A\u0629", "\u0648\u0631\u062F\u064A\u0629 \u0645\u0633\u0627\u0626\u064A\u0629", "\u0648\u0631\u062F\u064A\u0629 \u0644\u064A\u0644\u064A\u0629"];
var PLANT_56_OPS = Array.from({ length: 56 }, (_, i) => {
  if (i < PLANT_SEED_TOP_29.length) {
    const g = PLANT_SEED_TOP_29[i];
    return {
      id: `hb_ops_${i + 31}`,
      code: `HB-${String(i + 31).padStart(3, "0")}`,
      username: `@${g.code.toLowerCase()}`,
      nameEn: `${g.code} Staff (${g.jobTitle})`,
      nameAr: g.nameAr,
      department: "Plant Operations & Production",
      departmentAr: g.departmentAr,
      jobTitle: `${g.jobTitle} (${g.shift})`,
      compNumber: g.phone,
      sourceGroup: "plant_operations"
    };
  }
  const idx = i - PLANT_SEED_TOP_29.length;
  const num = idx + 30;
  const gerCode = `GER-${String(num).padStart(3, "0")}`;
  const dept = PLANT_DEPTS[idx % PLANT_DEPTS.length];
  const shift = PLANT_SHIFTS[idx % PLANT_SHIFTS.length];
  const jobTitle = `\u0641\u0646\u064A \u062A\u0634\u063A\u064A\u0644 ${dept.split(" ")[0]}`;
  return {
    id: `hb_ops_${i + 31}`,
    code: `HB-${String(i + 31).padStart(3, "0")}`,
    username: `@${gerCode.toLowerCase()}`,
    nameEn: `${gerCode} Staff (${jobTitle})`,
    nameAr: `${FIRST_NAMES[idx % FIRST_NAMES.length]} ${MID_NAMES[idx * 3 % MID_NAMES.length]} ${FAMILIES[idx * 7 % FAMILIES.length]}`,
    department: "Plant Operations & Production",
    departmentAr: dept,
    jobTitle: `${jobTitle} (${shift})`,
    compNumber: `010112233${70 + idx % 30}`,
    sourceGroup: "plant_operations"
  };
});
var HABE_EGYPT_EMPLOYEES = [
  ...HABE_CORPORATE_SHEET_30,
  ...PLANT_56_OPS
];
var CORPORATE_HABE_EMPLOYEES = HABE_EGYPT_EMPLOYEES;
var HABE_PRICE_CATALOG = [
  // Breakfast (49 EGP)
  { id: "cbk_01", code: "CBK-01", nameAr: "\u0641\u0648\u0644 \u0628\u0627\u0644\u0632\u064A\u062A \u0648\u0627\u0644\u0637\u062D\u064A\u0646\u0629 + \u062C\u0628\u0646\u0629 \u0628\u0627\u0644\u062E\u0644\u0637\u0629 + 1 \u0628\u064A\u0636\u0629 \u0645\u0633\u0644\u0648\u0642\u0629 + \u0637\u0631\u0634\u064A + 3 \u0623\u0631\u063A\u0641\u0629 \u062E\u0628\u0632 \u0641\u0627\u062E\u0631 \u0643\u0628\u064A\u0631", nameEn: "Corporate Breakfast CBK-01", priceEGP: 49, category: "breakfast" },
  { id: "cbk_02", code: "CBK-02", nameAr: "\u0641\u0648\u0644 \u0628\u0627\u0644\u0632\u064A\u062A \u0648\u0627\u0644\u0637\u062D\u064A\u0646\u0629 + \u0639\u0644\u0628\u0629 \u0644\u0628\u0646\u0629 \u0628\u0627\u0644\u0632\u0639\u062A\u0631 \u0648\u0627\u0644\u0628\u0642\u062F\u0648\u0646\u0633 + \u0628\u0648\u0631\u0634\u0646 \u0645\u0631\u0628\u0649 + \u0645\u062E\u0644\u0644 + 3 \u0623\u0631\u063A\u0641\u0629 \u062E\u0628\u0632", nameEn: "Corporate Breakfast CBK-02", priceEGP: 49, category: "breakfast" },
  { id: "cbk_03", code: "CBK-03", nameAr: "\u0641\u0648\u0644 \u0628\u0627\u0644\u0632\u064A\u062A \u0648\u0627\u0644\u0644\u064A\u0645\u0648\u0646 + \u0637\u0627\u062C\u0646 \u0645\u0633\u0642\u0639\u0629 + \u0645\u062E\u0644\u0644 + 3 \u0623\u0631\u063A\u0641\u0629 \u062E\u0628\u0632 \u0641\u0627\u062E\u0631 \u0643\u0628\u064A\u0631", nameEn: "Corporate Breakfast CBK-03", priceEGP: 49, category: "breakfast" },
  { id: "cbk_04", code: "CBK-04", nameAr: "\u0641\u0648\u0644 \u0628\u0631\u0627\u0626\u062D\u0629 \u0627\u0644\u0632\u0628\u062F\u0629 \u0627\u0644\u0628\u0644\u062F\u064A + \u0637\u0627\u062C\u0646 \u0628\u0637\u0627\u0637\u0633 \u0628\u0648\u0631\u064A\u0647 + \u0645\u062E\u0644\u0644 + 3 \u0623\u0631\u063A\u0641\u0629 \u062E\u0628\u0632 \u0641\u0627\u062E\u0631 \u0643\u0628\u064A\u0631", nameEn: "Corporate Breakfast CBK-04", priceEGP: 49, category: "breakfast" },
  { id: "cbk_05", code: "CBK-05", nameAr: "\u0641\u0648\u0644 \u0628\u0627\u0644\u0632\u064A\u062A \u0648\u0627\u0644\u0637\u062D\u064A\u0646\u0629 + \u062C\u0628\u0646\u0629 \u0641\u064A\u062A\u0627 + \u062F\u0648\u0645\u062A\u064A \u0628\u0644\u0633 80 \u062C\u0645 + \u0628\u064A\u0636\u0629 \u0645\u0633\u0644\u0648\u0642\u0629 + 3 \u0623\u0631\u063A\u0641\u0629 \u062E\u0628\u0632", nameEn: "Corporate Breakfast CBK-05", priceEGP: 49, category: "breakfast" },
  // Economy Lunch (92 EGP)
  { id: "fct_01", code: "FCT-01", nameAr: "\u0641\u0631\u0627\u062E \u0631\u0648\u0633\u062A\u0648 + \u0623\u0631\u0632 \u0623\u0628\u064A\u0636 \u0628\u0627\u0644\u0634\u0639\u0631\u064A\u0629 \u0645\u0641\u0644\u0641\u0644 + \u062A\u0648\u0631\u0644\u064A \u0628\u0627\u0644\u0635\u0644\u0635\u0629 + \u062E\u0628\u0632 + \u0645\u062E\u0644\u0644 + \u0633\u0644\u0637\u0629 \u0628\u062F\u0648\u0646 \u0637\u0645\u0627\u0637\u0645", nameEn: "Roast Chicken Meal", priceEGP: 92, category: "lunch" },
  { id: "fct_02", code: "FCT-02", nameAr: "\u062F\u0627\u0648\u0648\u062F \u0628\u0627\u0634\u0627 \u0628\u0627\u0644\u0635\u0648\u0635 + \u0623\u0631\u0632 \u0628\u0627\u0644\u0634\u0639\u0631\u064A\u0629 + \u0628\u0637\u0627\u0637\u0633 \u0628\u0635\u0648\u0635 \u0627\u0644\u062F\u0627\u0648\u062F \u0628\u0627\u0634\u0627 + \u062E\u064A\u0627\u0631 + \u062E\u0628\u0632 + \u0645\u062E\u0644\u0644", nameEn: "Dawood Pasha Meatballs", priceEGP: 92, category: "lunch" },
  { id: "fct_04", code: "FCT-04", nameAr: "120 \u062C\u0645 \u0643\u0641\u062A\u0629 \u0645\u0634\u0648\u064A\u0629 + \u0623\u0631\u0632 \u0628\u0633\u0645\u062A\u064A \u0623\u0635\u0641\u0631 + \u0628\u0637\u0627\u0637\u0633 \u0628\u0648\u0645 \u0641\u0631\u064A\u062A + \u062E\u064A\u0627\u0631 + \u0637\u062D\u064A\u0646\u0629 + \u062E\u0628\u0632", nameEn: "120g Charcoal Kofta", priceEGP: 92, category: "lunch" },
  { id: "fct_05", code: "FCT-05", nameAr: "120 \u062C\u0645 \u0634\u064A\u0634 \u0639\u0644\u0649 \u0627\u0644\u0641\u062D\u0645 + \u0623\u0631\u0632 \u0628\u0633\u0645\u062A\u064A \u0623\u0635\u0641\u0631 + \u0628\u0637\u0627\u0637\u0633 \u0628\u0648\u0645 \u0641\u0631\u064A\u062A + \u062E\u064A\u0627\u0631 + \u0637\u062D\u064A\u0646\u0629 + \u062E\u0628\u0632", nameEn: "120g Charcoal Shish Tawook", priceEGP: 92, category: "lunch" },
  { id: "fct_06", code: "FCT-06", nameAr: "\u0641\u0631\u0627\u062E \u0645\u0634\u0648\u064A\u0629 (\u0631\u0628\u0639 \u0635\u062F\u0631 \u0623\u0648 \u0648\u0631\u0643) + \u0623\u0631\u0632 \u0628\u0633\u0645\u062A\u064A \u0623\u0635\u0641\u0631 + \u0628\u0637\u0627\u0637\u0633 \u0628\u0648\u0645 \u0641\u0631\u064A\u062A + \u0637\u062D\u064A\u0646\u0629 + \u062E\u0628\u0632", nameEn: "Charcoal Quarter Chicken", priceEGP: 92, category: "lunch" },
  // Sahar Meals
  { id: "shr_01", code: "SHR-01", nameAr: "\u0637\u0627\u062C\u0646 \u0645\u0639\u0643\u0631\u0648\u0646\u0629 \u0633\u0627\u062E\u0646 \u0628\u0635\u0648\u0635 \u0627\u0644\u062C\u0628\u0646 \u0627\u0644\u0634\u064A\u062F\u0631 \u0648\u0627\u0644\u0643\u0628\u062F\u0629 \u0627\u0644\u0628\u0644\u062F\u064A \u0648\u0627\u0644\u0633\u062C\u0642", nameEn: "Sahar Special Pasta Bake", priceEGP: 95, category: "sahar_meals" },
  { id: "shr_02", code: "SHR-02", nameAr: "\u0645\u0643\u0633 \u062C\u0631\u064A\u0644 \u0627\u0644\u0633\u062D\u0631 (\u0643\u0641\u062A\u0629 \u0627\u0644\u062D\u0627\u062A\u064A + \u0634\u064A\u0634 \u0637\u0627\u0648\u0648\u0642 + \u0645\u062D\u0634\u064A \u0648\u0631\u0642 \u0639\u0646\u0628 + \u0623\u0631\u0632 \u0623\u0635\u0641\u0631)", nameEn: "Sahar Mixed Grill Feast", priceEGP: 125, category: "sahar_meals" },
  { id: "shr_03", code: "SHR-03", nameAr: "\u0633\u062A\u064A\u0643 \u0644\u062D\u0645 \u0628\u062A\u0644\u0648 \u0645\u0634\u0648\u064A \u0628\u0635\u0648\u0635 \u0627\u0644\u0645\u0634\u0631\u0648\u0645 \u0627\u0644\u062F\u064A\u0645\u064A \u062C\u0644\u0627\u0633 + \u0623\u0631\u0632 \u0623\u0628\u064A\u0636 \u0648\u062E\u0636\u0627\u0631 \u0633\u0648\u062A\u064A\u0647", nameEn: "Sahar Executive Veal Steak", priceEGP: 145, category: "sahar_meals" },
  // Pastries (37 EGP)
  { id: "pst_01", code: "PST-01", nameAr: "\u0628\u0627\u062A\u064A\u0647 \u0643\u0628\u064A\u0631 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A \u0628\u0627\u0644\u062E\u0636\u0627\u0631", nameEn: "Large Puff Pate Roumy", priceEGP: 37, category: "pastries" },
  { id: "pst_02", code: "PST-02", nameAr: "\u0628\u0627\u062A\u064A\u0647 \u0643\u0628\u064A\u0631 \u062C\u0628\u0646\u0629 \u0648\u0632\u064A\u062A\u0648\u0646", nameEn: "Large Puff Pate Cheese Olives", priceEGP: 37, category: "pastries" },
  { id: "pst_03", code: "PST-03", nameAr: "\u0643\u0631\u0648\u0627\u0633\u0648\u0646 \u0643\u0628\u064A\u0631 \u0633\u0627\u062F\u0629 \u0628\u0627\u0644\u0632\u0628\u062F\u0629", nameEn: "Large Plain Butter Croissant", priceEGP: 37, category: "pastries" },
  { id: "pst_04", code: "PST-04", nameAr: "\u0643\u0631\u0648\u0627\u0633\u0648\u0646 \u0643\u0628\u064A\u0631 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A", nameEn: "Large Roumy Cheese Croissant", priceEGP: 37, category: "pastries" },
  { id: "pst_05", code: "PST-05", nameAr: "\u0631\u0648\u0644 \u0628\u0627\u062A\u064A\u0647 \u0628\u0627\u0644\u062C\u0628\u0646\u0629 \u0648\u0627\u0644\u062E\u0636\u0627\u0631", nameEn: "Cheese & Vegetable Roll Pastry", priceEGP: 37, category: "pastries" },
  // Koshary, Pizza, Crepe
  { id: "ksh_01", code: "K-01", nameAr: "\u0643\u0634\u0631\u064A \u0645\u0635\u0631\u064A \u0645\u0645\u062A\u0627\u0632 (\u062D\u062C\u0645 \u0648\u0633\u0637)", nameEn: "Egyptian Koshary Medium", priceEGP: 40, category: "koshary_pizza_crepe" },
  { id: "ksh_02", code: "K-02", nameAr: "\u0643\u0634\u0631\u064A \u0645\u0635\u0631\u064A \u0645\u0645\u062A\u0627\u0632 (\u062D\u062C\u0645 \u0643\u0628\u064A\u0631)", nameEn: "Egyptian Koshary Large", priceEGP: 48, category: "koshary_pizza_crepe" },
  { id: "ksh_03", code: "K-03", nameAr: "\u0643\u0634\u0631\u064A \u0645\u0635\u0631\u064A \u0645\u0645\u062A\u0627\u0632 (\u062D\u062C\u0645 \u0639\u0627\u0626\u0644\u064A / \u062C\u0627\u0645\u0628\u0648)", nameEn: "Egyptian Koshary Jumbo", priceEGP: 58, category: "koshary_pizza_crepe" },
  { id: "sl_01", code: "SL-01", nameAr: "2 \u0642\u0637\u0639\u0629 \u0628\u064A\u062A\u0632\u0627 (\u0633\u0644\u0627\u064A\u0632) \u0645\u0627\u0631\u062C\u0631\u064A\u062A\u0627", nameEn: "2 Margherita Pizza Slices", priceEGP: 58, category: "koshary_pizza_crepe" },
  { id: "sl_02", code: "SL-02", nameAr: "2 \u0642\u0637\u0639\u0629 \u0628\u064A\u062A\u0632\u0627 (\u0633\u0644\u0627\u064A\u0632) \u0644\u062D\u0645\u0629 \u0645\u0641\u0631\u0648\u0645\u0629", nameEn: "2 Minced Beef Pizza Slices", priceEGP: 58, category: "koshary_pizza_crepe" },
  { id: "sl_03", code: "SL-03", nameAr: "2 \u0642\u0637\u0639\u0629 \u0628\u064A\u062A\u0632\u0627 (\u0633\u0644\u0627\u064A\u0632) \u0641\u0631\u0627\u062E", nameEn: "2 Chicken Pizza Slices", priceEGP: 58, category: "koshary_pizza_crepe" },
  { id: "pz_or_full", code: "PZ-OR", nameAr: "\u0628\u064A\u062A\u0632\u0627 \u0634\u0631\u0642\u064A \u0643\u0627\u0645\u0644\u0629 (\u0641\u0637\u064A\u0631 \u0634\u0631\u0642\u064A \u0645\u062D\u0634\u0648 \u0643\u0627\u0645\u0644)", nameEn: "Full Oriental Stuffed Pizza", priceEGP: 180, category: "koshary_pizza_crepe" },
  { id: "pz_it_full", code: "PZ-IT", nameAr: "\u0628\u064A\u062A\u0632\u0627 \u0625\u064A\u0637\u0627\u0644\u064A \u0643\u0627\u0645\u0644\u0629 (Whole Italian Pizza)", nameEn: "Full Italian Stone-Baked Pizza", priceEGP: 170, category: "koshary_pizza_crepe" },
  { id: "crp_01", code: "CRP-01", nameAr: "\u0643\u0631\u064A\u0628 \u0637\u0627\u0632\u062C \u0633\u0627\u062E\u0646 (\u0642\u0637\u0639\u0629 \u0648\u0627\u062D\u062F\u0629 \u0643\u0627\u0645\u0644\u0629)", nameEn: "Fresh Savory Crepe", priceEGP: 80, category: "koshary_pizza_crepe" },
  // Sandwiches
  { id: "snd_01", code: "SND-01", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0641\u0648\u0644", nameEn: "Foul Sandwich", priceEGP: 12, category: "sandwiches" },
  { id: "snd_02", code: "SND-02", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0637\u0639\u0645\u064A\u0629", nameEn: "Taameya Sandwich", priceEGP: 12, category: "sandwiches" },
  { id: "snd_03", code: "SND-03", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u062C\u0628\u0646\u0629", nameEn: "White Cheese Sandwich", priceEGP: 15, category: "sandwiches" },
  { id: "snd_04", code: "SND-04", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u062C\u0628\u0646\u0629 \u0628\u0627\u0644\u062E\u0644\u0637\u0629", nameEn: "Spiced Cheese Mix Sandwich", priceEGP: 15, category: "sandwiches" },
  { id: "snd_05", code: "SND-05", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u062C\u0628\u0646\u0629 \u0643\u064A\u0631\u064A (\u0641\u064A\u0646\u0648)", nameEn: "Kiri Cheese Sandwich", priceEGP: 15, category: "sandwiches" },
  { id: "snd_06", code: "SND-06", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0644\u0627\u0646\u0634\u0648\u0646 \u062D\u0644\u0648\u0627\u0646\u064A (\u0641\u064A\u0646\u0648)", nameEn: "Beef Luncheon Sandwich", priceEGP: 15, category: "sandwiches" },
  { id: "snd_07", code: "SND-07", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u062C\u0628\u0646\u0629 \u0631\u0648\u0645\u064A (\u0641\u064A\u0646\u0648)", nameEn: "Roumy Aged Cheese Sandwich", priceEGP: 15, category: "sandwiches" },
  { id: "snd_08", code: "SND-08", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u062D\u0644\u0627\u0648\u0629 \u0628\u0627\u0644\u0642\u0634\u0637\u0629 (\u0641\u064A\u0646\u0648)", nameEn: "Halawa & Cream Sandwich", priceEGP: 15, category: "sandwiches" },
  { id: "snd_09", code: "SND-09", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0637\u0627\u0637\u0633 \u0645\u0647\u0631\u0648\u0633\u0629", nameEn: "Mashed Potato Sandwich", priceEGP: 15, category: "sandwiches" },
  { id: "snd_10", code: "SND-10", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0637\u0627\u0637\u0633 \u0635\u0648\u0627\u0628\u0639", nameEn: "French Fries Sandwich", priceEGP: 15, category: "sandwiches" },
  { id: "snd_11", code: "SND-11", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0637\u0627\u0637\u0633 \u062C\u0645\u0628\u0631\u064A", nameEn: "Spiced Shrimp-Style Potato Sandwich", priceEGP: 15, category: "sandwiches" },
  { id: "snd_12", code: "SND-12", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0627\u0628\u0627 \u063A\u0646\u0648\u062C", nameEn: "Smoked Baba Ghanoush Sandwich", priceEGP: 15, category: "sandwiches" },
  { id: "snd_13", code: "SND-13", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u062A\u0648\u0646\u0629 \u0628\u0627\u0644\u0645\u0627\u064A\u0648\u0646\u064A\u0632 \u0648\u0627\u0644\u0641\u0644\u0641\u0644 (\u0633\u0628\u0627\u064A\u0633\u064A)", nameEn: "Spicy Tuna Mayo Sandwich", priceEGP: 20, category: "sandwiches" },
  { id: "snd_14", code: "SND-14", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0631\u062C\u0631", nameEn: "Beef Burger Sandwich", priceEGP: 45, category: "sandwiches" },
  { id: "snd_15", code: "SND-15", nameAr: "\u0643\u0644\u0648\u0628 \u0633\u0627\u0646\u062F\u0648\u062A\u0634", nameEn: "Club Sandwich", priceEGP: 75, category: "sandwiches" },
  { id: "snd_16", code: "SND-16", nameAr: "\u062A\u0634\u064A\u0632 \u0645\u064A\u0643\u0633 \u0633\u0627\u0646\u062F\u0648\u062A\u0634", nameEn: "Four-Cheese Mix Sandwich", priceEGP: 45, category: "sandwiches" },
  { id: "snd_17", code: "SND-17", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0643\u0641\u062A\u0629 \u0645\u0634\u0648\u064A\u0629", nameEn: "Grilled Kofta Sandwich", priceEGP: 55, category: "sandwiches" },
  { id: "snd_18", code: "SND-18", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0634\u064A\u0634 \u0645\u0634\u0648\u064A", nameEn: "Grilled Shish Tawook Sandwich", priceEGP: 55, category: "sandwiches" },
  { id: "snd_19", code: "SND-19", nameAr: "\u0633\u0646\u062F\u0648\u062A\u0634 \u0628\u0627\u0646\u064A\u0647", nameEn: "Crispy Chicken Pane Sandwich", priceEGP: 65, category: "sandwiches" },
  // Drinks & Market (34 SKUs)
  { id: "drk_01", code: "DRK-01", nameAr: "\u0628\u064A\u0628\u0633\u064A (Pepsi)", nameEn: "Pepsi Can", priceEGP: 15, category: "drinks_snacks" },
  { id: "drk_02", code: "DRK-02", nameAr: "\u0645\u064A\u0631\u0646\u062F\u0627 \u0628\u0631\u062A\u0642\u0627\u0644 (Mirinda)", nameEn: "Mirinda Orange", priceEGP: 15, category: "drinks_snacks" },
  { id: "drk_03", code: "DRK-03", nameAr: "\u0633\u0641\u0646 \u0623\u0628 (7UP)", nameEn: "7UP Can", priceEGP: 15, category: "drinks_snacks" },
  { id: "drk_04", code: "DRK-04", nameAr: "\u0645\u0627\u0648\u0646\u062A\u0646 \u062F\u064A\u0648 (Mountain Dew)", nameEn: "Mountain Dew", priceEGP: 15, category: "drinks_snacks" },
  { id: "drk_05", code: "DRK-05", nameAr: "\u0628\u064A\u0628\u0633\u064A \u0627\u0644\u0647\u0636\u0628\u0629 (Pepsi El Hadaba)", nameEn: "Pepsi El Hadaba", priceEGP: 10, category: "drinks_snacks" },
  { id: "drk_06", code: "DRK-06", nameAr: "\u0634\u0648\u064A\u0628\u0633 (Schweppes)", nameEn: "Schweppes Can", priceEGP: 17, category: "drinks_snacks" },
  { id: "drk_07", code: "DRK-07", nameAr: "\u0641\u064A\u0631\u0648\u0632 \u0634\u0639\u064A\u0631 \u0648\u0641\u0627\u0643\u0647\u0629 (Fayrouz)", nameEn: "Fayrouz Malt Beverage", priceEGP: 20, category: "drinks_snacks" },
  { id: "drk_08", code: "DRK-08", nameAr: "\u0628\u0631\u064A\u0644 \u0634\u0639\u064A\u0631 \u0643\u0644\u0627\u0633\u064A\u0643 (Birell)", nameEn: "Birell Classic Malt", priceEGP: 20, category: "drinks_snacks" },
  { id: "drk_09", code: "DRK-09", nameAr: "\u0631\u064A\u062F \u0628\u0648\u0644 \u0637\u0627\u0642\u0629 (Red Bull)", nameEn: "Red Bull Energy", priceEGP: 20, category: "drinks_snacks" },
  { id: "drk_10", code: "DRK-10", nameAr: "\u0639\u0635\u064A\u0631 \u062C\u0647\u064A\u0646\u0629 \u062A\u0641\u0627\u062D", nameEn: "Juhayna Apple Juice", priceEGP: 10, category: "drinks_snacks" },
  { id: "drk_11", code: "DRK-11", nameAr: "\u0639\u0635\u064A\u0631 \u062C\u0647\u064A\u0646\u0629 \u0645\u0627\u0646\u062C\u0648", nameEn: "Juhayna Mango Juice", priceEGP: 10, category: "drinks_snacks" },
  { id: "drk_12", code: "DRK-12", nameAr: "\u0639\u0635\u064A\u0631 \u062C\u0647\u064A\u0646\u0629 \u0628\u0631\u062A\u0642\u0627\u0644", nameEn: "Juhayna Orange Juice", priceEGP: 10, category: "drinks_snacks" },
  { id: "drk_13", code: "DRK-13", nameAr: "\u0639\u0635\u064A\u0631 \u062C\u0647\u064A\u0646\u0629 \u0643\u0648\u0643\u062A\u064A\u0644", nameEn: "Juhayna Fruit Cocktail", priceEGP: 10, category: "drinks_snacks" },
  { id: "chp_01", code: "CHP-01", nameAr: "\u0634\u064A\u0628\u0633\u064A \u0628\u0627\u0644\u0645\u0644\u062D", nameEn: "Chipsy Salted", priceEGP: 10, category: "drinks_snacks" },
  { id: "chp_02", code: "CHP-02", nameAr: "\u0634\u064A\u0628\u0633\u064A \u0628\u0627\u0644\u062C\u0628\u0646\u0629", nameEn: "Chipsy Cheese", priceEGP: 10, category: "drinks_snacks" },
  { id: "chp_03", code: "CHP-03", nameAr: "\u062A\u0627\u064A\u062C\u0631 \u0634\u064A\u0628\u0633 (\u0645\u0644\u062D)", nameEn: "Tiger Chips Salted", priceEGP: 10, category: "drinks_snacks" },
  { id: "chp_04", code: "CHP-04", nameAr: "\u062A\u0627\u064A\u062C\u0631 \u0634\u064A\u0628\u0633 (\u062C\u0628\u0646\u0629)", nameEn: "Tiger Chips Cheese", priceEGP: 10, category: "drinks_snacks" },
  { id: "chp_05", code: "CHP-05", nameAr: "\u062F\u0648\u0631\u064A\u062A\u0648\u0633 \u0646\u0627\u062A\u0634\u0648", nameEn: "Doritos Nacho Cheese", priceEGP: 15, category: "drinks_snacks" },
  { id: "chp_06", code: "CHP-06", nameAr: "\u062F\u0648\u0631\u064A\u062A\u0648\u0633 \u062D\u0627\u0631 / \u0633\u0648\u064A\u062A \u062A\u0634\u064A\u0644\u064A", nameEn: "Doritos Sweet Chili", priceEGP: 15, category: "drinks_snacks" },
  { id: "chp_07", code: "CHP-07", nameAr: "\u0634\u064A\u062A\u0648\u0633 \u0645\u0642\u0631\u0645\u0634 (Cheetos)", nameEn: "Cheetos Crunchy", priceEGP: 15, category: "drinks_snacks" },
  { id: "swt_01", code: "SWT-01", nameAr: "\u0634\u0648\u0643\u0648\u0644\u0627\u062A\u0629 \u062C\u0627\u0644\u0643\u0633\u064A (Galaxy)", nameEn: "Galaxy Milk Chocolate", priceEGP: 15, category: "drinks_snacks" },
  { id: "swt_02", code: "SWT-02", nameAr: "\u0634\u0648\u0643\u0648\u0644\u0627\u062A\u0629 \u0643\u0627\u062F\u0628\u0648\u0631\u064A / \u062F\u064A\u0644\u0627\u064A\u062A", nameEn: "Cadbury Dairy Milk", priceEGP: 15, category: "drinks_snacks" },
  { id: "swt_03", code: "SWT-03", nameAr: "\u0641\u0644\u0648\u062A\u0633 2 \u0635\u0627\u0628\u0639 \u0634\u0648\u0643\u0648\u0644\u0627\u062A\u0629", nameEn: "Flutes 2-Finger Chocolate", priceEGP: 15, category: "drinks_snacks" },
  { id: "swt_04", code: "SWT-04", nameAr: "\u0634\u0648\u0643\u0648\u0644\u0627\u062A\u0629 \u0645\u0648\u0631\u0648 (Moro)", nameEn: "Cadbury Moro Bar", priceEGP: 12, category: "drinks_snacks" },
  { id: "swt_05", code: "SWT-05", nameAr: "\u0634\u0648\u0643\u0648\u0644\u0627\u062A\u0629 \u0645\u0627\u0646\u062F\u0648\u0644\u064A\u0646 (Mandolin)", nameEn: "Mandolin Chocolate", priceEGP: 10, category: "drinks_snacks" },
  { id: "swt_06", code: "SWT-06", nameAr: "\u0645\u0627\u0646\u062F\u0648\u0644\u064A\u0646 \u0648\u064A\u0641\u0631 (Mandolin Wafer)", nameEn: "Mandolin Mini Wafer", priceEGP: 5, category: "drinks_snacks" },
  { id: "swt_07", code: "SWT-07", nameAr: "\u0628\u0633\u0643\u0648\u064A\u062A \u0647\u0627\u0644\u064A (Hally)", nameEn: "Hally Biscuit Pack", priceEGP: 10, category: "drinks_snacks" },
  { id: "swt_08", code: "SWT-08", nameAr: "\u062F\u0627\u064A\u062C\u0633\u062A\u0641 \u0634\u0648\u0643\u0648\u0644\u0627\u062A\u0629", nameEn: "Digestive Chocolate Biscuit", priceEGP: 10, category: "drinks_snacks" },
  { id: "swt_09", code: "SWT-09", nameAr: "\u0628\u0633\u0643\u0648\u064A\u062A \u0623\u0648\u0631\u064A\u0648 (Oreo)", nameEn: "Oreo Sandwich Cookies", priceEGP: 10, category: "drinks_snacks" },
  { id: "swt_10", code: "SWT-10", nameAr: "\u0643\u064A\u0643 \u0647\u0648\u0647\u0648\u0632 (HoHos)", nameEn: "HoHos Rolled Chocolate Cake", priceEGP: 10, category: "drinks_snacks" },
  { id: "swt_11", code: "SWT-11", nameAr: "\u0628\u0633\u0643\u0648\u064A\u062A \u0628\u064A\u0645\u0628\u0648 (Bimbo)", nameEn: "Bimbo Chocolate Biscuit", priceEGP: 10, category: "drinks_snacks" },
  { id: "swt_12", code: "SWT-12", nameAr: "\u062F\u0631\u064A\u0648 / \u062A\u0648\u0628\u0648 \u0628\u0631\u0627\u0648\u0646\u064A \u0643\u064A\u0643", nameEn: "Drio / Topo Brownie Cake", priceEGP: 10, category: "drinks_snacks" },
  { id: "swt_13", code: "SWT-13", nameAr: "\u0644\u0645\u0628\u0627\u062F\u0627 \u0648\u064A\u0641\u0631 (Lambada)", nameEn: "Lambada Crispy Wafer", priceEGP: 10, category: "drinks_snacks" },
  { id: "swt_14", code: "SWT-14", nameAr: "\u062C\u064A\u0645\u0628\u0648 \u0634\u0648\u0643\u0648 \u0645\u064A\u0643\u0633 / \u0632\u0645\u0632\u0645\u064A\u0629 \u0628\u0633\u0643\u0648\u064A\u062A", nameEn: "Jumbo Choco Mix", priceEGP: 10, category: "drinks_snacks" }
];
function findHabeCatalogItem(codeOrId) {
  const key = String(codeOrId || "").trim().toLowerCase();
  if (!key) return void 0;
  return HABE_PRICE_CATALOG.find(
    (entry) => entry.id.toLowerCase() === key || entry.code.toLowerCase() === key
  );
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var ALLOWED_GATEWAYS = ["fawry", "vodafone_cash", "instapay", "cash_on_delivery"];
var BOOTSTRAPPED_OWNER_EMAIL = "hamzaelhelaly08@gmail.com";
var SESSION_COOKIE_NAME = "wataniya_fin_session";
var SESSION_TTL_MS = 12 * 60 * 60 * 1e3;
var OTP_TTL_MS = 5 * 60 * 1e3;
var OTP_COOLDOWN_MS = 60 * 1e3;
var OTP_MAX_ATTEMPTS = 5;
var OTP_EMAIL_WINDOW_MS = 15 * 60 * 1e3;
var OTP_EMAIL_WINDOW_MAX = 5;
var OTP_IP_WINDOW_MAX = 15;
var OWNER_PIN_MAX_ATTEMPTS = 5;
var OWNER_PIN_LOCK_MS = 15 * 60 * 1e3;
var LOGIN_MAX_ATTEMPTS = 5;
var LOGIN_LOCK_MS = 15 * 60 * 1e3;
var SERVER_SECRET = process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16 ? process.env.SESSION_SECRET : crypto.randomBytes(32).toString("hex");
var SANDBOX_HMAC_KEY = process.env.SANDBOX_HMAC_SECRET || crypto.createHmac("sha256", SERVER_SECRET).update("sandbox").digest("hex");
var RUNTIME_STATE_PATH = path.resolve(__dirname, ".runtime-security-state.json");
function createInitialSecurityState() {
  return {
    ownerPin: null,
    revokedSubjects: {},
    designatedRoles: {},
    roleMatrix: sanitizeRoleMatrix(DEFAULT_ROLE_PERMISSION_MATRIX),
    accountsByEmail: {},
    tenantsById: {
      tenant_kitchen_alain: {
        tenantId: "tenant_kitchen_alain",
        name: "\u0645\u0637\u0628\u062E \u0648\u0645\u0631\u0643\u0632 \u0627\u0644\u0639\u064A\u0646 \u2014 \u0645\u062F\u064A\u0646\u0629 \u0628\u062F\u0631",
        kind: "central_kitchen",
        ownerUid: "seed_kitchen_alain",
        ownerEmail: "kitchen.alain@basit-platform.local",
        commercialRegRef: "HACCP-EG-2091",
        city: "\u0645\u062F\u064A\u0646\u0629 \u0628\u062F\u0631",
        countryCode: "EG",
        contractedKitchenIds: [],
        status: "active",
        createdAt: "2026-01-10T08:00:00.000Z",
        updatedAt: "2026-01-10T08:00:00.000Z"
      },
      tenant_kitchen_hanger: {
        tenantId: "tenant_kitchen_hanger",
        name: "\u0645\u0637\u0628\u062E \u0647\u0646\u062C\u0631 \u0633\u062A\u064A\u0634\u0646 \u0627\u0644\u0645\u0631\u0643\u0632\u064A \u2014 \u0623\u0631\u0636 \u0627\u0644\u0645\u0639\u0627\u0631\u0636 \u0628\u0645\u062F\u064A\u0646\u0629 \u0646\u0635\u0631",
        kind: "central_kitchen",
        ownerUid: "seed_kitchen_hanger",
        ownerEmail: "kitchen.hanger@basit-platform.local",
        commercialRegRef: "HACCP-EG-1042",
        city: "\u0623\u0631\u0636 \u0627\u0644\u0645\u0639\u0627\u0631\u0636 \u0628\u0645\u062F\u064A\u0646\u0629 \u0646\u0635\u0631",
        countryCode: "EG",
        contractedKitchenIds: [],
        status: "active",
        createdAt: "2026-01-12T08:00:00.000Z",
        updatedAt: "2026-01-12T08:00:00.000Z"
      },
      tenant_kitchen_bait_al_eila: {
        tenantId: "tenant_kitchen_bait_al_eila",
        name: "\u0645\u0637\u0628\u062E \u0628\u064A\u062A \u0627\u0644\u0639\u064A\u0644\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064A",
        kind: "central_kitchen",
        ownerUid: "seed_kitchen_bait_al_eila",
        ownerEmail: "kitchen.baitaleila@basit-platform.local",
        commercialRegRef: "HACCP-EG-3105",
        city: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 \u0627\u0644\u0643\u0628\u0631\u0649",
        countryCode: "EG",
        contractedKitchenIds: [],
        status: "active",
        createdAt: "2026-01-15T08:00:00.000Z",
        updatedAt: "2026-01-15T08:00:00.000Z"
      },
      tenant_client_habe: {
        tenantId: "tenant_client_habe",
        name: "\u0634\u0631\u0643\u0629 \u0647\u0627-\u0628\u064A \u0627\u0644\u0645\u0635\u0631\u064A\u0629 (H.A.B.E)",
        kind: "client_company",
        ownerUid: "seed_client_habe",
        ownerEmail: "ops@habe-egypt.local",
        commercialRegRef: "CONTRACT-HABE-2026",
        city: "\u0627\u0644\u0639\u0627\u0634\u0631 \u0645\u0646 \u0631\u0645\u0636\u0627\u0646 / \u0628\u062F\u0631",
        countryCode: "EG",
        contractedKitchenIds: ["tenant_kitchen_alain", "tenant_kitchen_hanger"],
        status: "active",
        createdAt: "2026-01-18T08:00:00.000Z",
        updatedAt: "2026-01-18T08:00:00.000Z"
      }
    },
    invitationsById: {},
    tenantOrdersById: {},
    habeOrdersById: {},
    habeCustomEmployees: [],
    ledgerEntries: [],
    auditLogs: [],
    ownerFinance: {
      accounts: {
        bank: 0,
        e_wallet: 0,
        treasury: 0
      },
      entries: [],
      receivables: [],
      payables: [],
      auditLogs: [],
      webauthnCredentials: [],
      ingestedOrderRefs: []
    }
  };
}
function loadSecurityState() {
  const base = createInitialSecurityState();
  try {
    if (fs.existsSync(RUNTIME_STATE_PATH)) {
      const raw = fs.readFileSync(RUNTIME_STATE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      const mergedTenants = {
        ...base.tenantsById,
        ...parsed.tenantsById || {}
      };
      if (mergedTenants.tenant_kitchen_hanger) {
        mergedTenants.tenant_kitchen_hanger = {
          ...mergedTenants.tenant_kitchen_hanger,
          name: "\u0645\u0637\u0628\u062E \u0647\u0646\u062C\u0631 \u0633\u062A\u064A\u0634\u0646 \u0627\u0644\u0645\u0631\u0643\u0632\u064A \u2014 \u0623\u0631\u0636 \u0627\u0644\u0645\u0639\u0627\u0631\u0636 \u0628\u0645\u062F\u064A\u0646\u0629 \u0646\u0635\u0631",
          city: "\u0623\u0631\u0636 \u0627\u0644\u0645\u0639\u0627\u0631\u0636 \u0628\u0645\u062F\u064A\u0646\u0629 \u0646\u0635\u0631"
        };
      }
      if (mergedTenants.tenant_kitchen_alain) {
        mergedTenants.tenant_kitchen_alain = {
          ...mergedTenants.tenant_kitchen_alain,
          name: "\u0645\u0637\u0628\u062E \u0648\u0645\u0631\u0643\u0632 \u0627\u0644\u0639\u064A\u0646 \u2014 \u0645\u062F\u064A\u0646\u0629 \u0628\u062F\u0631",
          city: "\u0645\u062F\u064A\u0646\u0629 \u0628\u062F\u0631"
        };
      }
      if (!mergedTenants.tenant_kitchen_bait_al_eila) {
        mergedTenants.tenant_kitchen_bait_al_eila = base.tenantsById.tenant_kitchen_bait_al_eila;
      }
      if (!mergedTenants.tenant_client_habe) {
        mergedTenants.tenant_client_habe = base.tenantsById.tenant_client_habe;
      }
      return {
        ownerPin: parsed.ownerPin || null,
        revokedSubjects: parsed.revokedSubjects || {},
        designatedRoles: parsed.designatedRoles || {},
        roleMatrix: sanitizeRoleMatrix(parsed.roleMatrix || DEFAULT_ROLE_PERMISSION_MATRIX),
        accountsByEmail: parsed.accountsByEmail || {},
        tenantsById: mergedTenants,
        invitationsById: parsed.invitationsById || {},
        tenantOrdersById: parsed.tenantOrdersById || {},
        habeOrdersById: parsed.habeOrdersById || {},
        habeCustomEmployees: Array.isArray(parsed.habeCustomEmployees) ? parsed.habeCustomEmployees : [],
        ledgerEntries: Array.isArray(parsed.ledgerEntries) ? parsed.ledgerEntries : [],
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        ownerFinance: {
          accounts: {
            bank: Number(parsed.ownerFinance?.accounts?.bank || 0),
            e_wallet: Number(parsed.ownerFinance?.accounts?.e_wallet || 0),
            treasury: Number(parsed.ownerFinance?.accounts?.treasury || 0)
          },
          entries: Array.isArray(parsed.ownerFinance?.entries) ? parsed.ownerFinance.entries : [],
          receivables: Array.isArray(parsed.ownerFinance?.receivables) ? parsed.ownerFinance.receivables : [],
          payables: Array.isArray(parsed.ownerFinance?.payables) ? parsed.ownerFinance.payables : [],
          auditLogs: Array.isArray(parsed.ownerFinance?.auditLogs) ? parsed.ownerFinance.auditLogs : [],
          webauthnCredentials: Array.isArray(parsed.ownerFinance?.webauthnCredentials) ? parsed.ownerFinance.webauthnCredentials : [],
          ingestedOrderRefs: Array.isArray(parsed.ownerFinance?.ingestedOrderRefs) ? parsed.ownerFinance.ingestedOrderRefs : []
        }
      };
    }
  } catch {
  }
  return base;
}
function saveSecurityState(state) {
  try {
    fs.writeFileSync(RUNTIME_STATE_PATH, JSON.stringify(state, null, 2), { mode: 384 });
  } catch (err) {
    console.warn("Could not persist runtime security state:", err instanceof Error ? err.message : "unknown");
  }
}
function seedExecutiveGovernanceAccounts(state) {
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  let changed = false;
  for (const spec of EXECUTIVE_ACCOUNTS) {
    const email = spec.email.toLowerCase();
    const existing = state.accountsByEmail[email];
    const envPw = String(process.env[spec.envInitialPasswordKey] || "").trim();
    let passwordSalt = existing?.passwordSalt || "";
    let passwordHash = existing?.passwordHash || "";
    if (!passwordHash && envPw.length >= 8) {
      passwordSalt = crypto.randomBytes(16).toString("hex");
      passwordHash = crypto.scryptSync(envPw, passwordSalt, 64).toString("hex");
      changed = true;
    }
    const nextAccount = {
      uid: existing?.uid || spec.uid,
      email,
      username: spec.username,
      usernameAliases: spec.usernameAliases || [],
      employeeCode: spec.employeeCode,
      canApproveHabe: spec.canApproveHabe,
      phone: existing?.phone || spec.phone || "",
      fullName: existing?.fullName || spec.fullNameAr,
      passwordSalt,
      passwordHash,
      canonicalRole: spec.canonicalRole,
      requestedKind: "client_company",
      approvalStatus: "approved",
      tenantId: existing?.tenantId || (spec.canonicalRole === "super_admin" ? "" : "tenant_client_habe"),
      customPermissions: existing?.customPermissions || [],
      businessName: existing?.businessName || "BASIT | H-A-B-E Governance",
      commercialRegRef: existing?.commercialRegRef || spec.employeeCode || "GOV-EXEC",
      city: existing?.city || "\u0627\u0644\u0642\u0627\u0647\u0631\u0629",
      countryCode: existing?.countryCode || "EG",
      reviewNote: existing?.reviewNote || "\u062D\u0633\u0627\u0628 \u0625\u062F\u0627\u0631\u0629 \u062A\u0646\u0641\u064A\u0630\u064A\u0629 \u0645\u0639\u062A\u0645\u062F",
      createdAt: existing?.createdAt || nowIso,
      updatedAt: existing?.updatedAt || nowIso
    };
    if (!existing || existing.username !== nextAccount.username || existing.canApproveHabe !== nextAccount.canApproveHabe || existing.canonicalRole !== nextAccount.canonicalRole || existing.employeeCode !== nextAccount.employeeCode) {
      changed = true;
    }
    state.accountsByEmail[email] = nextAccount;
    if (spec.canonicalRole === "platform_admin") {
      if (state.designatedRoles[email] !== "basit_admin") {
        state.designatedRoles[email] = "basit_admin";
        changed = true;
      }
    }
  }
  if (changed) {
    saveSecurityState(state);
  }
}
var securityState = loadSecurityState();
seedExecutiveGovernanceAccounts(securityState);
function appendAuditEntry(entry) {
  const rec = {
    ...entry,
    logId: `AUD-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  securityState.auditLogs.unshift(rec);
  if (securityState.auditLogs.length > 500) {
    securityState.auditLogs = securityState.auditLogs.slice(0, 500);
  }
  saveSecurityState(securityState);
  return rec;
}
var sessionStore = /* @__PURE__ */ new Map();
var otpChallengeStore = /* @__PURE__ */ new Map();
var otpEmailRateStore = /* @__PURE__ */ new Map();
var otpIpRateStore = /* @__PURE__ */ new Map();
var ownerPinFailStore = /* @__PURE__ */ new Map();
var passwordLoginFailStore = /* @__PURE__ */ new Map();
var sandboxIntentStore = /* @__PURE__ */ new Map();
var idempotencyStore = /* @__PURE__ */ new Map();
function readFirebaseWebApiKey() {
  try {
    const cfgPath = path.resolve(__dirname, "firebase-applet-config.json");
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
      return String(cfg.apiKey || "").trim();
    }
  } catch {
  }
  return "";
}
function escapeHtml(raw) {
  return raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function hashOtpCode(salt, email, code) {
  return crypto.createHmac("sha256", SERVER_SECRET).update(`${salt}::${email.toLowerCase()}::${code}`).digest("hex");
}
function hashOwnerPin(pin, salt) {
  return crypto.scryptSync(pin, salt, 64).toString("hex");
}
function timingSafeHexEquals(aHex, bHex) {
  try {
    const aBuf = Buffer.from(aHex, "hex");
    const bBuf = Buffer.from(bHex, "hex");
    if (aBuf.length === 0 || aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}
function timingSafeTextEquals(a, b) {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length === 0 || aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
function computeSandboxHmac(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}
function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}
function isSecureRequest(req) {
  const fwdProto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
  const origin = String(req.headers.origin || "").toLowerCase();
  return Boolean(req.secure || fwdProto.includes("https") || origin.startsWith("https://"));
}
function setSessionCookie(req, res, token) {
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1e3);
  const sameSite = isSecureRequest(req) ? "SameSite=None; Secure; Partitioned" : "SameSite=Lax";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; ${sameSite}; Max-Age=${maxAgeSec}`
  );
}
function clearSessionCookie(req, res) {
  const sameSite = isSecureRequest(req) ? "SameSite=None; Secure; Partitioned" : "SameSite=Lax";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; ${sameSite}; Max-Age=0`
  );
}
function isSubjectRevoked(email, uid) {
  const em = email.trim().toLowerCase();
  if (em && em !== BOOTSTRAPPED_OWNER_EMAIL && securityState.revokedSubjects[em]) {
    return securityState.revokedSubjects[em];
  }
  if (uid && securityState.revokedSubjects[uid]) {
    return securityState.revokedSubjects[uid];
  }
  if (em && em !== BOOTSTRAPPED_OWNER_EMAIL && securityState.accountsByEmail[em]?.approvalStatus === "suspended") {
    return {
      subject: em,
      reason: "\u062A\u0645 \u062A\u062C\u0645\u064A\u062F \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0644\u064A\u0627.",
      revokedAt: securityState.accountsByEmail[em].updatedAt,
      revokedBy: "platform_admin"
    };
  }
  return null;
}
function normalizePhone(raw) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.length === 11) return `+20${digits.slice(1)}`;
  return digits;
}
function resolveCanonicalToLegacyServerRole(cRole) {
  if (cRole === "super_admin") return "owner";
  if (cRole === "platform_admin") return "basit_admin";
  if (cRole === "finance_manager") return "finance_admin";
  return "customer";
}
function computeResolvedPermissions(role, customPermissions) {
  if (role === "super_admin") {
    return [...DEFAULT_ROLE_PERMISSION_MATRIX.super_admin];
  }
  if (customPermissions.length > 0) {
    return customPermissions;
  }
  return securityState.roleMatrix[role] || DEFAULT_ROLE_PERMISSION_MATRIX[role] || [];
}
function serializePublicSessionUser(session) {
  return {
    email: session.email,
    uid: session.uid,
    username: session.username,
    employeeCode: session.employeeCode,
    canApproveHabe: session.canApproveHabe,
    fullName: session.fullName,
    authKind: session.authKind,
    role: session.role,
    canonicalRole: session.canonicalRole,
    tenantId: session.tenantId,
    tenantName: session.tenantName,
    tenantKind: session.tenantKind,
    contractedKitchenIds: session.contractedKitchenIds,
    permissions: computeResolvedPermissions(session.canonicalRole, session.customPermissions),
    approvalStatus: session.approvalStatus,
    ownerPinVerified: session.ownerPinVerified,
    expiresAt: new Date(session.expiresAtMs).toISOString()
  };
}
function isHabeApproverAccount(email, acct) {
  const cleanEmail = email.trim().toLowerCase();
  return Boolean(
    cleanEmail === BOOTSTRAPPED_OWNER_EMAIL || EXECUTIVE_HABE_APPROVER_EMAILS.includes(cleanEmail) || acct?.canApproveHabe || acct?.canonicalRole === "super_admin" || acct?.canonicalRole === "platform_admin" || securityState.designatedRoles[cleanEmail] === "basit_admin"
  );
}
function isHabeApproverSession(session) {
  return Boolean(
    session.canonicalRole === "super_admin" || session.canonicalRole === "platform_admin" || session.canApproveHabe || EXECUTIVE_HABE_APPROVER_EMAILS.includes(session.email.toLowerCase())
  );
}
function findAccountByIdentifier(rawIdentifier) {
  const trimmed = rawIdentifier.trim();
  if (!trimmed) return void 0;
  const cleanLower = trimmed.toLowerCase().replace(/^@/, "");
  if (trimmed.includes("@")) {
    return securityState.accountsByEmail[cleanLower];
  }
  const byUsername = Object.values(securityState.accountsByEmail).find((a) => {
    const uname = (a.username || "").toLowerCase();
    const aliases = (a.usernameAliases || []).map((x) => x.toLowerCase());
    const empCode = (a.employeeCode || "").toLowerCase();
    return uname === cleanLower || aliases.includes(cleanLower) || empCode && empCode === cleanLower;
  });
  if (byUsername) return byUsername;
  const normalizedPhone = normalizePhone(trimmed);
  if (normalizedPhone) {
    return Object.values(securityState.accountsByEmail).find((a) => a.phone && a.phone === normalizedPhone);
  }
  return void 0;
}
var WEAK_PASSWORDS_SET = /* @__PURE__ */ new Set([
  "12345678",
  "00000000",
  "11111111",
  "password",
  "password123",
  "qwerty123",
  "admin1234",
  "catering@2026",
  "finance@2026",
  "bahed@2026"
]);
function isStrongPassword(password) {
  return password.length >= 8 && !WEAK_PASSWORDS_SET.has(password.toLowerCase());
}
function getMergedHabeEmployees() {
  const byCode = /* @__PURE__ */ new Map();
  for (const emp of CORPORATE_HABE_EMPLOYEES) {
    byCode.set(emp.code.toUpperCase(), {
      id: emp.id,
      code: emp.code,
      name: emp.nameAr || emp.nameEn,
      nameEn: emp.nameEn,
      department: emp.departmentAr || emp.department,
      phone: emp.compNumber
    });
  }
  for (const custom of securityState.habeCustomEmployees) {
    byCode.set(custom.code.toUpperCase(), custom);
  }
  return Array.from(byCode.values());
}
function resolveSessionHabeEmployee(sess) {
  const all = getMergedHabeEmployees();
  const acct = securityState.accountsByEmail[sess.email.toLowerCase()];
  const codeCandidate = (sess.employeeCode || acct?.employeeCode || "").trim().toUpperCase();
  if (codeCandidate) {
    const byCode = all.find((e) => e.code.toUpperCase() === codeCandidate);
    if (byCode) return byCode;
  }
  const phoneCandidate = normalizePhone(acct?.phone || "");
  if (phoneCandidate) {
    const byPhone = all.find((e) => e.phone && normalizePhone(e.phone) === phoneCandidate);
    if (byPhone) return byPhone;
  }
  const emailLower = sess.email.toLowerCase();
  const byEmail = all.find((e) => e.email && e.email.toLowerCase() === emailLower);
  return byEmail || null;
}
function terminateUserSessions(email, uid) {
  const cleanEmail = email.trim().toLowerCase();
  let count = 0;
  for (const [tok, sess] of sessionStore.entries()) {
    if (cleanEmail && sess.email === cleanEmail || uid && sess.uid === uid) {
      sessionStore.delete(tok);
      count += 1;
    }
  }
  return count;
}
function pruneRateWindow(store, key, nowMs, windowMs) {
  const arr = (store.get(key) || []).filter((ts) => nowMs - ts < windowMs);
  store.set(key, arr);
  return arr;
}
function isValidGmailSmtpConfig() {
  const user = String(process.env.GMAIL_SMTP_USER || "").trim();
  const rawPass = String(process.env.GMAIL_SMTP_APP_PASSWORD || "").replace(/\s+/g, "");
  const lowerUser = user.toLowerCase();
  const lowerPass = rawPass.toLowerCase();
  const isPlaceholder = !user || !rawPass || lowerUser.includes("example.com") || lowerUser.startsWith("your-") || lowerPass.includes("your-app-password") || lowerPass === "placeholder" || lowerPass === "changeme" || lowerPass === "dummy";
  const validUser = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user);
  const validPass = rawPass.length >= 8;
  return {
    valid: !isPlaceholder && validUser && validPass,
    user,
    pass: rawPass
  };
}
function getMailTransportStatus() {
  const gmailCfg = isValidGmailSmtpConfig();
  const hasGmailSmtp = gmailCfg.valid;
  const resendOptionalConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  return {
    gmailCliAvailable: false,
    // Verified: no standalone `gmail send` CLI exists in this runtime environment
    hasGmailSmtp,
    resendOptional: true,
    resendOptionalConfigured,
    configured: hasGmailSmtp,
    activeDriver: hasGmailSmtp ? "nodemailer_gmail_smtp" : "none"
  };
}
async function sendOtpEmailViaConfiguredTransport(toEmail, fullName, code) {
  const gmailCfg = isValidGmailSmtpConfig();
  if (!gmailCfg.valid) {
    return { sent: false, driver: "none" };
  }
  const safeName = escapeHtml(fullName);
  const subject = "\u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 | \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0644\u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u0622\u0645\u0646";
  const html = `
    <div dir="rtl" style="font-family: 'Cairo', Tahoma, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; color: #0f172a;">
      <div style="font-size: 13px; font-weight: 800; color: #4338ca; margin-bottom: 6px;">\u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u2014 \u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0622\u0645\u0646</div>
      <h2 style="margin: 0 0 12px; font-size: 18px;">\u0645\u0631\u062D\u0628\u0627\u064B ${safeName}</h2>
      <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.7; color: #334155;">
        \u0627\u0633\u062A\u062E\u062F\u0645 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0644\u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0623\u062F\u0646\u0627\u0647 \u0644\u0625\u062A\u0645\u0627\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0645\u0646\u0635\u0629 <strong>BASIT | \u0628\u0627\u0633\u0637</strong> \u0627\u0644\u062A\u0627\u0628\u0639\u0629 \u0644\u0634\u0631\u0643\u0629 <strong>\u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629</strong>:
      </p>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; font-size: 28px; font-weight: 900; letter-spacing: 8px; color: #1e293b; font-family: monospace;">
        ${code}
      </div>
      <p style="margin: 16px 0 0; font-size: 12px; color: #64748b; line-height: 1.6;">
        \u2022 \u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632 \u0635\u0627\u0644\u062D \u0644\u0645\u062F\u0629 <strong>5 \u062F\u0642\u0627\u0626\u0642</strong> \u0648\u064A\u064F\u0633\u062A\u062E\u062F\u0645 <strong>\u0644\u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0641\u0642\u0637</strong>.<br/>
        \u2022 \u0644\u0627 \u062A\u0634\u0627\u0631\u0643 \u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632 \u0645\u0639 \u0623\u064A \u0634\u062E\u0635 \u062D\u062A\u0649 \u0644\u0648 \u0627\u062F\u0651\u0639\u0649 \u0623\u0646\u0647 \u0645\u0646 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A.
      </p>
    </div>
  `;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailCfg.user,
      pass: gmailCfg.pass
    },
    connectionTimeout: 1e4,
    greetingTimeout: 1e4,
    socketTimeout: 15e3
  });
  await transporter.sendMail({
    from: process.env.OTP_FROM_EMAIL?.trim() || `\u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 <${gmailCfg.user}>`,
    to: toEmail,
    subject,
    html
  });
  return { sent: true, driver: "nodemailer_gmail_smtp" };
}
function resolveSessionFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return { session: null, revoked: false };
  const session = sessionStore.get(token);
  if (!session) return { session: null, revoked: false };
  if (Date.now() > session.expiresAtMs) {
    sessionStore.delete(token);
    return { session: null, revoked: false };
  }
  if (isSubjectRevoked(session.email, session.uid)) {
    sessionStore.delete(token);
    return { session: null, revoked: true };
  }
  return { session, revoked: false };
}
function requireAuthenticatedSession(req, res, next) {
  const { session, revoked } = resolveSessionFromRequest(req);
  if (revoked) {
    clearSessionCookie(req, res);
    res.status(401).json({
      ok: false,
      code: "SESSION_REVOKED",
      messageAr: "\u062A\u0645 \u0633\u062D\u0628 \u0635\u0644\u0627\u062D\u064A\u0629 \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062C\u0644\u0633\u0629 \u0641\u0648\u0631\u0627\u064B \u0645\u0646 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629.",
      messageEn: "Access revoked immediately by platform owner."
    });
    return;
  }
  if (!session) {
    res.status(401).json({
      ok: false,
      code: "AUTH_REQUIRED",
      messageAr: "\u064A\u0644\u0632\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u062C\u0644\u0633\u0629 \u0622\u0645\u0646\u0629 \u0645\u0648\u062B\u0642\u0629 \u0644\u0625\u062A\u0645\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621.",
      messageEn: "Valid authenticated session required."
    });
    return;
  }
  req.authSession = session;
  next();
}
function getProviderReadiness() {
  const fawryMissing = [];
  if (!process.env.FAWRY_MERCHANT_CODE) fawryMissing.push("FAWRY_MERCHANT_CODE");
  if (!process.env.FAWRY_SECURITY_KEY) fawryMissing.push("FAWRY_SECURITY_KEY");
  const mailStatus = getMailTransportStatus();
  return {
    gateways: [
      {
        providerId: "fawry",
        displayName: "Fawry (Cash Reference / Cards \u2014 Sandbox Mode)",
        countries: ["EG", "QA", "OM"],
        sandboxReady: true,
        liveConfigured: fawryMissing.length === 0,
        missingEnvVars: fawryMissing
      },
      {
        providerId: "vodafone_cash",
        displayName: "Vodafone Cash (+201010430347 \u2014 Audit/Sandbox)",
        walletNumber: "+201010430347",
        countries: ["EG"],
        sandboxReady: true,
        liveConfigured: false,
        missingEnvVars: ["LIVE_TRANSFERS_DISABLED_BY_POLICY"]
      },
      {
        providerId: "instapay",
        displayName: "InstaPay (Audit/Sandbox Only)",
        countries: ["EG"],
        sandboxReady: true,
        liveConfigured: false,
        missingEnvVars: ["LIVE_TRANSFERS_DISABLED_BY_POLICY"]
      },
      {
        providerId: "cash_on_delivery",
        displayName: "Cash on Delivery (COD)",
        countries: ["EG", "QA", "OM", "GB"],
        sandboxReady: true,
        liveConfigured: true,
        missingEnvVars: []
      }
    ],
    notificationChannels: {
      inAppFirestore: true,
      emailOtpConfigured: mailStatus.configured,
      emailOtpDriver: mailStatus.activeDriver,
      gmailCliAvailable: mailStatus.gmailCliAvailable
    }
  };
}
function maskEmail(email) {
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const local = parts[0];
  const maskedLocal = local.length <= 2 ? `${local[0] || "*"}*` : `${local.slice(0, 2)}***${local.slice(-1)}`;
  return `${maskedLocal}@${parts[1]}`;
}
async function createConfiguredApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", (req, res, next) => {
    const method = req.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      next();
      return;
    }
    if (req.path.startsWith("/payments/webhook/")) {
      next();
      return;
    }
    const originHeader = String(req.headers.origin || "").trim();
    const hostHeader = String(req.headers["x-forwarded-host"] || req.headers.host || "").trim().toLowerCase();
    if (originHeader && hostHeader) {
      try {
        const parsedOrigin = new URL(originHeader);
        const originHost = parsedOrigin.host.toLowerCase();
        const isLocal = originHost.startsWith("localhost:") || originHost.startsWith("127.0.0.1:");
        if (!isLocal && originHost !== hostHeader) {
          res.status(403).json({
            ok: false,
            code: "CSRF_ORIGIN_MISMATCH",
            messageAr: "\u062A\u0645 \u062D\u0638\u0631 \u0627\u0644\u0637\u0644\u0628 \u0644\u0627\u062E\u062A\u0644\u0627\u0641 \u0645\u0635\u062F\u0631 \u0627\u0644\u0646\u0637\u0627\u0642 \u0639\u0646 \u062E\u0627\u062F\u0645 \u0627\u0644\u0645\u0646\u0635\u0629.",
            messageEn: "Cross-origin mutation rejected."
          });
          return;
        }
      } catch {
        res.status(403).json({ ok: false, code: "INVALID_ORIGIN", messageEn: "Invalid Origin header." });
        return;
      }
    }
    next();
  });
  const isProd = process.env.NODE_ENV === "production";
  app.get("/api/health", (_req, res) => {
    const readiness = getProviderReadiness();
    res.json({
      ok: true,
      service: "\u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u2014 BASIT | \u0628\u0627\u0633\u0637 API",
      port: Number(process.env.PORT || 3e3),
      environment: isProd ? "production" : "development",
      gateways: readiness.gateways,
      notificationChannels: readiness.notificationChannels
    });
  });
  app.get("/api/payments/providers", (_req, res) => {
    res.json(getProviderReadiness());
  });
  app.get("/api/auth/mail-status", (_req, res) => {
    const status = getMailTransportStatus();
    res.json({
      ok: true,
      brandAr: "\u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629",
      ...status,
      messageAr: status.configured ? "\u0642\u0646\u0627\u0629 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0648\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0639\u0628\u0631 Gmail SMTP \u0645\u0641\u0639\u0651\u0644\u0629 \u0648\u062C\u0627\u0647\u0632\u0629." : "\u062E\u062F\u0645\u0629 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0648\u0632 OTP \u062A\u0639\u062A\u0645\u062F \u062D\u0635\u0631\u064A\u0627\u064B \u0639\u0644\u0649 Gmail SMTP (GMAIL_SMTP_USER \u0648 GMAIL_SMTP_APP_PASSWORD) \u0648\u0644\u0645 \u064A\u062A\u0645 \u0636\u0628\u0637 \u0625\u0639\u062F\u0627\u062F\u0627\u062A\u0647\u0627 \u0628\u0639\u062F. \u0645\u062A\u063A\u064A\u0631 RESEND_API_KEY \u0627\u062E\u062A\u064A\u0627\u0631\u064A \u0648\u0644\u0627 \u064A\u064F\u0634\u062A\u0631\u0637 \u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0646\u0638\u0627\u0645.",
      messageEn: status.configured ? "Gmail SMTP OTP transport is active and ready." : "OTP delivery uses Gmail SMTP exclusively (GMAIL_SMTP_USER & GMAIL_SMTP_APP_PASSWORD), which is not configured yet. RESEND_API_KEY is strictly optional."
    });
  });
  app.get("/api/auth/session", (req, res) => {
    const { session, revoked } = resolveSessionFromRequest(req);
    if (revoked) {
      clearSessionCookie(req, res);
      res.status(401).json({
        ok: false,
        authenticated: false,
        code: "SESSION_REVOKED",
        messageAr: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u062C\u0644\u0633\u062A\u0643 \u0648\u0633\u062D\u0628 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0646 \u0642\u0628\u0644 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629.",
        messageEn: "Session revoked by owner."
      });
      return;
    }
    if (!session) {
      res.json({ ok: true, authenticated: false, user: null });
      return;
    }
    res.json({
      ok: true,
      authenticated: true,
      user: serializePublicSessionUser(session)
    });
  });
  app.post("/api/auth/logout", (req, res) => {
    const cookies = parseCookies(req);
    const token = cookies[SESSION_COOKIE_NAME];
    if (token) {
      sessionStore.delete(token);
    }
    clearSessionCookie(req, res);
    res.json({
      ok: true,
      messageAr: "\u062A\u0645 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u0622\u0645\u0646\u0629 \u0648\u062D\u0630\u0641 \u0645\u0644\u0641 \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 \u0645\u0646 \u0627\u0644\u0645\u062A\u0635\u0641\u062D.",
      messageEn: "Secure session logged out."
    });
  });
  app.post("/api/auth/oauth-session", async (req, res) => {
    try {
      const body = req.body;
      const idToken = String(body.idToken || "").trim();
      if (!idToken || idToken.length < 20) {
        res.status(400).json({
          ok: false,
          messageAr: "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0647\u0648\u064A\u0629 (ID Token) \u0645\u0637\u0644\u0648\u0628.",
          messageEn: "Valid Firebase ID token required."
        });
        return;
      }
      const apiKey = readFirebaseWebApiKey();
      if (!apiKey) {
        res.status(503).json({
          ok: false,
          messageAr: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0635\u0627\u062F\u0642\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645.",
          messageEn: "Firebase Web API key unavailable."
        });
        return;
      }
      const lookupRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken })
        }
      );
      if (!lookupRes.ok) {
        res.status(401).json({
          ok: false,
          code: "INVALID_ID_TOKEN",
          messageAr: "\u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u062D\u0629 \u062C\u0644\u0633\u0629 Google \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645.",
          messageEn: "Invalid or expired Firebase ID token."
        });
        return;
      }
      const lookupJson = await lookupRes.json();
      const verifiedUser = lookupJson.users?.[0];
      if (!verifiedUser || !verifiedUser.email || !verifiedUser.emailVerified || verifiedUser.disabled) {
        res.status(401).json({
          ok: false,
          code: "UNVERIFIED_ACCOUNT",
          messageAr: "\u062D\u0633\u0627\u0628 Google \u063A\u064A\u0631 \u0645\u0648\u062B\u0642 \u0627\u0644\u0628\u0631\u064A\u062F \u0623\u0648 \u0645\u0639\u0637\u0644.",
          messageEn: "Google account email not verified or disabled."
        });
        return;
      }
      const email = verifiedUser.email.toLowerCase();
      const uid = String(verifiedUser.localId || "");
      if (isSubjectRevoked(email, uid)) {
        clearSessionCookie(req, res);
        res.status(403).json({
          ok: false,
          code: "SESSION_REVOKED",
          messageAr: "\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0648\u0642\u0648\u0641 \u0648\u0645\u0633\u062D\u0648\u0628 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0646 \u0642\u0628\u0644 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629.",
          messageEn: "Account access has been revoked by owner."
        });
        return;
      }
      let assignedRole = "customer";
      let canonicalRole = "customer";
      const existingAccount = securityState.accountsByEmail[email];
      if (email === BOOTSTRAPPED_OWNER_EMAIL) {
        assignedRole = "owner";
        canonicalRole = "super_admin";
      } else if (securityState.designatedRoles[email] === "basit_admin") {
        assignedRole = "basit_admin";
        canonicalRole = "platform_admin";
      } else if (securityState.designatedRoles[email] === "finance_admin") {
        assignedRole = "finance_admin";
        canonicalRole = "finance_manager";
      } else if (body.declaredRole === "finance_admin" && securityState.designatedRoles[email] === "finance_admin") {
        assignedRole = "finance_admin";
        canonicalRole = "finance_manager";
      } else if (existingAccount && existingAccount.approvalStatus === "approved") {
        canonicalRole = existingAccount.canonicalRole;
        assignedRole = resolveCanonicalToLegacyServerRole(canonicalRole);
      }
      const tenantRec = existingAccount?.tenantId ? securityState.tenantsById[existingAccount.tenantId] : void 0;
      const token = crypto.randomBytes(32).toString("base64url");
      const nowMs = Date.now();
      const session = {
        sessionId: token,
        email,
        uid,
        username: existingAccount?.username,
        employeeCode: existingAccount?.employeeCode,
        canApproveHabe: isHabeApproverAccount(email, existingAccount),
        fullName: verifiedUser.displayName || existingAccount?.fullName || email.split("@")[0],
        authKind: "google_firebase",
        role: assignedRole,
        canonicalRole,
        tenantId: tenantRec?.tenantId || existingAccount?.tenantId || "",
        tenantName: tenantRec?.name || "",
        tenantKind: tenantRec?.kind,
        contractedKitchenIds: tenantRec?.contractedKitchenIds || [],
        customPermissions: existingAccount?.customPermissions || [],
        approvalStatus: "approved",
        ownerPinVerified: false,
        createdAtMs: nowMs,
        expiresAtMs: nowMs + SESSION_TTL_MS
      };
      sessionStore.set(token, session);
      setSessionCookie(req, res, token);
      appendAuditEntry({
        actorUid: uid,
        actorEmail: email,
        actorRole: canonicalRole,
        action: "\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0645\u0648\u062B\u0642 \u0639\u0628\u0631 Google",
        targetType: "session",
        targetId: session.uid,
        severity: "info",
        details: `Google OAuth session issued for ${canonicalRole}`
      });
      res.json({
        ok: true,
        user: serializePublicSessionUser(session)
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        messageAr: "\u062A\u0639\u0630\u0631 \u0625\u0635\u062F\u0627\u0631 \u062C\u0644\u0633\u0629 \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u0622\u0645\u0646\u0629.",
        messageEn: err instanceof Error ? err.message : "OAuth session exchange error."
      });
    }
  });
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const body = req.body;
      const rawEmail = String(body.email || "").trim().toLowerCase();
      const fullName = String(body.fullName || "").trim().slice(0, 120);
      const clientIp = req.ip || "unknown";
      if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
        res.status(400).json({
          ok: false,
          messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0635\u062D\u064A\u062D.",
          messageEn: "Please provide a valid email address."
        });
        return;
      }
      if (fullName.length < 2) {
        res.status(400).json({
          ok: false,
          messageAr: "\u064A\u0631\u062C\u0649 \u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644 \u0623\u0648\u0644\u0627\u064B.",
          messageEn: "Please enter your full name first."
        });
        return;
      }
      if (isSubjectRevoked(rawEmail)) {
        res.status(403).json({
          ok: false,
          code: "ACCOUNT_REVOKED",
          messageAr: "\u062A\u0645 \u062D\u0638\u0631 \u0648\u0633\u062D\u0628 \u0635\u0644\u0627\u062D\u064A\u0629 \u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0645\u0646 \u0627\u0644\u062F\u062E\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u0635\u0629.",
          messageEn: "Access for this email is revoked."
        });
        return;
      }
      const nowMs = Date.now();
      const existing = otpChallengeStore.get(rawEmail);
      if (existing && nowMs - existing.lastSentAtMs < OTP_COOLDOWN_MS) {
        const waitSec = Math.ceil((OTP_COOLDOWN_MS - (nowMs - existing.lastSentAtMs)) / 1e3);
        res.status(429).json({
          ok: false,
          code: "OTP_COOLDOWN",
          retryAfterSec: waitSec,
          messageAr: `\u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 ${waitSec} \u062B\u0627\u0646\u064A\u0629 \u0642\u0628\u0644 \u0637\u0644\u0628 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F.`,
          messageEn: `Please wait ${waitSec}s before requesting a new code.`
        });
        return;
      }
      const ipHits = pruneRateWindow(otpIpRateStore, clientIp, nowMs, OTP_EMAIL_WINDOW_MS);
      if (ipHits.length >= OTP_IP_WINDOW_MAX) {
        res.status(429).json({
          ok: false,
          code: "IP_RATE_LIMITED",
          messageAr: "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0639\u0646\u0648\u0627\u0646. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0644\u0627\u062D\u0642\u0627\u064B.",
          messageEn: "Too many OTP requests from this IP. Try again later."
        });
        return;
      }
      const emailHits = pruneRateWindow(otpEmailRateStore, rawEmail, nowMs, OTP_EMAIL_WINDOW_MS);
      if (emailHits.length >= OTP_EMAIL_WINDOW_MAX) {
        res.status(429).json({
          ok: false,
          code: "EMAIL_RATE_LIMITED",
          messageAr: "\u062A\u0645 \u0637\u0644\u0628 \u0639\u062F\u0629 \u0631\u0645\u0648\u0632 \u0644\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u062E\u0644\u0627\u0644 \u0641\u062A\u0631\u0629 \u0642\u0635\u064A\u0631\u0629. \u0627\u0646\u062A\u0638\u0631 15 \u062F\u0642\u064A\u0642\u0629.",
          messageEn: "Too many OTP requests for this email. Wait 15 minutes."
        });
        return;
      }
      const mailStatus = getMailTransportStatus();
      if (!mailStatus.hasGmailSmtp) {
        res.status(503).json({
          ok: false,
          code: "GMAIL_SMTP_UNCONFIGURED",
          gmailCliAvailable: false,
          messageAr: "\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642: \u062E\u062F\u0645\u0629 \u0625\u0631\u0633\u0627\u0644 OTP \u062A\u0639\u062A\u0645\u062F \u0639\u0644\u0649 Gmail SMTP \u0641\u0642\u0637\u060C \u0648\u0644\u0645 \u064A\u062A\u0645 \u0636\u0628\u0637 GMAIL_SMTP_USER \u0623\u0648 GMAIL_SMTP_APP_PASSWORD \u0628\u0634\u0643\u0644 \u0635\u062D\u064A\u062D \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062E\u0627\u062F\u0645.",
          messageEn: "Gmail SMTP is not configured (valid GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD required). RESEND_API_KEY is optional and not required."
        });
        return;
      }
      const code = String(crypto.randomInt(1e5, 1e6));
      const salt = crypto.randomBytes(16).toString("hex");
      const codeHash = hashOtpCode(salt, rawEmail, code);
      try {
        const dispatch = await sendOtpEmailViaConfiguredTransport(rawEmail, fullName, code);
        if (!dispatch.sent) {
          throw new Error("GMAIL_SMTP_UNAVAILABLE");
        }
        otpChallengeStore.set(rawEmail, {
          email: rawEmail,
          fullName,
          purpose: "login",
          salt,
          codeHash,
          expiresAtMs: nowMs + OTP_TTL_MS,
          lastSentAtMs: nowMs,
          attempts: 0,
          used: false
        });
        ipHits.push(nowMs);
        emailHits.push(nowMs);
        otpIpRateStore.set(clientIp, ipHits);
        otpEmailRateStore.set(rawEmail, emailHits);
        res.json({
          ok: true,
          deliveryMode: "gmail_smtp",
          expiresInSec: OTP_TTL_MS / 1e3,
          cooldownSec: OTP_COOLDOWN_MS / 1e3,
          messageAr: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0633\u0631\u064A \u0625\u0644\u0649 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0639\u0628\u0631 Gmail SMTP (\u0635\u0627\u0644\u062D \u0644\u0645\u062F\u0629 5 \u062F\u0642\u0627\u0626\u0642 \u0648\u0644\u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629).",
          messageEn: "Verification code sent via Gmail SMTP (valid for 5 minutes, single-use)."
        });
      } catch (mailErr) {
        const smtpCode = typeof mailErr === "object" && mailErr && "code" in mailErr ? String(mailErr.code || "") : "";
        const isAuthFail = smtpCode === "EAUTH";
        const isTimeout = smtpCode === "ETIMEDOUT" || smtpCode === "ECONNECTION" || smtpCode === "ESOCKET";
        res.status(502).json({
          ok: false,
          code: isAuthFail ? "GMAIL_SMTP_AUTH_FAILED" : "GMAIL_SMTP_SEND_FAILED",
          messageAr: isAuthFail ? "\u0641\u0634\u0644 \u0627\u0644\u062A\u0648\u062B\u064A\u0642 \u0645\u0639 \u062E\u0627\u062F\u0645 Gmail SMTP. \u062A\u0623\u0643\u062F \u0645\u0646 \u0635\u062D\u0629 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 (App Password) \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062E\u0627\u062F\u0645." : isTimeout ? "\u0627\u0646\u062A\u0647\u062A \u0645\u0647\u0644\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u062E\u0627\u062F\u0645 Gmail SMTP \u062D\u0627\u0644\u064A\u0627\u064B. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0628\u0639\u062F \u0642\u0644\u064A\u0644." : "\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0639\u0628\u0631 Gmail SMTP \u062D\u0627\u0644\u064A\u0627\u064B. \u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u0634\u0628\u0643\u0629 \u0648\u0635\u062D\u0629 \u0625\u0639\u062F\u0627\u062F\u0627\u062A Gmail SMTP.",
          messageEn: isAuthFail ? "Gmail SMTP authentication failed. Verify GMAIL_SMTP_USER and Gmail App Password." : isTimeout ? "Gmail SMTP connection timed out. Please retry shortly." : "Failed to dispatch OTP email via Gmail SMTP."
        });
      }
    } catch (err) {
      res.status(500).json({
        ok: false,
        messageAr: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0637\u0644\u0628 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642.",
        messageEn: err instanceof Error ? err.message : "Failed to process OTP request."
      });
    }
  });
  app.post("/api/auth/verify-otp", (req, res) => {
    const body = req.body;
    const rawEmail = String(body.email || "").trim().toLowerCase();
    const rawCode = String(body.code || "").trim();
    if (!rawEmail || !/^\d{6}$/.test(rawCode)) {
      res.status(400).json({
        ok: false,
        messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0645\u0643\u0648\u0646 \u0645\u0646 6 \u0623\u0631\u0642\u0627\u0645.",
        messageEn: "Enter your email and 6-digit verification code."
      });
      return;
    }
    if (isSubjectRevoked(rawEmail)) {
      res.status(403).json({
        ok: false,
        code: "ACCOUNT_REVOKED",
        messageAr: "\u062A\u0645 \u0633\u062D\u0628 \u0635\u0644\u0627\u062D\u064A\u0629 \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0646 \u0627\u0644\u062F\u062E\u0648\u0644.",
        messageEn: "Account access revoked."
      });
      return;
    }
    const record = otpChallengeStore.get(rawEmail);
    if (!record || record.used) {
      res.status(404).json({
        ok: false,
        messageAr: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0637\u0644\u0628 \u062A\u062D\u0642\u0642 \u0635\u0627\u0644\u062D \u0644\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0623\u0648 \u062A\u0645 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0631\u0645\u0632 \u0645\u0633\u0628\u0642\u0627\u064B. \u0627\u0637\u0644\u0628 \u0631\u0645\u0632\u0627\u064B \u062C\u062F\u064A\u062F\u0627\u064B.",
        messageEn: "No valid unused OTP challenge found for this email."
      });
      return;
    }
    if (Date.now() > record.expiresAtMs) {
      otpChallengeStore.delete(rawEmail);
      res.status(410).json({
        ok: false,
        code: "OTP_EXPIRED",
        messageAr: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 (5 \u062F\u0642\u0627\u0626\u0642). \u064A\u0631\u062C\u0649 \u0637\u0644\u0628 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F.",
        messageEn: "Verification code expired after 5 minutes. Request a new one."
      });
      return;
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      otpChallengeStore.delete(rawEmail);
      res.status(429).json({
        ok: false,
        code: "OTP_ATTEMPTS_EXCEEDED",
        messageAr: "\u062A\u0645 \u0627\u0633\u062A\u0646\u0641\u0627\u062F \u0639\u062F\u062F \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647\u0627 (5 \u0645\u062D\u0627\u0648\u0644\u0627\u062A). \u0627\u0637\u0644\u0628 \u0631\u0645\u0632\u0627\u064B \u062C\u062F\u064A\u062F\u0627\u064B.",
        messageEn: "Maximum failed attempts reached. Request a new code."
      });
      return;
    }
    const incomingHash = hashOtpCode(record.salt, rawEmail, rawCode);
    if (!timingSafeHexEquals(incomingHash, record.codeHash)) {
      record.attempts += 1;
      if (record.attempts >= OTP_MAX_ATTEMPTS) {
        otpChallengeStore.delete(rawEmail);
      } else {
        otpChallengeStore.set(rawEmail, record);
      }
      res.status(401).json({
        ok: false,
        remainingAttempts: Math.max(0, OTP_MAX_ATTEMPTS - record.attempts),
        messageAr: record.attempts >= OTP_MAX_ATTEMPTS ? "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0648\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0631\u0645\u0632 \u0644\u0627\u0633\u062A\u0646\u0641\u0627\u062F \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A." : "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.",
        messageEn: "Invalid verification code."
      });
      return;
    }
    record.used = true;
    otpChallengeStore.delete(rawEmail);
    const existingAcct = securityState.accountsByEmail[record.email];
    if (existingAcct && existingAcct.approvalStatus === "pending_review") {
      res.status(403).json({
        ok: false,
        code: "PENDING_ADMIN_APPROVAL",
        messageAr: "\u062D\u0633\u0627\u0628 \u0647\u0630\u0627 \u0627\u0644\u0643\u064A\u0627\u0646 \u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0641\u0639\u064A\u0644 \u0648\u0635\u0648\u0644\u0647 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0642\u0628\u0644 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629.",
        messageEn: "Account is pending administrative approval."
      });
      return;
    }
    let cRole = existingAcct?.approvalStatus === "approved" ? existingAcct.canonicalRole : "customer";
    if (record.email === BOOTSTRAPPED_OWNER_EMAIL) {
      cRole = "super_admin";
    } else if (securityState.designatedRoles[record.email] === "basit_admin") {
      cRole = "platform_admin";
    } else if (securityState.designatedRoles[record.email] === "finance_admin") {
      cRole = "finance_manager";
    }
    const tenantRec = existingAcct?.tenantId ? securityState.tenantsById[existingAcct.tenantId] : void 0;
    const token = crypto.randomBytes(32).toString("base64url");
    const nowMs = Date.now();
    const session = {
      sessionId: token,
      email: record.email,
      uid: existingAcct?.uid || `otp_${crypto.createHash("sha256").update(record.email).digest("hex").slice(0, 24)}`,
      username: existingAcct?.username,
      employeeCode: existingAcct?.employeeCode,
      canApproveHabe: isHabeApproverAccount(record.email, existingAcct),
      fullName: existingAcct?.fullName || record.fullName,
      authKind: "email_otp",
      role: resolveCanonicalToLegacyServerRole(cRole),
      canonicalRole: cRole,
      tenantId: tenantRec?.tenantId || existingAcct?.tenantId || "",
      tenantName: tenantRec?.name || "",
      tenantKind: tenantRec?.kind,
      contractedKitchenIds: tenantRec?.contractedKitchenIds || [],
      customPermissions: existingAcct?.customPermissions || [],
      approvalStatus: "approved",
      ownerPinVerified: false,
      createdAtMs: nowMs,
      expiresAtMs: nowMs + SESSION_TTL_MS
    };
    sessionStore.set(token, session);
    setSessionCookie(req, res, token);
    appendAuditEntry({
      actorUid: session.uid,
      actorEmail: session.email,
      actorRole: session.canonicalRole,
      action: "\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0639\u0628\u0631 OTP \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
      targetType: "session",
      targetId: session.uid,
      severity: "info",
      details: "Verified single-use OTP session issued"
    });
    res.json({
      ok: true,
      user: {
        ...serializePublicSessionUser(session),
        verifiedAt: new Date(nowMs).toISOString()
      },
      messageAr: "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0648\u0625\u0646\u0634\u0627\u0621 \u062C\u0644\u0633\u0629 \u0639\u0645\u064A\u0644 \u0622\u0645\u0646\u0629 \u0639\u0628\u0631 \u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0627\u0631\u062A\u0628\u0627\u0637 \u0627\u0644\u0645\u0634\u0641\u0631\u0629 (HttpOnly Cookie).",
      messageEn: "Email verified and secure HttpOnly session issued."
    });
  });
  app.post("/api/auth/register", (req, res) => {
    const body = req.body;
    const fullName = String(body.fullName || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase();
    const rawUsername = String(body.username || "").trim().toLowerCase().replace(/^@/, "");
    const phone = normalizePhone(String(body.phone || "").trim());
    const password = String(body.password || "");
    const accountKind = body.accountKind === "client_company" || body.accountKind === "central_kitchen" ? body.accountKind : "customer";
    const businessName = String(body.businessName || "").trim().slice(0, 140);
    const commercialRegRef = String(body.commercialRegRef || "").trim().slice(0, 80);
    const city = String(body.city || "Cairo").trim().slice(0, 80);
    const countryCode = ["EG", "AE", "QA", "OM", "GB"].includes(String(body.countryCode || "").toUpperCase()) ? String(body.countryCode).toUpperCase() : "EG";
    const inviteToken = String(body.inviteToken || "").trim();
    if (fullName.length < 2) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644 (\u062D\u0631\u0641\u0627\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644).", messageEn: "Full name is required." });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0635\u062D\u064A\u062D.", messageEn: "Valid email is required." });
      return;
    }
    if (rawUsername && !/^[a-z0-9._-]{3,32}$/.test(rawUsername)) {
      res.status(400).json({
        ok: false,
        code: "INVALID_USERNAME",
        messageAr: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u064A\u062C\u0628 \u0623\u0646 \u064A\u062A\u0643\u0648\u0646 \u0645\u0646 3 \u0625\u0644\u0649 32 \u062D\u0631\u0641\u0627\u064B/\u0631\u0642\u0645\u0627\u064B \u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0627\u064B \u0641\u0642\u0637.",
        messageEn: "Username must be 3-32 lowercase alphanumeric, dot, underscore, or hyphen characters."
      });
      return;
    }
    if (isSubjectRevoked(email)) {
      res.status(403).json({ ok: false, code: "ACCOUNT_REVOKED", messageAr: "\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0645\u062D\u0638\u0648\u0631 \u0645\u0646 \u0627\u0644\u062A\u0633\u062C\u064A\u0644.", messageEn: "Email access revoked." });
      return;
    }
    if (!isStrongPassword(password)) {
      res.status(400).json({
        ok: false,
        code: "WEAK_PASSWORD",
        messageAr: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 8 \u0623\u062D\u0631\u0641/\u0623\u0631\u0642\u0627\u0645 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0648\u0623\u0644\u0627 \u062A\u0643\u0648\u0646 \u0634\u0627\u0626\u0639\u0629.",
        messageEn: "Password must be at least 8 characters and not trivial."
      });
      return;
    }
    if (securityState.accountsByEmail[email]) {
      res.status(409).json({
        ok: false,
        code: "EMAIL_EXISTS",
        messageAr: "\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0645\u0633\u062C\u0644 \u0628\u0627\u0644\u0641\u0639\u0644. \u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631.",
        messageEn: "An account with this email already exists."
      });
      return;
    }
    if (rawUsername && Object.values(securityState.accountsByEmail).some(
      (a) => (a.username || "").toLowerCase() === rawUsername || (a.usernameAliases || []).some((al) => al.toLowerCase() === rawUsername)
    )) {
      res.status(409).json({
        ok: false,
        code: "USERNAME_EXISTS",
        messageAr: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0627\u0644\u0641\u0639\u0644 \u0644\u062D\u0633\u0627\u0628 \u0622\u062E\u0631.",
        messageEn: "Username already taken."
      });
      return;
    }
    if (phone && Object.values(securityState.accountsByEmail).some((a) => a.phone && a.phone === phone)) {
      res.status(409).json({
        ok: false,
        code: "PHONE_EXISTS",
        messageAr: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0645\u0633\u062C\u0644 \u0628\u0627\u0644\u0641\u0639\u0644 \u0644\u062D\u0633\u0627\u0628 \u0622\u062E\u0631.",
        messageEn: "Phone number already registered."
      });
      return;
    }
    if (accountKind !== "customer" && !inviteToken && (businessName.length < 2 || commercialRegRef.length < 2)) {
      res.status(400).json({
        ok: false,
        messageAr: "\u064A\u062C\u0628 \u0625\u062F\u062E\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u062C\u0647\u0629/\u0627\u0644\u0645\u0637\u0628\u062E \u0648\u0631\u0642\u0645 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062A\u062C\u0627\u0631\u064A \u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645 \u0627\u0644\u0645\u0624\u0633\u0633\u064A\u0629.",
        messageEn: "Business name and commercial registration reference are required for company/kitchen accounts."
      });
      return;
    }
    let matchedInvite = null;
    if (inviteToken) {
      const tokenHash = crypto.createHash("sha256").update(inviteToken).digest("hex");
      matchedInvite = Object.values(securityState.invitationsById).find(
        (inv) => inv.status === "pending" && inv.inviteTokenHash === tokenHash && inv.invitedEmail === email
      ) || null;
      if (!matchedInvite) {
        res.status(400).json({
          ok: false,
          code: "INVALID_INVITE_TOKEN",
          messageAr: "\u0631\u0645\u0632 \u0627\u0644\u062F\u0639\u0648\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0644\u0627 \u064A\u0637\u0627\u0628\u0642 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0627\u0644\u0645\u062F\u062E\u0644.",
          messageEn: "Invitation token invalid or expired."
        });
        return;
      }
    }
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashOwnerPin(password, salt);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const uid = `usr_${crypto.createHash("sha256").update(email).digest("hex").slice(0, 20)}`;
    const approvalStatus = matchedInvite || accountKind === "customer" ? "approved" : "pending_review";
    const canonicalRole = matchedInvite ? matchedInvite.assignedRole : "customer";
    const derivedUsername = rawUsername || `${email.split("@")[0].replace(/[^a-z0-9._-]/g, "").slice(0, 18) || "user"}_${uid.slice(4, 8)}`;
    const account = {
      uid,
      email,
      username: derivedUsername,
      usernameAliases: [],
      phone,
      fullName,
      passwordSalt: salt,
      passwordHash,
      canonicalRole,
      requestedKind: accountKind,
      approvalStatus,
      tenantId: matchedInvite ? matchedInvite.tenantId : "",
      customPermissions: matchedInvite ? matchedInvite.assignedPermissions : [],
      businessName: matchedInvite ? matchedInvite.tenantName : businessName,
      commercialRegRef,
      city,
      countryCode,
      reviewNote: "",
      createdAt: nowIso,
      updatedAt: nowIso
    };
    securityState.accountsByEmail[email] = account;
    if (matchedInvite) {
      matchedInvite.status = "accepted";
      matchedInvite.updatedAt = nowIso;
      securityState.invitationsById[matchedInvite.inviteId] = matchedInvite;
    }
    saveSecurityState(securityState);
    appendAuditEntry({
      actorUid: uid,
      actorEmail: email,
      actorUsername: derivedUsername,
      actorRole: canonicalRole,
      action: approvalStatus === "pending_review" ? `\u0637\u0644\u0628 \u062A\u0633\u062C\u064A\u0644 \u062C\u0647\u0629 \u062C\u062F\u064A\u062F\u0629 \u0642\u064A\u062F \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F (${accountKind})` : matchedInvite ? `\u062A\u0641\u0639\u064A\u0644 \u0639\u0636\u0648\u064A\u0629 \u0645\u0648\u0638\u0641 \u0628\u062F\u0639\u0648\u0629 \u0645\u0639\u062A\u0645\u062F\u0629 \u062F\u0627\u062E\u0644 ${matchedInvite.tenantName}` : "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628 \u0639\u0645\u064A\u0644 \u062C\u062F\u064A\u062F",
      targetType: "account",
      targetId: uid,
      severity: "info",
      details: approvalStatus === "pending_review" ? `Business: ${businessName}` : `Role: ${canonicalRole}`
    });
    if (approvalStatus === "pending_review") {
      res.status(202).json({
        ok: true,
        pendingApproval: true,
        approvalStatus: "pending_review",
        messageAr: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0637\u0644\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0643\u064A\u0627\u0646/\u0627\u0644\u0645\u0637\u0628\u062E \u0628\u0646\u062C\u0627\u062D \u0648\u0647\u0648 \u0627\u0644\u0622\u0646 \u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0645\u0646 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0635\u0629. \u0644\u0627 \u062A\u064F\u0645\u0646\u062D \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0642\u0628\u0644 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629.",
        messageEn: "Your company/kitchen registration is pending Platform Admin review and approval. Administrative access remains disabled until approved."
      });
      return;
    }
    const tenantRec = account.tenantId ? securityState.tenantsById[account.tenantId] : void 0;
    const token = crypto.randomBytes(32).toString("base64url");
    const nowMs = Date.now();
    const session = {
      sessionId: token,
      email: account.email,
      uid: account.uid,
      username: account.username,
      employeeCode: account.employeeCode,
      canApproveHabe: isHabeApproverAccount(account.email, account),
      fullName: account.fullName,
      authKind: "password",
      role: resolveCanonicalToLegacyServerRole(account.canonicalRole),
      canonicalRole: account.canonicalRole,
      tenantId: tenantRec?.tenantId || account.tenantId,
      tenantName: tenantRec?.name || account.businessName,
      tenantKind: tenantRec?.kind,
      contractedKitchenIds: tenantRec?.contractedKitchenIds || [],
      customPermissions: account.customPermissions,
      approvalStatus: "approved",
      ownerPinVerified: false,
      createdAtMs: nowMs,
      expiresAtMs: nowMs + SESSION_TTL_MS
    };
    sessionStore.set(token, session);
    setSessionCookie(req, res, token);
    res.json({
      ok: true,
      pendingApproval: false,
      user: serializePublicSessionUser(session),
      messageAr: "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u062A\u0641\u0639\u064A\u0644\u0647 \u0628\u062C\u0644\u0633\u0629 \u0622\u0645\u0646\u0629 \u0628\u0646\u062C\u0627\u062D.",
      messageEn: "Account created and secure session issued."
    });
  });
  app.get("/api/auth/executive-setup-status", (_req, res) => {
    const accounts = EXECUTIVE_ACCOUNTS.map((spec) => {
      const acct = securityState.accountsByEmail[spec.email.toLowerCase()];
      return {
        username: spec.username,
        fullNameAr: spec.fullNameAr,
        fullNameEn: spec.fullNameEn,
        roleLabelAr: spec.canonicalRole === "super_admin" ? "\u0627\u0644\u0645\u0627\u0644\u0643 \u0648\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0623\u0639\u0644\u0649" : "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 (H-A-B-E)",
        canonicalRole: spec.canonicalRole,
        hasPassword: Boolean(acct?.passwordHash)
      };
    });
    res.json({ ok: true, executives: accounts });
  });
  app.post("/api/auth/claim-executive-password", (req, res) => {
    const body = req.body;
    const rawIdentifier = String(body.identifier || "").trim();
    const newPassword = String(body.newPassword || "");
    if (!rawIdentifier) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F.", messageEn: "Identifier required." });
      return;
    }
    const acct = findAccountByIdentifier(rawIdentifier);
    const isGovExec = acct && EXECUTIVE_ACCOUNTS.some((s) => s.email.toLowerCase() === acct.email.toLowerCase());
    if (!acct || !isGovExec) {
      res.status(404).json({ ok: false, messageAr: "\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", messageEn: "Executive account not found." });
      return;
    }
    if (acct.passwordHash) {
      res.status(409).json({
        ok: false,
        code: "PASSWORD_ALREADY_CLAIMED",
        messageAr: "\u062A\u0645 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0628\u0627\u0644\u0641\u0639\u0644. \u0627\u0633\u062A\u062E\u062F\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648 \u0627\u0637\u0644\u0628 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0645\u0646 \u0627\u0644\u0645\u0627\u0644\u0643.",
        messageEn: "Password already set for this executive account."
      });
      return;
    }
    if (!isStrongPassword(newPassword)) {
      res.status(400).json({
        ok: false,
        code: "WEAK_PASSWORD",
        messageAr: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064A\u062C\u0628 \u0623\u0646 \u0644\u0627 \u062A\u0642\u0644 \u0639\u0646 8 \u0623\u062D\u0631\u0641/\u0623\u0631\u0642\u0627\u0645 \u0648\u0623\u0644\u0627 \u062A\u0643\u0648\u0646 \u0634\u0627\u0626\u0639\u0629.",
        messageEn: "Password must be at least 8 characters and not trivial."
      });
      return;
    }
    const salt = crypto.randomBytes(16).toString("hex");
    acct.passwordSalt = salt;
    acct.passwordHash = hashOwnerPin(newPassword, salt);
    acct.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    securityState.accountsByEmail[acct.email] = acct;
    saveSecurityState(securityState);
    const tenantRec = acct.tenantId ? securityState.tenantsById[acct.tenantId] : void 0;
    const token = crypto.randomBytes(32).toString("base64url");
    const nowMs = Date.now();
    const session = {
      sessionId: token,
      email: acct.email,
      uid: acct.uid,
      username: acct.username,
      employeeCode: acct.employeeCode,
      canApproveHabe: isHabeApproverAccount(acct.email, acct),
      fullName: acct.fullName,
      authKind: "password",
      role: resolveCanonicalToLegacyServerRole(acct.canonicalRole),
      canonicalRole: acct.canonicalRole,
      tenantId: tenantRec?.tenantId || acct.tenantId,
      tenantName: tenantRec?.name || acct.businessName,
      tenantKind: tenantRec?.kind,
      contractedKitchenIds: tenantRec?.contractedKitchenIds || [],
      customPermissions: acct.customPermissions,
      approvalStatus: "approved",
      ownerPinVerified: false,
      createdAtMs: nowMs,
      expiresAtMs: nowMs + SESSION_TTL_MS
    };
    sessionStore.set(token, session);
    setSessionCookie(req, res, token);
    appendAuditEntry({
      actorUid: acct.uid,
      actorEmail: acct.email,
      actorUsername: acct.username,
      actorRole: acct.canonicalRole,
      action: `\u062A\u0641\u0639\u064A\u0644 \u0648\u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0623\u0648\u0644\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0644\u062D\u0633\u0627\u0628 (${acct.username || acct.fullName})`,
      targetType: "account",
      targetId: acct.uid,
      severity: "info",
      details: `First-run independent executive password claimed for ${acct.username}`
    });
    res.json({
      ok: true,
      user: serializePublicSessionUser(session),
      messageAr: `\u062A\u0645 \u062A\u0623\u0645\u064A\u0646 \u062D\u0633\u0627\u0628\u0643 (${acct.fullName}) \u0648\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062C\u0644\u0633\u0629 \u0628\u0646\u062C\u0627\u062D.`,
      messageEn: "Executive password configured and signed in."
    });
  });
  app.post("/api/auth/change-password", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    const body = req.body;
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const acct = securityState.accountsByEmail[sess.email.toLowerCase()];
    if (!acct) {
      res.status(404).json({ ok: false, messageAr: "\u0633\u062C\u0644 \u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0644\u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631.", messageEn: "Account record not found." });
      return;
    }
    if (acct.passwordHash) {
      const candidateHash = hashOwnerPin(currentPassword, acct.passwordSalt);
      if (!timingSafeHexEquals(candidateHash, acct.passwordHash)) {
        res.status(401).json({ ok: false, messageAr: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629.", messageEn: "Current password incorrect." });
        return;
      }
    }
    if (!isStrongPassword(newPassword)) {
      res.status(400).json({
        ok: false,
        code: "WEAK_PASSWORD",
        messageAr: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 8 \u0623\u062D\u0631\u0641/\u0623\u0631\u0642\u0627\u0645 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0648\u0623\u0644\u0627 \u062A\u0643\u0648\u0646 \u0634\u0627\u0626\u0639\u0629.",
        messageEn: "New password must be 8+ non-trivial characters."
      });
      return;
    }
    const salt = crypto.randomBytes(16).toString("hex");
    acct.passwordSalt = salt;
    acct.passwordHash = hashOwnerPin(newPassword, salt);
    acct.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    securityState.accountsByEmail[acct.email] = acct;
    saveSecurityState(securityState);
    for (const [tok, active] of sessionStore.entries()) {
      if (tok !== sess.sessionId && (active.uid === acct.uid || active.email === acct.email)) {
        sessionStore.delete(tok);
      }
    }
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorUsername: sess.username,
      actorRole: sess.canonicalRole,
      action: "\u062A\u062D\u062F\u064A\u062B \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0628\u0646\u062C\u0627\u062D",
      targetType: "account",
      targetId: acct.uid,
      severity: "info",
      details: `User ${sess.username || sess.email} rotated password`
    });
    res.json({
      ok: true,
      messageAr: "\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062C\u0627\u062D \u0648\u062A\u0623\u0645\u064A\u0646 \u0627\u0644\u062C\u0644\u0633\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629.",
      messageEn: "Password updated successfully."
    });
  });
  app.post("/api/auth/login-password", (req, res) => {
    const body = req.body;
    const rawIdentifier = String(body.identifier || "").trim();
    const password = String(body.password || "");
    if (!rawIdentifier || !password) {
      res.status(400).json({
        ok: false,
        messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631.",
        messageEn: "Username, email, or phone and password are required."
      });
      return;
    }
    const account = findAccountByIdentifier(rawIdentifier);
    const rateKey = account?.email || rawIdentifier.toLowerCase() || req.ip || "unknown";
    const nowMs = Date.now();
    const failRecord = passwordLoginFailStore.get(rateKey) || { count: 0, lockedUntilMs: 0 };
    if (failRecord.lockedUntilMs > nowMs) {
      const waitMin = Math.ceil((failRecord.lockedUntilMs - nowMs) / 6e4);
      res.status(429).json({
        ok: false,
        code: "LOGIN_LOCKED",
        messageAr: `\u062A\u0645 \u0642\u0641\u0644 \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0645\u062F\u0629 ${waitMin} \u062F\u0642\u064A\u0642\u0629 \u0644\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u062D\u0633\u0627\u0628.`,
        messageEn: "Too many failed login attempts. Try again later."
      });
      return;
    }
    if (!account) {
      const nextCount = failRecord.count + 1;
      passwordLoginFailStore.set(rateKey, {
        count: nextCount >= LOGIN_MAX_ATTEMPTS ? 0 : nextCount,
        lockedUntilMs: nextCount >= LOGIN_MAX_ATTEMPTS ? nowMs + LOGIN_LOCK_MS : 0
      });
      res.status(401).json({
        ok: false,
        code: "INVALID_CREDENTIALS",
        messageAr: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629.",
        messageEn: "Invalid credentials."
      });
      return;
    }
    if (isSubjectRevoked(account.email, account.uid)) {
      res.status(403).json({
        ok: false,
        code: "ACCOUNT_SUSPENDED",
        messageAr: "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0623\u0648 \u062A\u062C\u0645\u064A\u062F \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0646 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0635\u0629.",
        messageEn: "Account is suspended or revoked."
      });
      return;
    }
    if (!account.passwordHash || !account.passwordSalt) {
      res.status(409).json({
        ok: false,
        code: "PASSWORD_SETUP_REQUIRED",
        canClaimPassword: true,
        identifierHint: account.username || account.email,
        fullName: account.fullName,
        messageAr: `\u0627\u0644\u062D\u0633\u0627\u0628 (${account.fullName}) \u0644\u0645 \u064A\u0636\u0628\u0637 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631\u0647 \u0628\u0639\u062F. \u0639\u064A\u0651\u0646 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631\u0643 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0645\u0646 \u0646\u0645\u0648\u0630\u062C \u0627\u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0641\u0648\u0631\u064A \u0623\u0648 \u0639\u0628\u0631 \u0627\u0644\u0645\u0627\u0644\u0643.`,
        messageEn: "Executive account password not set yet. Claim your independent password now."
      });
      return;
    }
    const candidateHash = hashOwnerPin(password, account.passwordSalt);
    if (!timingSafeHexEquals(candidateHash, account.passwordHash)) {
      const nextCount = failRecord.count + 1;
      passwordLoginFailStore.set(rateKey, {
        count: nextCount >= LOGIN_MAX_ATTEMPTS ? 0 : nextCount,
        lockedUntilMs: nextCount >= LOGIN_MAX_ATTEMPTS ? nowMs + LOGIN_LOCK_MS : 0
      });
      appendAuditEntry({
        actorUid: account.uid,
        actorEmail: account.email,
        actorUsername: account.username,
        actorRole: account.canonicalRole,
        action: "\u0645\u062D\u0627\u0648\u0644\u0629 \u062F\u062E\u0648\u0644 \u0641\u0627\u0634\u0644\u0629 \u0628\u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u062E\u0627\u0637\u0626\u0629",
        targetType: "auth",
        targetId: account.uid,
        severity: "warning",
        details: `Failed password attempt (${nextCount}/${LOGIN_MAX_ATTEMPTS})`
      });
      res.status(401).json({
        ok: false,
        code: "INVALID_CREDENTIALS",
        messageAr: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629.",
        messageEn: "Invalid credentials."
      });
      return;
    }
    passwordLoginFailStore.delete(rateKey);
    if (account.approvalStatus === "pending_review") {
      res.status(403).json({
        ok: false,
        code: "PENDING_ADMIN_APPROVAL",
        messageAr: "\u0637\u0644\u0628 \u0627\u0646\u0636\u0645\u0627\u0645 \u062C\u0647\u062A\u0643\u0645 \u0644\u0627 \u064A\u0632\u0627\u0644 \u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0645\u0646 \u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0635\u0629. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0644\u062D\u064A\u0646 \u0627\u0644\u062A\u0641\u0639\u064A\u0644.",
        messageEn: "Your entity account is still awaiting Platform Admin approval."
      });
      return;
    }
    if (account.approvalStatus === "rejected") {
      res.status(403).json({
        ok: false,
        code: "REGISTRATION_REJECTED",
        messageAr: account.reviewNote || "\u062A\u0645 \u0631\u0641\u0636 \u0637\u0644\u0628 \u062A\u0641\u0639\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u0629.",
        messageEn: account.reviewNote || "Registration rejected by platform admin."
      });
      return;
    }
    let cRole = account.canonicalRole;
    if (account.email === BOOTSTRAPPED_OWNER_EMAIL) {
      cRole = "super_admin";
    } else if (securityState.designatedRoles[account.email] === "basit_admin") {
      cRole = "platform_admin";
    } else if (securityState.designatedRoles[account.email] === "finance_admin") {
      cRole = "finance_manager";
    }
    const tenantRec = account.tenantId ? securityState.tenantsById[account.tenantId] : void 0;
    if (tenantRec && tenantRec.status === "suspended") {
      res.status(403).json({
        ok: false,
        code: "TENANT_SUSPENDED",
        messageAr: "\u062A\u0645 \u062A\u0639\u0644\u064A\u0642 \u0646\u0634\u0627\u0637 \u0627\u0644\u0643\u064A\u0627\u0646/\u0627\u0644\u0645\u0637\u0628\u062E \u0627\u0644\u062A\u0627\u0628\u0639 \u0644\u0647 \u062D\u0633\u0627\u0628\u0643 \u0645\u0624\u0642\u062A\u0627\u064B.",
        messageEn: "Your associated entity/kitchen workspace is suspended."
      });
      return;
    }
    const token = crypto.randomBytes(32).toString("base64url");
    const session = {
      sessionId: token,
      email: account.email,
      uid: account.uid,
      username: account.username,
      employeeCode: account.employeeCode,
      canApproveHabe: isHabeApproverAccount(account.email, account),
      fullName: account.fullName,
      authKind: "password",
      role: resolveCanonicalToLegacyServerRole(cRole),
      canonicalRole: cRole,
      tenantId: tenantRec?.tenantId || account.tenantId,
      tenantName: tenantRec?.name || account.businessName,
      tenantKind: tenantRec?.kind,
      contractedKitchenIds: tenantRec?.contractedKitchenIds || [],
      customPermissions: account.customPermissions,
      approvalStatus: account.approvalStatus,
      ownerPinVerified: false,
      createdAtMs: nowMs,
      expiresAtMs: nowMs + SESSION_TTL_MS
    };
    sessionStore.set(token, session);
    setSessionCookie(req, res, token);
    appendAuditEntry({
      actorUid: session.uid,
      actorEmail: session.email,
      actorUsername: session.username,
      actorRole: session.canonicalRole,
      action: "\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0622\u0645\u0646 \u0628\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
      targetType: "session",
      targetId: session.uid,
      severity: "info",
      details: `Authenticated role ${session.canonicalRole}${session.tenantId ? ` in tenant ${session.tenantId}` : ""}`
    });
    res.json({
      ok: true,
      user: serializePublicSessionUser(session),
      messageAr: "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0646\u062C\u0627\u062D \u0648\u062A\u0641\u0639\u064A\u0644 \u062C\u0644\u0633\u062A\u0643 \u0627\u0644\u0622\u0645\u0646\u0629.",
      messageEn: "Signed in securely."
    });
  });
  app.post("/api/auth/forgot-password/request", async (req, res) => {
    const body = req.body;
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0635\u062D\u064A\u062D.", messageEn: "Valid email required." });
      return;
    }
    const account = securityState.accountsByEmail[email];
    if (!account) {
      res.status(404).json({
        ok: false,
        messageAr: "\u0644\u0627 \u064A\u0648\u062C\u062F \u062D\u0633\u0627\u0628 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0645\u0633\u062C\u0644 \u0628\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A.",
        messageEn: "No password-enabled account found for this email."
      });
      return;
    }
    const nowMs = Date.now();
    const existing = otpChallengeStore.get(email);
    if (existing && nowMs - existing.lastSentAtMs < OTP_COOLDOWN_MS) {
      const waitSec = Math.ceil((OTP_COOLDOWN_MS - (nowMs - existing.lastSentAtMs)) / 1e3);
      res.status(429).json({
        ok: false,
        messageAr: `\u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 ${waitSec} \u062B\u0627\u0646\u064A\u0629 \u0642\u0628\u0644 \u0637\u0644\u0628 \u0631\u0645\u0632 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u062C\u062F\u064A\u062F.`,
        messageEn: `Please wait ${waitSec}s before retrying.`
      });
      return;
    }
    const mailStatus = getMailTransportStatus();
    if (!mailStatus.hasGmailSmtp) {
      res.status(503).json({
        ok: false,
        code: "GMAIL_SMTP_UNCONFIGURED",
        messageAr: "\u062A\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629: \u062E\u0627\u062F\u0645 \u0627\u0644\u0628\u0631\u064A\u062F Gmail SMTP \u063A\u064A\u0631 \u0645\u0636\u0628\u0648\u0637 \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645.",
        messageEn: "Gmail SMTP is not configured on the server."
      });
      return;
    }
    const code = String(crypto.randomInt(1e5, 1e6));
    const salt = crypto.randomBytes(16).toString("hex");
    const codeHash = hashOtpCode(salt, email, code);
    try {
      const dispatch = await sendOtpEmailViaConfiguredTransport(email, account.fullName, code);
      if (!dispatch.sent) throw new Error("SMTP_FAIL");
      otpChallengeStore.set(email, {
        email,
        fullName: account.fullName,
        purpose: "password_reset",
        salt,
        codeHash,
        expiresAtMs: nowMs + OTP_TTL_MS,
        lastSentAtMs: nowMs,
        attempts: 0,
        used: false
      });
      res.json({
        ok: true,
        messageAr: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A (\u0635\u0627\u0644\u062D 5 \u062F\u0642\u0627\u0626\u0642).",
        messageEn: "Password recovery OTP sent via email."
      });
    } catch {
      res.status(502).json({
        ok: false,
        messageAr: "\u0641\u0634\u0644 \u0625\u0631\u0633\u0627\u0644 \u0628\u0631\u064A\u062F \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0639\u0628\u0631 Gmail SMTP.",
        messageEn: "Failed to send password reset email."
      });
    }
  });
  app.post("/api/auth/forgot-password/reset", (req, res) => {
    const body = req.body;
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    const newPassword = String(body.newPassword || "");
    if (!email || !/^\d{6}$/.test(code) || newPassword.length < 8) {
      res.status(400).json({
        ok: false,
        messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0648\u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u0645\u0643\u0648\u0646 \u0645\u0646 6 \u0623\u0631\u0642\u0627\u0645 \u0648\u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u062C\u062F\u064A\u062F\u0629 \u0644\u0627 \u062A\u0642\u0644 \u0639\u0646 8 \u0623\u062D\u0631\u0641.",
        messageEn: "Email, 6-digit OTP code, and 8+ character password are required."
      });
      return;
    }
    const account = securityState.accountsByEmail[email];
    const record = otpChallengeStore.get(email);
    if (!account || !record || record.used || record.purpose !== "password_reset") {
      res.status(404).json({
        ok: false,
        messageAr: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0637\u0644\u0628 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0635\u0627\u0644\u062D \u0644\u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F.",
        messageEn: "No valid password recovery challenge found."
      });
      return;
    }
    if (Date.now() > record.expiresAtMs) {
      otpChallengeStore.delete(email);
      res.status(410).json({ ok: false, messageAr: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0631\u0645\u0632 \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629.", messageEn: "Recovery code expired." });
      return;
    }
    if (!timingSafeHexEquals(hashOtpCode(record.salt, email, code), record.codeHash)) {
      record.attempts += 1;
      if (record.attempts >= OTP_MAX_ATTEMPTS) otpChallengeStore.delete(email);
      res.status(401).json({ ok: false, messageAr: "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.", messageEn: "Invalid recovery code." });
      return;
    }
    otpChallengeStore.delete(email);
    const nextSalt = crypto.randomBytes(16).toString("hex");
    account.passwordSalt = nextSalt;
    account.passwordHash = hashOwnerPin(newPassword, nextSalt);
    account.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    securityState.accountsByEmail[email] = account;
    saveSecurityState(securityState);
    const terminated = terminateUserSessions(account.email, account.uid);
    appendAuditEntry({
      actorUid: account.uid,
      actorEmail: account.email,
      actorRole: account.canonicalRole,
      action: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0648\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0642\u062F\u064A\u0645\u0629",
      targetType: "account",
      targetId: account.uid,
      severity: "info",
      details: `Terminated ${terminated} prior session(s)`
    });
    res.json({
      ok: true,
      messageAr: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062C\u0627\u062D \u0648\u0625\u0644\u063A\u0627\u0621 \u062C\u0645\u064A\u0639 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0633\u0627\u0628\u0642\u0629. \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644.",
      messageEn: "Password updated successfully. You may now sign in."
    });
  });
  app.get("/api/owner/setup-status", (req, res) => {
    const { session } = resolveSessionFromRequest(req);
    if (session?.role === "finance_admin") {
      res.status(403).json({
        ok: false,
        code: "FINANCE_ROLE_ISOLATED",
        messageAr: "\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A \u0645\u0639\u0632\u0648\u0644\u0629 \u062A\u0645\u0627\u0645\u0627\u064B \u0639\u0646 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u0643.",
        messageEn: "Finance admin cannot inspect owner setup endpoints."
      });
      return;
    }
    res.json({
      ok: true,
      configured: Boolean(securityState.ownerPin),
      configuredAt: securityState.ownerPin?.configuredAt || null,
      ownerEmailHint: maskEmail(BOOTSTRAPPED_OWNER_EMAIL),
      requiresBootstrapSecret: !securityState.ownerPin && !session,
      sessionIsOwner: session?.role === "owner",
      ownerPinVerified: Boolean(session?.ownerPinVerified)
    });
  });
  app.post("/api/owner/setup", (req, res) => {
    const body = req.body;
    const { session } = resolveSessionFromRequest(req);
    if (session?.role === "finance_admin" || session?.role === "basit_admin" || session?.role === "customer") {
      res.status(403).json({
        ok: false,
        code: "OWNER_ONLY",
        messageAr: "\u062A\u0623\u0645\u064A\u0646 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u0643 \u0645\u0642\u062A\u0635\u0631 \u062D\u0635\u0631\u064A\u0627\u064B \u0639\u0644\u0649 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064A.",
        messageEn: "Owner security setup is restricted strictly to Platform Owner."
      });
      return;
    }
    const pin = String(body.pin || "").trim();
    const weakPins = /* @__PURE__ */ new Set([
      "12345678",
      "00000000",
      "11111111",
      "password",
      "catering@2026",
      "finance@2026",
      "bahed@2026",
      "admin1234"
    ]);
    if (pin.length < 8 || weakPins.has(pin.toLowerCase())) {
      res.status(400).json({
        ok: false,
        code: "WEAK_OWNER_PIN",
        messageAr: "\u064A\u062C\u0628 \u0623\u0644\u0627 \u064A\u0642\u0644 \u0631\u0645\u0632 \u062A\u0623\u0645\u064A\u0646 \u0627\u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0633\u062A\u0642\u0644 \u0639\u0646 8 \u0623\u062D\u0631\u0641/\u0623\u0631\u0642\u0627\u0645 \u0648\u0623\u0644\u0627 \u064A\u0643\u0648\u0646 \u0643\u0644\u0645\u0629 \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 \u0634\u0627\u0626\u0639\u0629.",
        messageEn: "Owner PIN/passphrase must be at least 8 characters and not a common default."
      });
      return;
    }
    if (!securityState.ownerPin) {
      const envBootstrapSecret = process.env.OWNER_SETUP_SECRET || "";
      const providedSecret = String(body.bootstrapSecret || "").trim();
      const authorizedByOwnerSession = session?.role === "owner";
      const authorizedByBootstrapSecret = Boolean(envBootstrapSecret) && Boolean(providedSecret) && timingSafeTextEquals(providedSecret, envBootstrapSecret);
      if (!authorizedByOwnerSession && !authorizedByBootstrapSecret) {
        res.status(401).json({
          ok: false,
          code: "OWNER_AUTH_OR_SECRET_REQUIRED",
          messageAr: "\u064A\u0644\u0632\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0648\u062B\u0642 \u0639\u0628\u0631 Google \u0623\u0648 \u0625\u062F\u062E\u0627\u0644 \u0645\u0641\u062A\u0627\u062D \u062A\u0647\u064A\u0626\u0629 \u0627\u0644\u0645\u0627\u0644\u0643 \u0644\u0625\u0639\u062F\u0627\u062F \u0631\u0645\u0632 \u0627\u0644\u0623\u0645\u0627\u0646 \u0627\u0644\u0645\u0633\u062A\u0642\u0644.",
          messageEn: "Verify Owner Google session or provide OWNER_SETUP_SECRET to initialize Owner security."
        });
        return;
      }
    } else {
      if (session?.role !== "owner") {
        res.status(403).json({
          ok: false,
          code: "OWNER_ONLY",
          messageAr: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0631\u0645\u0632 \u0623\u0645\u0627\u0646 \u0627\u0644\u0645\u0627\u0644\u0643 \u062A\u062A\u0637\u0644\u0628 \u062C\u0644\u0633\u0629 \u0627\u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u062D\u0627\u0644\u064A\u0629.",
          messageEn: "Owner session required to update security passphrase."
        });
        return;
      }
      const currentPin = String(body.currentPin || "");
      const currentHash = hashOwnerPin(currentPin, securityState.ownerPin.salt);
      if (!timingSafeHexEquals(currentHash, securityState.ownerPin.hash)) {
        res.status(401).json({
          ok: false,
          code: "INVALID_CURRENT_PIN",
          messageAr: "\u0631\u0645\u0632 \u0627\u0644\u0623\u0645\u0627\u0646 \u0627\u0644\u062D\u0627\u0644\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.",
          messageEn: "Current security passphrase is incorrect."
        });
        return;
      }
    }
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = hashOwnerPin(pin, salt);
    securityState.ownerPin = {
      salt,
      hash,
      configuredAt: (/* @__PURE__ */ new Date()).toISOString(),
      configuredByEmail: session?.email || BOOTSTRAPPED_OWNER_EMAIL
    };
    saveSecurityState(securityState);
    if (session && session.role === "owner") {
      session.ownerPinVerified = true;
      sessionStore.set(session.sessionId, session);
    }
    res.json({
      ok: true,
      configured: true,
      configuredAt: securityState.ownerPin.configuredAt,
      messageAr: "\u062A\u0645 \u062A\u0623\u0645\u064A\u0646 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u0643 \u0628\u062E\u0637\u0648\u0629 \u0645\u0633\u062A\u0642\u0644\u0629 \u0648\u062A\u0634\u0641\u064A\u0631 \u0627\u0644\u0631\u0645\u0632 \u0628\u0645\u0644\u0641 \u0627\u0644\u062E\u0627\u062F\u0645 \u0628\u0646\u062C\u0627\u062D.",
      messageEn: "Independent owner security passphrase configured and salted-scrypt hashed."
    });
  });
  app.post("/api/owner/verify", (req, res) => {
    const body = req.body;
    const { session, revoked } = resolveSessionFromRequest(req);
    if (revoked || !session || session.role !== "owner") {
      res.status(403).json({
        ok: false,
        code: "OWNER_SESSION_REQUIRED",
        messageAr: "\u064A\u062A\u0637\u0644\u0628 \u0627\u0644\u062A\u062D\u0642\u0642 \u0648\u062C\u0648\u062F \u062C\u0644\u0633\u0629 \u0646\u0634\u0637\u0629 \u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u0643.",
        messageEn: "Active owner session required."
      });
      return;
    }
    if (!securityState.ownerPin) {
      res.status(409).json({
        ok: false,
        code: "OWNER_PIN_NOT_CONFIGURED",
        messageAr: "\u0644\u0645 \u064A\u062A\u0645 \u0625\u0639\u062F\u0627\u062F \u0631\u0645\u0632 \u0623\u0645\u0627\u0646 \u0627\u0644\u0645\u0627\u0644\u0643 \u0628\u0639\u062F. \u0623\u0643\u0645\u0644 \u062E\u0637\u0648\u0629 \u0625\u0639\u062F\u0627\u062F \u0627\u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0633\u062A\u0642\u0644\u0629 \u0623\u0648\u0644\u0627\u064B.",
        messageEn: "Owner security setup not completed yet."
      });
      return;
    }
    const nowMs = Date.now();
    const failState = ownerPinFailStore.get(session.email) || { count: 0, lockedUntilMs: 0 };
    if (failState.lockedUntilMs > nowMs) {
      const waitMin = Math.ceil((failState.lockedUntilMs - nowMs) / 6e4);
      res.status(429).json({
        ok: false,
        code: "OWNER_PIN_LOCKED",
        messageAr: `\u062A\u0645 \u0642\u0641\u0644 \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0645\u062F\u0629 ${waitMin} \u062F\u0642\u064A\u0642\u0629 \u0644\u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u062D\u0633\u0627\u0628.`,
        messageEn: "Owner verification temporarily locked due to failed attempts."
      });
      return;
    }
    const candidateHash = hashOwnerPin(String(body.pin || ""), securityState.ownerPin.salt);
    if (!timingSafeHexEquals(candidateHash, securityState.ownerPin.hash)) {
      const nextCount = failState.count + 1;
      ownerPinFailStore.set(session.email, {
        count: nextCount >= OWNER_PIN_MAX_ATTEMPTS ? 0 : nextCount,
        lockedUntilMs: nextCount >= OWNER_PIN_MAX_ATTEMPTS ? nowMs + OWNER_PIN_LOCK_MS : 0
      });
      res.status(401).json({
        ok: false,
        code: "INVALID_OWNER_PIN",
        messageAr: "\u0631\u0645\u0632 \u062A\u0623\u0645\u064A\u0646 \u0627\u0644\u0645\u0627\u0644\u0643 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.",
        messageEn: "Incorrect owner security passphrase."
      });
      return;
    }
    ownerPinFailStore.delete(session.email);
    session.ownerPinVerified = true;
    sessionStore.set(session.sessionId, session);
    res.json({
      ok: true,
      ownerPinVerified: true,
      messageAr: "\u062A\u0645 \u062A\u0648\u062B\u064A\u0642 \u0627\u0644\u062C\u0644\u0633\u0629 \u0628\u0631\u0645\u0632 \u0627\u0644\u0645\u0627\u0644\u0643 \u0628\u0646\u062C\u0627\u062D.",
      messageEn: "Owner session verified."
    });
  });
  app.get("/api/finance/overview", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    if (sess.role !== "owner" && sess.role !== "finance_admin") {
      res.status(403).json({
        ok: false,
        code: "FINANCE_OR_OWNER_REQUIRED",
        messageAr: "\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0645\u0642\u0635\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0627\u0644\u0643 \u0623\u0648 \u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A \u0641\u0642\u0637.",
        messageEn: "Finance overview restricted to owner or finance_admin."
      });
      return;
    }
    res.json({
      ok: true,
      brandAr: "\u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629",
      accessScope: sess.role === "finance_admin" ? "finance_read_only_isolated" : "owner_full_audit",
      realMoneyTransfersEnabled: false,
      role: sess.role,
      sandboxTransactionCount: sandboxIntentStore.size,
      noteAr: "\u0628\u064A\u0626\u0629 \u0645\u0627\u0644\u064A\u0629 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0641\u0642\u0637 \u2014 \u0643\u0627\u0641\u0629 \u0627\u0644\u062A\u062D\u0648\u064A\u0644\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u0645\u0639\u0637\u0644\u0629 \u0648\u0645\u0645\u0646\u0648\u0639\u0629 \u0628\u0631\u0645\u062C\u064A\u0627\u064B."
    });
  });
  app.post("/api/finance/transfer", requireAuthenticatedSession, (_req, res) => {
    res.status(403).json({
      ok: false,
      code: "REAL_TRANSFERS_DISABLED",
      messageAr: "\u0627\u0644\u062A\u062D\u0648\u064A\u0644\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u062A\u062D\u0631\u064A\u0643 \u0627\u0644\u0623\u0645\u0648\u0627\u0644 \u0627\u0644\u062D\u0642\u064A\u0642\u064A \u0645\u0639\u0637\u0644\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0645\u0646\u0635\u0629.",
      messageEn: "Live money movement and direct transfers are strictly disabled by system policy."
    });
  });
  function round2(val) {
    return Math.round(val * 100) / 100;
  }
  function inferMealsCountFromSummary(summary, explicit) {
    if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0) {
      return Math.round(explicit);
    }
    const m = summary.match(/(\d+)\s*(?:وجبة|وجبات|meals?|qty)/i);
    if (m && Number(m[1]) > 0) {
      return Math.min(1e5, Number(m[1]));
    }
    return 1;
  }
  app.get("/api/finance/catering-ledger", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    const isGovernanceFinance = sess.canonicalRole === "super_admin" || sess.canonicalRole === "platform_admin" || sess.canonicalRole === "finance_manager" || sess.role === "owner" || sess.role === "finance_admin" || sess.role === "basit_admin";
    const isTenantScopedFinance = Boolean(sess.tenantId) && (sess.canonicalRole === "client_owner" || sess.canonicalRole === "client_manager" || sess.canonicalRole === "kitchen_owner" || sess.canonicalRole === "kitchen_manager");
    if (!isGovernanceFinance && !isTenantScopedFinance) {
      res.status(403).json({
        ok: false,
        code: "FINANCE_LEDGER_FORBIDDEN",
        messageAr: "\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u062F\u0641\u062A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A \u0644\u0625\u0639\u0627\u0634\u0629 \u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0645\u0642\u0635\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0623\u0648 \u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A \u0623\u0648 \u0645\u0645\u062B\u0644 \u0627\u0644\u062C\u0647\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F.",
        messageEn: "Access to B2B catering financial ledger is restricted."
      });
      return;
    }
    const qClientId = String(req.query.clientId || "").trim();
    const qKitchenId = String(req.query.kitchenId || "").trim();
    const qFromDate = String(req.query.fromDate || "").trim();
    const qToDate = String(req.query.toDate || "").trim();
    const qContractRef = String(req.query.contractRef || "").trim().toLowerCase();
    if (!isGovernanceFinance) {
      const ownTenant = securityState.tenantsById[sess.tenantId];
      if (ownTenant?.kind === "client_company" && qClientId && qClientId !== "all" && qClientId !== sess.tenantId) {
        appendAuditEntry({
          actorUid: sess.uid,
          actorEmail: sess.email,
          actorRole: sess.canonicalRole,
          action: "\u0631\u0641\u0636 \u0645\u062D\u0627\u0648\u0644\u0629 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0645\u0627\u0644\u064A \u0639\u0627\u0628\u0631 \u0644\u0644\u062C\u0647\u0627\u062A (Cross-Tenant Finance Query)",
          targetType: "finance_isolation",
          targetId: qClientId,
          severity: "security_alert",
          details: `Scoped client "${sess.tenantId}" requested financial data for "${qClientId}"`
        });
        res.status(403).json({
          ok: false,
          code: "CROSS_TENANT_FINANCE_BLOCKED",
          messageAr: "\u0645\u0645\u0646\u0648\u0639: \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0644\u062C\u0647\u0629 \u0623\u0648 \u0639\u0645\u064A\u0644 \u0622\u062E\u0631.",
          messageEn: "Cross-tenant financial query blocked."
        });
        return;
      }
      if (ownTenant?.kind === "central_kitchen" && qKitchenId && qKitchenId !== "all" && qKitchenId !== sess.tenantId) {
        appendAuditEntry({
          actorUid: sess.uid,
          actorEmail: sess.email,
          actorRole: sess.canonicalRole,
          action: "\u0631\u0641\u0636 \u0645\u062D\u0627\u0648\u0644\u0629 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0645\u0627\u0644\u064A \u0639\u0627\u0628\u0631 \u0644\u0644\u0645\u0637\u0627\u0628\u062E",
          targetType: "finance_isolation",
          targetId: qKitchenId,
          severity: "security_alert",
          details: `Scoped kitchen "${sess.tenantId}" requested financial data for "${qKitchenId}"`
        });
        res.status(403).json({
          ok: false,
          code: "CROSS_TENANT_FINANCE_BLOCKED",
          messageAr: "\u0645\u0645\u0646\u0648\u0639: \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0644\u0645\u0637\u0628\u062E \u0622\u062E\u0631.",
          messageEn: "Cross-kitchen financial query blocked."
        });
        return;
      }
    }
    const orderDerivedEntries = Object.values(securityState.tenantOrdersById).filter((ord) => ord.status !== "cancelled").map((ord) => {
      const mealsCount = inferMealsCountFromSummary(ord.itemsSummary, ord.mealsCount);
      const amountEGP = Number(ord.totalEGP) || 0;
      const unitPrice = typeof ord.mealUnitPriceEGP === "number" && ord.mealUnitPriceEGP > 0 ? ord.mealUnitPriceEGP : mealsCount > 0 ? round2(amountEGP / mealsCount) : 0;
      const paidAmountEGP = ord.status === "delivered" ? amountEGP : 0;
      return {
        entryId: `ORDLED-${ord.orderId}`,
        entryType: "supply_revenue",
        clientTenantId: ord.clientTenantId,
        clientName: ord.clientTenantName,
        kitchenTenantId: ord.kitchenTenantId,
        kitchenName: ord.kitchenTenantName,
        contractRef: ord.contractRef || `CTR-${ord.clientTenantId.slice(-6).toUpperCase()}`,
        mealsCount,
        mealUnitPriceEGP: unitPrice,
        amountEGP,
        paidAmountEGP,
        entryDate: String(ord.createdAt || "").slice(0, 10) || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        sourceChannel: "central_order",
        notes: ord.itemsSummary,
        createdByEmail: ord.placedByName,
        createdAt: ord.createdAt
      };
    });
    const combinedRaw = [...securityState.ledgerEntries, ...orderDerivedEntries];
    const filteredEntries = combinedRaw.filter((entry) => {
      if (!isGovernanceFinance) {
        const matchesTenant = entry.clientTenantId === sess.tenantId || entry.kitchenTenantId === sess.tenantId;
        if (!matchesTenant) return false;
      }
      if (qClientId && qClientId !== "all" && entry.clientTenantId !== qClientId) return false;
      if (qKitchenId && qKitchenId !== "all" && entry.kitchenTenantId !== qKitchenId) return false;
      if (qFromDate && entry.entryDate < qFromDate) return false;
      if (qToDate && entry.entryDate > qToDate) return false;
      if (qContractRef && !entry.contractRef.toLowerCase().includes(qContractRef)) return false;
      return true;
    }).sort((a, b) => (b.entryDate || b.createdAt).localeCompare(a.entryDate || a.createdAt));
    const supplyEntries = filteredEntries.filter((e) => e.entryType === "supply_revenue");
    const expenseEntries = filteredEntries.filter((e) => e.entryType === "recorded_expense");
    const receivableEntries = filteredEntries.filter((e) => e.entryType === "receivable");
    const payableEntries = filteredEntries.filter((e) => e.entryType === "payable");
    const totalMealsSupplied = supplyEntries.reduce((sum, e) => sum + (Number(e.mealsCount) || 0), 0);
    const totalSupplyValueEGP = round2(supplyEntries.reduce((sum, e) => sum + (Number(e.amountEGP) || 0), 0));
    const avgMealUnitPriceEGP = totalMealsSupplied > 0 ? round2(totalSupplyValueEGP / totalMealsSupplied) : null;
    const actualRevenueEGP = round2(supplyEntries.reduce((sum, e) => sum + (Number(e.paidAmountEGP) || 0), 0));
    const hasRecordedExpenses = expenseEntries.length > 0;
    const recordedExpensesEGP = hasRecordedExpenses ? round2(expenseEntries.reduce((sum, e) => sum + (Number(e.amountEGP) || 0), 0)) : 0;
    const netProfitEGP = hasRecordedExpenses ? round2(actualRevenueEGP - recordedExpensesEGP) : null;
    const profitMarginPct = hasRecordedExpenses && actualRevenueEGP > 0 ? round2((actualRevenueEGP - recordedExpensesEGP) / actualRevenueEGP * 100) : null;
    const unpaidSupplyReceivables = supplyEntries.reduce(
      (sum, e) => sum + Math.max(0, (Number(e.amountEGP) || 0) - (Number(e.paidAmountEGP) || 0)),
      0
    );
    const explicitReceivables = receivableEntries.reduce(
      (sum, e) => sum + Math.max(0, (Number(e.amountEGP) || 0) - (Number(e.paidAmountEGP) || 0)),
      0
    );
    const receivablesEGP = round2(unpaidSupplyReceivables + explicitReceivables);
    const hasRecordedPayables = payableEntries.length > 0;
    const payablesEGP = hasRecordedPayables ? round2(
      payableEntries.reduce(
        (sum, e) => sum + Math.max(0, (Number(e.amountEGP) || 0) - (Number(e.paidAmountEGP) || 0)),
        0
      )
    ) : 0;
    const clientMap = /* @__PURE__ */ new Map();
    for (const e of filteredEntries) {
      if (!e.clientTenantId && !e.clientName) continue;
      const cid = e.clientTenantId || e.clientName;
      if (!clientMap.has(cid)) {
        clientMap.set(cid, {
          clientTenantId: cid,
          clientName: e.clientName || cid,
          mealsCount: 0,
          supplyValueEGP: 0,
          actualRevenueEGP: 0,
          receivablesEGP: 0,
          recordsCount: 0
        });
      }
      const bucket = clientMap.get(cid);
      bucket.recordsCount += 1;
      if (e.entryType === "supply_revenue") {
        bucket.mealsCount += Number(e.mealsCount) || 0;
        bucket.supplyValueEGP = round2(bucket.supplyValueEGP + (Number(e.amountEGP) || 0));
        bucket.actualRevenueEGP = round2(bucket.actualRevenueEGP + (Number(e.paidAmountEGP) || 0));
        bucket.receivablesEGP = round2(
          bucket.receivablesEGP + Math.max(0, (Number(e.amountEGP) || 0) - (Number(e.paidAmountEGP) || 0))
        );
      } else if (e.entryType === "receivable") {
        bucket.receivablesEGP = round2(
          bucket.receivablesEGP + Math.max(0, (Number(e.amountEGP) || 0) - (Number(e.paidAmountEGP) || 0))
        );
      }
    }
    const kitchenMap = /* @__PURE__ */ new Map();
    for (const e of filteredEntries) {
      if (!e.kitchenTenantId && !e.kitchenName) continue;
      const kid = e.kitchenTenantId || e.kitchenName;
      if (!kitchenMap.has(kid)) {
        kitchenMap.set(kid, {
          kitchenTenantId: kid,
          kitchenName: e.kitchenName || kid,
          mealsCount: 0,
          supplyValueEGP: 0,
          expensesEGP: 0,
          recordsCount: 0
        });
      }
      const bucket = kitchenMap.get(kid);
      bucket.recordsCount += 1;
      if (e.entryType === "supply_revenue") {
        bucket.mealsCount += Number(e.mealsCount) || 0;
        bucket.supplyValueEGP = round2(bucket.supplyValueEGP + (Number(e.amountEGP) || 0));
      } else if (e.entryType === "recorded_expense") {
        bucket.expensesEGP = round2(bucket.expensesEGP + (Number(e.amountEGP) || 0));
      }
    }
    const canViewHabeSummary = isGovernanceFinance || sess.tenantId === "tenant_client_habe";
    const habeEntries = canViewHabeSummary ? filteredEntries.filter((e) => e.sourceChannel === "habe" || e.clientTenantId === "tenant_client_habe") : [];
    const incompleteNotices = [];
    if (supplyEntries.length === 0) {
      incompleteNotices.push("\u0644\u0627 \u062A\u0648\u062C\u062F \u0637\u0644\u0628\u0627\u062A \u062A\u0648\u0631\u064A\u062F \u0623\u0648 \u0625\u064A\u0631\u0627\u062F\u0627\u062A \u0645\u0633\u062C\u0644\u0629 \u0641\u064A \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u062D\u062F\u062F \u2014 \u0623\u0636\u0641 \u0642\u064A\u062F \u062A\u0648\u0631\u064A\u062F \u0641\u0639\u0644\u064A \u0623\u0648 \u0632\u0627\u0645\u0646 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0639\u0642\u0648\u062F.");
    }
    if (!hasRecordedExpenses) {
      incompleteNotices.push("\u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A \u0648\u0627\u0644\u062A\u0643\u0627\u0644\u064A\u0641 \u0627\u0644\u062A\u0634\u063A\u064A\u0644\u064A\u0629: \u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0645\u0633\u062C\u0644\u0629 \u0628\u0639\u062F \u2014 \u0644\u0627 \u064A\u062A\u0645 \u0627\u062D\u062A\u0633\u0627\u0628 \u0647\u0627\u0645\u0634 \u0631\u0628\u062D \u0623\u0648 \u0635\u0627\u0641\u064A \u0631\u0628\u062D \u062A\u0642\u062F\u064A\u0631\u064A \u062D\u062A\u0649 \u062A\u064F\u0633\u062C\u064E\u0651\u0644 \u0642\u064A\u0648\u062F \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A \u0627\u0644\u0641\u0639\u0644\u064A\u0629.");
    }
    if (!hasRecordedPayables) {
      incompleteNotices.push("\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A \u0648\u0627\u0644\u0645\u0628\u0627\u0644\u063A \u0627\u0644\u0645\u0633\u062A\u062D\u0642\u0629 \u0639\u0644\u064A\u0646\u0627: \u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0645\u0633\u062C\u0644\u0629 \u0628\u0639\u062F.");
    }
    const allTenants = Object.values(securityState.tenantsById);
    const availableClients = allTenants.filter((t) => t.kind === "client_company").filter((t) => isGovernanceFinance || t.tenantId === sess.tenantId);
    const availableKitchens = allTenants.filter((t) => t.kind === "central_kitchen").filter((t) => isGovernanceFinance || t.tenantId === sess.tenantId);
    res.json({
      ok: true,
      accessScope: isGovernanceFinance ? "governance_full" : "tenant_scoped",
      canWriteVouchers: sess.canonicalRole === "super_admin" || sess.canonicalRole === "platform_admin" || sess.canonicalRole === "finance_manager" || sess.role === "owner" || sess.role === "finance_admin",
      questions: {
        totalMealsSupplied,
        avgMealUnitPriceEGP,
        totalSupplyValueEGP,
        byClient: Array.from(clientMap.values()).sort((a, b) => b.supplyValueEGP - a.supplyValueEGP),
        byKitchen: Array.from(kitchenMap.values()).sort((a, b) => b.supplyValueEGP - a.supplyValueEGP),
        actualRevenueEGP,
        hasRecordedExpenses,
        recordedExpensesEGP,
        netProfitEGP,
        profitMarginPct,
        receivablesEGP,
        hasRecordedPayables,
        payablesEGP
      },
      habeSummary: canViewHabeSummary ? {
        recordsCount: habeEntries.length,
        totalValueEGP: round2(habeEntries.reduce((s, e) => s + (Number(e.amountEGP) || 0), 0)),
        collectedEGP: round2(habeEntries.reduce((s, e) => s + (Number(e.paidAmountEGP) || 0), 0))
      } : null,
      incompleteNotices,
      entries: filteredEntries,
      availableClients,
      availableKitchens
    });
  });
  app.post("/api/finance/entries", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    const canWrite = sess.canonicalRole === "super_admin" || sess.canonicalRole === "platform_admin" || sess.canonicalRole === "finance_manager" || sess.role === "owner" || sess.role === "finance_admin";
    if (!canWrite) {
      appendAuditEntry({
        actorUid: sess.uid,
        actorEmail: sess.email,
        actorRole: sess.canonicalRole,
        action: "\u0631\u0641\u0636 \u0645\u062D\u0627\u0648\u0644\u0629 \u062A\u0633\u062C\u064A\u0644 \u0642\u064A\u062F \u0645\u0627\u0644\u064A \u0628\u062F\u0648\u0646 \u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0627\u0644\u064A\u0629 \u0645\u0639\u062A\u0645\u062F\u0629",
        targetType: "finance_write",
        targetId: "/api/finance/entries",
        severity: "security_alert",
        details: `Blocked role ${sess.canonicalRole} from posting finance voucher`
      });
      res.status(403).json({
        ok: false,
        code: "FINANCE_WRITE_FORBIDDEN",
        messageAr: "\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0642\u064A\u0648\u062F \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A \u0648\u0627\u0644\u062A\u062D\u0635\u064A\u0644\u0627\u062A \u0645\u0642\u062A\u0635\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0627\u0644\u0643 \u0623\u0648 \u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0635\u0629 \u0623\u0648 \u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A \u0641\u0642\u0637.",
        messageEn: "Posting ledger entries is restricted to super_admin, platform_admin, or finance_manager."
      });
      return;
    }
    const body = req.body;
    const allowedTypes = [
      "supply_revenue",
      "recorded_expense",
      "receivable",
      "payable"
    ];
    if (!body.entryType || !allowedTypes.includes(body.entryType)) {
      res.status(400).json({ ok: false, messageAr: "\u0646\u0648\u0639 \u0627\u0644\u0642\u064A\u062F \u063A\u064A\u0631 \u0635\u0627\u0644\u062D.", messageEn: "Invalid entryType." });
      return;
    }
    const amountEGP = Number(body.amountEGP || 0);
    const paidAmountEGP = Number(body.paidAmountEGP ?? (body.entryType === "supply_revenue" ? 0 : amountEGP));
    const mealsCount = Math.max(0, Math.round(Number(body.mealsCount || 0)));
    if (!Number.isFinite(amountEGP) || amountEGP <= 0 || amountEGP > 5e8) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u062C\u0628 \u0625\u062F\u062E\u0627\u0644 \u0645\u0628\u0644\u063A \u0645\u0627\u0644\u064A \u0635\u062D\u064A\u062D \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631.", messageEn: "Valid positive amountEGP required." });
      return;
    }
    if (!Number.isFinite(paidAmountEGP) || paidAmountEGP < 0 || paidAmountEGP > amountEGP) {
      res.status(400).json({ ok: false, messageAr: "\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u062D\u0635\u0644/\u0627\u0644\u0645\u062F\u0641\u0648\u0639 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0628\u064A\u0646 0 \u0648\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0642\u064A\u062F.", messageEn: "paidAmountEGP must be between 0 and amountEGP." });
      return;
    }
    const clientTenantId = String(body.clientTenantId || "").trim();
    const kitchenTenantId = String(body.kitchenTenantId || "").trim();
    const clientTenant = clientTenantId ? securityState.tenantsById[clientTenantId] : void 0;
    const kitchenTenant = kitchenTenantId ? securityState.tenantsById[kitchenTenantId] : void 0;
    const clientName = String(body.clientName || clientTenant?.name || "\u062C\u0647\u0629 \u0645\u062A\u0639\u0627\u0642\u062F\u0629").trim().slice(0, 140);
    const kitchenName = String(body.kitchenName || kitchenTenant?.name || "\u0645\u0637\u0628\u062E \u0645\u0631\u0643\u0632\u064A").trim().slice(0, 140);
    const contractRef = String(body.contractRef || "CONTRACT-GENERAL").trim().slice(0, 80);
    const entryDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.entryDate || "")) ? String(body.entryDate) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const notes = String(body.notes || "").trim().slice(0, 300);
    const unitPrice = mealsCount > 0 ? round2(amountEGP / mealsCount) : 0;
    const entry = {
      entryId: `FIN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
      entryType: body.entryType,
      clientTenantId: clientTenantId || "unassigned_client",
      clientName,
      kitchenTenantId: kitchenTenantId || "unassigned_kitchen",
      kitchenName,
      contractRef,
      mealsCount,
      mealUnitPriceEGP: unitPrice,
      amountEGP: round2(amountEGP),
      paidAmountEGP: round2(paidAmountEGP),
      entryDate,
      sourceChannel: "manual_voucher",
      notes,
      createdByEmail: sess.email,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    securityState.ledgerEntries.unshift(entry);
    saveSecurityState(securityState);
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorRole: sess.canonicalRole,
      action: `\u062A\u0633\u062C\u064A\u0644 \u0642\u064A\u062F \u0645\u0627\u0644\u064A (${entry.entryType}) \u0628\u0642\u064A\u0645\u0629 ${entry.amountEGP} \u062C.\u0645`,
      targetType: "finance_entry",
      targetId: entry.entryId,
      severity: "info",
      details: `${entry.clientName} \xB7 ${entry.kitchenName} \xB7 ${entry.contractRef}`
    });
    res.status(201).json({
      ok: true,
      entry,
      messageAr: `\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0642\u064A\u062F \u0627\u0644\u0645\u0627\u0644\u064A [${entry.entryId}] \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u0627\u0644\u062F\u0641\u062A\u0631 \u0627\u0644\u0645\u0631\u0643\u0632\u064A.`,
      messageEn: "Financial ledger entry recorded."
    });
  });
  app.post("/api/habe/ledger-sync", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    const isAllowed = isHabeApproverSession(sess) || sess.canonicalRole === "finance_manager" || sess.role === "finance_admin" || sess.tenantId === "tenant_client_habe";
    if (!isAllowed) {
      appendAuditEntry({
        actorUid: sess.uid,
        actorEmail: sess.email,
        actorUsername: sess.username,
        actorRole: sess.canonicalRole,
        action: "\u0631\u0641\u0636 \u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0632\u0627\u0645\u0646\u0629 \u0645\u0627\u0644\u064A\u0629 \u0645\u0639 \u0628\u0648\u0627\u0628\u0629 H.A.B.E \u0628\u062F\u0648\u0646 \u0635\u0644\u0627\u062D\u064A\u0629",
        targetType: "habe_sync",
        targetId: "tenant_client_habe",
        severity: "security_alert",
        details: `Blocked role ${sess.canonicalRole} (${sess.tenantId || "none"}) from /api/habe/ledger-sync`
      });
      res.status(403).json({
        ok: false,
        code: "HABE_SYNC_FORBIDDEN",
        messageAr: "\u0645\u0632\u0627\u0645\u0646\u0629 \u0633\u062C\u0644\u0627\u062A H.A.B.E \u0645\u0639 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0645\u0642\u0635\u0648\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062E\u0648\u0644\u0629 \u0623\u0648 \u0645\u0645\u062B\u0644 \u062D\u0633\u0627\u0628 H.A.B.E \u0641\u0642\u0637.",
        messageEn: "Unauthorized H.A.B.E financial ledger sync."
      });
      return;
    }
    const body = req.body;
    const incoming = Array.isArray(body.orders) ? body.orders : [];
    if (incoming.length === 0) {
      res.status(400).json({ ok: false, messageAr: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0637\u0644\u0628\u0627\u062A H.A.B.E \u0645\u0639\u062A\u0645\u062F\u0629 \u0644\u0644\u0645\u0632\u0627\u0645\u0646\u0629.", messageEn: "No orders supplied." });
      return;
    }
    const kitchenTenant = securityState.tenantsById.tenant_kitchen_alain;
    let addedCount = 0;
    for (const item of incoming.slice(0, 200)) {
      const orderId = String(item.orderId || "").trim();
      const totalEGP = Number(item.totalEGP || 0);
      const isApprovedOrPaid = item.approvalStatus === "confirmed_paid" || item.approvalStatus === "approved";
      if (!orderId || !isApprovedOrPaid || !Number.isFinite(totalEGP) || totalEGP <= 0) continue;
      const entryId = `HABE-${orderId}`;
      if (securityState.ledgerEntries.some((e) => e.entryId === entryId)) continue;
      const mealsCount = Math.max(1, Math.round(Number(item.mealsCount || 1)));
      const isImmediatePaid = item.paymentMethod !== "payroll_deduction";
      const entryDate = /^\d{4}-\d{2}-\d{2}$/.test(String(item.isoDate || "")) ? String(item.isoDate) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      securityState.ledgerEntries.unshift({
        entryId,
        entryType: "supply_revenue",
        clientTenantId: "tenant_client_habe",
        clientName: "\u0634\u0631\u0643\u0629 \u0647\u0627-\u0628\u064A \u0627\u0644\u0645\u0635\u0631\u064A\u0629 (H.A.B.E)",
        kitchenTenantId: kitchenTenant?.tenantId || "tenant_kitchen_alain",
        kitchenName: kitchenTenant?.name || "\u0645\u0637\u0628\u062E \u0648\u0645\u0631\u0643\u0632 \u0627\u0644\u0639\u064A\u0646 \u2014 \u0645\u062F\u064A\u0646\u0629 \u0628\u062F\u0631",
        contractRef: "HABE-PORTAL-2026",
        mealsCount,
        mealUnitPriceEGP: round2(totalEGP / mealsCount),
        amountEGP: round2(totalEGP),
        paidAmountEGP: isImmediatePaid ? round2(totalEGP) : 0,
        entryDate,
        sourceChannel: "habe",
        notes: `\u0637\u0644\u0628 H.A.B.E [${orderId}] \u2014 ${String(item.employeeName || "\u0645\u0648\u0638\u0641")} (${String(item.trxRef || orderId)})`,
        createdByEmail: sess.email,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      addedCount += 1;
    }
    if (addedCount > 0) {
      saveSecurityState(securityState);
      appendAuditEntry({
        actorUid: sess.uid,
        actorEmail: sess.email,
        actorUsername: sess.username,
        actorRole: sess.canonicalRole,
        action: `\u0645\u0632\u0627\u0645\u0646\u0629 ${addedCount} \u0633\u062C\u0644 \u0645\u0627\u0644\u064A \u0645\u0639\u062A\u0645\u062F \u0645\u0646 \u0628\u0648\u0627\u0628\u0629 H.A.B.E`,
        targetType: "habe_sync",
        targetId: "tenant_client_habe",
        severity: "info",
        details: `Synced ${addedCount} approved/paid H.A.B.E orders into isolated tenant ledger`
      });
    }
    res.json({
      ok: true,
      syncedCount: addedCount,
      messageAr: addedCount > 0 ? `\u062A\u0645\u062A \u0645\u0632\u0627\u0645\u0646\u0629 ${addedCount} \u0645\u0639\u0627\u0645\u0644\u0629 H.A.B.E \u0645\u0639\u062A\u0645\u062F\u0629 \u0641\u064A \u0627\u0644\u062F\u0641\u062A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0639\u0632\u0648\u0644 \u0628\u0646\u062C\u0627\u062D.` : "\u0643\u0627\u0641\u0629 \u0645\u0639\u0627\u0645\u0644\u0627\u062A H.A.B.E \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0645\u0632\u0627\u0645\u0646\u0629 \u0628\u0627\u0644\u0641\u0639\u0644 \u0641\u064A \u0627\u0644\u062F\u0641\u062A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A."
    });
  });
  app.get("/api/habe/employees", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    const approver = isHabeApproverSession(sess);
    if (approver) {
      res.json({ ok: true, isApprover: true, employees: getMergedHabeEmployees() });
      return;
    }
    const selfEmp = resolveSessionHabeEmployee(sess);
    res.json({ ok: true, isApprover: false, employees: selfEmp ? [selfEmp] : [] });
  });
  app.post("/api/habe/employees", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    if (!isHabeApproverSession(sess)) {
      appendAuditEntry({
        actorUid: sess.uid,
        actorEmail: sess.email,
        actorUsername: sess.username,
        actorRole: sess.canonicalRole,
        action: "\u0631\u0641\u0636 \u0645\u062D\u0627\u0648\u0644\u0629 \u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0638\u0641 \u0641\u064A \u0643\u0634\u0641 H-A-B-E \u0628\u062F\u0648\u0646 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0639\u062A\u0645\u0627\u062F",
        targetType: "habe_isolation",
        targetId: "habe_employees",
        severity: "security_alert",
        details: `Blocked non-approver ${sess.email} from POST /api/habe/employees`
      });
      res.status(403).json({
        ok: false,
        code: "HABE_APPROVER_ONLY",
        messageAr: "\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0648\u0625\u062F\u0627\u0631\u0629 \u0643\u0634\u0648\u0641 H-A-B-E \u0645\u0642\u062A\u0635\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0641\u0642\u0637.",
        messageEn: "H-A-B-E employee management restricted to approved executives."
      });
      return;
    }
    const body = req.body;
    const name = String(body.name || "").trim().slice(0, 120);
    const code = String(body.code || "").trim().toUpperCase().slice(0, 32);
    const department = String(body.department || "\u0627\u0644\u0625\u0646\u062A\u0627\u062C \u0648\u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u2014 H-A-B-E").trim().slice(0, 100);
    const phone = body.phone ? normalizePhone(String(body.phone)) : "";
    const email = body.email ? String(body.email).trim().toLowerCase() : "";
    const monthlyPayrollCapEGP = Math.min(2e4, Math.max(100, Number(body.monthlyPayrollCapEGP || 2500)));
    if (name.length < 2 || code.length < 2) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0627\u0633\u0645 \u0648\u0643\u0648\u062F \u0627\u0644\u0645\u0648\u0638\u0641.", messageEn: "Name and code required." });
      return;
    }
    if (getMergedHabeEmployees().some((e) => e.code.toUpperCase() === code)) {
      res.status(409).json({ ok: false, code: "EMP_CODE_EXISTS", messageAr: "\u0643\u0648\u062F \u0627\u0644\u0645\u0648\u0638\u0641 \u0645\u0633\u062C\u0644 \u0628\u0627\u0644\u0641\u0639\u0644.", messageEn: "Employee code already exists." });
      return;
    }
    const rec = {
      id: `hb_emp_${crypto.randomBytes(4).toString("hex")}`,
      name,
      code,
      department,
      ...phone ? { phone } : {},
      ...email ? { email } : {},
      monthlyPayrollCapEGP
    };
    securityState.habeCustomEmployees.push(rec);
    saveSecurityState(securityState);
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorUsername: sess.username,
      actorRole: sess.canonicalRole,
      action: `\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0638\u0641 \u062C\u062F\u064A\u062F \u0644\u0643\u0634\u0641 H-A-B-E (${rec.name} - ${rec.code})`,
      targetType: "habe_employee",
      targetId: rec.id,
      severity: "info",
      details: `Department: ${rec.department}, Cap: ${rec.monthlyPayrollCapEGP}`
    });
    res.status(201).json({ ok: true, employee: rec, messageAr: "\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0648\u0638\u0641 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u062E\u0627\u062F\u0645 \u0628\u0646\u062C\u0627\u062D." });
  });
  app.get("/api/habe/orders", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    const approver = isHabeApproverSession(sess);
    const allOrders = Object.values(securityState.habeOrdersById).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );
    if (approver) {
      res.json({ ok: true, scope: "approver_all", orders: allOrders });
      return;
    }
    const ownEmp = resolveSessionHabeEmployee(sess);
    const ownOrders = allOrders.filter(
      (o) => o.placedByUid === sess.uid || sess.email && o.placedByEmail === sess.email.toLowerCase() || ownEmp && o.employeeCode.toUpperCase() === ownEmp.code.toUpperCase()
    );
    res.json({ ok: true, scope: "personal_only", orders: ownOrders });
  });
  app.post("/api/habe/orders", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    const approver = isHabeApproverSession(sess);
    const body = req.body;
    const allowedMethods = /* @__PURE__ */ new Set(["vodafone_cash", "instapay", "payroll_deduction", "cash"]);
    const paymentMethod = body.paymentMethod && allowedMethods.has(body.paymentMethod) ? body.paymentMethod : "cash";
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0 || rawItems.length > 60) {
      res.status(400).json({ ok: false, messageAr: "\u0627\u0644\u0633\u0644\u0629 \u0641\u0627\u0631\u063A\u0629 \u0623\u0648 \u062A\u062C\u0627\u0648\u0632\u062A \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D.", messageEn: "Valid items required." });
      return;
    }
    const verifiedItems = [];
    let totalEGP = 0;
    for (const rawIt of rawItems) {
      const qty = Math.floor(Number(rawIt.qty || 0));
      if (!Number.isFinite(qty) || qty < 1 || qty > 100) {
        res.status(400).json({ ok: false, messageAr: "\u0643\u0645\u064A\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629 \u0641\u064A \u0627\u0644\u0637\u0644\u0628.", messageEn: "Invalid item quantity." });
        return;
      }
      const catalogItem = findHabeCatalogItem(String(rawIt.id || rawIt.code || ""));
      if (!catalogItem) {
        res.status(400).json({
          ok: false,
          code: "INVALID_CATALOG_ITEM",
          messageAr: `\u0627\u0644\u0635\u0646\u0641 (${String(rawIt.id || rawIt.code || "")}) \u063A\u064A\u0631 \u0645\u0639\u062A\u0645\u062F \u0641\u064A \u0642\u0627\u0626\u0645\u0629 H-A-B-E.`,
          messageEn: "Catalog item not found or unauthorized."
        });
        return;
      }
      const lineTotal = round2(catalogItem.priceEGP * qty);
      verifiedItems.push({
        id: catalogItem.id,
        code: catalogItem.code,
        nameAr: catalogItem.nameAr,
        unitPriceEGP: catalogItem.priceEGP,
        qty,
        lineTotalEGP: lineTotal
      });
      totalEGP = round2(totalEGP + lineTotal);
    }
    const ownEmp = resolveSessionHabeEmployee(sess);
    const allEmps = getMergedHabeEmployees();
    const requestedEmpRef = String(body.employeeId || body.employeeCode || "").trim();
    const requestedEmp = requestedEmpRef ? allEmps.find((e) => e.id === requestedEmpRef || e.code.toUpperCase() === requestedEmpRef.toUpperCase()) : null;
    if (!approver && requestedEmp) {
      const matchesOwn = ownEmp && (requestedEmp.id === ownEmp.id || requestedEmp.code.toUpperCase() === ownEmp.code.toUpperCase());
      if (!matchesOwn) {
        appendAuditEntry({
          actorUid: sess.uid,
          actorEmail: sess.email,
          actorUsername: sess.username,
          actorRole: sess.canonicalRole,
          action: "\u0645\u062D\u0627\u0648\u0644\u0629 \u0627\u0644\u0637\u0644\u0628 \u0623\u0648 \u0627\u0646\u062A\u062D\u0627\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0648\u0638\u0641 \u0622\u062E\u0631 \u0641\u064A H-A-B-E",
          targetType: "habe_isolation",
          targetId: requestedEmp.code,
          severity: "security_alert",
          details: `Blocked ${sess.email} from ordering on behalf of ${requestedEmp.code}`
        });
        res.status(403).json({
          ok: false,
          code: "CROSS_EMPLOYEE_ORDER_BLOCKED",
          messageAr: "\u0645\u0645\u0646\u0648\u0639: \u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062A\u0633\u062C\u064A\u0644 \u0637\u0644\u0628 \u0628\u0627\u0633\u0645 \u0645\u0648\u0638\u0641 \u0622\u062E\u0631 \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629.",
          messageEn: "Cross-employee ordering/impersonation blocked."
        });
        return;
      }
    }
    const targetEmp = approver ? requestedEmp || ownEmp : ownEmp;
    if (paymentMethod === "payroll_deduction" && !targetEmp) {
      res.status(403).json({
        ok: false,
        code: "PAYROLL_REQUIRES_EMPLOYEE_LINK",
        messageAr: "\u0627\u0644\u062E\u0635\u0645 \u0645\u0646 \u0627\u0644\u0631\u0627\u062A\u0628 \u0645\u062A\u0627\u062D \u0641\u0642\u0637 \u0644\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0627\u0644\u0645\u0633\u062C\u0644\u064A\u0646 \u0648\u0627\u0644\u0645\u0631\u062A\u0628\u0637\u064A\u0646 \u0628\u0643\u0648\u062F H-A-B-E \u0627\u0644\u0645\u0639\u062A\u0645\u062F.",
        messageEn: "Payroll deduction requires verified employee link."
      });
      return;
    }
    const employeeId = targetEmp?.id || sess.uid;
    const employeeName = targetEmp?.name || sess.fullName;
    const employeeCode = targetEmp?.code || sess.employeeCode || "SELF";
    const department = targetEmp?.department || "\u0639\u0645\u064A\u0644 / \u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0633\u062C\u0644";
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const orderId = `HBE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const trxRef = `TRX-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const approvalStatus = paymentMethod === "payroll_deduction" ? "pending_approval" : "confirmed_paid";
    const order = {
      orderId,
      trxRef,
      employeeId,
      employeeName,
      employeeCode,
      department,
      placedByUid: sess.uid,
      placedByEmail: sess.email.toLowerCase(),
      placedByUsername: sess.username,
      placedByName: sess.fullName,
      paymentMethod,
      paymentAccountOrNote: String(body.paymentAccountOrNote || "").trim().slice(0, 180),
      approvalStatus,
      kitchenName: String(body.kitchenName || "\u0646\u0642\u0637\u0629 \u0647\u0627-\u0628\u064A \u2014 \u0645\u062F\u064A\u0646\u0629 \u0628\u062F\u0631").trim().slice(0, 120),
      items: verifiedItems,
      totalEGP,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    securityState.habeOrdersById[orderId] = order;
    if (approvalStatus === "confirmed_paid") {
      const kitchenTenant = securityState.tenantsById.tenant_kitchen_alain;
      const mealsCount = verifiedItems.reduce((s, it) => s + it.qty, 0);
      securityState.ledgerEntries.unshift({
        entryId: `HABE-${orderId}`,
        entryType: "supply_revenue",
        clientTenantId: "tenant_client_habe",
        clientName: "\u0634\u0631\u0643\u0629 \u0647\u0627-\u0628\u064A \u0627\u0644\u0645\u0635\u0631\u064A\u0629 (H.A.B.E)",
        kitchenTenantId: kitchenTenant?.tenantId || "tenant_kitchen_alain",
        kitchenName: kitchenTenant?.name || "\u0645\u0637\u0628\u062E \u0648\u0645\u0631\u0643\u0632 \u0627\u0644\u0639\u064A\u0646 \u2014 \u0645\u062F\u064A\u0646\u0629 \u0628\u062F\u0631",
        contractRef: "HABE-PORTAL-2026",
        mealsCount,
        mealUnitPriceEGP: round2(totalEGP / Math.max(1, mealsCount)),
        amountEGP: totalEGP,
        paidAmountEGP: totalEGP,
        entryDate: nowIso.slice(0, 10),
        sourceChannel: "habe",
        notes: `\u0637\u0644\u0628 H.A.B.E [${orderId}] \u2014 ${employeeName} (${trxRef})`,
        createdByEmail: sess.email,
        createdAt: nowIso
      });
      const ch = paymentMethod === "cash" ? "treasury" : paymentMethod === "vodafone_cash" || paymentMethod === "instapay" ? "e_wallet" : "bank";
      const pct = paymentMethod === "vodafone_cash" ? 1.5 : 0;
      recordOwnerFinancialInflow({
        source: `\u0628\u0648\u0627\u0628\u0629 H.A.B.E \u2014 ${employeeName}`,
        purpose: `\u0637\u0644\u0628 \u0645\u0648\u0638\u0641 \u0641\u0648\u0631\u064A \u0631\u0642\u0645 ${orderId}`,
        grossEGP: totalEGP,
        commissionPct: pct,
        channel: ch,
        orderRef: `HABE-${orderId}`,
        actorEmail: sess.email
      });
    }
    saveSecurityState(securityState);
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorUsername: sess.username,
      actorRole: sess.canonicalRole,
      action: `\u062A\u0633\u062C\u064A\u0644 \u0637\u0644\u0628 H-A-B-E (${orderId}) \u0628\u0642\u064A\u0645\u0629 ${totalEGP} \u062C.\u0645`,
      targetType: "habe_order",
      targetId: orderId,
      severity: "info",
      details: `${employeeName} (${employeeCode}) \xB7 ${paymentMethod} \xB7 ${approvalStatus}`
    });
    res.status(201).json({
      ok: true,
      order,
      messageAr: approvalStatus === "pending_approval" ? `\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0637\u0644\u0628 \u0627\u0644\u062E\u0635\u0645 \u0645\u0646 \u0627\u0644\u0631\u0627\u062A\u0628 [${orderId}] \u0648\u0647\u0648 \u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A\u0629.` : `\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0637\u0644\u0628 [${orderId}] \u0648\u062A\u0633\u062C\u064A\u0644\u0647 \u0641\u064A \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A.`
    });
  });
  app.post("/api/habe/orders/:orderId/decide", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    if (!isHabeApproverSession(sess)) {
      appendAuditEntry({
        actorUid: sess.uid,
        actorEmail: sess.email,
        actorUsername: sess.username,
        actorRole: sess.canonicalRole,
        action: "\u0631\u0641\u0636 \u0645\u062D\u0627\u0648\u0644\u0629 \u0627\u0639\u062A\u0645\u0627\u062F \u0623\u0648 \u0631\u0641\u0636 \u0637\u0644\u0628 H-A-B-E \u0628\u062F\u0648\u0646 \u0635\u0644\u0627\u062D\u064A\u0629",
        targetType: "habe_approval",
        targetId: String(req.params.orderId || ""),
        severity: "security_alert",
        details: `Blocked ${sess.email} (${sess.canonicalRole}) from deciding H-A-B-E order`
      });
      res.status(403).json({
        ok: false,
        code: "HABE_APPROVER_ONLY",
        messageAr: "\u0627\u0639\u062A\u0645\u0627\u062F \u0648\u0631\u0641\u0636 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062E\u0635\u0645 \u0645\u0642\u062A\u0635\u0631 \u062D\u0635\u0631\u064A\u0627\u064B \u0639\u0644\u0649 \u062D\u0645\u0632\u0629 \u0623\u0648 \u0623\u062D\u0645\u062F \u0639\u062F\u0644\u064A \u0623\u0648 \u0623\u062D\u0645\u062F \u0648\u062D\u064A\u062F.",
        messageEn: "H-A-B-E approval restricted to designated governance executives."
      });
      return;
    }
    const orderId = String(req.params.orderId || "").trim();
    const order = securityState.habeOrdersById[orderId];
    if (!order) {
      res.status(404).json({ ok: false, messageAr: "\u0637\u0644\u0628 H-A-B-E \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", messageEn: "Order not found." });
      return;
    }
    const body = req.body;
    const decision = body.decision === "rejected" ? "rejected" : "approved";
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    order.approvalStatus = decision;
    order.decidedByName = sess.fullName;
    order.decidedByEmail = sess.email;
    order.decidedByUsername = sess.username;
    order.decisionNote = String(body.note || "").trim().slice(0, 200);
    order.updatedAt = nowIso;
    securityState.habeOrdersById[orderId] = order;
    if (decision === "approved") {
      const entryId = `HABE-${orderId}`;
      if (!securityState.ledgerEntries.some((e) => e.entryId === entryId)) {
        const kitchenTenant = securityState.tenantsById.tenant_kitchen_alain;
        const mealsCount = order.items.reduce((s, it) => s + it.qty, 0);
        securityState.ledgerEntries.unshift({
          entryId,
          entryType: "supply_revenue",
          clientTenantId: "tenant_client_habe",
          clientName: "\u0634\u0631\u0643\u0629 \u0647\u0627-\u0628\u064A \u0627\u0644\u0645\u0635\u0631\u064A\u0629 (H.A.B.E)",
          kitchenTenantId: kitchenTenant?.tenantId || "tenant_kitchen_alain",
          kitchenName: kitchenTenant?.name || "\u0645\u0637\u0628\u062E \u0648\u0645\u0631\u0643\u0632 \u0627\u0644\u0639\u064A\u0646 \u2014 \u0645\u062F\u064A\u0646\u0629 \u0628\u062F\u0631",
          contractRef: "HABE-PORTAL-2026",
          mealsCount: Math.max(1, mealsCount),
          mealUnitPriceEGP: round2(order.totalEGP / Math.max(1, mealsCount)),
          amountEGP: order.totalEGP,
          paidAmountEGP: 0,
          entryDate: order.createdAt.slice(0, 10),
          sourceChannel: "habe",
          notes: `\u062E\u0635\u0645 \u0631\u0627\u062A\u0628 \u0645\u0639\u062A\u0645\u062F H.A.B.E [${orderId}] \u2014 ${order.employeeName} (\u0628\u0648\u0627\u0633\u0637\u0629 ${sess.fullName})`,
          createdByEmail: sess.email,
          createdAt: nowIso
        });
      }
    }
    saveSecurityState(securityState);
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorUsername: sess.username,
      actorRole: sess.canonicalRole,
      action: `${decision === "approved" ? "\u0627\u0639\u062A\u0645\u0627\u062F" : "\u0631\u0641\u0636"} \u0637\u0644\u0628 \u062E\u0635\u0645 H-A-B-E (${orderId})`,
      targetType: "habe_approval",
      targetId: orderId,
      severity: "info",
      details: `${order.employeeName} (${order.totalEGP} EGP) decided by ${sess.fullName} (${sess.username || sess.email})`
    });
    res.json({
      ok: true,
      order,
      messageAr: decision === "approved" ? `\u062A\u0645 \u0627\u0639\u062A\u0645\u0627\u062F \u0637\u0644\u0628 [${orderId}] \u0648\u062A\u0631\u062D\u064A\u0644\u0647 \u0644\u0644\u062D\u0633\u0627\u0628\u0627\u062A.` : `\u062A\u0645 \u0631\u0641\u0636 \u0637\u0644\u0628 [${orderId}].`
    });
  });
  app.get("/api/habe/reports/monthly", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    const allowed = isHabeApproverSession(sess) || sess.canonicalRole === "finance_manager" || sess.role === "finance_admin";
    if (!allowed) {
      appendAuditEntry({
        actorUid: sess.uid,
        actorEmail: sess.email,
        actorUsername: sess.username,
        actorRole: sess.canonicalRole,
        action: "\u0631\u0641\u0636 \u0645\u062D\u0627\u0648\u0644\u0629 \u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0643\u0634\u0641 \u0627\u0644\u062E\u0635\u0648\u0645\u0627\u062A \u0627\u0644\u0634\u0647\u0631\u064A \u0627\u0644\u0645\u062C\u0645\u0639 \u0641\u064A H-A-B-E",
        targetType: "habe_payroll_report",
        targetId: "monthly_payroll",
        severity: "security_alert",
        details: `Blocked ${sess.email} (${sess.canonicalRole}) from /api/habe/reports/monthly`
      });
      res.status(403).json({
        ok: false,
        code: "PAYROLL_REPORT_FORBIDDEN",
        messageAr: "\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u062C\u0645\u0639\u0629 \u0644\u062E\u0635\u0648\u0645\u0627\u062A \u0627\u0644\u0631\u0648\u0627\u062A\u0628 \u0645\u062D\u062C\u0648\u0628\u0629 \u062A\u0645\u0627\u0645\u0627\u064B \u0639\u0646 \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0648\u0645\u0642\u062A\u0635\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629.",
        messageEn: "Consolidated payroll reports restricted to approvers and finance managers."
      });
      return;
    }
    const monthPrefix = /^\d{4}-\d{2}$/.test(String(req.query.month || "")) ? String(req.query.month) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
    const eligibleOrders = Object.values(securityState.habeOrdersById).filter(
      (o) => o.createdAt.startsWith(monthPrefix) && o.paymentMethod === "payroll_deduction" && o.approvalStatus === "approved"
    );
    const byEmployeeMap = /* @__PURE__ */ new Map();
    for (const o of eligibleOrders) {
      const key = o.employeeCode.toUpperCase();
      if (!byEmployeeMap.has(key)) {
        byEmployeeMap.set(key, {
          employeeCode: o.employeeCode,
          employeeName: o.employeeName,
          department: o.department,
          ordersCount: 0,
          totalEGP: 0
        });
      }
      const bucket = byEmployeeMap.get(key);
      bucket.ordersCount += 1;
      bucket.totalEGP = round2(bucket.totalEGP + o.totalEGP);
    }
    const rows = Array.from(byEmployeeMap.values()).sort((a, b) => b.totalEGP - a.totalEGP);
    res.json({
      ok: true,
      month: monthPrefix,
      totalEmployees: rows.length,
      totalDeductionsEGP: round2(rows.reduce((s, r) => s + r.totalEGP, 0)),
      rows,
      orders: eligibleOrders
    });
  });
  function requireOwnerOnly(req, res, next) {
    requireAuthenticatedSession(req, res, () => {
      const sess = req.authSession;
      if (sess.role !== "owner") {
        res.status(403).json({
          ok: false,
          code: sess.role === "finance_admin" ? "FINANCE_ROLE_ISOLATED" : "OWNER_ONLY",
          messageAr: sess.role === "finance_admin" ? "\u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0627\u0644\u064A \u0645\u0639\u0632\u0648\u0644 \u062A\u0645\u0627\u0645\u0627\u064B \u0639\u0646 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0648\u0633\u062D\u0628 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A." : "\u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0645\u0642\u0635\u0648\u0631 \u062D\u0635\u0631\u064A\u0627\u064B \u0639\u0644\u0649 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629.",
          messageEn: "Owner privilege required; finance and non-owner roles are blocked."
        });
        return;
      }
      next();
    });
  }
  app.get("/api/admin/sessions", requireOwnerOnly, (_req, res) => {
    const activeSessions = Array.from(sessionStore.values()).filter((s) => Date.now() <= s.expiresAtMs).map((s) => ({
      sessionPrefix: `${s.sessionId.slice(0, 8)}...`,
      email: s.email,
      uid: s.uid,
      fullName: s.fullName,
      role: s.role,
      authKind: s.authKind,
      createdAt: new Date(s.createdAtMs).toISOString(),
      expiresAt: new Date(s.expiresAtMs).toISOString()
    }));
    res.json({
      ok: true,
      activeSessions,
      revokedSubjects: Object.values(securityState.revokedSubjects),
      designatedRoles: securityState.designatedRoles
    });
  });
  app.post("/api/admin/set-role", requireOwnerOnly, (req, res) => {
    const body = req.body;
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@") || email === BOOTSTRAPPED_OWNER_EMAIL) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0635\u062D\u064A\u062D \u063A\u064A\u0631 \u0627\u0644\u0645\u0627\u0644\u0643." });
      return;
    }
    if (body.role === "none") {
      delete securityState.designatedRoles[email];
    } else if (body.role === "basit_admin" || body.role === "finance_admin") {
      securityState.designatedRoles[email] = body.role;
    } else {
      res.status(400).json({ ok: false, messageAr: "\u0627\u0644\u062F\u0648\u0631 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645." });
      return;
    }
    saveSecurityState(securityState);
    for (const [tok, sess] of sessionStore.entries()) {
      if (sess.email === email) {
        sess.role = body.role === "none" ? "customer" : body.role;
        sessionStore.set(tok, sess);
      }
    }
    res.json({
      ok: true,
      email,
      role: body.role,
      messageAr: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062F\u0648\u0631 \u0627\u0644\u062E\u0627\u062F\u0645 \u0644\u0644\u0628\u0631\u064A\u062F ${email} \u0648\u062A\u0637\u0628\u064A\u0642\u0647 \u0639\u0644\u0649 \u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0646\u0634\u0637\u0629 \u0641\u0648\u0631\u0627\u064B.`
    });
  });
  app.post("/api/admin/revoke-access", requireOwnerOnly, (req, res) => {
    const body = req.body;
    const email = String(body.email || "").trim().toLowerCase();
    const uid = String(body.uid || "").trim();
    const reason = String(body.reason || "\u0633\u062D\u0628 \u0635\u0644\u0627\u062D\u064A\u0629 \u0625\u062F\u0627\u0631\u064A \u0641\u0648\u0631\u064A \u0645\u0646 \u0627\u0644\u0645\u0627\u0644\u0643").trim().slice(0, 200);
    if (!email && !uid) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0623\u0648 \u0627\u0644\u0645\u0639\u0631\u0641 \u0644\u0633\u062D\u0628 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629." });
      return;
    }
    if (email === BOOTSTRAPPED_OWNER_EMAIL) {
      res.status(400).json({ ok: false, messageAr: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0633\u062D\u0628 \u0635\u0644\u0627\u062D\u064A\u0629 \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064A." });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const actor = req.authSession.email;
    if (email) {
      securityState.revokedSubjects[email] = { subject: email, reason, revokedAt: nowIso, revokedBy: actor };
      delete securityState.designatedRoles[email];
    }
    if (uid) {
      securityState.revokedSubjects[uid] = { subject: uid, reason, revokedAt: nowIso, revokedBy: actor };
    }
    saveSecurityState(securityState);
    let terminatedCount = 0;
    for (const [tok, sess] of sessionStore.entries()) {
      if (email && sess.email === email || uid && sess.uid === uid) {
        sessionStore.delete(tok);
        terminatedCount += 1;
      }
    }
    res.json({
      ok: true,
      terminatedSessions: terminatedCount,
      messageAr: `\u062A\u0645 \u0633\u062D\u0628 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0641\u0648\u0631\u0627\u064B \u0648\u0625\u0644\u063A\u0627\u0621 ${terminatedCount} \u062C\u0644\u0633\u0629 \u0646\u0634\u0637\u0629.`,
      messageEn: `Revoked access immediately and terminated ${terminatedCount} session(s).`
    });
  });
  app.post("/api/admin/restore-access", requireOwnerOnly, (req, res) => {
    const body = req.body;
    const subject = String(body.subject || "").trim().toLowerCase();
    if (!subject || !securityState.revokedSubjects[subject]) {
      res.status(404).json({ ok: false, messageAr: "\u0627\u0644\u0639\u0646\u0635\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0625\u064A\u0642\u0627\u0641." });
      return;
    }
    delete securityState.revokedSubjects[subject];
    saveSecurityState(securityState);
    res.json({
      ok: true,
      messageAr: `\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u0625\u062A\u0627\u062D\u0629 \u0627\u0644\u062D\u0633\u0627\u0628 ${subject} \u0644\u0644\u062F\u062E\u0648\u0644 \u0645\u0646 \u062C\u062F\u064A\u062F (\u0628\u062F\u0648\u0646 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0625\u062F\u0627\u0631\u064A\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0629).`
    });
  });
  app.post("/api/admin/provision-executive-password", requireOwnerOnly, (req, res) => {
    const sess = req.authSession;
    const body = req.body;
    const rawIdentifier = String(body.identifier || "").trim();
    const newPassword = String(body.newPassword || "");
    const acct = findAccountByIdentifier(rawIdentifier);
    const isGovExec = acct && EXECUTIVE_ACCOUNTS.some((s) => s.email.toLowerCase() === acct.email.toLowerCase());
    if (!acct || !isGovExec) {
      res.status(404).json({ ok: false, messageAr: "\u062D\u0633\u0627\u0628 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", messageEn: "Executive account not found." });
      return;
    }
    if (!isStrongPassword(newPassword)) {
      res.status(400).json({
        ok: false,
        code: "WEAK_PASSWORD",
        messageAr: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 8 \u0623\u062D\u0631\u0641/\u0623\u0631\u0642\u0627\u0645 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0648\u0623\u0644\u0627 \u062A\u0643\u0648\u0646 \u0634\u0627\u0626\u0639\u0629.",
        messageEn: "Strong 8+ character password required."
      });
      return;
    }
    const salt = crypto.randomBytes(16).toString("hex");
    acct.passwordSalt = salt;
    acct.passwordHash = hashOwnerPin(newPassword, salt);
    acct.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    securityState.accountsByEmail[acct.email] = acct;
    saveSecurityState(securityState);
    const killed = acct.email !== sess.email ? terminateUserSessions(acct.email, acct.uid) : 0;
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorUsername: sess.username,
      actorRole: sess.canonicalRole,
      action: `\u062A\u0639\u064A\u064A\u0646/\u062A\u062F\u0648\u064A\u0631 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A\u0629 (${acct.username || acct.email})`,
      targetType: "account",
      targetId: acct.uid,
      severity: "info",
      details: `Owner provisioned independent password for ${acct.username} (${killed} prior sessions ended)`
    });
    res.json({
      ok: true,
      username: acct.username,
      terminatedSessions: killed,
      messageAr: `\u062A\u0645 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0645\u0633\u062A\u0642\u0644\u0629 \u0648\u0645\u0634\u0641\u0631\u0629 \u0644\u062D\u0633\u0627\u0628 (${acct.fullName}) \u0628\u0646\u062C\u0627\u062D.`,
      messageEn: "Executive password provisioned."
    });
  });
  function requirePlatformAdminOrOwner(req, res, next) {
    requireAuthenticatedSession(req, res, () => {
      const sess = req.authSession;
      const allowed = sess.canonicalRole === "super_admin" || sess.canonicalRole === "platform_admin";
      if (!allowed) {
        appendAuditEntry({
          actorUid: sess.uid,
          actorEmail: sess.email,
          actorRole: sess.canonicalRole,
          action: "\u0631\u0641\u0636 \u0648\u0635\u0648\u0644 \u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0647 \u0644\u0644\u0648\u062D\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
          targetType: "security",
          targetId: req.path,
          severity: "security_alert",
          details: `Blocked role ${sess.canonicalRole} from accessing ${req.method} ${req.path}`
        });
        res.status(403).json({
          ok: false,
          code: "ADMIN_PRIVILEGE_REQUIRED",
          messageAr: "\u0647\u0630\u0647 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0642\u062A\u0635\u0631\u0629 \u0639\u0644\u0649 \u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0623\u0639\u0644\u0649 \u0623\u0648 \u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F \u0641\u0642\u0637.",
          messageEn: "Requires Super Admin or Platform Admin privilege."
        });
        return;
      }
      next();
    });
  }
  app.get("/api/rbac/matrix", (req, res) => {
    res.json({
      ok: true,
      roles: ALL_CANONICAL_ROLES,
      matrix: securityState.roleMatrix
    });
  });
  app.post("/api/rbac/matrix", requirePlatformAdminOrOwner, (req, res) => {
    const sess = req.authSession;
    if (sess.canonicalRole !== "super_admin") {
      res.status(403).json({
        ok: false,
        code: "SUPER_ADMIN_ONLY",
        messageAr: "\u062A\u0639\u062F\u064A\u0644 \u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629 \u0645\u0642\u0635\u0648\u0631 \u0639\u0644\u0649 \u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0623\u0639\u0644\u0649 (Super Admin).",
        messageEn: "Only Super Admin may modify the global RBAC matrix."
      });
      return;
    }
    const body = req.body;
    if (!body.matrix || typeof body.matrix !== "object") {
      res.status(400).json({ ok: false, messageAr: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0635\u0641\u0648\u0641\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.", messageEn: "Invalid matrix payload." });
      return;
    }
    securityState.roleMatrix = sanitizeRoleMatrix(body.matrix);
    saveSecurityState(securityState);
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorRole: sess.canonicalRole,
      action: "\u062A\u062D\u062F\u064A\u062B \u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629 \u0644\u0644\u0623\u062F\u0648\u0627\u0631 \u0627\u0644\u0639\u0634\u0631\u0629",
      targetType: "rbac_matrix",
      targetId: "global",
      severity: "info",
      details: "Updated 10-role customizable permission matrix"
    });
    res.json({
      ok: true,
      matrix: securityState.roleMatrix,
      messageAr: "\u062A\u0645 \u062D\u0641\u0638 \u0648\u062A\u0637\u0628\u064A\u0642 \u0645\u0635\u0641\u0648\u0641\u0629 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0639\u0644\u0649 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u062E\u0627\u062F\u0645 \u0641\u0648\u0631\u0627\u064B.",
      messageEn: "Global RBAC matrix saved and enforced."
    });
  });
  app.get("/api/admin/approvals", requirePlatformAdminOrOwner, (_req, res) => {
    const pendingAccounts = Object.values(securityState.accountsByEmail).filter((a) => a.approvalStatus === "pending_review").map(({ passwordHash: _ph, passwordSalt: _ps, ...safe }) => safe);
    const allManagedUsers = Object.values(securityState.accountsByEmail).map(
      ({ passwordHash: _ph, passwordSalt: _ps, ...safe }) => safe
    );
    const tenants = Object.values(securityState.tenantsById);
    res.json({
      ok: true,
      pendingApprovals: pendingAccounts,
      users: allManagedUsers,
      tenants
    });
  });
  app.post("/api/admin/approvals/:uid/decide", requirePlatformAdminOrOwner, (req, res) => {
    const sess = req.authSession;
    const targetUid = String(req.params.uid || "").trim();
    const body = req.body;
    const account = Object.values(securityState.accountsByEmail).find((a) => a.uid === targetUid);
    if (!account) {
      res.status(404).json({ ok: false, messageAr: "\u0637\u0644\u0628 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", messageEn: "Account not found." });
      return;
    }
    const decision = body.decision === "reject" ? "reject" : "approve";
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (decision === "reject") {
      account.approvalStatus = "rejected";
      account.reviewNote = String(body.reviewNote || "\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u0629.").slice(0, 300);
      account.updatedAt = nowIso;
      securityState.accountsByEmail[account.email] = account;
      saveSecurityState(securityState);
      appendAuditEntry({
        actorUid: sess.uid,
        actorEmail: sess.email,
        actorRole: sess.canonicalRole,
        action: "\u0631\u0641\u0636 \u0637\u0644\u0628 \u062A\u0633\u062C\u064A\u0644 \u062C\u0647\u0629/\u0645\u0637\u0628\u062E",
        targetType: "approval",
        targetId: account.uid,
        severity: "warning",
        details: `${account.email} (${account.businessName}) rejected`
      });
      res.json({
        ok: true,
        messageAr: "\u062A\u0645 \u0631\u0641\u0636 \u0637\u0644\u0628 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0648\u062A\u0633\u062C\u064A\u0644\u0647 \u0641\u064A \u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642."
      });
      return;
    }
    const defaultRoleForKind = account.requestedKind === "central_kitchen" ? "kitchen_owner" : account.requestedKind === "client_company" ? "client_owner" : "customer";
    const nextRole = body.assignedRole && ALL_CANONICAL_ROLES.includes(body.assignedRole) && body.assignedRole !== "super_admin" ? body.assignedRole : defaultRoleForKind;
    let tenantId = account.tenantId;
    if ((account.requestedKind === "client_company" || account.requestedKind === "central_kitchen") && !tenantId) {
      tenantId = `tenant_${crypto.createHash("sha256").update(`${account.uid}:${account.businessName}`).digest("hex").slice(0, 12)}`;
      const kitchenIds = account.requestedKind === "client_company" ? Array.isArray(body.contractedKitchenIds) && body.contractedKitchenIds.length > 0 ? body.contractedKitchenIds : ["tenant_kitchen_hanger"] : [];
      securityState.tenantsById[tenantId] = {
        tenantId,
        name: account.businessName || account.fullName,
        kind: account.requestedKind === "central_kitchen" ? "central_kitchen" : "client_company",
        ownerUid: account.uid,
        ownerEmail: account.email,
        commercialRegRef: account.commercialRegRef || "PENDING-REF",
        city: account.city || "Cairo",
        countryCode: account.countryCode || "EG",
        contractedKitchenIds: kitchenIds,
        status: "active",
        createdAt: nowIso,
        updatedAt: nowIso
      };
    }
    account.approvalStatus = "approved";
    account.canonicalRole = nextRole;
    account.tenantId = tenantId;
    account.reviewNote = String(body.reviewNote || "\u062A\u0645 \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0648\u062A\u0641\u0639\u064A\u0644 \u0645\u0633\u0627\u062D\u0629 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u0639\u0632\u0648\u0644\u0629.").slice(0, 300);
    account.updatedAt = nowIso;
    securityState.accountsByEmail[account.email] = account;
    saveSecurityState(securityState);
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorRole: sess.canonicalRole,
      action: "\u0627\u0639\u062A\u0645\u0627\u062F \u0643\u064A\u0627\u0646/\u0645\u0637\u0628\u062E \u0648\u062A\u0641\u0639\u064A\u0644 \u0635\u0644\u0627\u062D\u064A\u0627\u062A\u0647 \u0627\u0644\u0645\u0639\u0632\u0648\u0644\u0629",
      targetType: "tenant",
      targetId: tenantId || account.uid,
      severity: "info",
      details: `Approved ${account.email} as ${nextRole} in ${tenantId}`
    });
    res.json({
      ok: true,
      tenantId,
      assignedRole: nextRole,
      messageAr: `\u062A\u0645 \u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u062A\u062E\u0635\u064A\u0635 \u0645\u0633\u0627\u062D\u0629 \u0639\u0645\u0644 \u0645\u0639\u0632\u0648\u0644\u0629 (${nextRole}) \u0628\u0646\u062C\u0627\u062D.`,
      messageEn: "Entity approved and isolated tenant provisioned."
    });
  });
  app.post("/api/admin/users/:uid/role-status", requirePlatformAdminOrOwner, (req, res) => {
    const sess = req.authSession;
    const targetUid = String(req.params.uid || "").trim();
    const body = req.body;
    const account = Object.values(securityState.accountsByEmail).find((a) => a.uid === targetUid);
    if (!account) {
      res.status(404).json({ ok: false, messageAr: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", messageEn: "User not found." });
      return;
    }
    if (account.email === BOOTSTRAPPED_OWNER_EMAIL) {
      res.status(403).json({ ok: false, messageAr: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0623\u0648 \u062A\u062C\u0645\u064A\u062F \u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0623\u0639\u0644\u0649.", messageEn: "Cannot mutate Super Admin." });
      return;
    }
    if (body.canonicalRole === "super_admin" && sess.canonicalRole !== "super_admin") {
      res.status(403).json({ ok: false, messageAr: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0635\u0639\u064A\u062F \u062F\u0648\u0631 \u0625\u0644\u0649 Super Admin \u0625\u0644\u0627 \u0645\u0646 \u0627\u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0623\u0639\u0644\u0649.", messageEn: "Privilege escalation denied." });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (body.canonicalRole && ALL_CANONICAL_ROLES.includes(body.canonicalRole)) {
      account.canonicalRole = body.canonicalRole;
    }
    if (Array.isArray(body.customPermissions)) {
      account.customPermissions = body.customPermissions;
    }
    if (body.approvalStatus === "suspended") {
      account.approvalStatus = "suspended";
      securityState.revokedSubjects[account.email] = {
        subject: account.email,
        reason: String(body.reason || "\u062A\u062C\u0645\u064A\u062F \u0625\u062F\u0627\u0631\u064A \u0644\u0644\u062D\u0633\u0627\u0628").slice(0, 200),
        revokedAt: nowIso,
        revokedBy: sess.email
      };
      const killed = terminateUserSessions(account.email, account.uid);
      securityState.accountsByEmail[account.email] = { ...account, updatedAt: nowIso };
      saveSecurityState(securityState);
      appendAuditEntry({
        actorUid: sess.uid,
        actorEmail: sess.email,
        actorRole: sess.canonicalRole,
        action: "\u062A\u062C\u0645\u064A\u062F \u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0625\u0644\u063A\u0627\u0621 \u062C\u0644\u0633\u0627\u062A\u0647 \u0627\u0644\u0646\u0634\u0637\u0629 \u0641\u0648\u0631\u0627\u064B",
        targetType: "account",
        targetId: account.uid,
        severity: "warning",
        details: `Suspended ${account.email} and terminated ${killed} active session(s)`
      });
      res.json({ ok: true, terminatedSessions: killed, messageAr: `\u062A\u0645 \u062A\u062C\u0645\u064A\u062F \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u0625\u0644\u063A\u0627\u0621 ${killed} \u062C\u0644\u0633\u0629 \u0646\u0634\u0637\u0629 \u0641\u0648\u0631\u0627\u064B.` });
      return;
    }
    if (body.approvalStatus === "approved") {
      account.approvalStatus = "approved";
      delete securityState.revokedSubjects[account.email];
      delete securityState.revokedSubjects[account.uid];
    }
    account.updatedAt = nowIso;
    securityState.accountsByEmail[account.email] = account;
    saveSecurityState(securityState);
    for (const [tok, activeSess] of sessionStore.entries()) {
      if (activeSess.uid === account.uid || activeSess.email === account.email) {
        activeSess.canonicalRole = account.canonicalRole;
        activeSess.role = resolveCanonicalToLegacyServerRole(account.canonicalRole);
        activeSess.customPermissions = account.customPermissions;
        sessionStore.set(tok, activeSess);
      }
    }
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorRole: sess.canonicalRole,
      action: "\u062A\u062D\u062F\u064A\u062B \u0635\u0644\u0627\u062D\u064A\u0629/\u062D\u0627\u0644\u0629 \u0645\u0633\u062A\u062E\u062F\u0645",
      targetType: "account",
      targetId: account.uid,
      severity: "info",
      details: `${account.email} -> role:${account.canonicalRole}, status:${account.approvalStatus}`
    });
    res.json({ ok: true, messageAr: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062F\u0648\u0631 \u0648\u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u062A\u0637\u0628\u064A\u0642\u0647\u0627 \u0641\u0648\u0631\u0627\u064B." });
  });
  function requireTenantScope(req, res, requiredPerm) {
    const sess = req.authSession;
    const tenantId = String(req.params.tenantId || "").trim();
    const tenant = securityState.tenantsById[tenantId];
    if (!tenant) {
      res.status(404).json({ ok: false, messageAr: "\u0627\u0644\u0643\u064A\u0627\u0646 \u0623\u0648 \u0627\u0644\u0645\u0637\u0628\u062E \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", messageEn: "Tenant workspace not found." });
      return null;
    }
    const isPlatformGovernance = sess.canonicalRole === "super_admin" || sess.canonicalRole === "platform_admin";
    if (!isPlatformGovernance && sess.tenantId !== tenantId) {
      appendAuditEntry({
        actorUid: sess.uid,
        actorEmail: sess.email,
        actorRole: sess.canonicalRole,
        action: "\u0645\u062D\u0627\u0648\u0644\u0629 \u0627\u062E\u062A\u0631\u0627\u0642 \u0639\u0632\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u064A\u0646 \u0627\u0644\u062C\u0647\u0627\u062A (Cross-Tenant Attempt)",
        targetType: "tenant_isolation",
        targetId: tenantId,
        severity: "security_alert",
        details: `User in tenant "${sess.tenantId || "none"}" attempted access to "${tenantId}"`
      });
      res.status(403).json({
        ok: false,
        code: "TENANT_ISOLATION_VIOLATION",
        messageAr: "\u0645\u0645\u0646\u0648\u0639: \u0639\u0632\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0635\u0627\u0631\u0645 \u064A\u0645\u0646\u0639 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0628\u064A\u0627\u0646\u0627\u062A \u0623\u0648 \u0637\u0644\u0628\u0627\u062A \u0623\u064A \u062C\u0647\u0629 \u0623\u0648 \u0645\u0637\u0628\u062E \u0622\u062E\u0631.",
        messageEn: "Strict multi-tenant isolation blocks cross-tenant access."
      });
      return null;
    }
    if (requiredPerm && !isPlatformGovernance && !hasEffectivePermission(securityState.roleMatrix, sess.canonicalRole, sess.customPermissions, requiredPerm)) {
      res.status(403).json({
        ok: false,
        code: "PERMISSION_DENIED",
        messageAr: "\u0644\u0627 \u062A\u0645\u0644\u0643 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u062F\u0627\u062E\u0644 \u0646\u0637\u0627\u0642 \u0647\u0630\u0627 \u0627\u0644\u0643\u064A\u0627\u0646.",
        messageEn: `Missing permission: ${requiredPerm}`
      });
      return null;
    }
    return tenant;
  }
  app.get("/api/tenant/:tenantId/overview", requireAuthenticatedSession, (req, res) => {
    const tenant = requireTenantScope(req, res);
    if (!tenant) return;
    const members = Object.values(securityState.accountsByEmail).filter((a) => a.tenantId === tenant.tenantId).map(({ passwordHash: _ph, passwordSalt: _ps, ...safe }) => safe);
    const invitations = Object.values(securityState.invitationsById).filter((inv) => inv.tenantId === tenant.tenantId).map(({ inviteTokenHash: _th, ...safe }) => safe);
    const orders = Object.values(securityState.tenantOrdersById).filter(
      (ord) => ord.clientTenantId === tenant.tenantId || ord.kitchenTenantId === tenant.tenantId
    );
    const contractedKitchens = tenant.kind === "central_kitchen" ? [tenant] : tenant.contractedKitchenIds.map((kid) => securityState.tenantsById[kid]).filter((k) => Boolean(k));
    res.json({
      ok: true,
      tenant,
      members,
      invitations,
      orders,
      contractedKitchens
    });
  });
  app.post("/api/tenant/:tenantId/members/invite", requireAuthenticatedSession, (req, res) => {
    const tenant = requireTenantScope(
      req,
      res,
      req.authSession?.canonicalRole.startsWith("kitchen_") ? "kitchen:manage_staff" : "entity:invite_employees"
    );
    if (!tenant) return;
    const sess = req.authSession;
    const body = req.body;
    const invitedEmail = String(body.invitedEmail || "").trim().toLowerCase();
    const invitedName = String(body.invitedName || "").trim().slice(0, 120);
    if (!invitedEmail || !invitedEmail.includes("@") || invitedName.length < 2) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0638\u0641 \u0648\u0628\u0631\u064A\u062F\u0647 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A.", messageEn: "Name and email required." });
      return;
    }
    const allowedRolesForKind = tenant.kind === "central_kitchen" ? ["kitchen_manager", "kitchen_staff"] : ["client_manager", "client_employee"];
    const assignedRole = body.assignedRole && allowedRolesForKind.includes(body.assignedRole) ? body.assignedRole : allowedRolesForKind[1];
    const rawInviteToken = crypto.randomBytes(16).toString("hex");
    const inviteTokenHash = crypto.createHash("sha256").update(rawInviteToken).digest("hex");
    const inviteId = `INV-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const record = {
      inviteId,
      inviteTokenHash,
      tenantId: tenant.tenantId,
      tenantName: tenant.name,
      tenantKind: tenant.kind,
      invitedEmail,
      invitedName,
      assignedRole,
      assignedPermissions: Array.isArray(body.assignedPermissions) ? body.assignedPermissions : securityState.roleMatrix[assignedRole] || [],
      status: "pending",
      invitedByUid: sess.uid,
      invitedByEmail: sess.email,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    securityState.invitationsById[inviteId] = record;
    saveSecurityState(securityState);
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorRole: sess.canonicalRole,
      action: `\u062F\u0639\u0648\u0629 \u0645\u0648\u0638\u0641 \u062C\u062F\u064A\u062F \u062F\u0627\u062E\u0644 ${tenant.name}`,
      targetType: "invitation",
      targetId: inviteId,
      severity: "info",
      details: `Invited ${invitedEmail} as ${assignedRole}`
    });
    res.json({
      ok: true,
      inviteId,
      inviteCodeForApplicant: rawInviteToken,
      messageAr: "\u062A\u0645 \u0625\u0635\u062F\u0627\u0631 \u062F\u0639\u0648\u0629 \u0627\u0644\u0645\u0648\u0638\u0641 \u0628\u0646\u062C\u0627\u062D \u0648\u0631\u0628\u0637\u0647\u0627 \u0628\u0646\u0637\u0627\u0642 \u0627\u0644\u0643\u064A\u0627\u0646 \u0627\u0644\u0645\u0639\u0632\u0648\u0644 \u0641\u0642\u0637.",
      messageEn: "Employee invitation issued and scoped strictly to this tenant."
    });
  });
  app.patch("/api/tenant/:tenantId/members/:memberUid/permissions", requireAuthenticatedSession, (req, res) => {
    const tenant = requireTenantScope(
      req,
      res,
      req.authSession?.canonicalRole.startsWith("kitchen_") ? "kitchen:manage_staff" : "entity:assign_member_permissions"
    );
    if (!tenant) return;
    const sess = req.authSession;
    const memberUid = String(req.params.memberUid || "").trim();
    const member = Object.values(securityState.accountsByEmail).find(
      (a) => a.uid === memberUid && a.tenantId === tenant.tenantId
    );
    if (!member) {
      res.status(404).json({ ok: false, messageAr: "\u0627\u0644\u0645\u0648\u0638\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0636\u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0643\u064A\u0627\u0646.", messageEn: "Member not found in tenant." });
      return;
    }
    const body = req.body;
    const allowedRolesForKind = tenant.kind === "central_kitchen" ? ["kitchen_manager", "kitchen_staff"] : ["client_manager", "client_employee"];
    const forbiddenPlatformPerms = /* @__PURE__ */ new Set([
      "platform:approve_entities",
      "platform:manage_users",
      "platform:manage_roles",
      "platform:manage_offers_cms",
      "platform:view_audit_logs",
      "platform:manage_orders"
    ]);
    if (body.assignedRole && allowedRolesForKind.includes(body.assignedRole)) {
      member.canonicalRole = body.assignedRole;
    }
    if (Array.isArray(body.customPermissions)) {
      member.customPermissions = body.customPermissions.filter((p) => !forbiddenPlatformPerms.has(p));
    }
    if (typeof body.suspended === "boolean") {
      member.approvalStatus = body.suspended ? "suspended" : "approved";
      if (body.suspended) {
        terminateUserSessions(member.email, member.uid);
      }
    }
    member.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    securityState.accountsByEmail[member.email] = member;
    saveSecurityState(securityState);
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorRole: sess.canonicalRole,
      action: `\u062A\u062D\u062F\u064A\u062B \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0639\u0636\u0648 \u062F\u0627\u062E\u0644 ${tenant.name}`,
      targetType: "tenant_member",
      targetId: member.uid,
      severity: "info",
      details: `${member.email} -> role:${member.canonicalRole}, perms:${member.customPermissions.length}`
    });
    res.json({
      ok: true,
      messageAr: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u0648\u0638\u0641 \u0636\u0645\u0646 \u062D\u062F\u0648\u062F \u0627\u0644\u0643\u064A\u0627\u0646 \u0628\u0646\u062C\u0627\u062D.",
      messageEn: "Tenant member permissions updated."
    });
  });
  app.post("/api/tenant/:tenantId/orders", requireAuthenticatedSession, (req, res) => {
    const tenant = requireTenantScope(req, res, "entity:place_orders");
    if (!tenant) return;
    const sess = req.authSession;
    const body = req.body;
    const kitchenTenantId = String(body.kitchenTenantId || "").trim();
    const itemsSummary = String(body.itemsSummary || "").trim().slice(0, 300);
    const mealsCount = Number(body.mealsCount || 0) > 0 ? Math.round(Number(body.mealsCount)) : void 0;
    const contractRef = body.contractRef ? String(body.contractRef).trim().slice(0, 80) : void 0;
    const totalEGP = Number(body.totalEGP || 0);
    if (tenant.kind === "client_company" && !tenant.contractedKitchenIds.includes(kitchenTenantId)) {
      appendAuditEntry({
        actorUid: sess.uid,
        actorEmail: sess.email,
        actorRole: sess.canonicalRole,
        action: "\u0631\u0641\u0636 \u0637\u0644\u0628 \u0644\u0639\u062F\u0645 \u0648\u062C\u0648\u062F \u0639\u0642\u062F \u0645\u0639\u062A\u0645\u062F \u0645\u0639 \u0627\u0644\u0645\u0637\u0628\u062E \u0627\u0644\u0645\u0637\u0644\u0648\u0628",
        targetType: "contract_isolation",
        targetId: kitchenTenantId,
        severity: "security_alert",
        details: `Client ${tenant.tenantId} blocked from uncontracted kitchen ${kitchenTenantId}`
      });
      res.status(403).json({
        ok: false,
        code: "NO_KITCHEN_CONTRACT",
        messageAr: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0645\u0637\u0628\u062E \u0644\u0639\u062F\u0645 \u0648\u062C\u0648\u062F \u0639\u0642\u062F \u0633\u0627\u0631\u064D \u0648\u0645\u0639\u062A\u0645\u062F \u0645\u0639 \u062C\u0647\u062A\u0643\u0645.",
        messageEn: "No active approved contract links your company to this kitchen."
      });
      return;
    }
    const kitchen = securityState.tenantsById[kitchenTenantId];
    if (!kitchen || itemsSummary.length < 2 || !Number.isFinite(totalEGP) || totalEGP <= 0) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0628 \u0648\u0627\u0644\u0645\u0637\u0628\u062E \u0627\u0644\u0645\u0639\u062A\u0645\u062F.", messageEn: "Valid kitchen, items, and amount required." });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const orderId = `TORD-${Date.now().toString(36)}-${crypto.randomBytes(2).toString("hex")}`;
    const order = {
      orderId,
      clientTenantId: tenant.tenantId,
      clientTenantName: tenant.name,
      kitchenTenantId: kitchen.tenantId,
      kitchenTenantName: kitchen.name,
      placedByUid: sess.uid,
      placedByName: sess.fullName,
      itemsSummary,
      ...mealsCount ? { mealsCount, mealUnitPriceEGP: Math.round(totalEGP / mealsCount * 100) / 100 } : {},
      ...contractRef ? { contractRef } : {},
      totalEGP,
      status: "pending_kitchen",
      createdAt: nowIso,
      updatedAt: nowIso
    };
    securityState.tenantOrdersById[orderId] = order;
    saveSecurityState(securityState);
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorRole: sess.canonicalRole,
      action: "\u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628 \u0625\u0639\u0627\u0634\u0629 \u062A\u0639\u0627\u0642\u062F\u064A \u0645\u0639\u0632\u0648\u0644",
      targetType: "tenant_order",
      targetId: orderId,
      severity: "info",
      details: `${tenant.tenantId} -> ${kitchen.tenantId} (${totalEGP} EGP)`
    });
    res.json({ ok: true, order, messageAr: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628 \u0625\u0644\u0649 \u0627\u0644\u0645\u0637\u0628\u062E \u0627\u0644\u0645\u0631\u0643\u0632\u064A \u0627\u0644\u0645\u062A\u0639\u0627\u0642\u062F \u0645\u0639\u0647 \u0641\u0642\u0637." });
  });
  app.get("/api/admin/audit-logs", requirePlatformAdminOrOwner, (_req, res) => {
    res.json({
      ok: true,
      immutable: true,
      logs: securityState.auditLogs
    });
  });
  app.delete("/api/admin/audit-logs/:logId", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorRole: sess.canonicalRole,
      action: "\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u062D\u0638\u0648\u0631\u0629 \u0644\u062D\u0630\u0641 \u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0623\u0645\u0646\u064A",
      targetType: "audit_tamper",
      targetId: String(req.params.logId || "unknown"),
      severity: "security_alert",
      details: `Blocked audit log delete attempt by ${sess.email}`
    });
    res.status(403).json({
      ok: false,
      code: "IMMUTABLE_AUDIT_LOG",
      messageAr: "\u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0623\u0645\u0646\u064A \u063A\u064A\u0631 \u0642\u0627\u0628\u0644 \u0644\u0644\u062D\u0630\u0641 \u0623\u0648 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0646\u0632\u0627\u0647\u0629 \u0648\u0627\u0644\u0631\u0642\u0627\u0628\u0629.",
      messageEn: "Audit logs are strictly immutable and cannot be deleted."
    });
  });
  app.put("/api/admin/audit-logs/:logId", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    appendAuditEntry({
      actorUid: sess.uid,
      actorEmail: sess.email,
      actorRole: sess.canonicalRole,
      action: "\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u062D\u0638\u0648\u0631\u0629 \u0644\u062A\u0639\u062F\u064A\u0644 \u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0623\u0645\u0646\u064A",
      targetType: "audit_tamper",
      targetId: String(req.params.logId || "unknown"),
      severity: "security_alert",
      details: `Blocked audit log modification attempt by ${sess.email}`
    });
    res.status(403).json({
      ok: false,
      code: "IMMUTABLE_AUDIT_LOG",
      messageAr: "\u0633\u062C\u0644 \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0627\u0644\u0623\u0645\u0646\u064A \u063A\u064A\u0631 \u0642\u0627\u0628\u0644 \u0644\u0644\u062A\u0639\u062F\u064A\u0644 \u0646\u0647\u0627\u0626\u064A\u0627\u064B.",
      messageEn: "Audit logs are strictly immutable."
    });
  });
  app.post("/api/payments/create-intent", requireAuthenticatedSession, async (req, res) => {
    try {
      const sess = req.authSession;
      const body = req.body;
      const provider = body.provider;
      const mode = body.mode === "live" ? "live" : "sandbox";
      const amount = Number(body.amount || 0);
      const currency = String(body.currency || "EGP").toUpperCase();
      const countryCode = String(body.countryCode || "EG").toUpperCase();
      const orderId = String(body.orderId || `ORD-${Date.now()}`);
      const tenantId = sess.tenantId || String(body.tenantId || "platform_global");
      const idempotencyKey = String(body.idempotencyKey || `${sess.uid}_${orderId}_${provider}_${amount}`);
      if (!provider || !ALLOWED_GATEWAYS.includes(provider)) {
        res.status(400).json({ ok: false, error: "Invalid payment provider." });
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1e7) {
        res.status(400).json({ ok: false, error: "Payment amount must be greater than zero." });
        return;
      }
      const existingTxId = idempotencyStore.get(idempotencyKey);
      if (existingTxId && sandboxIntentStore.has(existingTxId)) {
        res.json({
          ok: true,
          idempotentReplay: true,
          intent: sandboxIntentStore.get(existingTxId)
        });
        return;
      }
      if (mode === "live") {
        res.status(403).json({
          ok: false,
          code: "REAL_TRANSFERS_DISABLED",
          provider,
          messageAr: "\u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0627\u0644\u064A \u0627\u0644\u062D\u064A \u0648\u062A\u062D\u0631\u064A\u0643 \u0627\u0644\u0623\u0645\u0648\u0627\u0644 \u0627\u0644\u0641\u0639\u0644\u064A \u0645\u062D\u0638\u0648\u0631 \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646. \u064A\u064F\u0633\u0645\u062D \u0641\u0642\u0637 \u0628\u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631 (Sandbox).",
          messageEn: "Live monetary transfers are disabled by security policy. Only Sandbox / Audit verification mode is enabled."
        });
        return;
      }
      const txId = `tx_sbx_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`;
      const gatewayReference = `${provider.toUpperCase()}-SBX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      const hmacSignature = computeSandboxHmac(
        `${txId}|${provider}|${orderId}|${amount}|${currency}`,
        SANDBOX_HMAC_KEY
      );
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const record = {
        txId,
        payerUid: sess.uid,
        provider,
        mode: "sandbox",
        orderId,
        tenantId,
        amount,
        currency,
        countryCode,
        status: "Pending",
        gatewayReference,
        idempotencyKey,
        hmacSignature,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      sandboxIntentStore.set(txId, record);
      idempotencyStore.set(idempotencyKey, txId);
      res.json({
        ok: true,
        idempotentReplay: false,
        intent: {
          ...record,
          ...provider === "vodafone_cash" ? { walletNumber: "+201010430347" } : {}
        }
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : "Internal payment error"
      });
    }
  });
  app.post("/api/payments/sandbox-action", requireAuthenticatedSession, (req, res) => {
    const sess = req.authSession;
    const body = req.body;
    const txId = String(body.txId || "");
    const nextStatus = body.action;
    if (!txId || !nextStatus || !["Paid", "Failed", "Cancelled", "Refunded"].includes(nextStatus)) {
      res.status(400).json({ ok: false, error: "Missing txId or invalid action status." });
      return;
    }
    const record = sandboxIntentStore.get(txId);
    if (!record) {
      res.status(404).json({ ok: false, error: "Sandbox transaction intent not found on server." });
      return;
    }
    if (record.payerUid && record.payerUid !== sess.uid && sess.canonicalRole !== "super_admin" && sess.canonicalRole !== "platform_admin") {
      res.status(403).json({
        ok: false,
        code: "PAYMENT_INTENT_FORBIDDEN",
        messageAr: "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062A\u0639\u062F\u064A\u0644 \u0645\u0639\u0627\u0645\u0644\u0629 \u062F\u0641\u0639 \u0644\u0627 \u062A\u062E\u0635 \u062D\u0633\u0627\u0628\u0643.",
        messageEn: "Cannot modify another user payment intent."
      });
      return;
    }
    if (record.mode !== "sandbox") {
      res.status(403).json({ ok: false, error: "Sandbox action endpoint cannot mutate live gateway records." });
      return;
    }
    const expectedHmac = computeSandboxHmac(
      `${record.txId}|${record.provider}|${record.orderId}|${record.amount}|${record.currency}`,
      SANDBOX_HMAC_KEY
    );
    if (body.hmacSignature && body.hmacSignature !== expectedHmac) {
      res.status(401).json({ ok: false, error: "Invalid HMAC signature for sandbox confirmation." });
      return;
    }
    record.status = nextStatus;
    record.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    sandboxIntentStore.set(txId, record);
    if (nextStatus === "Paid" && Number(record.amount) > 0) {
      const channelMap = {
        vodafone_cash: "e_wallet",
        instapay: "e_wallet",
        fawry: "e_wallet",
        paymob: "bank",
        cash_on_delivery: "treasury"
      };
      const pctMap = {
        vodafone_cash: 1.5,
        instapay: 0,
        fawry: 2,
        paymob: 2.5,
        cash_on_delivery: 0
      };
      recordOwnerFinancialInflow({
        source: `\u0628\u0648\u0627\u0628\u0629 \u062F\u0641\u0639 (${record.provider})`,
        purpose: `\u062A\u062D\u0635\u064A\u0644 \u0645\u0639\u0627\u0645\u0644\u0629 \u0637\u0644\u0628 ${record.orderId || record.txId}`,
        grossEGP: Number(record.amount),
        commissionPct: pctMap[record.provider] ?? 1.5,
        channel: channelMap[record.provider] || "e_wallet",
        orderRef: `SBX-${record.txId}`,
        actorEmail: sess.email
      });
    }
    res.json({
      ok: true,
      hmacVerified: true,
      intent: record
    });
  });
  app.post("/api/payments/webhook/:provider", (req, res) => {
    const provider = String(req.params.provider || "").toLowerCase();
    if (!ALLOWED_GATEWAYS.includes(provider)) {
      res.status(400).json({ ok: false, error: "Unsupported payment provider." });
      return;
    }
    const signatureHeader = String(req.headers["x-basit-signature"] || req.query.hmac || "");
    const payload = JSON.stringify(req.body || {});
    const secret = provider === "fawry" ? process.env.FAWRY_SECURITY_KEY : "";
    const activeSecret = secret || SANDBOX_HMAC_KEY;
    const expected = computeSandboxHmac(payload, activeSecret);
    const verified = Boolean(signatureHeader) && timingSafeTextEquals(signatureHeader, expected);
    if (!verified) {
      res.status(401).json({
        ok: false,
        provider,
        verified: false,
        usingSandboxSecret: !secret,
        error: "Webhook HMAC signature mismatch or missing x-basit-signature header."
      });
      return;
    }
    res.json({
      ok: true,
      provider,
      verified: true,
      usingSandboxSecret: !secret,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/chat", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        ok: false,
        error: "GEMINI_API_KEY is not configured on the server.",
        messageAr: "\u062E\u062F\u0645\u0629 \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u063A\u064A\u0631 \u0645\u0641\u0639\u0651\u0644\u0629 \u062D\u0627\u0644\u064A\u0627\u064B \u0644\u0639\u062F\u0645 \u0636\u0628\u0637 \u0645\u0641\u062A\u0627\u062D Gemini \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645.",
        messageEn: "AI Assistant is unavailable because GEMINI_API_KEY is missing."
      });
      return;
    }
    const body = req.body || {};
    const userMessage = typeof body.message === "string" ? body.message.trim() : "";
    if (!userMessage) {
      res.status(400).json({
        ok: false,
        messageAr: "\u064A\u0631\u062C\u0649 \u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0642\u0628\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644.",
        messageEn: "Message cannot be empty."
      });
      return;
    }
    if (userMessage.length > 4e3) {
      res.status(400).json({
        ok: false,
        messageAr: "\u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0637\u0648\u064A\u0644\u0629 \u062C\u062F\u0627\u064B (\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 4000 \u062D\u0631\u0641).",
        messageEn: "Message exceeds 4000 character limit."
      });
      return;
    }
    const lang = body.lang === "en" ? "en" : "ar";
    const userRole = typeof body.userRole === "string" ? body.userRole : "visitor";
    const isVisitor = userRole === "visitor" || userRole === "guest";
    const rawHistory = Array.isArray(body.history) ? body.history.slice(-16) : [];
    const formattedHistory = [];
    for (const entry of rawHistory) {
      if (!entry || typeof entry !== "object") continue;
      const roleVal = entry.role;
      const textVal = entry.text;
      if ((roleVal === "user" || roleVal === "model") && typeof textVal === "string" && textVal.trim()) {
        formattedHistory.push({
          role: roleVal,
          parts: [{ text: textVal.trim().slice(0, 4e3) }]
        });
      }
    }
    const systemInstruction = [
      "You are the official BASIT (\u0628\u0627\u0633\u0637) Customer & Catering Assistant for Wataniya Logistics Financial (\u0627\u0644\u0634\u0631\u0643\u0629 \u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629).",
      `Reply primarily in ${lang === "ar" ? "clear, warm, concise Arabic" : "clear, concise English"}.`,
      "Core central kitchens in BASIT: \u0645\u0648\u0644 \u0627\u0644\u0639\u064A\u0646 (\u0645\u062F\u064A\u0646\u0629 \u0628\u062F\u0631), \u0647\u0646\u062C\u0631 \u0633\u062A\u064A\u0634\u0646 (\u0623\u0631\u0636 \u0627\u0644\u0645\u0639\u0627\u0631\u0636 \u0628\u0645\u062F\u064A\u0646\u0629 \u0646\u0635\u0631), \u0628\u064A\u062A \u0627\u0644\u0639\u064A\u0644\u0629, \u0639\u0645\u0627\u0631 \u0641\u0627\u0645\u064A\u0644\u064A, \u0648\u0639\u0645 \u0627\u0644\u0631\u0641\u0627\u0639\u064A (\u0627\u0644\u0634\u0631\u0648\u0642).",
      "Service coverage areas: \u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629\u060C \u0645\u062F\u064A\u0646\u0629 \u0628\u062F\u0631\u060C \u0645\u0635\u0627\u0646\u0639 \u0645\u062F\u064A\u0646\u0629 \u0628\u062F\u0631\u060C \u0627\u0644\u0634\u0631\u0648\u0642\u060C \u0645\u062F\u064A\u0646\u062A\u064A.",
      "8 Organized Catering Menus: \u0645\u0646\u064A\u0648 \u0627\u0644\u0639\u0645\u0627\u0644\u0629\u060C \u0645\u0646\u064A\u0648 \u0627\u0644\u0645\u0624\u062A\u0645\u0631\u0627\u062A\u060C \u0645\u0646\u064A\u0648 \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u0627\u062A\u060C \u0645\u0646\u064A\u0648 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A \u0648\u0627\u0644\u0623\u0641\u0631\u0627\u062D\u060C \u0645\u0646\u064A\u0648 \u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u062E\u064A\u0631\u060C \u0645\u0646\u064A\u0648 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0631\u0636\u0649\u060C \u0645\u0646\u064A\u0648 \u0627\u0644\u0647\u064A\u0644\u062B\u064A \u0648\u0627\u0644\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629 \u0648\u0635\u0627\u0644\u0627\u062A \u0627\u0644\u062C\u064A\u0645\u060C \u0645\u0646\u064A\u0648 \u0627\u0644\u0623\u0648\u0628\u0646 \u0628\u0648\u0641\u064A\u0647.",
      "Central Kitchen Partner applications are reviewed by platform leadership (hamzaelhelaly08@gmail.com).",
      isVisitor ? "IMPORTANT: The current user is a Visitor/Guest. Never invent or quote specific meal unit prices; invite them to register a Company/Client account or submit a Quote & Tasting request." : "The current user is an authenticated platform member/client. Help them with meal menus, factory contracts, tasting requests, Google Forms intake, and schedule planning.",
      "Keep answers helpful, accurate, and brief (under 6 short sentences unless a menu breakdown is requested)."
    ].join("\n");
    try {
      const genaiPkg = ["@google", "genai"].join("/");
      const { GoogleGenAI } = await import(genaiPkg);
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const chat = ai.chats.create({
        model: "gemini-4-hydrogen",
        config: { systemInstruction },
        history: formattedHistory
      });
      const response = await chat.sendMessage({ message: userMessage });
      const reply = (response.text || "").trim();
      if (!reply) {
        res.status(502).json({
          ok: false,
          messageAr: "\u0644\u0645 \u064A\u0631\u062C\u0639 \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0631\u062F\u0627\u064B \u0646\u0635\u064A\u0627\u064B\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",
          messageEn: "Model returned an empty response."
        });
        return;
      }
      res.json({ ok: true, reply });
    } catch (err) {
      const status = typeof err === "object" && err !== null && "status" in err && typeof err.status === "number" ? err.status : 500;
      const errMsg = err instanceof Error ? err.message : "Gemini chat request failed";
      console.error("[api/chat] error:", status, errMsg);
      res.status(status >= 400 && status < 600 ? status : 500).json({
        ok: false,
        error: errMsg,
        messageAr: "\u062A\u0639\u0630\u0631 \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0631\u062F \u0645\u0646 \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u062D\u0627\u0644\u064A\u0627\u064B.",
        messageEn: errMsg
      });
    }
  });
  function appendOwnerFinanceAudit(entry) {
    const rec = {
      ...entry,
      logId: `OFA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    securityState.ownerFinance.auditLogs.unshift(rec);
    if (securityState.ownerFinance.auditLogs.length > 600) {
      securityState.ownerFinance.auditLogs = securityState.ownerFinance.auditLogs.slice(0, 600);
    }
    saveSecurityState(securityState);
    return rec;
  }
  function recordOwnerFinancialInflow(params) {
    const gross = round2(Number(params.grossEGP || 0));
    if (!Number.isFinite(gross) || gross <= 0 || gross > 5e8) return null;
    const orderRef = String(params.orderRef || "").trim().slice(0, 120);
    if (orderRef && securityState.ownerFinance.ingestedOrderRefs.includes(orderRef)) {
      return null;
    }
    const commissionPct = Math.min(50, Math.max(0, round2(Number(params.commissionPct || 0))));
    const computedCommission = typeof params.commissionEGP === "number" && Number.isFinite(params.commissionEGP) && params.commissionEGP >= 0 ? Math.min(gross, round2(params.commissionEGP)) : round2(gross * commissionPct / 100);
    const netEGP = Math.max(0, round2(gross - computedCommission));
    const channel = params.channel === "bank" || params.channel === "e_wallet" || params.channel === "treasury" ? params.channel : "e_wallet";
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const entryDate = /^\d{4}-\d{2}-\d{2}$/.test(String(params.entryDate || "")) ? String(params.entryDate) : nowIso.slice(0, 10);
    const entry = {
      entryId: `OFE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
      direction: "inflow",
      sourceOrBeneficiary: String(params.source || "\u0645\u0628\u064A\u0639\u0627\u062A \u0628\u0627\u0633\u0637").trim().slice(0, 160),
      purpose: String(params.purpose || "\u062A\u062D\u0635\u064A\u0644 \u0637\u0644\u0628").trim().slice(0, 280),
      expenseCategory: "none",
      channel,
      grossEGP: gross,
      commissionPct,
      commissionEGP: computedCommission,
      netEGP,
      entryDate,
      orderRef,
      createdByEmail: String(params.actorEmail || "system@basit-platform.local").slice(0, 160),
      createdAt: nowIso
    };
    securityState.ownerFinance.entries.unshift(entry);
    securityState.ownerFinance.accounts[channel] = round2(
      (securityState.ownerFinance.accounts[channel] || 0) + netEGP
    );
    if (orderRef) {
      securityState.ownerFinance.ingestedOrderRefs.unshift(orderRef);
      if (securityState.ownerFinance.ingestedOrderRefs.length > 1e3) {
        securityState.ownerFinance.ingestedOrderRefs = securityState.ownerFinance.ingestedOrderRefs.slice(0, 1e3);
      }
    }
    saveSecurityState(securityState);
    appendOwnerFinanceAudit({
      actorEmail: entry.createdByEmail,
      actionAr: `\u062A\u062D\u0635\u064A\u0644 \u062A\u0644\u0642\u0627\u0626\u064A \u0648\u0627\u0631\u062F (${entry.sourceOrBeneficiary}) \u2014 \u0635\u0627\u0641\u064A ${netEGP.toLocaleString()} \u062C.\u0645 (\u0639\u0645\u0648\u0644\u0629 \u0645\u062E\u0635\u0648\u0645\u0629 ${computedCommission.toLocaleString()} \u062C.\u0645)`,
      category: "inflow",
      amountEGP: netEGP,
      details: `${entry.purpose} \xB7 \u0642\u0646\u0627\u0629: ${channel}${orderRef ? ` \xB7 \u0645\u0631\u062C\u0639: ${orderRef}` : ""}`
    });
    return entry;
  }
  function requireStrictAppOwnerSession(req, res, next) {
    requireAuthenticatedSession(req, res, () => {
      const sess = req.authSession;
      const emailOk = sess.email.toLowerCase() === BOOTSTRAPPED_OWNER_EMAIL;
      const roleOk = sess.role === "owner" || sess.canonicalRole === "super_admin";
      if (!emailOk || !roleOk) {
        appendAuditEntry({
          actorUid: sess.uid,
          actorEmail: sess.email,
          actorRole: sess.canonicalRole,
          action: "\u0645\u062D\u0627\u0648\u0644\u0629 \u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0647\u0627 \u0644\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u0645\u0627\u0644\u0643",
          targetType: "owner_finance_isolation",
          targetId: req.path,
          severity: "security_alert",
          details: `Blocked ${sess.email} (${sess.role}/${sess.canonicalRole}) from ${req.path}`
        });
        res.status(403).json({
          ok: false,
          code: "OWNER_ONLY_FINANCIAL_PLATFORM",
          messageAr: "\u0639\u0630\u0631\u0627\u064B: \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u0645\u0627\u0644\u0643 \u0633\u0631\u064A\u0629 \u0648\u0645\u0642\u0635\u0648\u0631\u0629 \u062D\u0635\u0631\u064A\u0627\u064B \u0639\u0644\u0649 \u0645\u0627\u0644\u0643 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0641\u0642\u0637.",
          messageEn: "Access denied: Exclusive to Verified App Owner."
        });
        return;
      }
      next();
    });
  }
  function requireVerifiedOwner2FA(req, res, next) {
    requireStrictAppOwnerSession(req, res, () => {
      const sess = req.authSession;
      if (!sess.ownerPinVerified) {
        res.status(423).json({
          ok: false,
          code: "OWNER_2FA_REQUIRED",
          configuredPin: Boolean(securityState.ownerPin),
          webauthnRegisteredCount: securityState.ownerFinance.webauthnCredentials.length,
          messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u062B\u0646\u0627\u0626\u064A \u0623\u0648 \u0628\u0635\u0645\u0629 \u0627\u0644\u0648\u062C\u0647 \u0644\u0641\u062A\u062D \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u0645\u0627\u0644\u0643.",
          messageEn: "2FA / Biometric unlock required to access Owner financial data."
        });
        return;
      }
      next();
    });
  }
  app.post("/api/owner-finance/inflow-ingest", (req, res) => {
    const body = req.body || {};
    const { session } = resolveSessionFromRequest(req);
    const grossEGP = Number(body.grossEGP || 0);
    if (!Number.isFinite(grossEGP) || grossEGP <= 0 || grossEGP > 5e8) {
      res.status(400).json({ ok: false, messageAr: "\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0628\u0644\u063A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629.", messageEn: "Invalid grossEGP." });
      return;
    }
    const pm = String(body.paymentMethod || "").toLowerCase();
    let channel = body.channel === "bank" || body.channel === "e_wallet" || body.channel === "treasury" ? body.channel : "e_wallet";
    let defaultCommissionPct = 1.5;
    if (!body.channel) {
      if (pm === "cash" || pm === "cash_on_delivery") {
        channel = "treasury";
        defaultCommissionPct = 0;
      } else if (pm === "bank_transfer" || pm === "paymob" || pm === "corporate_invoice") {
        channel = "bank";
        defaultCommissionPct = pm === "paymob" ? 2.5 : 0;
      } else if (pm === "instapay") {
        channel = "e_wallet";
        defaultCommissionPct = 0;
      } else if (pm === "fawry") {
        channel = "e_wallet";
        defaultCommissionPct = 2;
      } else if (pm === "vodafone_cash") {
        channel = "e_wallet";
        defaultCommissionPct = 1.5;
      }
    }
    const commissionPct = typeof body.commissionPct === "number" && Number.isFinite(body.commissionPct) ? body.commissionPct : defaultCommissionPct;
    const created = recordOwnerFinancialInflow({
      source: typeof body.source === "string" && body.source.trim() ? body.source.trim() : "\u0637\u0644\u0628 \u0645\u0628\u0627\u0634\u0631 \u2014 \u0628\u0627\u0633\u0637",
      purpose: typeof body.purpose === "string" && body.purpose.trim() ? body.purpose.trim() : "\u0645\u0628\u064A\u0639\u0627\u062A \u0648\u062A\u0639\u0627\u0642\u062F\u0627\u062A",
      grossEGP,
      commissionPct,
      commissionEGP: typeof body.commissionEGP === "number" ? body.commissionEGP : void 0,
      channel,
      orderRef: typeof body.orderRef === "string" ? body.orderRef.trim() : "",
      entryDate: typeof body.entryDate === "string" ? body.entryDate.trim() : void 0,
      actorEmail: session?.email || "checkout@basit-platform.local"
    });
    res.status(created ? 201 : 200).json({
      ok: true,
      ingested: Boolean(created),
      duplicate: !created
    });
  });
  app.get("/api/owner-finance/status", requireStrictAppOwnerSession, (req, res) => {
    const sess = req.authSession;
    res.json({
      ok: true,
      ownerEmail: sess.email,
      configuredPin: Boolean(securityState.ownerPin),
      webauthnRegisteredCount: securityState.ownerFinance.webauthnCredentials.length,
      registeredCredentialIds: securityState.ownerFinance.webauthnCredentials.map((c) => c.credentialId),
      owner2faVerified: Boolean(sess.ownerPinVerified)
    });
  });
  app.post("/api/owner-finance/webauthn/challenge", requireStrictAppOwnerSession, (req, res) => {
    const sess = req.authSession;
    const challenge = crypto.randomBytes(32).toString("base64url");
    sess.webauthnChallenge = challenge;
    sessionStore.set(sess.sessionId, sess);
    res.json({
      ok: true,
      challenge,
      rpName: "BASIT Owner Financial Vault",
      userId: Buffer.from(sess.uid).toString("base64url"),
      userEmail: sess.email,
      registeredCredentialIds: securityState.ownerFinance.webauthnCredentials.map((c) => c.credentialId)
    });
  });
  app.post("/api/owner-finance/webauthn/register", requireStrictAppOwnerSession, (req, res) => {
    const sess = req.authSession;
    const body = req.body || {};
    const credentialId = String(body.credentialId || "").trim();
    const clientDataJSON = String(body.clientDataJSON || "").trim();
    if (!credentialId || !clientDataJSON || !sess.webauthnChallenge) {
      res.status(400).json({ ok: false, messageAr: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0628\u0635\u0645\u0629 \u0623\u0648 \u0627\u0644\u062A\u062D\u062F\u064A \u0627\u0644\u0623\u0645\u0646\u064A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629." });
      return;
    }
    try {
      const parsed = JSON.parse(Buffer.from(clientDataJSON, "base64url").toString("utf8"));
      if (parsed.type !== "webauthn.create" || parsed.challenge !== sess.webauthnChallenge) {
        res.status(401).json({ ok: false, messageAr: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u062A\u0648\u0642\u064A\u0639 \u062A\u062D\u062F\u064A \u0627\u0644\u0628\u0635\u0645\u0629 \u0627\u0644\u0623\u0645\u0646\u064A." });
        return;
      }
    } catch {
      res.status(400).json({ ok: false, messageAr: "\u0635\u064A\u063A\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0628\u0635\u0645\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629." });
      return;
    }
    if (!securityState.ownerFinance.webauthnCredentials.some((c) => c.credentialId === credentialId)) {
      securityState.ownerFinance.webauthnCredentials.push({
        credentialId,
        label: String(body.label || "\u0628\u0635\u0645\u0629 \u0627\u0644\u0648\u062C\u0647 / \u0627\u0644\u0625\u0635\u0628\u0639 \u0644\u0644\u0645\u0627\u0644\u0643").slice(0, 80),
        registeredAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    sess.webauthnChallenge = void 0;
    sess.ownerPinVerified = true;
    sessionStore.set(sess.sessionId, sess);
    saveSecurityState(securityState);
    appendOwnerFinanceAudit({
      actorEmail: sess.email,
      actionAr: "\u062A\u0641\u0639\u064A\u0644 \u0648\u0631\u0628\u0637 \u0628\u0635\u0645\u0629 \u0627\u0644\u0648\u062C\u0647 / \u0627\u0644\u0625\u0635\u0628\u0639 (WebAuthn) \u0628\u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0644\u0644\u0645\u0627\u0644\u0643",
      category: "security_2fa",
      amountEGP: 0,
      details: `Credential ID: ${credentialId.slice(0, 14)}...`
    });
    res.json({
      ok: true,
      owner2faVerified: true,
      webauthnRegisteredCount: securityState.ownerFinance.webauthnCredentials.length,
      messageAr: "\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0628\u0635\u0645\u0629 \u0627\u0644\u0648\u062C\u0647/\u0627\u0644\u0625\u0635\u0628\u0639 \u0648\u0641\u062A\u062D \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u0645\u0627\u0644\u0643."
    });
  });
  app.post("/api/owner-finance/webauthn/verify", requireStrictAppOwnerSession, (req, res) => {
    const sess = req.authSession;
    const body = req.body || {};
    const credentialId = String(body.credentialId || "").trim();
    const clientDataJSON = String(body.clientDataJSON || "").trim();
    if (!credentialId || !clientDataJSON || !sess.webauthnChallenge) {
      res.status(400).json({ ok: false, messageAr: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u062D\u0642\u0642 \u0628\u0627\u0644\u0628\u0635\u0645\u0629 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629." });
      return;
    }
    const isRegistered = securityState.ownerFinance.webauthnCredentials.some(
      (c) => c.credentialId === credentialId
    );
    if (!isRegistered) {
      res.status(401).json({ ok: false, messageAr: "\u0627\u0644\u0628\u0635\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0629 \u063A\u064A\u0631 \u0645\u0633\u062C\u0644\u0629 \u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u0643." });
      return;
    }
    try {
      const parsed = JSON.parse(Buffer.from(clientDataJSON, "base64url").toString("utf8"));
      if (parsed.type !== "webauthn.get" || parsed.challenge !== sess.webauthnChallenge) {
        res.status(401).json({ ok: false, messageAr: "\u0641\u0634\u0644 \u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u062A\u062D\u062F\u064A \u0627\u0644\u0623\u0645\u0646\u064A \u0644\u0644\u0628\u0635\u0645\u0629." });
        return;
      }
    } catch {
      res.status(400).json({ ok: false, messageAr: "\u062A\u0639\u0630\u0631 \u0642\u0631\u0627\u0621\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u062D\u064A\u0648\u064A." });
      return;
    }
    sess.webauthnChallenge = void 0;
    sess.ownerPinVerified = true;
    sessionStore.set(sess.sessionId, sess);
    appendOwnerFinanceAudit({
      actorEmail: sess.email,
      actionAr: "\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0645\u0648\u062B\u0642 \u0628\u0628\u0635\u0645\u0629 \u0627\u0644\u0648\u062C\u0647/\u0627\u0644\u0625\u0635\u0628\u0639 \u0644\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u0645\u0627\u0644\u0643",
      category: "security_2fa",
      amountEGP: 0,
      details: "WebAuthn biometric verification passed"
    });
    res.json({ ok: true, owner2faVerified: true, messageAr: "\u062A\u0645 \u0641\u062A\u062D \u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0644\u0644\u0645\u0627\u0644\u0643 \u0628\u0628\u0635\u0645\u0629 \u0627\u0644\u0623\u0645\u0627\u0646 \u0628\u0646\u062C\u0627\u062D." });
  });
  function buildOwnerFinanceSummaryPayload() {
    const { accounts, entries, receivables, payables, auditLogs } = securityState.ownerFinance;
    const bank = round2(accounts.bank || 0);
    const e_wallet = round2(accounts.e_wallet || 0);
    const treasury = round2(accounts.treasury || 0);
    const totalNetBalance = round2(bank + e_wallet + treasury);
    const inflows = entries.filter((e) => e.direction === "inflow");
    const outflows = entries.filter((e) => e.direction === "outflow");
    const totalInflowsGross = round2(inflows.reduce((s, e) => s + (Number(e.grossEGP) || 0), 0));
    const totalCommissionsDeducted = round2(inflows.reduce((s, e) => s + (Number(e.commissionEGP) || 0), 0));
    const totalInflowsNet = round2(inflows.reduce((s, e) => s + (Number(e.netEGP) || 0), 0));
    const totalOutflows = round2(outflows.reduce((s, e) => s + (Number(e.netEGP) || 0), 0));
    const totalReceivablesOpen = round2(
      receivables.reduce((s, r) => s + Math.max(0, (Number(r.totalAmountEGP) || 0) - (Number(r.collectedAmountEGP) || 0)), 0)
    );
    const totalPayablesOpen = round2(
      payables.reduce((s, p) => s + Math.max(0, (Number(p.totalAmountEGP) || 0) - (Number(p.paidAmountEGP) || 0)), 0)
    );
    const categoryLabels = {
      none: "\u063A\u064A\u0631 \u0645\u0635\u0646\u0641",
      salaries: "\u0631\u0648\u0627\u062A\u0628",
      raw_materials: "\u0645\u0648\u0627\u062F \u062E\u0627\u0645",
      marketing: "\u062A\u0633\u0648\u064A\u0642",
      commissions: "\u0639\u0645\u0648\u0644\u0627\u062A",
      logistics: "\u0644\u0648\u062C\u0633\u062A\u064A\u0627\u062A",
      other: "\u0623\u062E\u0631\u0649"
    };
    const catTotals = /* @__PURE__ */ new Map();
    for (const o of outflows) {
      const cat = o.expenseCategory || "other";
      catTotals.set(cat, round2((catTotals.get(cat) || 0) + (Number(o.netEGP) || 0)));
    }
    if (totalCommissionsDeducted > 0) {
      catTotals.set("commissions", round2((catTotals.get("commissions") || 0) + totalCommissionsDeducted));
    }
    const expenseAnalytics = Array.from(catTotals.entries()).map(([key, totalEGP]) => ({
      key,
      labelAr: categoryLabels[key] || "\u0623\u062E\u0631\u0649",
      totalEGP
    }));
    return {
      accounts: { bank, e_wallet, treasury, totalNetBalance },
      totals: {
        totalInflowsGross,
        totalCommissionsDeducted,
        totalInflowsNet,
        totalOutflows,
        totalReceivablesOpen,
        totalPayablesOpen,
        netCashflowPosition: round2(totalNetBalance + totalReceivablesOpen - totalPayablesOpen)
      },
      expenseAnalytics,
      entries,
      receivables,
      payables,
      auditLogs
    };
  }
  app.get("/api/owner-finance/dashboard", requireVerifiedOwner2FA, (_req, res) => {
    res.json({
      ok: true,
      ...buildOwnerFinanceSummaryPayload()
    });
  });
  app.post("/api/owner-finance/account-adjust", requireVerifiedOwner2FA, (req, res) => {
    const sess = req.authSession;
    const body = req.body || {};
    const channel = body.channel;
    if (channel !== "bank" && channel !== "e_wallet" && channel !== "treasury") {
      res.status(400).json({ ok: false, messageAr: "\u0642\u0646\u0627\u0629 \u0627\u0644\u062D\u0633\u0627\u0628 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629." });
      return;
    }
    const amount = round2(Number(body.amountEGP || 0));
    if (!Number.isFinite(amount) || amount < 0 || amount > 5e8) {
      res.status(400).json({ ok: false, messageAr: "\u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D." });
      return;
    }
    const mode = body.mode === "deposit" || body.mode === "withdraw" ? body.mode : "set";
    const current = securityState.ownerFinance.accounts[channel] || 0;
    const nextVal = mode === "set" ? amount : mode === "deposit" ? round2(current + amount) : round2(current - amount);
    securityState.ownerFinance.accounts[channel] = nextVal;
    saveSecurityState(securityState);
    const chNames = {
      bank: "\u0627\u0644\u0628\u0646\u0648\u0643",
      e_wallet: "\u0627\u0644\u0645\u062D\u0641\u0638\u0629 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629",
      treasury: "\u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u0646\u0642\u062F\u064A\u0629"
    };
    appendOwnerFinanceAudit({
      actorEmail: sess.email,
      actionAr: `\u062A\u062D\u062F\u064A\u062B \u0631\u0635\u064A\u062F ${chNames[channel]} (${mode === "set" ? "\u0636\u0628\u0637" : mode === "deposit" ? "\u0625\u064A\u062F\u0627\u0639" : "\u0633\u062D\u0628"}) \u0625\u0644\u0649 ${nextVal.toLocaleString()} \u062C.\u0645`,
      category: "balance",
      amountEGP: amount,
      details: String(body.reason || "\u062A\u0633\u0648\u064A\u0629 \u0631\u0635\u064A\u062F \u064A\u062F\u0648\u064A\u0629 \u0645\u0646 \u0627\u0644\u0645\u0627\u0644\u0643").slice(0, 240)
    });
    res.json({ ok: true, ...buildOwnerFinanceSummaryPayload() });
  });
  app.post("/api/owner-finance/entries", requireVerifiedOwner2FA, (req, res) => {
    const sess = req.authSession;
    const body = req.body || {};
    const direction = body.direction === "outflow" ? "outflow" : "inflow";
    const sourceOrBeneficiary = String(body.sourceOrBeneficiary || "").trim().slice(0, 160);
    const purpose = String(body.purpose || "").trim().slice(0, 280);
    const channel = body.channel === "bank" || body.channel === "e_wallet" || body.channel === "treasury" ? body.channel : "bank";
    const grossEGP = round2(Number(body.grossEGP || 0));
    if (sourceOrBeneficiary.length < 2 || purpose.length < 2 || !Number.isFinite(grossEGP) || grossEGP <= 0 || grossEGP > 5e8) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u062C\u0647\u0629/\u0627\u0644\u0645\u0633\u062A\u0641\u064A\u062F \u0648\u0627\u0644\u063A\u0631\u0636 \u0648\u0645\u0628\u0644\u063A \u0635\u062D\u064A\u062D \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631." });
      return;
    }
    const entryDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.entryDate || "")) ? String(body.entryDate) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (direction === "inflow") {
      const commissionPct = Math.min(50, Math.max(0, round2(Number(body.commissionPct || 0))));
      const commissionEGP = round2(grossEGP * commissionPct / 100);
      const netEGP = Math.max(0, round2(grossEGP - commissionEGP));
      const entry = {
        entryId: `OFE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
        direction: "inflow",
        sourceOrBeneficiary,
        purpose,
        expenseCategory: "none",
        channel,
        grossEGP,
        commissionPct,
        commissionEGP,
        netEGP,
        entryDate,
        orderRef: "",
        createdByEmail: sess.email,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      securityState.ownerFinance.entries.unshift(entry);
      securityState.ownerFinance.accounts[channel] = round2((securityState.ownerFinance.accounts[channel] || 0) + netEGP);
      saveSecurityState(securityState);
      appendOwnerFinanceAudit({
        actorEmail: sess.email,
        actionAr: `\u062A\u0633\u062C\u064A\u0644 \u0645\u062A\u062D\u0635\u0644\u0627\u062A \u064A\u062F\u0648\u064A\u0629 \u0645\u0646 (${sourceOrBeneficiary}) \u2014 \u0635\u0627\u0641\u064A ${netEGP.toLocaleString()} \u062C.\u0645`,
        category: "inflow",
        amountEGP: netEGP,
        details: `${purpose} \xB7 \u0639\u0645\u0648\u0644\u0629 \u0645\u062E\u0635\u0648\u0645\u0629: ${commissionEGP.toLocaleString()} \u062C.\u0645 (${commissionPct}%)`
      });
    } else {
      const allowedCats = /* @__PURE__ */ new Set(["salaries", "raw_materials", "marketing", "commissions", "logistics", "other"]);
      const expenseCategory = body.expenseCategory && allowedCats.has(body.expenseCategory) ? body.expenseCategory : "other";
      const entry = {
        entryId: `OFE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
        direction: "outflow",
        sourceOrBeneficiary,
        purpose,
        expenseCategory,
        channel,
        grossEGP,
        commissionPct: 0,
        commissionEGP: 0,
        netEGP: grossEGP,
        entryDate,
        orderRef: "",
        createdByEmail: sess.email,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      securityState.ownerFinance.entries.unshift(entry);
      securityState.ownerFinance.accounts[channel] = round2((securityState.ownerFinance.accounts[channel] || 0) - grossEGP);
      saveSecurityState(securityState);
      appendOwnerFinanceAudit({
        actorEmail: sess.email,
        actionAr: `\u062A\u0633\u062C\u064A\u0644 \u0645\u0635\u0631\u0648\u0641 \u062E\u0627\u0631\u062C \u0625\u0644\u0649 (${sourceOrBeneficiary}) \u0628\u0645\u0628\u0644\u063A ${grossEGP.toLocaleString()} \u062C.\u0645`,
        category: "outflow",
        amountEGP: grossEGP,
        details: `${purpose} \xB7 \u0627\u0644\u062A\u0635\u0646\u064A\u0641: ${expenseCategory} \xB7 \u0627\u0644\u0642\u0646\u0627\u0629: ${channel}`
      });
    }
    res.status(201).json({ ok: true, ...buildOwnerFinanceSummaryPayload() });
  });
  app.post("/api/owner-finance/receivables", requireVerifiedOwner2FA, (req, res) => {
    const sess = req.authSession;
    const body = req.body || {};
    const clientName = String(body.clientName || "").trim().slice(0, 160);
    const purpose = String(body.purpose || "").trim().slice(0, 240);
    const totalAmountEGP = round2(Number(body.totalAmountEGP || 0));
    const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.dueDate || "")) ? String(body.dueDate) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (clientName.length < 2 || purpose.length < 2 || !Number.isFinite(totalAmountEGP) || totalAmountEGP <= 0) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064A\u0644 \u0648\u0627\u0644\u063A\u0631\u0636 \u0648\u0645\u0628\u0644\u063A \u0635\u062D\u064A\u062D \u0648\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0633\u062A\u062D\u0642\u0627\u0642." });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const rec = {
      receivableId: `RCV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
      clientName,
      purpose,
      totalAmountEGP,
      collectedAmountEGP: 0,
      dueDate,
      status: "open",
      createdAt: nowIso,
      updatedAt: nowIso
    };
    securityState.ownerFinance.receivables.unshift(rec);
    saveSecurityState(securityState);
    appendOwnerFinanceAudit({
      actorEmail: sess.email,
      actionAr: `\u0625\u0636\u0627\u0641\u0629 \u0645\u062F\u064A\u0648\u0646\u064A\u0629 \u0639\u0645\u064A\u0644 (\u0644\u064A\u0646\u0627 \u0628\u0631\u0647) \u0639\u0644\u0649 ${clientName} \u0628\u0642\u064A\u0645\u0629 ${totalAmountEGP.toLocaleString()} \u062C.\u0645`,
      category: "receivable",
      amountEGP: totalAmountEGP,
      details: `${purpose} \xB7 \u0627\u0633\u062A\u062D\u0642\u0627\u0642: ${dueDate}`
    });
    res.status(201).json({ ok: true, ...buildOwnerFinanceSummaryPayload() });
  });
  app.patch("/api/owner-finance/receivables/:id/collect", requireVerifiedOwner2FA, (req, res) => {
    const sess = req.authSession;
    const id = String(req.params.id || "").trim();
    const rec = securityState.ownerFinance.receivables.find((r) => r.receivableId === id);
    if (!rec) {
      res.status(404).json({ ok: false, messageAr: "\u0633\u062C\u0644 \u0645\u062F\u064A\u0648\u0646\u064A\u0629 \u0627\u0644\u0639\u0645\u064A\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
      return;
    }
    const remaining = round2(rec.totalAmountEGP - rec.collectedAmountEGP);
    if (remaining <= 0) {
      res.status(400).json({ ok: false, messageAr: "\u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u064A\u0648\u0646\u064A\u0629 \u0645\u062D\u0635\u0644\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0627\u0644\u0641\u0639\u0644." });
      return;
    }
    const body = req.body || {};
    const collectAmt = Math.min(remaining, Math.max(0.01, round2(Number(body.amountEGP || remaining))));
    const channel = body.channel === "bank" || body.channel === "e_wallet" || body.channel === "treasury" ? body.channel : "bank";
    rec.collectedAmountEGP = round2(rec.collectedAmountEGP + collectAmt);
    rec.status = rec.collectedAmountEGP >= rec.totalAmountEGP ? "collected" : "partial";
    rec.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    recordOwnerFinancialInflow({
      source: rec.clientName,
      purpose: `\u062A\u062D\u0635\u064A\u0644 \u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0639\u0645\u0644\u0627\u0621: ${rec.purpose}`,
      grossEGP: collectAmt,
      commissionPct: 0,
      channel,
      orderRef: `RCV-COL-${rec.receivableId}-${Date.now()}`,
      actorEmail: sess.email
    });
    appendOwnerFinanceAudit({
      actorEmail: sess.email,
      actionAr: `\u062A\u062D\u0635\u064A\u0644 \u062F\u0641\u0639\u0629 \u0645\u0646 \u0627\u0644\u0639\u0645\u064A\u0644 (${rec.clientName}) \u0628\u0642\u064A\u0645\u0629 ${collectAmt.toLocaleString()} \u062C.\u0645`,
      category: "receivable",
      amountEGP: collectAmt,
      details: `\u0627\u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u0622\u0646: ${rec.status} \xB7 \u0642\u0646\u0627\u0629 \u0627\u0644\u062A\u062D\u0635\u064A\u0644: ${channel}`
    });
    saveSecurityState(securityState);
    res.json({ ok: true, ...buildOwnerFinanceSummaryPayload() });
  });
  app.post("/api/owner-finance/payables", requireVerifiedOwner2FA, (req, res) => {
    const sess = req.authSession;
    const body = req.body || {};
    const supplierName = String(body.supplierName || "").trim().slice(0, 160);
    const purpose = String(body.purpose || "").trim().slice(0, 240);
    const totalAmountEGP = round2(Number(body.totalAmountEGP || 0));
    const scheduledPaymentDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.scheduledPaymentDate || "")) ? String(body.scheduledPaymentDate) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (supplierName.length < 2 || purpose.length < 2 || !Number.isFinite(totalAmountEGP) || totalAmountEGP <= 0) {
      res.status(400).json({ ok: false, messageAr: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0631\u062F \u0648\u0627\u0644\u063A\u0631\u0636 \u0648\u0645\u0628\u0644\u063A \u0635\u062D\u064A\u062D \u0648\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0633\u062F\u0627\u062F \u0627\u0644\u0645\u062C\u062F\u0648\u0644." });
      return;
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const payRec = {
      payableId: `PAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
      supplierName,
      purpose,
      totalAmountEGP,
      paidAmountEGP: 0,
      scheduledPaymentDate,
      status: "scheduled",
      createdAt: nowIso,
      updatedAt: nowIso
    };
    securityState.ownerFinance.payables.unshift(payRec);
    saveSecurityState(securityState);
    appendOwnerFinanceAudit({
      actorEmail: sess.email,
      actionAr: `\u062C\u062F\u0648\u0644\u0629 \u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0645\u0648\u0631\u062F (\u0639\u0644\u064A\u0646\u0627 \u0628\u0631\u0647) \u0644\u0640 ${supplierName} \u0628\u0642\u064A\u0645\u0629 ${totalAmountEGP.toLocaleString()} \u062C.\u0645`,
      category: "payable",
      amountEGP: totalAmountEGP,
      details: `${purpose} \xB7 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0633\u062F\u0627\u062F: ${scheduledPaymentDate}`
    });
    res.status(201).json({ ok: true, ...buildOwnerFinanceSummaryPayload() });
  });
  app.patch("/api/owner-finance/payables/:id/pay", requireVerifiedOwner2FA, (req, res) => {
    const sess = req.authSession;
    const id = String(req.params.id || "").trim();
    const rec = securityState.ownerFinance.payables.find((p) => p.payableId === id);
    if (!rec) {
      res.status(404).json({ ok: false, messageAr: "\u0633\u062C\u0644 \u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0627\u0644\u0645\u0648\u0631\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F." });
      return;
    }
    const remaining = round2(rec.totalAmountEGP - rec.paidAmountEGP);
    if (remaining <= 0) {
      res.status(400).json({ ok: false, messageAr: "\u062A\u0645 \u0633\u062F\u0627\u062F \u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0631\u062F \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0627\u0644\u0641\u0639\u0644." });
      return;
    }
    const body = req.body || {};
    const payAmt = Math.min(remaining, Math.max(0.01, round2(Number(body.amountEGP || remaining))));
    const channel = body.channel === "bank" || body.channel === "e_wallet" || body.channel === "treasury" ? body.channel : "bank";
    rec.paidAmountEGP = round2(rec.paidAmountEGP + payAmt);
    rec.status = rec.paidAmountEGP >= rec.totalAmountEGP ? "paid" : "partial";
    rec.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    securityState.ownerFinance.entries.unshift({
      entryId: `OFE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
      direction: "outflow",
      sourceOrBeneficiary: rec.supplierName,
      purpose: `\u0633\u062F\u0627\u062F \u062F\u0641\u0639\u0629 \u0645\u0648\u0631\u062F: ${rec.purpose}`,
      expenseCategory: "raw_materials",
      channel,
      grossEGP: payAmt,
      commissionPct: 0,
      commissionEGP: 0,
      netEGP: payAmt,
      entryDate: nowIso.slice(0, 10),
      orderRef: `PAY-${rec.payableId}`,
      createdByEmail: sess.email,
      createdAt: nowIso
    });
    securityState.ownerFinance.accounts[channel] = round2((securityState.ownerFinance.accounts[channel] || 0) - payAmt);
    saveSecurityState(securityState);
    appendOwnerFinanceAudit({
      actorEmail: sess.email,
      actionAr: `\u0633\u062F\u0627\u062F \u062F\u0641\u0639\u0629 \u0645\u0648\u0631\u062F \u0644\u0640 (${rec.supplierName}) \u0628\u0645\u0628\u0644\u063A ${payAmt.toLocaleString()} \u062C.\u0645`,
      category: "payable",
      amountEGP: payAmt,
      details: `\u0627\u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u0622\u0646: ${rec.status} \xB7 \u0627\u0644\u0642\u0646\u0627\u0629: ${channel}`
    });
    res.json({ ok: true, ...buildOwnerFinanceSummaryPayload() });
  });
  app.post("/api/owner-finance/audit-export", requireVerifiedOwner2FA, (req, res) => {
    const sess = req.authSession;
    const period = req.body?.period === "day" || req.body?.period === "week" ? req.body.period : "month";
    const labels = { day: "\u0627\u0644\u064A\u0648\u0645", week: "\u0627\u0644\u0623\u0633\u0628\u0648\u0639", month: "\u0627\u0644\u0634\u0647\u0631" };
    appendOwnerFinanceAudit({
      actorEmail: sess.email,
      actionAr: `\u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0643\u0634\u0641 \u062D\u0633\u0627\u0628 PDF \u062A\u0646\u0641\u064A\u0630\u064A \u0644\u0644\u0645\u0627\u0644\u0643 (\u0627\u0644\u0641\u062A\u0631\u0629: ${labels[period]})`,
      category: "pdf_export",
      amountEGP: 0,
      details: `Exported executive statement for period=${period}`
    });
    res.json({ ok: true });
  });
  app.post("/api/owner-finance/ai-investor", requireVerifiedOwner2FA, async (req, res) => {
    const sess = req.authSession;
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        ok: false,
        code: "GEMINI_KEY_MISSING",
        messageAr: "\u062E\u062F\u0645\u0629 \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631 \u0627\u0644\u0630\u0643\u064A \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u0629 \u0644\u0623\u0646 \u0645\u0641\u062A\u0627\u062D GEMINI_API_KEY \u063A\u064A\u0631 \u0645\u0636\u0628\u0648\u0637 \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645.",
        messageEn: "GEMINI_API_KEY is not configured on the server."
      });
      return;
    }
    const summary = buildOwnerFinanceSummaryPayload();
    const safeReserveEGP = round2(Math.max(summary.totals.totalPayablesOpen * 1.15, 0));
    const investableSurplusEGP = round2(Math.max(0, summary.accounts.totalNetBalance - safeReserveEGP));
    try {
      const genaiPkg = ["@google", "genai"].join("/");
      const { GoogleGenAI } = await import(genaiPkg);
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const prompt = [
        '\u0623\u0646\u062A \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631 \u0627\u0644\u0630\u0643\u064A \u0627\u0644\u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0627\u0631 \u0627\u0644\u0645\u0627\u0644\u064A \u0627\u0644\u062D\u0635\u0631\u064A \u0644\u0645\u0627\u0644\u0643 \u0645\u0646\u0635\u0629 "\u0628\u0627\u0633\u0637 | BASIT" \u0644\u0644\u062A\u0645\u0648\u064A\u0646 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0641\u064A \u0645\u0635\u0631.',
        "\u0642\u0645 \u0628\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062A\u062F\u0641\u0642\u0627\u062A \u0627\u0644\u0646\u0642\u062F\u064A\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \u0628\u062F\u0642\u0629 \u0648\u0627\u0642\u062A\u0631\u062D \u0641\u0631\u0635 \u0627\u0633\u062A\u062B\u0645\u0627\u0631\u064A\u0629 \u0622\u0645\u0646\u0629 \u0648\u0639\u0645\u0644\u064A\u0629 \u0641\u064A \u0645\u0635\u0631 \u062A\u0646\u0627\u0633\u0628 \u0627\u0644\u0641\u0627\u0626\u0636 \u0627\u0644\u0645\u062A\u0627\u062D\u060C \u0645\u0639 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u0625\u0631\u062C\u0627\u0639 JSON \u0641\u0642\u0637 \u0628\u0647\u0630\u0627 \u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u062F\u0642\u064A\u0642:",
        "{",
        '  "summaryAr": "\u0645\u0644\u062E\u0635 \u062A\u0646\u0641\u064A\u0630\u064A \u0648\u0627\u0636\u062D \u0644\u0644\u0648\u0636\u0639 \u0627\u0644\u0646\u0642\u062F\u064A \u0627\u0644\u062D\u0627\u0644\u064A \u0648\u0627\u0644\u0633\u064A\u0648\u0644\u0629 \u0627\u0644\u062D\u0631\u0629",',
        '  "riskPostureAr": "\u0645\u0646\u062E\u0641\u0636 \u0627\u0644\u0645\u062E\u0627\u0637\u0631 / \u0645\u062A\u0648\u0627\u0632\u0646 / \u062A\u062D\u0648\u0637\u064A",',
        '  "investableSurplusEGP": number,',
        '  "opportunities": [',
        "    {",
        '      "titleAr": "\u0627\u0633\u0645 \u0627\u0644\u0641\u0631\u0635\u0629 \u0627\u0644\u0627\u0633\u062A\u062B\u0645\u0627\u0631\u064A\u0629",',
        '      "allocationEGP": number,',
        '      "expectedYieldAr": "\u0627\u0644\u0639\u0627\u0626\u062F \u0627\u0644\u0645\u062A\u0648\u0642\u0639",',
        '      "horizonAr": "\u0627\u0644\u0645\u062F\u0629 \u0627\u0644\u0632\u0645\u0646\u064A\u0629",',
        '      "safetyLevelAr": "\u062F\u0631\u062C\u0629 \u0627\u0644\u0623\u0645\u0627\u0646",',
        '      "rationaleAr": "\u0644\u0645\u0627\u0630\u0627 \u062A\u0646\u0627\u0633\u0628 \u0648\u0636\u0639 \u0627\u0644\u062A\u062F\u0641\u0642 \u0627\u0644\u0646\u0642\u062F\u064A \u0627\u0644\u062D\u0627\u0644\u064A \u0644\u0634\u0631\u0643\u0629 \u0628\u0627\u0633\u0637"',
        "    }",
        "  ],",
        '  "cashflowWarnings": ["\u062A\u0646\u0628\u064A\u0647 1 \u0623\u0648 \u062E\u0637\u0648\u0629 \u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u062A\u062F\u0641\u0642 \u0627\u0644\u0646\u0642\u062F\u064A"]',
        "}",
        "",
        "\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u062D\u064A\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 (EGP):",
        JSON.stringify({
          accounts: summary.accounts,
          totals: summary.totals,
          estimatedSafeReserveEGP: safeReserveEGP,
          estimatedInvestableSurplusEGP: investableSurplusEGP,
          expenseAnalytics: summary.expenseAnalytics
        })
      ].join("\n");
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const rawText = (response.text || "").trim();
      if (!rawText) {
        res.status(502).json({
          ok: false,
          messageAr: "\u0644\u0645 \u064A\u0631\u062C\u0639 \u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u062A\u062D\u0644\u064A\u0644\u0627\u064B \u0646\u0635\u064A\u0627\u064B. \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649."
        });
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        res.status(502).json({
          ok: false,
          messageAr: "\u062A\u0639\u0630\u0631 \u0642\u0631\u0627\u0621\u0629 \u0635\u064A\u063A\u0629 \u0627\u0644\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0639\u0627\u0626\u062F\u0629 \u0645\u0646 \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631 \u0627\u0644\u0630\u0643\u064A."
        });
        return;
      }
      appendOwnerFinanceAudit({
        actorEmail: sess.email,
        actionAr: "\u062A\u0634\u063A\u064A\u0644 \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631 \u0627\u0644\u0630\u0643\u064A AI \u0644\u0644\u062A\u062F\u0641\u0642 \u0627\u0644\u0646\u0642\u062F\u064A \u0648\u0641\u0631\u0635 \u0627\u0644\u0627\u0633\u062A\u062B\u0645\u0627\u0631",
        category: "ai_investor",
        amountEGP: investableSurplusEGP,
        details: `Net Balance: ${summary.accounts.totalNetBalance} EGP \xB7 Surplus: ${investableSurplusEGP} EGP`
      });
      res.json({
        ok: true,
        analysis: parsed,
        snapshotTotals: summary.totals,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      const status = typeof err === "object" && err !== null && "status" in err && typeof err.status === "number" ? err.status : 500;
      const errMsg = err instanceof Error ? err.message : "Smart Investor Gemini call failed";
      console.error("[api/owner-finance/ai-investor] error:", status, errMsg);
      res.status(status >= 400 && status < 600 ? status : 500).json({
        ok: false,
        error: errMsg,
        messageAr: `\u062A\u0639\u0630\u0631 \u0625\u062A\u0645\u0627\u0645 \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631 \u0627\u0644\u0630\u0643\u064A: ${errMsg}`
      });
    }
  });
  return app;
}
async function startServer() {
  const app = await createConfiguredApp();
  const port = Number(process.env.PORT || 3e3);
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    app.get("/@vite/client", (_req, res) => {
      res.type("application/javascript; charset=utf-8");
      res.send(`
const sheetsMap = new Map();
const linkSheetsMap = new Map();
const hasDoc = typeof document !== "undefined";
const cspNonce = hasDoc ? document.querySelector("meta[property=csp-nonce]")?.nonce : undefined;

if (hasDoc) {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}

let lastInsertedStyle;
export function updateStyle(id, content) {
  if (!hasDoc || linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (cspNonce) style.setAttribute("nonce", cspNonce);
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}

export function removeStyle(id) {
  if (!hasDoc) return;
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll(\`link[rel="stylesheet"][data-vite-dev-id="\${CSS.escape(id)}"]\`).forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    style.parentNode?.removeChild(style);
    sheetsMap.delete(id);
  }
}

const dataMap = new Map();
export function createHotContext(ownerPath) {
  if (!dataMap.has(ownerPath)) dataMap.set(ownerPath, {});
  return {
    get data() { return dataMap.get(ownerPath); },
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}

export function injectQuery(url, queryToInject) {
  if (!url || (url[0] !== "." && url[0] !== "/")) return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return \`\${pathname}?\${queryToInject}\${search ? "&" + search.slice(1) : ""}\${hash || ""}\`;
}

const BaseHTMLElement = typeof HTMLElement !== "undefined" ? HTMLElement : class {};
export class ErrorOverlay extends BaseHTMLElement {
  close() {
    this.parentNode?.removeChild(this);
  }
}
`);
    });
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: "spa"
    });
    app.get(["/habe", "/habe/*"], async (req, res, next) => {
      try {
        const htmlPath = path.resolve(__dirname, "habe.html");
        const rawHtml = await fs.promises.readFile(htmlPath, "utf-8");
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawHtml);
        res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(transformed);
      } catch (err) {
        next(err);
      }
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get(["/habe", "/habe/*"], (_req, res) => {
      res.sendFile(path.join(distDir, "habe.html"));
    });
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`\u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 | BASIT server running on http://0.0.0.0:${port}`);
  });
}
var isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isEntrypoint) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
export {
  createConfiguredApp
};
