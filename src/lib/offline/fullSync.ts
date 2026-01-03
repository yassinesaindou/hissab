// lib/offline/fullSync.ts
import { syncTransactionsToServer } from './syncTransactions';
import { syncDataFromServer } from './sync';

export async function performFullSync() {
  if (!navigator.onLine) {
    console.log('Offline — skipping sync');
    return { success: false, message: 'Hors ligne' };
  }

  console.log('Starting full sync...');

  // 1. First: Upload all pending transactions
  const uploadResult = await syncTransactionsToServer();
  console.log(`Upload complete: ${uploadResult.synced} transactions synced`);

  // 2. Then: Download fresh data (products, profile, store)
  const downloadResult = await syncDataFromServer();
  console.log('Download complete:', downloadResult.message);

  return {
    success: uploadResult.success && downloadResult.success,
    uploaded: 'synced' in uploadResult ? uploadResult.synced : 0,
    message: 'Synchronisation complète terminée',
  };
}