/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
 
// lib/offline/syncInvoicesToServer.ts
import { createSupabaseClient } from "@/lib/supabase/client";
import { getDB } from "@/lib/indexeddb";
import type { LocalInvoice } from "@/lib/indexeddb";

/**
 * Sync all pending invoices from IndexedDB to Supabase
 *
 * For each pending invoice:
 * 1. Check subscription (in case it expired offline)
 * 2. For each product in invoice, check & deduct stock
 * 3. Create ONE transaction for the entire invoice
 * 4. Mark invoice as synced
 */
export async function syncInvoicesToServer() {
  const supabase = createSupabaseClient();
  const db = await getDB();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn("No authenticated user during invoice sync");
    return { success: false, message: "Non authentifié" };
  }

  // Get user's store
  const { data: profile } = await supabase
    .from("profiles")
    .select("storeId")
    .eq("userId", user.id)
    .single();

  if (!profile?.storeId) {
    return { success: false, message: "Magasin non trouvé" };
  }

  const storeId = profile.storeId;

  // Get all pending invoices
  const pendingInvoices = await db.getAllFromIndex(
    "invoices",
    "synced",
    IDBKeyRange.only(0)
  );

  if (pendingInvoices.length === 0) {
    console.log("Aucune facture en attente de synchronisation");
    return { success: true, synced: 0 };
  }

  console.log(
    `Tentative de synchronisation de ${pendingInvoices.length} facture(s) en attente`
  );

  let syncedCount = 0;
  let failedCount = 0;

  for (const invoice of pendingInvoices) {
    try {
      // Check subscription (might have expired while offline)
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("endAt")
        .eq("storeId", storeId)
        .single();

      if (!subscription) {
        console.warn(
          `Abonnement introuvable pour la facture ${invoice.invoiceId}`
        );
        failedCount++;
        continue;
      }

      const endAt = new Date(subscription.endAt);
      if (endAt < new Date()) {
        console.warn(
          `Abonnement expiré lors de la synchro de la facture ${invoice.invoiceId}`
        );
        failedCount++;
        continue;
      }

      // For each product in the invoice, check & deduct stock
      for (const product of invoice.products) {
        if (!product.productId) {
          // Unregistered product — no stock to deduct
          continue;
        }

        const { data: current, error: fetchErr } = await supabase
          .from("products")
          .select("stock, name")
          .eq("productId", product.productId)
          .eq("storeId", storeId)
          .single();

        if (fetchErr || !current) {
          console.warn(
            `Produit ${product.name} introuvable lors de la synchro de la facture ${invoice.invoiceId}`,
            fetchErr
          );
          failedCount++;
          continue;
        }

        const currentStock = current.stock ?? 0;
        if (currentStock < product.quantity) {
          console.warn(
            `Stock insuffisant lors de la synchro de la facture ${invoice.invoiceId}: ${current.name} — requis: ${product.quantity}, disponible: ${currentStock}`
          );
          failedCount++;
          continue;
        }

        // Deduct stock
        const newStock = currentStock - product.quantity;
        const { error: updateErr } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("productId", product.productId);

        if (updateErr) {
          console.error(
            `Échec de la mise à jour du stock (facture ${invoice.invoiceId})`,
            updateErr
          );
          failedCount++;
          continue;
        }

        console.log(
          `Stock mis à jour pour ${current.name} → -${product.quantity} (nouveau: ${newStock})`
        );
      }

      // Create ONE transaction for the entire invoice
      const description = invoice.products
        .map((p :any) => `${p.name} (x${p.quantity})`)
        .join(", ");

      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          storeId,
          userId: user.id,
          productName: "Facture - Plusieurs articles",
          unitPrice: null,
          totalPrice: invoice.totalPrice,
          quantity: invoice.totalQuantity,
          type: "sale",
          description,
          created_at: invoice.created_at,
        });

      if (txError) {
        console.error(
          `Échec création transaction (facture ${invoice.invoiceId})`,
          txError
        );
        failedCount++;
        continue;
      }

      // Mark invoice as synced
      const invoiceStore = db.transaction("invoices", "readwrite").store;
      await invoiceStore.put({
        ...invoice,
        synced: 1,
      });

      syncedCount++;
      console.log(`Facture ${invoice.invoiceId} synchronisée avec succès`);
    } catch (err) {
      console.error(
        `Échec de la synchronisation de la facture ${invoice.invoiceId}`,
        err
      );
      failedCount++;
    }
  }

  const summary = `Synchronisé: ${syncedCount} | Échoué: ${failedCount} sur ${pendingInvoices.length} en attente`;
  console.log(summary);

  return {
    success: syncedCount > 0 || failedCount === 0,
    synced: syncedCount,
    failed: failedCount,
    totalPending: pendingInvoices.length,
    message: summary,
  };
}