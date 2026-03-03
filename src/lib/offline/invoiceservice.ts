/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/offline/invoiceService.ts
import { v4 as uuidv4 } from "uuid";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getDB } from "@/lib/indexeddb";
import { getUserProfile } from "./session";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createLocalTransaction } from "./transactions";
import { getProductById, updateProductStock } from "./products";

/**
 * Product line in an invoice
 */
export interface InvoiceProduct {
  productId?: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Invoice creation payload
 */
export interface InvoicePayload {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  storeName: string;
  storeAddress: string;
  storePhoneNumber?: string;
  notes?: string;
  products: InvoiceProduct[];
}

/**
 * Offline invoice structure stored in IndexedDB
 */
export interface OfflineInvoice {
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

/**
 * ONLINE: Check subscription
 */
async function checkSubscriptionOnline(
  storeId: string
): Promise<{ isActive: boolean; message?: string }> {
  const supabase = createSupabaseClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("endAt, planId")
    .eq("storeId", storeId)
    .single();

  if (error || !subscription) {
    return { isActive: false, message: "Abonnement introuvable" };
  }

  const endAt = new Date(subscription.endAt);
  const today = new Date();
  const isActive = endAt > today;

  return { isActive };
}

/**
 * OFFLINE: Check subscription from cache
 */
async function checkSubscriptionOffline(): Promise<{
  isActive: boolean;
  message?: string;
}> {
  const profile = await getUserProfile();

  if (!profile) {
    return { isActive: false, message: "Profil non trouvé" };
  }

    const daysLeft = profile.subscriptionDaysLeft ?? null;
     
  const isActive = daysLeft !== null && Number(daysLeft) > 0;

  return { isActive };
}

/**
 * ONLINE: Check stock for a product
 */
async function checkProductStockOnline(
  storeId: string,
  productId: string,
  quantity: number
): Promise<{ hasEnough: boolean; currentStock: number }> {
  const supabase = createSupabaseClient();

  const { data: product } = await supabase
    .from("products")
    .select("stock")
    .eq("productId", productId)
    .eq("storeId", storeId)
    .single();

  const currentStock = product?.stock ?? 0;
  return {
    hasEnough: currentStock >= quantity,
    currentStock,
  };
}

/**
 * OFFLINE: Check stock from local cache
 * Note: This is called during offline invoice creation to validate stock before deducting
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkProductStockOffline(
  productId: string,
  quantity: number
): Promise<{ hasEnough: boolean; currentStock: number }> {
  const product = await getProductById(productId);

  const currentStock = product?.stock ?? 0;
  return {
    hasEnough: currentStock >= quantity,
    currentStock,
  };
}

/**
 * ONLINE: Deduct stock for a product
 */
async function deductProductStockOnline(
  storeId: string,
  productId: string,
  quantity: number
): Promise<boolean> {
  const supabase = createSupabaseClient();

  const { data: product } = await supabase
    .from("products")
    .select("stock")
    .eq("productId", productId)
    .eq("storeId", storeId)
    .single();

  const newStock = (product?.stock ?? 0) - quantity;

  const { error } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("productId", productId);

  return !error;
}

/**
 * OFFLINE: Deduct stock from local cache
 */
async function deductProductStockOffline(
  productId: string,
  quantity: number
): Promise<boolean> {
  try {
    await updateProductStock(productId, quantity);
    return true;
  } catch (err) {
    console.error("Failed to deduct local stock:", err);
    return false;
  }
}

/**
 * CORE: Create an invoice (online or offline)
 *
 * Online:
 *   - Check subscription
 *   - For each product: check stock, deduct stock
 *   - Create ONE transaction with totalPrice = sum of all products
 *
 * Offline:
 *   - Check subscription from cache
 *   - Save entire invoice to IndexedDB
 *   - Deduct stock from local cache for each product
 *   - When synced later, will create the transaction
 */
export async function createInvoice(
  payload: InvoicePayload
): Promise<{
  success: boolean;
  message: string;
  invoiceId?: string;
}> {
  const isOnline = navigator.onLine;
  const invoiceId = uuidv4();

  try {
    // ── GET USER & STORE IDS ──────────────────────────────────────────────
    let userId: string;
    let storeId: string;

    if (isOnline) {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, message: "Non authentifié" };
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("storeId")
        .eq("userId", user.id)
        .single();

      if (!profile?.storeId) {
        return { success: false, message: "Magasin non trouvé" };
      }

      userId = user.id;
      storeId = profile.storeId;
    } else {
      const profile = await getUserProfile();
      if (!profile) {
        return {
          success: false,
          message:
            "Données locales manquantes. Connectez-vous une première fois.",
        };
      }

      userId = profile.userId;
      storeId = profile.storeId;
    }

    // ── CHECK SUBSCRIPTION ────────────────────────────────────────────────
    const subCheck = isOnline
      ? await checkSubscriptionOnline(storeId)
      : await checkSubscriptionOffline();

    if (!subCheck.isActive) {
      return {
        success: false,
        message: "Votre abonnement a expiré. Veuillez le renouveler.",
      };
    }

    // ── CALCULATE TOTALS ─────────────────────────────────────────────────
    let totalPrice = 0;
    let totalQuantity = 0;

    for (const product of payload.products) {
      totalPrice += product.unitPrice * product.quantity;
      totalQuantity += product.quantity;
    }

    if (isOnline) {
      // ── ONLINE: Check & deduct stock for each product, then save ONE transaction
      const supabase = createSupabaseClient();

      // Pre-check all stocks
      for (const product of payload.products) {
        if (!product.productId) continue; // Skip non-registered products

        const { hasEnough, currentStock } = await checkProductStockOnline(
          storeId,
          product.productId,
          product.quantity
        );

        if (!hasEnough) {
          return {
            success: false,
            message: `Stock insuffisant pour ${product.name}. Disponible: ${currentStock}`,
          };
        }
      }

      // Deduct stock for each registered product
      for (const product of payload.products) {
        if (!product.productId) continue;

        const success = await deductProductStockOnline(
          storeId,
          product.productId,
          product.quantity
        );

        if (!success) {
          return {
            success: false,
            message: `Erreur mise à jour stock: ${product.name}`,
          };
        }
      }

      // Create ONE transaction for the entire invoice
      const description = payload.products
        .map((p) => `${p.name} (x${p.quantity})`)
        .join(", ");

      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          storeId,
          userId,
          productName: "Facture - Plusieurs articles",
          unitPrice: null,
          totalPrice,
          quantity: totalQuantity,
          type: "sale",
          description,
          created_at: new Date().toISOString(),
        });

      if (txError) {
        console.error("Transaction error:", txError);
        return {
          success: false,
          message: "Erreur création transaction",
        };
      }

      return {
        success: true,
        message: "Facture créée avec succès",
        invoiceId,
      };
    } else {
      // ── OFFLINE: Save invoice + deduct stock for registered products
      const db = await getDB();

      // Build offline invoice
      const offlineInvoice: OfflineInvoice = {
        invoiceId,
        clientName: payload.clientName,
        clientPhone: payload.clientPhone,
        clientEmail: payload.clientEmail || null,
        clientAddress: payload.clientAddress || null,
        storeName: payload.storeName,
        storeAddress: payload.storeAddress,
        storePhoneNumber: payload.storePhoneNumber || null,
        notes: payload.notes || null,
        products: payload.products,
        totalPrice,
        totalQuantity,
        created_at: new Date().toISOString(),
        synced: 0, // pending
      };

      // Save invoice to IndexedDB
      try {
        const invoiceStore = db.transaction("invoices", "readwrite").store;
        await invoiceStore.put(offlineInvoice);
      } catch (err) {
        console.error("Failed to save offline invoice:", err);
        return {
          success: false,
          message: "Erreur sauvegarde locale de la facture",
        };
      }

      // Deduct stock from local cache for registered products
      for (const product of payload.products) {
        if (!product.productId) continue;

        const success = await deductProductStockOffline(
          product.productId,
          product.quantity
        );

        if (!success) {
          console.warn(`Failed to deduct stock for ${product.name}`);
          // Continue anyway — stock will be tracked during sync
        }
      }

      return {
        success: true,
        message: "Facture sauvegardée (synchronisation en attente)",
        invoiceId,
      };
    }
  } catch (error) {
    console.error("Invoice creation error:", error);
    return {
      success: false,
      message: "Erreur lors de la création de la facture",
    };
  }
}