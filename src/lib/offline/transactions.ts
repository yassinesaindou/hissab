// lib/offline/transactions.ts
import { getDB, LocalTransaction } from '@/lib/indexeddb';

export async function createLocalTransaction(
  transaction: Omit<LocalTransaction, 'localId' | 'synced'>
): Promise<number> {
  const db = await getDB();
  const tx = db.transaction(['transactions', 'products'], 'readwrite');
  const txStore = tx.objectStore('transactions');
  const productStore = tx.objectStore('products');

  if (transaction.productId && (transaction.type === 'sale' || transaction.type === 'credit')) {
    const product = await productStore.get(transaction.productId);
    if (product) {
      if (product.stock < transaction.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}. Disponible: ${product.stock}`);
      }
      product.stock -= transaction.quantity;
      await productStore.put(product);
    }
  }

  const localId = await txStore.add({
    ...transaction,
    synced: 0,
  });

  await tx.done;
  return Number(localId);
}

export async function getAllTransactions(storeId: string): Promise<LocalTransaction[]> {
  const db = await getDB();
  return await db.getAllFromIndex('transactions', 'storeId', storeId);
}

export async function getPendingTransactions(storeId: string): Promise<LocalTransaction[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('transactions', 'storeId', storeId);
  return all.filter(tx => !tx.synced);
}

export async function getRecentTransactions(storeId: string, limit = 10): Promise<LocalTransaction[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('transactions', 'storeId', storeId);
  return all
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export async function markTransactionAsSynced(localId: number, serverId: string) {
  const db = await getDB();
  const tx = await db.get('transactions', localId);
  if (tx) {
    tx.synced =1;
    tx.transactionId = serverId;
    await db.put('transactions', tx);
  }
}

export async function clearTransactions() {
  const db = await getDB();
  await db.clear('transactions');
}