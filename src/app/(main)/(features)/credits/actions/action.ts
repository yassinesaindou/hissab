// app/actions/credits.ts
"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isUserSubscriptionActive } from "@/lib/utils/utils";

// ─── Line item schema ──────────────────────────────────────────────────────────
// productId is optional: present → catalogue product (stock gets adjusted),
// absent → custom/free-text item (no stock effect, just recorded for the record).

const creditItemSchema = z.object({
  productId: z
    .string()
    .uuid({ message: "Identifiant produit incorrect." })
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  productName: z.string().min(1, "Le nom de l'article est requis."),
  unitPrice: z.coerce.number().min(0, "Le prix doit être positif ou nul."),
  quantity: z.coerce.number().int().min(1, "La quantité doit être au moins 1."),
});

export type CreditItemInput = z.infer<typeof creditItemSchema>;

const creditFormSchema = z.object({
  customerName: z
    .string()
    .min(2, { message: "Le nom du client doit avoir au moins 2 caractères." })
    .max(100, { message: "Le nom du client doit avoir au plus 100 caractères." }),
  customerPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: "Le numéro de téléphone est incorrect." })
    .min(5, { message: "Le numéro de téléphone doit avoir au moins 5 chiffres." })
    .max(15, { message: "Le numéro de téléphone doit avoir au plus 15 chiffres." }),
  status: z.enum(["pending", "paid"]).optional().default("pending"),
  description: z
    .string()
    .max(500, { message: "La description doit avoir au plus 500 caractères." })
    .optional(),
  items: z.array(creditItemSchema).min(1, "Au moins un article est requis."),
});

const updateCreditFormSchema = creditFormSchema.extend({
  creditId: z.string().uuid({ message: "Identifiant du crédit incorrect." }),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUserStore(userId: string) {
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("storeId, role")
    .eq("userId", userId)
    .single();
  return profile;
}

function computeTotal(items: CreditItemInput[]) {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function addCreditAction(payload: {
  customerName: string;
  customerPhone: string;
  status?: "pending" | "paid";
  description?: string;
  items: CreditItemInput[];
}) {
  try {
    const validatedData = creditFormSchema.parse(payload);
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: "Non autorisé." };
    }

    const profile = await getUserStore(user.id);
    const storeId = profile?.storeId;
    if (!storeId) {
      return { success: false, message: "Aucun magasin n'est associé à votre compte." };
    }

    const isSubscriptionActive = await isUserSubscriptionActive(storeId);
    if (!isSubscriptionActive) {
      return { success: false, message: "Votre souscription a expiré, veuillez la renouveler." };
    }

    // Validate stock for every catalogue item BEFORE writing anything
    const catalogueItems = validatedData.items.filter((i) => i.productId);
    for (const item of catalogueItems) {
      const { data: product, error } = await supabase
        .from("products")
        .select("storeId, stock, name")
        .eq("productId", item.productId)
        .single();

      if (error || !product) {
        return { success: false, message: `Produit introuvable : ${item.productName}` };
      }
      if (product.storeId !== storeId) {
        return { success: false, message: `Accès refusé au produit : ${item.productName}` };
      }
      if (product.stock < item.quantity) {
        return {
          success: false,
          message: `Stock insuffisant pour "${product.name}". Disponible : ${product.stock}, requis : ${item.quantity}.`,
        };
      }
    }

    const totalAmount = computeTotal(validatedData.items);

    // Build a human-readable summary into description (kept for quick display
    // in the existing UI which still shows credit.description / productName)
    const itemsSummary = validatedData.items
      .map((i) => `${i.productName} (x${i.quantity})`)
      .join(", ");
    const finalDescription = validatedData.description
      ? `${validatedData.description} — ${itemsSummary}`
      : itemsSummary;

    // Insert the credit header
    const { data: credit, error: creditError } = await supabase
      .from("credits")
      .insert({
        userId: user.id,
        storeId,
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        amount: totalAmount,
        status: validatedData.status,
        description: finalDescription,
        // productId left null — line items now live in credit_items
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (creditError || !credit) {
      console.error("Error creating credit:", creditError?.message);
      return { success: false, message: "Échec lors de la création du crédit." };
    }

    // Insert line items
    const itemRows = validatedData.items.map((item) => ({
      creditId: credit.creditId,
      productId: item.productId ?? null,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      totalPrice: item.unitPrice * item.quantity,
    }));

    const { error: itemsError } = await supabase.from("credit_items").insert(itemRows);
    if (itemsError) {
      console.error("Error creating credit items:", itemsError.message);
      // Roll back the credit header so we don't leave an empty credit behind
      await supabase.from("credits").delete().eq("creditId", credit.creditId);
      return { success: false, message: "Échec lors de l'enregistrement des articles." };
    }

    // Deduct stock for catalogue items
    for (const item of catalogueItems) {
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("productId", item.productId)
        .single();
      if (product) {
        await supabase
          .from("products")
          .update({ stock: product.stock - item.quantity })
          .eq("productId", item.productId);
      }
    }

    revalidatePath("/credits");
    return { success: true, message: "Crédit créé avec succès.", creditId: credit.creditId };
  } catch (error) {
    console.error("Unexpected error during credit creation:", error);
    if (error instanceof z.ZodError) return { success: false, message: error.errors[0].message };
    return { success: false, message: "Une erreur s'est produite." };
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateCreditAction(payload: {
  creditId: string;
  customerName: string;
  customerPhone: string;
  status: "pending" | "paid";
  description?: string;
  items: CreditItemInput[];
}) {
  try {
    const validatedData = updateCreditFormSchema.parse(payload);
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: "Non autorisé." };
    }

    const profile = await getUserStore(user.id);
    const storeId = profile?.storeId;
    if (!storeId) {
      return { success: false, message: "Aucun magasin n'est associé à votre compte." };
    }

    const isSubscriptionActive = await isUserSubscriptionActive(storeId);
    if (!isSubscriptionActive) {
      return { success: false, message: "Votre souscription a expiré, veuillez la renouveler." };
    }

    const { data: existingCredit, error: fetchError } = await supabase
      .from("credits")
      .select("storeId, status")
      .eq("creditId", validatedData.creditId)
      .single();

    if (fetchError || !existingCredit) {
      return { success: false, message: "Le crédit n'existe pas." };
    }
    if (existingCredit.storeId !== storeId) {
      return { success: false, message: "Vous n'êtes pas autorisé à modifier ce crédit." };
    }

    // ── If the credit is being marked as paid right now, convert it ──────────
    // (transitioning pending -> paid triggers the move into transactions)
    const isBeingMarkedPaid =
      existingCredit.status !== "paid" && validatedData.status === "paid";

    if (isBeingMarkedPaid) {
      return await convertCreditToSale(validatedData.creditId, storeId, user.id);
    }

    // ── Otherwise, a normal field/line-item edit ──────────────────────────────

    // Fetch current items so we can restore/re-deduct stock deltas correctly
    const { data: currentItems } = await supabase
      .from("credit_items")
      .select("productId, quantity")
      .eq("creditId", validatedData.creditId);

    // Restore stock from the old items first
    for (const old of currentItems || []) {
      if (old.productId) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("productId", old.productId)
          .single();
        if (product) {
          await supabase
            .from("products")
            .update({ stock: product.stock + old.quantity })
            .eq("productId", old.productId);
        }
      }
    }

    // Validate stock for the NEW set of items
    const catalogueItems = validatedData.items.filter((i) => i.productId);
    for (const item of catalogueItems) {
      const { data: product, error } = await supabase
        .from("products")
        .select("storeId, stock, name")
        .eq("productId", item.productId)
        .single();

      if (error || !product) {
        return { success: false, message: `Produit introuvable : ${item.productName}` };
      }
      if (product.storeId !== storeId) {
        return { success: false, message: `Accès refusé au produit : ${item.productName}` };
      }
      if (product.stock < item.quantity) {
        return {
          success: false,
          message: `Stock insuffisant pour "${product.name}". Disponible : ${product.stock}, requis : ${item.quantity}.`,
        };
      }
    }

    const totalAmount = computeTotal(validatedData.items);
    const itemsSummary = validatedData.items
      .map((i) => `${i.productName} (x${i.quantity})`)
      .join(", ");
    const finalDescription = validatedData.description
      ? `${validatedData.description} — ${itemsSummary}`
      : itemsSummary;

    const { error: updateError } = await supabase
      .from("credits")
      .update({
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        amount: totalAmount,
        status: validatedData.status,
        description: finalDescription,
      })
      .eq("creditId", validatedData.creditId);

    if (updateError) {
      console.error("Error updating credit:", updateError.message);
      return { success: false, message: "Échec lors de la mise à jour du crédit." };
    }

    // Replace line items wholesale (simplest correct approach)
    await supabase.from("credit_items").delete().eq("creditId", validatedData.creditId);

    const itemRows = validatedData.items.map((item) => ({
      creditId: validatedData.creditId,
      productId: item.productId ?? null,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      totalPrice: item.unitPrice * item.quantity,
    }));
    await supabase.from("credit_items").insert(itemRows);

    // Deduct stock for the new items
    for (const item of catalogueItems) {
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("productId", item.productId)
        .single();
      if (product) {
        await supabase
          .from("products")
          .update({ stock: product.stock - item.quantity })
          .eq("productId", item.productId);
      }
    }

    revalidatePath("/credits");
    return { success: true, message: "Crédit mis à jour avec succès." };
  } catch (error) {
    console.error("Unexpected error during credit update:", error);
    if (error instanceof z.ZodError) return { success: false, message: error.errors[0].message };
    return { success: false, message: "Une erreur s'est produite." };
  }
}

// ─── PAY → CONVERT TO TRANSACTION ─────────────────────────────────────────────
// Moves a credit (with its line items) into the transactions table as a
// single 'sale' transaction, then deletes the credit (and its items, via
// the ON DELETE CASCADE on credit_items).
//
// IMPORTANT: stock was already deducted when the credit was created, so this
// conversion does NOT touch stock again — it only re-records the economic
// event as a sale instead of a credit.

async function convertCreditToSale(creditId: string, storeId: string, userId: string) {
  const supabase = createSupabaseServerClient();

  const { data: credit, error: creditError } = await supabase
    .from("credits")
    .select("*")
    .eq("creditId", creditId)
    .single();

  if (creditError || !credit) {
    return { success: false, message: "Le crédit n'existe pas." };
  }
  if (credit.storeId !== storeId) {
    return { success: false, message: "Vous n'êtes pas autorisé à modifier ce crédit." };
  }

  const { data: items, error: itemsError } = await supabase
    .from("credit_items")
    .select("*")
    .eq("creditId", creditId);

  if (itemsError) {
    console.error("Error fetching credit items:", itemsError.message);
    return { success: false, message: "Échec lors de la récupération des articles du crédit." };
  }

  const lineItems = items && items.length > 0
    ? items
    : [{ productName: credit.description || "Article", unitPrice: credit.amount, quantity: 1, totalPrice: credit.amount }];

  const totalQuantity = lineItems.reduce((s, i) => s + i.quantity, 0);
  const description = lineItems.map((i) => `${i.productName} (x${i.quantity})`).join(", ");

  // Insert as a single consolidated sale transaction
  const { error: txError } = await supabase.from("transactions").insert({
    storeId,
    userId,
    productName: `Crédit réglé — ${credit.customerName}`,
    unitPrice: null,
    totalPrice: credit.amount,
    quantity: totalQuantity,
    type: "sale",
    description: `${description} • Client: ${credit.customerName} (${credit.customerPhone})`,
    created_at: new Date().toISOString(),
  });

  if (txError) {
    console.error("Error creating transaction from credit:", txError.message);
    return { success: false, message: "Échec lors de la conversion du crédit en vente." };
  }

  // Delete the credit — credit_items cascade-delete automatically
  const { error: deleteError } = await supabase
    .from("credits")
    .delete()
    .eq("creditId", creditId);

  if (deleteError) {
    console.error("Error deleting paid credit:", deleteError.message);
    // The sale was recorded, but cleanup failed — surface this clearly
    return {
      success: false,
      message: "La vente a été enregistrée mais le crédit n'a pas pu être supprimé. Contactez le support.",
    };
  }

  revalidatePath("/credits");
  revalidatePath("/transactions");
  return { success: true, message: "Crédit réglé et transféré vers les ventes." };
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteCreditAction(creditId: string) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: "Non autorisé." };
    }

    const profile = await getUserStore(user.id);
    if (!profile?.storeId) {
      return { success: false, message: "Aucun magasin n'est associé à votre compte." };
    }

    const { data: credit, error: fetchError } = await supabase
      .from("credits")
      .select("storeId")
      .eq("creditId", creditId)
      .single();

    if (fetchError || !credit) {
      return { success: false, message: "Le crédit n'existe pas." };
    }
    if (credit.storeId !== profile.storeId) {
      return { success: false, message: "Vous n'êtes pas autorisé à supprimer ce crédit." };
    }

    // Restore stock for every catalogue line item before deleting
    const { data: items } = await supabase
      .from("credit_items")
      .select("productId, quantity")
      .eq("creditId", creditId);

    for (const item of items || []) {
      if (item.productId) {
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("productId", item.productId)
          .single();
        if (product) {
          await supabase
            .from("products")
            .update({ stock: product.stock + item.quantity })
            .eq("productId", item.productId);
        }
      }
    }

    // credit_items cascade-delete automatically via the FK constraint
    const { error } = await supabase.from("credits").delete().eq("creditId", creditId);
    if (error) throw error;

    revalidatePath("/credits");
    return { success: true, message: "Crédit supprimé avec succès." };
  } catch (error) {
    console.error("Error deleting credit:", error);
    return { success: false, message: "Échec de la suppression du crédit." };
  }
}

// ─── FETCH HELPERS (used by the credits page to load items per credit) ───────

export async function getCreditItems(creditId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("credit_items")
    .select("*")
    .eq("creditId", creditId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching credit items:", error.message);
    return [];
  }
  return data || [];
}