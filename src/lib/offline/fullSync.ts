/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/offline/fullSync.ts - UPDATED WITH CLEANUP

 
import { syncDataFromServer } from "./sync";
import { getDB } from "@/lib/indexeddb";
import { syncInvoicesToServer } from "./syncInvoiceToServer";
import { syncTransactionsToServer } from "./syncTransactions";

/**
 * Clean up successfully synced data from IndexedDB
 * Called after successful sync to free up storage
 */
async function cleanupSyncedData() {
  const db = await getDB();

  try {
    // Delete synced transactions
    const syncedTransactions = await db.getAllFromIndex(
      "transactions",
      "synced",
      IDBKeyRange.only(1)
    );

    const txStore = db.transaction("transactions", "readwrite").store;
    for (const tx of syncedTransactions) {
      await txStore.delete(tx.localId);
    }
    console.log(`✓ Deleted ${syncedTransactions.length} synced transactions`);

    // Delete synced invoices
    const syncedInvoices = await db.getAllFromIndex(
      "invoices",
      "synced",
      IDBKeyRange.only(1)
    );

    const invoiceStore = db.transaction("invoices", "readwrite").store;
    for (const invoice of syncedInvoices) {
      await invoiceStore.delete(invoice.invoiceId);
    }
    console.log(`✓ Deleted ${syncedInvoices.length} synced invoices`);

    return {
      transactionsDeleted: syncedTransactions.length,
      invoicesDeleted: syncedInvoices.length,
    };
  } catch (error) {
    console.error("Cleanup error:", error);
    return {
      transactionsDeleted: 0,
      invoicesDeleted: 0,
    };
  }
}

/**
 * Get storage usage info
 * Useful for debugging and monitoring
 */
export async function getStorageInfo() {
  const db = await getDB();

  const allTransactions = await db.getAll("transactions");
  const allInvoices = await db.getAll("invoices");
  const allProducts = await db.getAll("products");

  const pendingTransactions = allTransactions.filter((t) => t.synced === 0);
  const syncedTransactions = allTransactions.filter((t) => t.synced === 1);
  const pendingInvoices = allInvoices.filter((i) => i.synced === 0);
  const syncedInvoices = allInvoices.filter((i) => i.synced === 1);

  return {
    transactions: {
      total: allTransactions.length,
      pending: pendingTransactions.length,
      synced: syncedTransactions.length,
    },
    invoices: {
      total: allInvoices.length,
      pending: pendingInvoices.length,
      synced: syncedInvoices.length,
    },
    products: {
      total: allProducts.length,
    },
  };
}

/**
 * Perform a complete synchronization with automatic cleanup:
 * 1. Upload all pending invoices
 * 2. Upload all pending transactions
 * 3. Download fresh data from server
 * 4. DELETE successfully synced data to free storage
 */
export async function performFullSync() {
  if (!navigator.onLine) {
    console.log("Offline — skipping sync");
    return { success: false, message: "Hors ligne" };
  }

  console.log("Starting full sync...");

  try {
    // 1. First: Upload all pending invoices (these create transactions on server)
    const invoiceResult = await syncInvoicesToServer();
    console.log(
      `Invoice sync complete: ${invoiceResult.synced} invoices synced`
    );

    // 2. Second: Upload any remaining individual transactions
    const uploadResult = await syncTransactionsToServer();
    console.log(
      `Transaction sync complete: ${uploadResult.synced} transactions synced`
    );

    // 3. Finally: Download fresh data (products, profile, store)
    const downloadResult = await syncDataFromServer();
    console.log("Download complete:", downloadResult.message);

    // 4. NEW: Clean up successfully synced data to free storage
    if (invoiceResult.success && uploadResult.success) {
      console.log("Cleaning up synced data...");
      const cleanup = await cleanupSyncedData();
      console.log(
        `✓ Cleanup complete: ${cleanup.transactionsDeleted} transactions, ${cleanup.invoicesDeleted} invoices deleted`
      );
    }

    const success =
      invoiceResult.success &&
      uploadResult.success &&
      downloadResult.success;

    return {
      success,
      invoicesSynced: invoiceResult.synced || 0,
      transactionsSynced: uploadResult.synced || 0,
      transactionsDeleted: success ? (await cleanupSyncedData()).transactionsDeleted : 0,
      invoicesDeleted: success ? (await cleanupSyncedData()).invoicesDeleted : 0,
      message: "Synchronisation complète terminée",
    };
  } catch (error) {
    console.error("Full sync error:", error);
    return {
      success: false,
      message: "Erreur lors de la synchronisation",
      invoicesSynced: 0,
      transactionsSynced: 0,
      transactionsDeleted: 0,
      invoicesDeleted: 0,
    };
  }
}

/**
 * Manual cleanup function - can be called anytime
 * Deletes all synced data from IndexedDB
 */
export async function manualCleanup() {
  console.log("Starting manual cleanup...");
  const cleanup = await cleanupSyncedData();
  console.log("Manual cleanup complete:", cleanup);
  return cleanup;
}

/**
 * Get storage stats for UI display
 */
export async function getStorageStats() {
  const info = await getStorageInfo();

  const usedItems =
    info.transactions.total +
    info.invoices.total +
    info.products.total;

  const pendingItems =
    info.transactions.pending +
    info.invoices.pending;

  const syncedItems =
    info.transactions.synced +
    info.invoices.synced;

  return {
    totalItems: usedItems,
    pendingItems,
    syncedItems,
    canCleanup: syncedItems > 0,
    info,
  };
}