// app/actions/credits.ts
"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isUserSubscriptionActive } from "@/lib/utils/utils";
 

const creditFormSchema = z.object({
  customerName: z
    .string()
    .min(2, { message: "Le nom du client doit avoir au moins 2 caractères." })
    .max(100, {
      message: "Le nom du client doit avoir au plus 100 caractères.",
    }),
  customerPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, {
      message: "Le numéro de téléphone est incorrecte.",
    })
    .min(5, {
      message: "Le numéro de téléphone doit avoir au moins 5 chiffres.",
    })
    .max(15, {
      message: "Le numéro de téléphone doit avoir au plus 15 chiffres.",
    }),
  amount: z
    .number()
    .min(0, { message: "Le montant doit être positif." })
    .max(1000000, { message: "Le montant doit pas exéder 1 000 000." }),
  status: z.enum(["pending", "paid"]).optional().default("pending"),
  description: z
    .string()
    .max(500, { message: "La description doit avoir au plus 500 caractères." })
    .optional(),
  productId: z
    .string()
    .uuid({ message: "L'identifiant du produit est incorrect." })
    .optional(),
  numberOfProductsTaken: z
    .number()
    .int({ message: "Le nombre de produits pris doit être entier." })
    .min(1, { message: "Le nombre de produits pris doit être au moins 1." })
    .optional(),
});

const updateCreditFormSchema = creditFormSchema.extend({
  creditId: z
    .string()
    .uuid({ message: "L'identifiant du crédit est incorrect." }),
});

export async function addCreditAction(formData: FormData) {
  try {
    const validatedData = creditFormSchema.parse({
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      amount: Number(formData.get("amount")),
      status: formData.get("status") || undefined,
      description: formData.get("description") || undefined,
      productId: formData.get("productId") || undefined,
      numberOfProductsTaken: formData.get("numberOfProductsTaken")
        ? Number(formData.get("numberOfProductsTaken"))
        : undefined,
    });

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Non autorisé" };
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();
    const storeId = data?.storeId;
    
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
        message: "Votre souscription a expiré, veuillez la renouveler.",
      };
    }

    // If productId is provided, verify it exists, belongs to the user, and check stock
    if (validatedData.productId && validatedData.numberOfProductsTaken) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("storeId, stock")
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
          message: "Vous n'êtes pas autorisé de modifier ce produit",
        };
      }

      if (product.stock < validatedData.numberOfProductsTaken) {
        return {
          success: false,
          message: `Le stock du produit est insuffisant. Stock: ${product.stock}, Requis: ${validatedData.numberOfProductsTaken}`,
        };
      }

      // Update product stock
      const { error: stockError } = await supabase
        .from("products")
        .update({ stock: product.stock - validatedData.numberOfProductsTaken })
        .eq("productId", validatedData.productId);

      if (stockError) {
        console.error("Error updating product stock:", stockError.message);
        return {
          success: false,
          message: "Échec durant la mise à jour du produit",
        };
      }
    } else if (
      validatedData.productId &&
      !validatedData.numberOfProductsTaken
    ) {
      return {
        success: false,
        message:
          "Le nombre de produits pris est requis lorsque l'identifiant du produit est fourni",
      };
    } else if (
      !validatedData.productId &&
      validatedData.numberOfProductsTaken
    ) {
      return {
        success: false,
        message:
          "L'identifiant du produit est requis lorsque le nombre de produits pris est fourni",
      };
    }

    const { error } = await supabase.from("credits").insert({
      userId: user.id,
      customerName: validatedData.customerName,
      customerPhone: validatedData.customerPhone,
      amount: validatedData.amount,
      storeId: storeId,
      status: validatedData.status,
      description: validatedData.description,
      productId: validatedData.productId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error creating credit:", error.message);
      return { success: false, message: "Échec durant la création du crédit" };
    }

    revalidatePath("/credits");
    return { success: true, message: "Création du crédit réussie" };
  } catch (error) {
    console.error("Unexpected error during credit creation:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite" };
  }
}

export async function updateCreditAction(formData: FormData) {
  try {
    const validatedData = updateCreditFormSchema.parse({
      creditId: formData.get("creditId"),
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      amount: Number(formData.get("amount")),
      status: formData.get("status") || undefined,
      description: formData.get("description") || undefined,
      productId: formData.get("productId") || undefined,
    });

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Non autorisé" };
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();
    const storeId = data?.storeId;
    
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
        message: "Votre souscription a expiré, veuillez la renouveler.",
      };
    }

    // Verify the credit exists and belongs to the user
    const { data: credit, error: fetchError } = await supabase
      .from("credits")
      .select("storeId")
      .eq("creditId", validatedData.creditId)
      .single();

    if (fetchError || !credit) {
      console.error("Error fetching credit:", fetchError?.message);
      return { success: false, message: "Le crédit n'existe pas" };
    }

    if (credit.storeId !== storeId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé de modifier ce crédit",
      };
    }

    // If productId is provided, verify it exists and belongs to the user
    if (validatedData.productId) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("storeId")
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
          message: "Vous n'êtes pas autorisé de modifier ce produit",
        };
      }
    }

    // Update the credit
    const { error } = await supabase
      .from("credits")
      .update({
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        amount: validatedData.amount,
        status: validatedData.status,
        description: validatedData.description,
        productId: validatedData.productId,
      })
      .eq("creditId", validatedData.creditId);

    if (error) {
      console.error("Error updating credit:", error.message);
      return {
        success: false,
        message: "Échec durant la mise à jour du crédit",
      };
    }

    revalidatePath("/credits");
    return { success: true, message: "Mise à jour du crédit réussie" };
  } catch (error) {
    console.error("Unexpected error during credit update:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite" };
  }
}

export async function deleteCreditAction(creditId: string) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Non autorisé" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();

    if (!profile?.storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    // Verify the credit belongs to the user's store
    const { data: credit, error: fetchError } = await supabase
      .from("credits")
      .select("storeId, productId, amount")
      .eq("creditId", creditId)
      .single();

    if (fetchError || !credit) {
      return { success: false, message: "Le crédit n'existe pas" };
    }

    if (credit.storeId !== profile.storeId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé de supprimer ce crédit",
      };
    }

    // If credit has a product, restore stock
    if (credit.productId) {
      // Get current product stock
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("productId", credit.productId)
        .single();

      if (product) {
        // Calculate how many items to restore (assuming 1 item per credit for simplicity)
        const itemsToRestore = Math.ceil(credit.amount / (product.stock > 0 ? credit.amount / product.stock : 1));
        
        await supabase
          .from("products")
          .update({ stock: product.stock + itemsToRestore })
          .eq("productId", credit.productId);
      }
    }

    const { error } = await supabase
      .from("credits")
      .delete()
      .eq("creditId", creditId);

    if (error) throw error;

    revalidatePath("/credits");
    return { success: true, message: "Crédit supprimé avec succès" };
  } catch (error) {
    console.error("Error deleting credit:", error);
    return { success: false, message: "Échec de la suppression du crédit" };
  }
}