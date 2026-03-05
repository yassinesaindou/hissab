/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/offline/transactionService.ts - FIXED VERSION

import { createSupabaseClient } from "@/lib/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getDB } from "@/lib/indexeddb";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createLocalTransaction } from "./transactions";
import { getUserProfile } from "./session";
import { getProductById, updateProductStock } from "./products";

/**
 * Unified transaction structure used internally
 * This is the source of truth for transaction data
 */
export interface TransactionPayload {
  productId?: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  type: "sale" | "expense" | "credit";
  description?: string | null;
}

/**
 * Enhanced transaction with metadata for offline tracking
 */
export interface OfflineTransaction {
  userId: string;
  storeId: string;
  productId?: string | null;
  productName: string;
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  type: "sale" | "expense" | "credit";
  description?: string | null;
  created_at: string;
  synced: 0 | 1;
  invoiceId?: string; // groups products from same invoice
}

/**
 * Result from subscription validation
 */
interface SubscriptionCheck {
  isActive: boolean;
  daysLeft: number | null;
  planName: string | null;
  dailyLimit?: number;
  todayCount?: number;
}

/**
 * Result from stock check
 */
interface StockCheck {
  hasEnough: boolean;
  currentStock: number;
  needed: number;
  productName: string;
}

/**
 * ONLINE MODE: Check if subscription is valid for this store
 */
async function checkSubscriptionOnline(
  storeId: string
): Promise<SubscriptionCheck> {
  const supabase = createSupabaseClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("endAt, planId, plans(name)")
    .eq("storeId", storeId)
    .single();

  if (error || !subscription) {
    return { isActive: false, daysLeft: null, planName: null };
  }

  const endAt = new Date(subscription.endAt);
  const today = new Date();
  const diffTime = endAt.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const plans = subscription.plans as unknown as any;
  const planName = Array.isArray(plans)
    ? plans[0]?.name ?? null
    : plans?.name ?? null;

  const isActive = daysLeft > 0;

  // Get daily transaction limit
  const { data: plan } = await supabase
    .from("plans")
    .select("transactionsPerDay")
    .eq("planId", subscription.planId)
    .single();

  const dailyLimit = plan?.transactionsPerDay ?? 0;

  // Count today's transactions
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  ).toISOString();

  const { count } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("storeId", storeId)
    .gte("created_at", startOfDay)
    .lt("created_at", endOfDay);

  return {
    isActive,
    daysLeft,
    planName,
    dailyLimit,
    todayCount: count ?? 0,
  };
}

/**
 * OFFLINE MODE: Check subscription from local cache
 */
async function checkSubscriptionOffline(): Promise<SubscriptionCheck> {
  const profile = await getUserProfile();

  if (!profile) {
    return { isActive: false, daysLeft: null, planName: null };
  }

  const daysLeft = profile.subscriptionDaysLeft ?? null;
  const isActive = daysLeft !== null && daysLeft > 0;

  return {
    isActive,
    daysLeft,
    planName: profile.planName ?? null,
  };
}

/**
 * ONLINE MODE: Check if product has enough stock
 */
async function checkStockOnline(
  storeId: string,
  productId: string,
  quantity: number
): Promise<StockCheck> {
  const supabase = createSupabaseClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("stock, name")
    .eq("productId", productId)
    .eq("storeId", storeId)
    .single();

  if (error || !product) {
    return {
      hasEnough: false,
      currentStock: 0,
      needed: quantity,
      productName: "Produit introuvable",
    };
  }

  const currentStock = product.stock ?? 0;
  const hasEnough = currentStock >= quantity;

  return {
    hasEnough,
    currentStock,
    needed: quantity,
    productName: product.name || "Produit",
  };
}

/**
 * OFFLINE MODE: Check product stock from local cache
 */
async function checkStockOffline(
  productId: string,
  quantity: number
): Promise<StockCheck> {
  const product = await getProductById(productId);

  if (!product) {
    return {
      hasEnough: false,
      currentStock: 0,
      needed: quantity,
      productName: "Produit introuvable",
    };
  }

  const currentStock = product.stock ?? 0;
  const hasEnough = currentStock >= quantity;

  return {
    hasEnough,
    currentStock,
    needed: quantity,
    productName: product.name || "Produit",
  };
}

/**
 * ONLINE MODE: Deduct stock from server
 */
async function deductStockOnline(
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
 * OFFLINE MODE: Deduct stock from local cache
 * FIXED: Uses the correct updateProductStock signature
 */
async function deductStockOffline(
  productId: string,
  quantity: number
): Promise<boolean> {
  try {
    // Get current product
    const product = await getProductById(productId);
    
    if (!product) {
      console.error(`Product ${productId} not found`);
      return false;
    }

    // Calculate new stock
    const currentStock = product.stock ?? 0;
    const newStock = Math.max(0, currentStock - quantity);

    // Update with the new stock value
    // Your updateProductStock expects (productId, newStock) - the final value
    await updateProductStock(productId, newStock);
    
    console.log(
      `✓ Stock deducted for ${product.name}: ${currentStock} → ${newStock}`
    );
    return true;
  } catch (err) {
    console.error("Failed to deduct local stock:", err);
    return false;
  }
}

/**
 * CORE: Create a single transaction (online or offline)
 *
 * This is the main entry point for transaction creation.
 * Handles subscription check, stock check/update, and saves to appropriate store.
 */
export async function createTransaction(
  payload: TransactionPayload
): Promise<{
  success: boolean;
  message: string;
  transaction?: any;
}> {
  const isOnline = navigator.onLine;

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

    // Check daily limit (online only)
    if (
      isOnline &&
      subCheck.dailyLimit &&
      subCheck.todayCount &&
      subCheck.todayCount >= subCheck.dailyLimit
    ) {
      return {
        success: false,
        message: `Limite quotidienne atteinte : ${subCheck.dailyLimit} transactions/jour.`,
      };
    }

    // ── HANDLE STOCK (if product is specified and type is sale/credit) ────
    const finalUnitPrice = payload.unitPrice;

    if (
      payload.productId &&
      (payload.type === "sale" || payload.type === "credit")
    ) {
      // Check stock
      const stockCheck = isOnline
        ? await checkStockOnline(storeId, payload.productId, payload.quantity)
        : await checkStockOffline(payload.productId, payload.quantity);

      if (!stockCheck.hasEnough) {
        return {
          success: false,
          message: `Stock insuffisant pour ${stockCheck.productName}. Disponible: ${stockCheck.currentStock}`,
        };
      }

      // Deduct stock
      const deductSuccess = isOnline
        ? await deductStockOnline(storeId, payload.productId, payload.quantity)
        : await deductStockOffline(payload.productId, payload.quantity);

      if (!deductSuccess) {
        return {
          success: false,
          message: "Erreur lors de la mise à jour du stock",
        };
      }
    }

    // ── CREATE TRANSACTION ────────────────────────────────────────────────
    const txPayload = {
      userId,
      storeId,
      productId: payload.productId || null,
      productName: payload.productName,
      unitPrice: finalUnitPrice,
      totalPrice: finalUnitPrice * payload.quantity,
      quantity: payload.quantity,
      type: payload.type,
      description: payload.description || null,
      created_at: new Date().toISOString(),
    };

    if (isOnline) {
      // Online: Save to Supabase
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("transactions")
        .insert(txPayload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: "Transaction créée avec succès",
        transaction: data,
      };
    } else {
      // Offline: Save to IndexedDB
      const localTx: OfflineTransaction = {
        ...txPayload,
        synced: 0,
      };

      const localId = await createLocalTransaction(localTx);

      return {
        success: true,
        message: "Transaction sauvegardée (synchronisation en attente)",
        transaction: { ...localTx, localId },
      };
    }
  } catch (error) {
    console.error("Transaction creation error:", error);
    return {
      success: false,
      message: "Erreur lors de la création de la transaction",
    };
  }
}