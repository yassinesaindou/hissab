// lib/indexeddb.ts
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'pos-offline-db';
const DB_VERSION = 3;

export interface LocalProduct {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
  storeId: string;
  userId?: string | null;
  description?: string | null;
  category?: string | null;
  created_at?: string;
}

export interface LocalTransaction {
  localId?: number;
  transactionId?: string | null;
  userId: string;
  storeId: string;
  productId?: string | null;
  productName?: string | null;
  unitPrice?: number | null;
  totalPrice: number;
  quantity: number;
  type: 'sale' | 'expense' | 'credit';
  description?: string | null;
  created_at: string;
  synced: 0|1;
}

export interface UserProfile {
  key: 'current';
  userId: string;
  name?: string | null;
  email: string;
  role: string;
  storeId: string;
  isActive: boolean;
  subscriptionDaysLeft?: number | null;
}

export interface StoreInfo {
  key: 'current';
  storeId: string;
  storeName: string;
  storeAddress?: string | null;
  storePhoneNumber?: string | null;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'productId' });
        productStore.createIndex('storeId', 'storeId');
      }

      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', {
          keyPath: 'localId',
          autoIncrement: true,
        });
        txStore.createIndex('synced', 'synced');
        txStore.createIndex('storeId', 'storeId');
        txStore.createIndex('created_at', 'created_at');
      }

      // Fixed: use fixed key "current"
      if (!db.objectStoreNames.contains('storeInfo')) {
        db.createObjectStore('storeInfo', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile', { keyPath: 'key' });
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