// Seed data generator. Populates IndexedDB with a realistic-but-manageable
// catalog for the MVP. Scale knobs are intentionally small here (tens, not
// thousands) — the Bug Generation Engine / environment sizing described in
// the PRD can grow these multipliers later without changing the shape.

import { v4 as uuid } from "uuid";
import { getDB } from "./schema";
import type {
  Category,
  Coupon,
  InventoryRecord,
  Order,
  Product,
  ProductVariant,
  Review,
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
  return [
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
}

function seedCoupons(): Coupon[] {
  return [
    { id: uuid(), code: "SAVE10", type: "percentage", value: 10, active: true, expiresAt: null },
    { id: uuid(), code: "FLAT5", type: "fixed", value: 500, active: true, expiresAt: null },
    { id: uuid(), code: "EXPIRED20", type: "percentage", value: 20, active: true, expiresAt: "2020-01-01T00:00:00.000Z" },
  ];
}

function seedWarehouses(): Warehouse[] {
  return [
    { id: uuid(), name: "East Distribution Center", region: "US-East" },
    { id: uuid(), name: "West Distribution Center", region: "US-West" },
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
  const { productCount = 120, force = false } = options;
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
  const orders: Order[] = [];

  const tx = db.transaction(
    ["categories", "products", "reviews", "users", "coupons", "warehouses", "inventory", "orders", "carts", "meta"],
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
    tx.objectStore("meta").put({ key: "seededAt", value: new Date().toISOString() }),
  ]);
  await tx.done;
}
