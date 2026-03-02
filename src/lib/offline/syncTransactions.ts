// lib/offline/syncTransactionsToServer.ts
import { createSupabaseClient } from '@/lib/supabase/client';
import { getDB } from '@/lib/indexeddb';
import { markTransactionAsSynced } from './transactions';

export async function syncTransactionsToServer() {
  const supabase = createSupabaseClient();
  const db = await getDB();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('No authenticated user during sync');
    return { success: false, message: 'Non authentifié' };
  }

  const pending = await db.getAllFromIndex(
    'transactions',
    'synced',
    IDBKeyRange.only(0)
  );

  if (pending.length === 0) {
    console.log('Aucune transaction en attente de synchronisation');
    return { success: true, synced: 0 };
  }

  console.log(`Tentative de synchronisation de ${pending.length} transaction(s) en attente`);

  let syncedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const tx of pending) {
    try {
      // ── STOCK CHECK & UPDATE (only for sale/credit with product) ─────────────
      if (tx.productId && (tx.type === 'sale' || tx.type === 'credit')) {
        const { data: product, error: fetchErr } = await supabase
          .from('products')
          .select('stock, name')
          .eq('productId', tx.productId)
          .single();

        if (fetchErr || !product) {
          console.warn(`Impossible de récupérer le stock pour la transaction ${tx.localId}`, fetchErr);
          skippedCount++;
          continue;
        }

        if (product.stock < tx.quantity) {
          console.warn(
            `Stock insuffisant lors de la synchro (transaction ${tx.localId}): ${product.name} — requis: ${tx.quantity}, disponible: ${product.stock}`
          );
          skippedCount++;
          continue;
        }

        const newStock = product.stock - tx.quantity;

        const { error: updateErr } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('productId', tx.productId);

        if (updateErr) {
          console.error(`Échec de la mise à jour du stock (transaction ${tx.localId})`, updateErr);
          failedCount++;
          continue;
        }

        console.log(`Stock mis à jour pour ${product.name} → -${tx.quantity} (nouveau: ${newStock})`);
      }

      // ── Insert the transaction into Supabase ─────────────────────────────────
      const { data, error: insertErr } = await supabase
        .from('transactions')
        .insert({
          userId: tx.userId,
          storeId: tx.storeId,
          
          productName: tx.productName || null,
          unitPrice: tx.unitPrice,
          totalPrice: tx.totalPrice,
          quantity: tx.quantity,
          type: tx.type,
          description: tx.description || null,
          created_at: tx.created_at,
        })
        .select('transactionId')
        .single();

      if (insertErr) throw insertErr;

      // Mark as synced locally
      await markTransactionAsSynced(tx.localId!, data.transactionId);
      syncedCount++;

      console.log(`Transaction ${tx.localId} synchronisée avec succès (ID serveur: ${data.transactionId})`);
    } catch (err) {
      console.error(`Échec de la synchronisation de la transaction ${tx.localId}`, err);
      failedCount++;
      // We continue with the next transaction — do not stop the whole sync
    }
  }

  const summary = `Synchronisé: ${syncedCount} | Ignoré: ${skippedCount} | Échoué: ${failedCount} sur ${pending.length} en attente`;
  console.log(summary);

  return {
    success: syncedCount > 0 || failedCount === 0,
    synced: syncedCount,
    skipped: skippedCount,
    failed: failedCount,
    totalPending: pending.length,
    message: summary,
  };
}