/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/offline/sync.ts
import { createSupabaseClient } from "@/lib/supabase/client";
import { getDB } from "@/lib/indexeddb";

export async function syncDataFromServer() {
  const supabase = createSupabaseClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Not authenticated:", userError);
      return { success: false, message: "Non authentifié" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("userId, name, email, role, storeId")
      .eq("userId", user.id)
      .single();

    if (profileError || !profile?.storeId) {
      console.error("Profile or storeId not found:", profileError);
      return { success: false, message: "Profil ou magasin non trouvé" };
    }

    // Employee active status (for employees only)
    let isActive = true;
    if (profile.role === "employee") {
      const { data: emp, error: empError } = await supabase
        .from("employees")
        .select("isActive")
        .eq("employeeId", user.id)
        .single();

      if (empError) {
        console.warn("Failed to fetch employee status:", empError);
      } else {
        isActive = emp?.isActive ?? true;
      }
    }

    // Store info
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("storeId, storeName, storeAddress, storePhoneNumber")
      .eq("storeId", profile.storeId)
      .single();

    if (storeError || !store) {
      console.error("Store not found:", storeError);
      return { success: false, message: "Magasin non trouvé" };
    }

    // Products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        "productId, name, unitPrice, stock, storeId, userId, description, category, created_at"
      )
      .eq("storeId", profile.storeId);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return { success: false, message: "Erreur lors du chargement des produits" };
    }

    // Subscription info (days left + plan name)
    let subscriptionDaysLeft: number | null = null;
    let planName: string | null = null;

    const { data: subscriptionData, error: subError } = await supabase
      .from("subscriptions")
      .select("endAt, planId, plans(name)")
      .eq("storeId", profile.storeId)
      .single();

    if (subError) {
      console.warn("Failed to fetch subscription:", subError);
    } else if (subscriptionData?.endAt) {
      const endAt = new Date(subscriptionData.endAt);
      const today = new Date();
      const diffTime = endAt.getTime() - today.getTime();
      subscriptionDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Safely get plan name
     const plans = subscriptionData.plans as unknown as any;
planName = Array.isArray(plans) ? plans[0]?.name ?? null : plans?.name ?? null;
    }

    // Save everything to IndexedDB
    const db = await getDB();
    const tx = db.transaction(
      ["products", "userProfile", "storeInfo"],
      "readwrite"
    );

    // Save user profile (including new fields)
    const userProfileStore = tx.objectStore("userProfile");
    await userProfileStore.put({
      key: "current",
      userId: profile.userId,
      name: profile.name || null,
      email: profile.email,
      role: profile.role,
      storeId: profile.storeId,
      isActive,
      subscriptionDaysLeft,
      planName,
    });

    // Save store info
    const storeInfoStore = tx.objectStore("storeInfo");
    await storeInfoStore.put({
      key: "current",
      storeId: store.storeId,
      storeName: store.storeName,
      storeAddress: store.storeAddress || null,
      storePhoneNumber: store.storePhoneNumber || null,
    });

    // Save products
    const productStore = tx.objectStore("products");
    await productStore.clear();
    for (const product of products || []) {
      await productStore.put(product);
    }

    await tx.done;

    console.log("✅ Sync completed successfully");
    return { success: true, message: "Synchronisation réussie" };
  } catch (error) {
    console.error("Unexpected error during sync:", error);
    return { success: false, message: "Échec de la synchronisation" };
  }
}