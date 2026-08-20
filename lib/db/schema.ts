// IndexedDB schema + connection singleton, powered by the `idb` wrapper.
// This is the persistence layer for the entire "backend" — everything the
// mock API reads/writes lives here, in the browser.

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Cart,
  Category,
  Coupon,
  DefectReport,
  InventoryRecord,
  Order,
  Product,
  Review,
  SeededBug,
  TestCase,
  User,
  UserProgress,
  Warehouse,
} from "./types";

export const DB_NAME = "atlas-commerce";
export const DB_VERSION = 2;

export interface AtlasDBSchema extends DBSchema {
  products: { key: string; value: Product; indexes: { "by-category": string } };
  categories: { key: string; value: Category; indexes: { "by-parent": string } };
  reviews: { key: string; value: Review; indexes: { "by-product": string } };
  users: { key: string; value: User; indexes: { "by-email": string } };
  carts: { key: string; value: Cart };
  orders: { key: string; value: Order; indexes: { "by-user": string } };
  coupons: { key: string; value: Coupon; indexes: { "by-code": string } };
  inventory: { key: string; value: InventoryRecord; indexes: { "by-variant": string } };
  warehouses: { key: string; value: Warehouse };
  meta: { key: string; value: { key: string; value: string } };
  bugs: { key: string; value: SeededBug; indexes: { "by-category": string } };
  testCases: { key: string; value: TestCase; indexes: { "by-author": string } };
  defectReports: { key: string; value: DefectReport; indexes: { "by-author": string } };
  userProgress: { key: string; value: UserProgress };
}

let dbPromise: Promise<IDBPDatabase<AtlasDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<AtlasDBSchema>> {
  if (typeof indexedDB === "undefined") {
    throw new Error("getDB() can only be called in the browser");
  }
  if (!dbPromise) {
    dbPromise = openDB<AtlasDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const products = db.createObjectStore("products", { keyPath: "id" });
          products.createIndex("by-category", "categoryId");

          const categories = db.createObjectStore("categories", { keyPath: "id" });
          categories.createIndex("by-parent", "parentId");

          const reviews = db.createObjectStore("reviews", { keyPath: "id" });
          reviews.createIndex("by-product", "productId");

          const users = db.createObjectStore("users", { keyPath: "id" });
          users.createIndex("by-email", "email", { unique: true });

          db.createObjectStore("carts", { keyPath: "id" });

          const orders = db.createObjectStore("orders", { keyPath: "id" });
          orders.createIndex("by-user", "userId");

          const coupons = db.createObjectStore("coupons", { keyPath: "id" });
          coupons.createIndex("by-code", "code", { unique: true });

          const inventory = db.createObjectStore("inventory", { keyPath: "id" });
          inventory.createIndex("by-variant", "variantId");

          db.createObjectStore("warehouses", { keyPath: "id" });
          db.createObjectStore("meta", { keyPath: "key" });
        }
        if (oldVersion < 2) {
          const bugs = db.createObjectStore("bugs", { keyPath: "id" });
          bugs.createIndex("by-category", "category");

          const testCases = db.createObjectStore("testCases", { keyPath: "id" });
          testCases.createIndex("by-author", "authorId");

          const defectReports = db.createObjectStore("defectReports", { keyPath: "id" });
          defectReports.createIndex("by-author", "authorId");

          db.createObjectStore("userProgress", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

/** Wipes and recreates the database, used by the seed data generator / bug engine. */
export async function resetDB(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await getDB();
  db.close();
  dbPromise = null;
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}
