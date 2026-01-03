// lib/offline/syncTransactions.ts
import { createSupabaseClient } from '@/lib/supabase/client';
import { getDB } from '@/lib/indexeddb';
import { markTransactionAsSynced } from './transactions';

export async function syncTransactionsToServer() {
  const supabase = createSupabaseClient();
  const db = await getDB();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Non authentifié' };

  // Fixed: Use built-in IDBKeyRange (no import)
  const pending = await db.getAllFromIndex(
    'transactions',
    'synced',
    IDBKeyRange.only(0)
  );

  if (pending.length === 0) {
    return { success: true, synced: 0 };
  }

  let syncedCount = 0;

  for (const tx of pending) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          userId: tx.userId,
          storeId: tx.storeId,
          productId: tx.productId || null,
          productName: tx.productName || null,
          unitPrice: tx.unitPrice,
          totalPrice: tx.totalPrice,
          quantity: tx.quantity,
          type: tx.type,
          description: tx.description || null,
          created_at: tx.created_at,
        })
        .select()
        .single();

      if (error) throw error;

      await markTransactionAsSynced(tx.localId!, data.transactionId);
      syncedCount++;
    } catch (err) {
      console.error('Failed to sync transaction', tx.localId, err);
    }
  }

  console.log(`Synced ${syncedCount} transactions`);
  return { success: true, synced: syncedCount };
}