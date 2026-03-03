// lib/offline/transactions.ts
import { getDB, LocalTransaction } from "@/lib/indexeddb";

/**
 * Create a local transaction in IndexedDB
 * Returns the localId assigned by the database
 */
export async function createLocalTransaction(
  transaction: Omit<LocalTransaction, "localId">
): Promise<number> {
  const db = await getDB();
  const localId = await db.add("transactions", transaction);
  return localId as number;
}

/**
 * Mark a transaction as synced (update synced flag to 1)
 */
export async function markTransactionAsSynced(
  localId: number,
  transactionId: string
): Promise<void> {
  const db = await getDB();
  const tx = await db.get("transactions", localId);

  if (!tx) {
    throw new Error(`Transaction with localId ${localId} not found`);
  }

  await db.put("transactions", {
    ...tx,
    transactionId,
    synced: 1,
  });
}

/**
 * Get all transactions for a store (optionally limit)
 */
export async function getRecentTransactions(
  storeId: string,
  limit: number = 50
): Promise<LocalTransaction[]> {
  const db = await getDB();
  const allTx = await db.getAllFromIndex(
    "transactions",
    "storeId",
    storeId
  );

  // Sort by created_at descending
  allTx.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return allTx.slice(0, limit);
}

/**
 * Get pending transactions (synced = 0)
 */
export async function getPendingTransactions(): Promise<LocalTransaction[]> {
  const db = await getDB();
  const pending = await db.getAllFromIndex(
    "transactions",
    "synced",
    IDBKeyRange.only(0)
  );
  return pending;
}

/**
 * Clear all transactions (useful on logout)
 */
export async function clearTransactions(): Promise<void> {
  const db = await getDB();
  await db.clear("transactions");
}