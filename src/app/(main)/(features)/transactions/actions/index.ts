// app/transactions/actions/index.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import { isUserSubscriptionActive } from "@/lib/utils/utils";

// ─── Shared schema ────────────────────────────────────────────────────────────

const baseTransactionFormSchema = z.object({
  productId: z
    .string()
    .uuid({ message: "L'identifiant du produit est incorrect." })
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" || v === "none") ? undefined : v),
  productName: z
    .string()
    .max(100, { message: "Le nom du produit ne doit pas dépasser 100 caractères." })
    .optional(),
  unitPrice: z.coerce
    .number()
    .min(0, { message: "Le prix unitaire doit être non-négatif." })
    .max(1000000, { message: "Prix unitaire trop élevé." }),
  quantity: z.coerce
    .number()
    .int({ message: "La quantité doit être un entier." })
    .min(1, { message: "La quantité doit être supérieure à 0." }),
  type: z.enum(["sale", "credit", "expense"], {
    message: "Le type doit être 'sale', 'credit' ou 'expense'.",
  }),
});

const transactionFormSchema = baseTransactionFormSchema.refine(
  (data) =>
    data.type === "expense" ||
    (data.productId && data.productId !== "none") ||
    data.productName,
  {
    message:
      "Un produit doit être sélectionné ou un nom fourni pour les ventes et crédits.",
    path: ["productId"],
  }
);

type TransactionFormData = z.infer<typeof transactionFormSchema>;

// ─── ADD ──────────────────────────────────────────────────────────────────────

export async function addTransactionAction(formData: TransactionFormData) {
  try {
    const validatedData = transactionFormSchema.parse(formData);
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();

    const storeId = profile?.storeId;
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    // Subscription check
    const isSubscriptionActive = await isUserSubscriptionActive(storeId);
    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Votre abonnement a expiré. Veuillez le renouveler.",
      };
    }

    // Daily limit check
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("planId")
      .eq("storeId", storeId)
      .single();

    if (!subscription?.planId) {
      return { success: false, message: "Aucun plan trouvé." };
    }

    const { data: plan } = await supabase
      .from("plans")
      .select("transactionsPerDay")
      .eq("planId", subscription.planId)
      .single();

    const dailyLimit = plan?.transactionsPerDay ?? 0;
    if (dailyLimit <= 0) {
      return {
        success: false,
        message: "Ce plan n'autorise pas de transactions.",
      };
    }

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toISOString();
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    ).toISOString();

    const { count, error: countError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("storeId", storeId)
      .gte("created_at", startOfDay)
      .lt("created_at", endOfDay);

    if (countError) {
      return {
        success: false,
        message: "Erreur lors du comptage des transactions.",
      };
    }

    if ((count ?? 0) >= dailyLimit) {
      return {
        success: false,
        message: `Limite quotidienne atteinte : ${dailyLimit} transactions/jour.`,
      };
    }

    // If a known product is referenced, validate it and adjust stock
    let unitPrice = validatedData.unitPrice;
    let totalPrice = validatedData.unitPrice * validatedData.quantity;

    if (validatedData.productId && validatedData.productId !== "none") {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("unitPrice, stock, name, storeId")
        .eq("productId", validatedData.productId)
        .single();

      if (productError || !product) {
        return { success: false, message: "Produit introuvable." };
      }
      if (product.storeId !== storeId) {
        return { success: false, message: "Accès refusé au produit." };
      }
      if (
        (validatedData.type === "sale" || validatedData.type === "credit") &&
        product.stock < validatedData.quantity
      ) {
        return {
          success: false,
          message: `Stock insuffisant : ${product.stock} disponible(s).`,
        };
      }

      unitPrice = product.unitPrice;
      totalPrice = unitPrice * validatedData.quantity;
      validatedData.productName =
        validatedData.productName || product.name;

      if (
        validatedData.type === "sale" ||
        validatedData.type === "credit"
      ) {
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: product.stock - validatedData.quantity })
          .eq("productId", validatedData.productId);

        if (stockError) {
          return { success: false, message: "Échec de la mise à jour du stock." };
        }
      }
    }

    // Insert — no productId column in transactions table
    const { data: newTransaction, error: insertError } = await supabase
      .from("transactions")
      .insert({
        storeId,
        userId: user.id,
        productName:
          validatedData.productName === "none"
            ? null
            : validatedData.productName,
        unitPrice,
        totalPrice,
        quantity: validatedData.quantity,
        type: validatedData.type,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return { success: false, message: "Échec de la création de la transaction." };
    }

    const { data: userProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("userId", user.id)
      .single();

    revalidatePath("/transactions");

    return {
      success: true,
      message: "Transaction ajoutée avec succès.",
      transaction: {
        ...newTransaction,
        userName:
          userProfile?.name || user.email || "Utilisateur inconnu",
      },
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Erreur inattendue." };
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

const updateTransactionFormSchema = baseTransactionFormSchema
  .extend({
    transactionId: z
      .string()
      .uuid({ message: "L'identifiant de la transaction est incorrect." }),
  })
  .refine(
    (data) =>
      data.type === "expense" ||
      (data.productId && data.productId !== "none") ||
      data.productName,
    {
      message:
        "Un produit doit être sélectionné ou un nom fourni pour les ventes et crédits.",
      path: ["productId"],
    }
  );

type UpdateTransactionFormData = z.infer<typeof updateTransactionFormSchema>;

export async function updateTransactionAction(
  formData: UpdateTransactionFormData
) {
  try {
    const validatedData = updateTransactionFormSchema.parse(formData);
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("storeId, role")
      .eq("userId", user.id)
      .single();

    if (profile?.role === "employee") {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé à modifier une transaction.",
      };
    }

    const storeId = profile?.storeId;
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    const isSubscriptionActive = await isUserSubscriptionActive(storeId);
    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Votre abonnement a expiré. Veuillez le renouveler.",
      };
    }

    // Fetch the existing transaction — only columns that actually exist
    const { data: existingTx, error: fetchError } = await supabase
      .from("transactions")
      .select("quantity, type, storeId")   // ← productId removed (not in schema)
      .eq("transactionId", validatedData.transactionId)
      .single();

    if (fetchError || !existingTx) {
      console.error("Fetch transaction error:", fetchError?.message);
      return {
        success: false,
        message: "Transaction introuvable.",
      };
    }

    if (existingTx.storeId !== storeId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé à modifier cette transaction.",
      };
    }

    // Price resolution — if the submitted form references a catalogue product,
    // use its price; otherwise use whatever the user typed.
    let unitPrice = validatedData.unitPrice;
    let totalPrice = validatedData.unitPrice * validatedData.quantity;

    if (validatedData.productId && validatedData.productId !== "none") {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("storeId, unitPrice, stock, name")
        .eq("productId", validatedData.productId)
        .single();

      if (productError || !product) {
        return {
          success: false,
          message: "Produit introuvable.",
        };
      }

      if (product.storeId !== storeId) {
        return {
          success: false,
          message: "Vous n'êtes pas autorisé à modifier ce produit.",
        };
      }

      // Adjust stock: restore old quantity then deduct new quantity
      const stockDelta = existingTx.quantity - validatedData.quantity;
      const newStock = product.stock + stockDelta;

      if (
        (validatedData.type === "sale" || validatedData.type === "credit") &&
        newStock < 0
      ) {
        return {
          success: false,
          message: `Stock insuffisant. Disponible : ${product.stock}, requis : ${validatedData.quantity}.`,
        };
      }

      unitPrice = product.unitPrice;
      totalPrice = unitPrice * validatedData.quantity;
      validatedData.productName =
        validatedData.productName || product.name;

      if (
        validatedData.type === "sale" ||
        validatedData.type === "credit"
      ) {
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("productId", validatedData.productId);

        if (stockError) {
          return {
            success: false,
            message: "Échec de la mise à jour du stock.",
          };
        }
      }
    }

    // Persist — no productId column in transactions
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        productName:
          validatedData.productName === "none"
            ? null
            : validatedData.productName,
        unitPrice,
        totalPrice,
        quantity: validatedData.quantity,
        type: validatedData.type,
      })
      .eq("transactionId", validatedData.transactionId);

    if (updateError) {
      console.error("Update error:", updateError.message);
      return {
        success: false,
        message: "Échec de la mise à jour de la transaction.",
      };
    }

    revalidatePath("/transactions");
    return { success: true, message: "Transaction mise à jour avec succès." };
  } catch (error) {
    console.error("Unexpected error during update:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite." };
  }
}