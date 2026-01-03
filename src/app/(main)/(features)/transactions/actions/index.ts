// app/transactions/actions/index.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
 
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import { isUserSubscriptionActive } from "@/lib/utils/utils";

const baseTransactionFormSchema = z.object({
  productId: z
    .string()
    .uuid({ message: "L'identifiant du produit est incorrect." })
    .optional(),
  productName: z
    .string()
    .max(100, { message: "Product name must be at most 100 characters." })
    .optional(),
  unitPrice: z.coerce
    .number()
    .min(0, { message: "Unit price must be non-negative" })
    .max(1000000, { message: "Unit price too high" }),
  quantity: z.coerce
    .number()
    .int({ message: "Quantity must be an integer" })
    .min(1, { message: "La quantité doit etre superieur à 0" }),
  type: z.enum(["sale", "credit", "expense"], {
    message: "Le type de transaction doit etre 'sale', 'credit' ou 'expense'.",
  }),
});

const transactionFormSchema = baseTransactionFormSchema.refine(
  (data) =>
    data.type === "expense" ||
    (data.productId && data.productId !== "none") ||
    data.productName,
  {
    message:
      "Un produit doit être sélectionné ou un nom de produit doit être fourni pour les transactions de vente ou de crédit.",
    path: ["productId"],
  }
);

type TransactionFormData = z.infer<typeof transactionFormSchema>;

export async function addTransactionAction(formData: TransactionFormData) {
  try {
    const validatedData = transactionFormSchema.parse(formData);
    const supabase = createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();

    const storeId = profile?.storeId;
    if (!storeId) {
      return { success: false, message: "Aucun magasin n'est associé à votre compte." };
    }

    // Check subscription
    const isSubscriptionActive = await isUserSubscriptionActive(storeId);
    if (!isSubscriptionActive) {
      return { success: false, message: "Votre abonnement a expiré. Veuillez le renouveler." };
    }

    // Check daily transaction limit
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
      return { success: false, message: "Ce plan n'autorise pas de transactions." };
    }

    // Count today's transactions
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { count, error: countError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("storeId", storeId)
      .gte("created_at", startOfDay)
      .lt("created_at", endOfDay);

    if (countError) {
      console.error("Error counting transactions:", countError);
      return { success: false, message: "Erreur lors du comptage des transactions." };
    }

    if ((count ?? 0) >= dailyLimit) {
      return {
        success: false,
        message: `Limite quotidienne atteinte : ${dailyLimit} transactions/jour.`,
      };
    }

    // Process transaction
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

      if ((validatedData.type === "sale" || validatedData.type === "credit") && product.stock < validatedData.quantity) {
        return { success: false, message: `Stock insuffisant : ${product.stock} disponible.` };
      }

      unitPrice = product.unitPrice;
      totalPrice = unitPrice * validatedData.quantity;
      validatedData.productName = validatedData.productName || product.name;

      if (validatedData.type === "sale" || validatedData.type === "credit") {
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: product.stock - validatedData.quantity })
          .eq("productId", validatedData.productId);

        if (stockError) {
          console.error("Stock update error:", stockError);
          return { success: false, message: "Échec mise à jour stock." };
        }
      }
    }

    // Insert transaction
    const { data: newTransaction, error: insertError } = await supabase
      .from("transactions")
      .insert({
        storeId,
        userId: user.id,
        productId: validatedData.productId === "none" ? null : validatedData.productId,
        productName: validatedData.productName === "none" ? null : validatedData.productName,
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
      return { success: false, message: "Échec création transaction." };
    }

    // Get user name for the transaction
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
        userName: userProfile?.name || user.email || "Utilisateur inconnu"
      }
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Erreur inattendue." };
  }
}

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
        "Un produit doit être sélectionné ou un nom de produit doit être renseigné pour les transactions de vente ou de crédit.",
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

    if (!user) {
      redirect("/login");
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId, role")
      .eq("userId", user.id)
      .single();
    const storeId = data?.storeId;

    if (data?.role === "employee")
      return {
        success: false,
        message: "Vous n'êtes pas autorisé à modifier une transaction.",
      };
    
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
        message: "Ta souscription a expiré, veuillez la renouveler.",
      };
    }

    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select(" productId, quantity, type, storeId")
      .eq("transactionId", validatedData.transactionId)
      .single();

    if (fetchError || !transaction) {
      console.error("Error fetching transaction:", fetchError?.message);
      return { success: false, message: "La transaction n'existe pas" };
    }

    if (transaction.storeId !== storeId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé de modifier cette transaction",
      };
    }

    let unitPrice = validatedData.unitPrice;
    let totalPrice = validatedData.unitPrice * validatedData.quantity;

    if (validatedData.productId && validatedData.productId !== "none") {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("userId, storeId,unitPrice, stock, name")
        .eq("productId", validatedData.productId)
        .single();

      if (productError || !product) {
        console.error("Error fetching product:", productError?.message);
        return {
          success: false,
          message: "L'identifiant du produit est incorrect",
        };
      }

      if (product.storeId !== storeId) {
        return {
          success: false,
          message: "Vous n'êtes pas autorisé de modifier ce produit",
        };
      }

      const stockAdjustment = transaction.quantity - validatedData.quantity;
      const newStock = product.stock + stockAdjustment;

      if (
        (validatedData.type === "sale" || validatedData.type === "credit") &&
        newStock < 0
      ) {
        return {
          success: false,
          message: `Stock insuffisant Disponible: ${product.stock}, Requis: ${validatedData.quantity}`,
        };
      }

      unitPrice = product.unitPrice;
      totalPrice = unitPrice * validatedData.quantity;
      validatedData.productName = validatedData.productName || product.name;

      if (validatedData.type === "sale" || validatedData.type === "credit") {
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("productId", validatedData.productId);

        if (stockError) {
          console.error("Error updating product stock:", stockError.message);
          return {
            success: false,
            message: "Echec durant la mise à jour du stock",
          };
        }
      }
    } else if (
      transaction.productId &&
      (transaction.type === "sale" || transaction.type === "credit")
    ) {
      // Restore stock if productId is removed
      const { data: oldProduct, error: oldProductError } = await supabase
        .from("products")
        .select("userId, stock")
        .eq("productId", transaction.productId)
        .single();

      if (oldProductError || !oldProduct) {
        console.error("Error fetching old product:", oldProductError?.message);
        return {
          success: false,
          message: "L'identifiant de l'ancien produit  est incorrect",
        };
      }

      const { error: stockError } = await supabase
        .from("products")
        .update({ stock: oldProduct.stock + transaction.quantity })
        .eq("productId", transaction.productId);

      if (stockError) {
        console.error("Error restoring product stock:", stockError.message);
        return {
          success: false,
          message: "Echec durant la restauration du stock",
        };
      }
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        productId:
          validatedData.productId === "none" ? null : validatedData.productId,
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

    if (error) {
      console.error("Error updating transaction:", error.message);
      return {
        success: false,
        message: "Echec durant la mise à jour de la transaction",
      };
    }

    revalidatePath("/transactions");
    return { success: true, message: "La transaction a bien été mise à jour" };
  } catch (error) {
    console.error("Unexpected error during transaction update:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite" };
  }
}