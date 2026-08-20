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
  items: OrderItem[];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  status: OrderStatus;
  couponCode?: string;
  createdAt: string;
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
