// Core domain types shared across the mock API layer, seed generator, and UI.

export type Role =
  | "customer"
  | "support_agent"
  | "inventory_manager"
  | "store_admin"
  | "super_admin";

export interface User {
  id: string;
  email: string;
  password: string; // plaintext on purpose in this sandbox (seeded "security bug" territory)
  name: string;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export interface ProductVariant {
  id: string;
  sku: string;
  label: string; // e.g. "Size M / Black"
  priceCents: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  basePriceCents: number;
  images: string[];
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface Cart {
  id: string; // "guest" or userId
  items: CartItem[];
  updatedAt: string;
}

export type OrderStatus =
  | "placed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refund_requested"
  | "refunded"
  | "partially_refunded";

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  userId: string;
  // Denormalized at order-creation time so admin order views and archived
  // (post user-deletion) orders can still show who placed them.
  userEmail: string;
  items: OrderItem[];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  status: OrderStatus;
  couponCode?: string;
  createdAt: string;
  // Set when the placing user's account has been deleted by an admin. The
  // order itself is preserved for historical/audit purposes rather than
  // being deleted along with the user.
  archived?: boolean;
  // Populated while status === "refund_requested" so an admin can decide
  // whether to issue the requested (possibly partial) refund or deny it
  // and restore the prior status.
  refundRequestedPartialCents?: number;
  statusBeforeRefundRequest?: OrderStatus;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "bogo";
  value: number; // percentage (0-100) or fixed cents
  active: boolean;
  expiresAt: string | null;
}

export interface InventoryRecord {
  id: string;
  variantId: string;
  warehouseId: string;
  quantity: number;
}

export interface Warehouse {
  id: string;
  name: string;
  region: string;
}

// --- Intentional Bug Framework -------------------------------------------

export type BugCategory =
  | "ui"
  | "functional"
  | "api"
  | "security"
  | "accessibility"
  | "performance"
  | "data_integrity";

export type BugSeverity = "low" | "medium" | "high" | "critical";

/** A registry entry describing one intentionally-seeded defect. */
export interface SeededBug {
  id: string;
  title: string;
  category: BugCategory;
  severity: BugSeverity;
  location: string; // file/function where the bug lives, for QA reference
  description: string;
  hint?: string; // shown only in Beginner training mode
  active: boolean; // Bug Generation Engine can enable/disable per environment
}

// --- QA Workbench: Test Case Builder --------------------------------------

export interface TestCase {
  id: string;
  authorId: string | null;
  title: string;
  preconditions: string;
  steps: string;
  expectedResult: string;
  actualResult: string;
  status: "draft" | "submitted";
  score: number | null; // completeness score 0-100
  createdAt: string;
  updatedAt: string;
}

// --- QA Workbench: Defect Reporting Module --------------------------------

export type DefectSeverity = "low" | "medium" | "high" | "critical";
export type DefectPriority = "low" | "medium" | "high" | "urgent";

export interface DefectReport {
  id: string;
  authorId: string | null;
  title: string;
  severity: DefectSeverity;
  priority: DefectPriority;
  steps: string;
  expectedResult: string;
  actualResult: string;
  screenshotDataUrl?: string;
  matchedBugId: string | null; // best-guess match against the seeded bug registry
  matchScore: number | null; // 0-1 similarity score of that match
  createdAt: string;
}

// --- Gamification ----------------------------------------------------------

/** Per-user progress record. Achievement/level definitions themselves are
 * static config (see lib/gamification/achievements.ts), not persisted. */
export interface UserProgress {
  id: string; // userId or "guest"
  points: number;
  achievementsUnlocked: string[]; // AchievementDef ids
  updatedAt: string;
}
