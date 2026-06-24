/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/indexeddb.ts
import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "pos-offline-db";
const DB_VERSION = 5; // Bumped: LocalProduct now carries productCode for offline scanning

export interface LocalProduct {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
  storeId: string;
  userId?: string | null;
  description?: string | null;
  category?: string | null;
  productCode?: string;          // EAN-13 barcode — needed so the scanner works offline
  created_at?: string;
}

export interface LocalTransaction {
  localId?: number;
  transactionId?: string | null;
  invoiceId?: string | null;
  userId: string;
  storeId: string;
  // productId is LOCAL bookkeeping only — it lets the sync functions know which
  // product's stock to deduct once the device is back online. It is NEVER sent
  // to the Supabase `transactions` table (that table has no productId column).
  productId?: string | null;
  productName?: string | null;
  unitPrice?: number | null;
  totalPrice: number;
  quantity: number;
  type: "sale" | "expense" | "credit";
  description?: string | null;
  created_at: string;
  synced: 0 | 1;
}

export interface LocalInvoice {
  invoiceId: string; // UUID
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  clientAddress?: string | null;
  storeName: string;
  storeAddress: string;
  storePhoneNumber?: string | null;
  notes?: string | null;
  products: Array<{
    // Same rule as LocalTransaction.productId — local lookup key only,
    // used purely to find & deduct stock for this product on sync.
    productId?: string | null;
    name: string;
    unitPrice: number;
    quantity: number;
  }>;
  totalPrice: number;
  totalQuantity: number;
  created_at: string;
  synced: 0 | 1; // 0 = pending, 1 = synced
}

export interface UserProfile {
  key: "current";
  userId: string;
  name?: string | null;
  email: string;
  role: string;
  storeId: string;
  isActive: boolean;
  subscriptionDaysLeft?: number | null;
  planName?: string | null;
}

export interface StoreInfo {
  key: "current";
  storeId: string;
  storeName: string;
  storeAddress?: string | null;
  storePhoneNumber?: string | null;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Products store
      if (!db.objectStoreNames.contains("products")) {
        const productStore = db.createObjectStore("products", {
          keyPath: "productId",
        });
        productStore.createIndex("storeId", "storeId");
      }
      // Note: productCode is a new field on existing records (added in v5).
      // IndexedDB object stores are schemaless for non-indexed fields, so
      // existing product rows just won't have productCode until the next
      // full sync overwrites them via productStore.clear() + re-put()
      // inside syncDataFromServer() — no separate migration needed here.

      // Transactions store
      if (!db.objectStoreNames.contains("transactions")) {
        const txStore = db.createObjectStore("transactions", {
          keyPath: "localId",
          autoIncrement: true,
        });
        txStore.createIndex("synced", "synced");
        txStore.createIndex("storeId", "storeId");
        txStore.createIndex("created_at", "created_at");
        txStore.createIndex("invoiceId", "invoiceId");
      }

      // Invoices store
      if (!db.objectStoreNames.contains("invoices")) {
        const invoiceStore = db.createObjectStore("invoices", {
          keyPath: "invoiceId",
        });
        invoiceStore.createIndex("synced", "synced");
        invoiceStore.createIndex("storeId", "storeId");
        invoiceStore.createIndex("created_at", "created_at");
      }

      // Store info
      if (!db.objectStoreNames.contains("storeInfo")) {
        db.createObjectStore("storeInfo", { keyPath: "key" });
      }

      // User profile
      if (!db.objectStoreNames.contains("userProfile")) {
        db.createObjectStore("userProfile", { keyPath: "key" });
      }
    },
  });
}

export async function getDB() {
  if (!dbPromise) {
    dbPromise = initDB();
  }
  return dbPromise;
}