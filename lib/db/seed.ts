// Seed data generator. Populates IndexedDB with a realistic-but-manageable
// catalog. Defaults are scaled up toward the PRD's target volumes (hundreds
// of products/thousands of orders/reviews) while staying light enough to
// seed quickly in a browser tab — the full 5,000+/50,000+ PRD figures can be
// dialed in later via the Bug/Environment Generation Engine without changing
// the shape of this data.

import { v4 as uuid } from "uuid";
import { getDB } from "./schema";
import type {
  Category,
  Coupon,
  InventoryRecord,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductVariant,
  Review,
  SeededBug,
  User,
  Warehouse,
} from "./types";

const CATEGORY_TREE: Record<string, string[]> = {
  Electronics: ["Laptops", "Tablets", "Accessories"],
  Apparel: ["Men", "Women", "Kids"],
  Home: ["Kitchen", "Furniture"],
};

const ADJECTIVES = ["Sleek", "Classic", "Pro", "Ultra", "Everyday", "Premium", "Compact", "Vintage"];
const NOUNS = ["Backpack", "Laptop", "Tablet", "Jacket", "Mug", "Chair", "Headphones", "Sneakers", "Lamp", "Desk"];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

async function seedCategories(): Promise<Category[]> {
  const categories: Category[] = [];
  for (const [parentName, children] of Object.entries(CATEGORY_TREE)) {
    const parent: Category = { id: uuid(), name: parentName, parentId: null };
    categories.push(parent);
    for (const childName of children) {
      categories.push({ id: uuid(), name: childName, parentId: parent.id });
    }
  }
  return categories;
}

function seedProducts(categories: Category[], count: number): Product[] {
  const leafCategories = categories.filter((c) => c.parentId !== null);
  const products: Product[] = [];
  for (let i = 0; i < count; i++) {
    const category = pick(leafCategories);
    const name = `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
    const basePriceCents = rand(999, 29999);
    const variantCount = rand(1, 3);
    const variants: ProductVariant[] = Array.from({ length: variantCount }, (_, vi) => ({
      id: uuid(),
      sku: `SKU-${i}-${vi}`,
      label: variantCount === 1 ? "Standard" : `Option ${vi + 1}`,
      priceCents: basePriceCents + vi * 200,
      stock: rand(0, 120),
    }));
    products.push({
      id: uuid(),
      name,
      description: `${name} — a great addition to the ${category.name} lineup. Durable, reliable, and ready to ship.`,
      categoryId: category.id,
      basePriceCents,
      images: [`https://picsum.photos/seed/${encodeURIComponent(name)}${i}/480/480`],
      variants,
      rating: Math.round((rand(30, 50) / 10) * 10) / 10,
      reviewCount: rand(0, 250),
      createdAt: new Date(Date.now() - rand(0, 1000 * 60 * 60 * 24 * 365)).toISOString(),
    });
  }
  return products;
}

function seedReviews(products: Product[]): Review[] {
  const reviews: Review[] = [];
  for (const product of products) {
    const n = rand(0, 4);
    for (let i = 0; i < n; i++) {
      reviews.push({
        id: uuid(),
        productId: product.id,
        userId: "seed-customer",
        rating: rand(1, 5),
        comment: pick([
          "Great value for the price.",
          "Shipping took longer than expected.",
          "Exactly as described.",
          "Would buy again.",
          "Not what I expected from the photos.",
        ]),
        createdAt: new Date().toISOString(),
      });
    }
  }
  return reviews;
}

function seedUsers(): User[] {
  const seeded: User[] = [
    {
      id: "seed-customer",
      email: "customer@atlascommerce.test",
      password: "password123",
      name: "Casey Customer",
      role: "customer",
      createdAt: new Date().toISOString(),
    },
    {
      id: "seed-admin",
      email: "admin@atlascommerce.test",
      password: "admin123",
      name: "Alex Admin",
      role: "store_admin",
      createdAt: new Date().toISOString(),
    },
  ];
  const FIRST_NAMES = ["Jordan", "Taylor", "Morgan", "Riley", "Casey", "Avery", "Quinn", "Reese", "Skyler", "Drew"];
  const LAST_NAMES = ["Nguyen", "Smith", "Garcia", "Patel", "Kim", "Johnson", "Brown", "Davis", "Lopez", "Chen"];
  for (let i = 0; i < 100; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    seeded.push({
      id: `seed-customer-${i}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@atlascommerce.test`,
      password: "password123",
      name: `${first} ${last}`,
      role: "customer",
      createdAt: new Date(Date.now() - rand(0, 1000 * 60 * 60 * 24 * 365)).toISOString(),
    });
  }
  return seeded;
}

function seedCoupons(): Coupon[] {
  const coupons: Coupon[] = [
    { id: uuid(), code: "SAVE10", type: "percentage", value: 10, active: true, expiresAt: null },
    { id: uuid(), code: "FLAT5", type: "fixed", value: 500, active: true, expiresAt: null },
    { id: uuid(), code: "EXPIRED20", type: "percentage", value: 20, active: true, expiresAt: "2020-01-01T00:00:00.000Z" },
  ];
  const CODE_WORDS = ["WELCOME", "SUMMER", "WINTER", "FLASH", "BOGO", "LOYAL", "VIP", "BUNDLE", "CLEAROUT", "REWARD"];
  for (let i = 0; i < 17; i++) {
    const type = pick(["percentage", "fixed", "bogo"] as const);
    coupons.push({
      id: uuid(),
      code: `${pick(CODE_WORDS)}${rand(1, 99)}`,
      type,
      value: type === "percentage" ? rand(5, 40) : type === "fixed" ? rand(200, 3000) : 1,
      active: Math.random() > 0.15,
      expiresAt: Math.random() > 0.7 ? new Date(Date.now() + rand(1, 90) * 86400000).toISOString() : null,
    });
  }
  return coupons;
}

function seedWarehouses(): Warehouse[] {
  return [
    { id: uuid(), name: "East Distribution Center", region: "US-East" },
    { id: uuid(), name: "West Distribution Center", region: "US-West" },
    { id: uuid(), name: "Central Distribution Center", region: "US-Central" },
    { id: uuid(), name: "Gulf Coast Fulfillment", region: "US-South" },
    { id: uuid(), name: "Pacific Northwest Hub", region: "US-Northwest" },
    { id: uuid(), name: "Mountain Region Depot", region: "US-Mountain" },
    { id: uuid(), name: "Northeast Corridor Center", region: "US-Northeast" },
    { id: uuid(), name: "Southwest Distribution Hub", region: "US-Southwest" },
  ];
}

function seedOrders(products: Product[], users: User[], count: number): Order[] {
  const orders: Order[] = [];
  const STATUSES: OrderStatus[] = ["placed", "processing", "shipped", "delivered", "cancelled", "refunded", "partially_refunded"];
  for (let i = 0; i < count; i++) {
    const user = pick(users);
    const itemCount = rand(1, 4);
    const items: OrderItem[] = [];
    for (let j = 0; j < itemCount; j++) {
      const product = pick(products);
      const variant = pick(product.variants);
      items.push({
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        quantity: rand(1, 3),
        unitPriceCents: variant.priceCents,
      });
    }
    const subtotalCents = items.reduce((sum, it) => sum + it.unitPriceCents * it.quantity, 0);
    const taxCents = Math.round(subtotalCents * 0.08);
    const shippingCents = 599;
    orders.push({
      id: uuid(),
      userId: user.id,
      items,
      subtotalCents,
      taxCents,
      shippingCents,
      totalCents: subtotalCents + taxCents + shippingCents,
      status: pick(STATUSES),
      createdAt: new Date(Date.now() - rand(0, 1000 * 60 * 60 * 24 * 180)).toISOString(),
    });
  }
  return orders;
}

/** Seed registry of the intentionally-planted defects, powering the Bug
 * Generation Engine, Defect Reporting match-scoring, and training-mode hints. */
function seedBugs(): SeededBug[] {
  return [
    {
      id: "bug-search-name-only",
      title: "Product search ignores descriptions",
      category: "functional",
      severity: "medium",
      location: "lib/mock-api/products.ts:listProducts",
      description: "Searching only matches against the product name, so relevant products whose description contains the search term are missed from results.",
      hint: "Search is returning incorrect results — try searching for a word you know only appears in a product's description.",
      active: true,
    },
    {
      id: "bug-cart-nonpositive-qty",
      title: "Cart accepts zero/negative quantities",
      category: "functional",
      severity: "medium",
      location: "lib/mock-api/cart.ts:updateCartItemQuantity",
      description: "Setting a cart line item's quantity to zero or a negative number does not remove it or clamp it, leaving an invalid line item in the cart.",
      hint: "Try setting a cart item's quantity to 0 — what happens to the line item and the subtotal?",
      active: true,
    },
    {
      id: "bug-tax-pre-discount",
      title: "Tax calculated before discount is applied",
      category: "functional",
      severity: "high",
      location: "lib/mock-api/orders.ts:placeOrder",
      description: "Tax is computed on the pre-discount subtotal instead of the discounted subtotal, overcharging customers who use a coupon.",
      hint: "Tax calculation appears incorrect — place an order with a percentage-off coupon and check the math.",
      active: true,
    },
    {
      id: "bug-refund-no-restock",
      title: "Refunds don't restore inventory",
      category: "data_integrity",
      severity: "high",
      location: "lib/mock-api/orders.ts:refundOrder",
      description: "Refunding an order marks it refunded but never restores the corresponding inventory quantities, causing inventory to drift from reality.",
      active: true,
    },
    {
      id: "bug-expired-coupon-redeemable",
      title: "Expired coupons remain redeemable",
      category: "api",
      severity: "medium",
      location: "lib/mock-api/coupons.ts:getCoupon",
      description: "getCoupon does not filter out coupons whose expiresAt date has passed, so expired codes are silently accepted at checkout.",
      active: true,
    },
    {
      id: "bug-login-account-enumeration",
      title: "Login error reveals account existence",
      category: "security",
      severity: "medium",
      location: "lib/mock-api/auth.ts:login",
      description: "The login error message differs for \"no account with that email\" versus \"wrong password\", letting an attacker enumerate registered emails.",
      active: true,
    },
  ];
}

function seedInventory(products: Product[], warehouses: Warehouse[]): InventoryRecord[] {
  const records: InventoryRecord[] = [];
  for (const product of products) {
    for (const variant of product.variants) {
      for (const warehouse of warehouses) {
        records.push({
          id: uuid(),
          variantId: variant.id,
          warehouseId: warehouse.id,
          quantity: rand(0, 60),
        });
      }
    }
  }
  return records;
}

export interface SeedOptions {
  productCount?: number;
  orderCount?: number;
  force?: boolean;
}

// Guards against concurrent seeding (e.g. React Strict Mode double-invoking
// effects in dev), which would otherwise race and violate unique indexes.
let inFlightSeed: Promise<void> | null = null;

export async function seedDatabase(options: SeedOptions = {}): Promise<void> {
  if (inFlightSeed) return inFlightSeed;
  inFlightSeed = seedDatabaseInternal(options).finally(() => {
    inFlightSeed = null;
  });
  return inFlightSeed;
}

/** Seeds the database if empty (or always, when force is set). */
async function seedDatabaseInternal(options: SeedOptions = {}): Promise<void> {
  const { productCount = 600, orderCount = 1500, force = false } = options;
  const db = await getDB();

  if (!force) {
    const existing = await db.count("products");
    if (existing > 0) return;
  }

  const categories = await seedCategories();
  const products = seedProducts(categories, productCount);
  const reviews = seedReviews(products);
  const users = seedUsers();
  const coupons = seedCoupons();
  const warehouses = seedWarehouses();
  const inventory = seedInventory(products, warehouses);
  const orders = seedOrders(products, users, orderCount);
  const bugs = seedBugs();

  const tx = db.transaction(
    ["categories", "products", "reviews", "users", "coupons", "warehouses", "inventory", "orders", "carts", "bugs", "meta"],
    "readwrite",
  );
  await Promise.all([
    ...categories.map((c) => tx.objectStore("categories").put(c)),
    ...products.map((p) => tx.objectStore("products").put(p)),
    ...reviews.map((r) => tx.objectStore("reviews").put(r)),
    ...users.map((u) => tx.objectStore("users").put(u)),
    ...coupons.map((c) => tx.objectStore("coupons").put(c)),
    ...warehouses.map((w) => tx.objectStore("warehouses").put(w)),
    ...inventory.map((i) => tx.objectStore("inventory").put(i)),
    ...orders.map((o) => tx.objectStore("orders").put(o)),
    ...bugs.map((b) => tx.objectStore("bugs").put(b)),
    tx.objectStore("meta").put({ key: "seededAt", value: new Date().toISOString() }),
  ]);
  await tx.done;
}
