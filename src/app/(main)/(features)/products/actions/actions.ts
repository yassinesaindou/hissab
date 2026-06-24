// app/products/actions/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUserSubscriptionActive } from "@/lib/utils/utils";
import { isValidEAN13 } from "@/lib/utils/ean13";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  productId: string;
  name: string;
  stock: number;
  unitPrice: number;
  category: string | null;
  description: string | null;
  productCode: string;
  created_at: string;
  updated_at?: string;
  userId?: string;
  storeId?: string;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const productFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Le nom doit avoir au moins 2 caractères." })
    .max(100, { message: "Le nom doit avoir moins de 100 caractères." }),
  stock: z
    .number()
    .int({ message: "Le stock doit être un entier." })
    .min(0, { message: "Le stock doit être non-négatif." }),
  unitPrice: z
    .number()
    .min(0, { message: "Le prix doit être non-négatif." })
    .max(1000000, { message: "Prix trop élevé." }),
  category: z
    .string()
    .max(50, { message: "La catégorie doit avoir moins de 50 caractères." })
    .optional(),
  description: z
    .string()
    .max(500, { message: "La description doit avoir moins de 500 caractères." })
    .optional(),
  // Optional manual override — must be 13 digits AND a valid EAN-13 checksum
  productCode: z
    .string()
    .regex(/^\d{13}$/, { message: "Le code EAN-13 doit contenir exactement 13 chiffres." })
    .refine((v) => isValidEAN13(v), {
      message: "Le code EAN-13 a un checksum invalide et ne sera pas lisible par un scanner.",
    })
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

const updateProductFormSchema = productFormSchema.extend({
  productId: z.string().uuid({ message: "Identifiant produit incorrect." }),
});

const stockAdjustmentSchema = z.object({
  productId: z.string().uuid({ message: "Identifiant produit incorrect." }),
  quantity: z
    .number()
    .int()
    .min(1, { message: "La quantité doit être au moins 1." }),
  type: z.enum(["increase", "decrease"]),
  reason: z
    .string()
    .max(200, { message: "La raison doit avoir moins de 200 caractères." })
    .optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductFormSchema>;
export type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUserStore(userId: string) {
  const supabase = createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("storeId, role")
    .eq("userId", userId)
    .single();
  if (error) {
    console.error("Error fetching profile:", error.message);
    return null;
  }
  return profile;
}

/**
 * Ask the DB to generate a unique EAN-13 via the function we already created.
 * Retries up to 5 times in case of a collision (extremely unlikely with EAN-13).
 */
async function generateEAN13(storeId: string): Promise<string> {
  const supabase = createSupabaseServerClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase.rpc("generate_ean13");
    if (error || !data) continue;

    const code = data as string;

    // Check uniqueness within this store
    const { data: conflict } = await supabase
      .from("products")
      .select("productId")
      .eq("productCode", code)
      .eq("storeId", storeId)
      .maybeSingle();

    if (!conflict) return code;
  }

  throw new Error("Impossible de générer un code EAN-13 unique. Réessayez.");
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createProductAction(formData: FormData) {
  try {
    const raw = {
      name: formData.get("name"),
      stock: Number(formData.get("stock")),
      unitPrice: Number(formData.get("unitPrice")),
      category: (formData.get("category") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      productCode: (formData.get("productCode") as string) || "",
    };

    const validatedData = productFormSchema.parse(raw);

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const profile = await getUserStore(user.id);
    if (!profile?.storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    const isSubscriptionActive = await isUserSubscriptionActive(
      profile.storeId
    );
    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Votre souscription a expiré, veuillez la renouveler.",
      };
    }

    // Resolve product code
    let productCode: string;

    if (validatedData.productCode) {
      // User supplied a custom EAN-13 — check uniqueness in this store
      const { data: conflict } = await supabase
        .from("products")
        .select("productId")
        .eq("productCode", validatedData.productCode)
        .eq("storeId", profile.storeId)
        .maybeSingle();

      if (conflict) {
        return {
          success: false,
          message: `Le code EAN-13 "${validatedData.productCode}" est déjà utilisé par un autre article.`,
        };
      }
      productCode = validatedData.productCode;
    } else {
      // Generate one from the DB function
      productCode = await generateEAN13(profile.storeId);
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        userId: user.id,
        storeId: profile.storeId,
        name: validatedData.name,
        stock: validatedData.stock,
        unitPrice: validatedData.unitPrice,
        category: validatedData.category,
        description: validatedData.description,
        productCode,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error.message);
      return {
        success: false,
        message: "Échec lors de la création du produit.",
      };
    }

    revalidatePath("/products");
    return {
      success: true,
      message: "Produit ajouté avec succès.",
      product: product as Product,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    if (error instanceof z.ZodError)
      return { success: false, message: error.errors[0].message };
    if (error instanceof Error)
      return { success: false, message: error.message };
    return { success: false, message: "Une erreur s'est produite." };
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateProductAction(formData: FormData) {
  try {
    const raw = {
      productId: formData.get("productId"),
      name: formData.get("name"),
      stock: Number(formData.get("stock")),
      unitPrice: Number(formData.get("unitPrice")),
      category: (formData.get("category") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      productCode: (formData.get("productCode") as string) || "",
    };

    const validatedData = updateProductFormSchema.parse(raw);

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const profile = await getUserStore(user.id);
    if (!profile?.storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }
    if (profile.role === "employee") {
      return {
        success: false,
        message: "Vous n'avez pas les droits pour modifier ce produit.",
      };
    }

    const isSubscriptionActive = await isUserSubscriptionActive(
      profile.storeId
    );
    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Votre souscription a expiré, veuillez la renouveler.",
      };
    }

    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("productId", validatedData.productId)
      .single();

    if (fetchError || !existingProduct) {
      return { success: false, message: "Produit introuvable." };
    }
    if (existingProduct.storeId !== profile.storeId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé à modifier ce produit.",
      };
    }

    // Resolve code: keep existing unless user explicitly changed it
    let productCode: string = existingProduct.productCode;
    const incomingCode = validatedData.productCode;

    if (incomingCode && incomingCode !== productCode) {
      const { data: conflict } = await supabase
        .from("products")
        .select("productId")
        .eq("productCode", incomingCode)
        .eq("storeId", profile.storeId)
        .neq("productId", validatedData.productId)
        .maybeSingle();

      if (conflict) {
        return {
          success: false,
          message: `Le code EAN-13 "${incomingCode}" est déjà utilisé par un autre article.`,
        };
      }
      productCode = incomingCode;
    }

    const { error } = await supabase
      .from("products")
      .update({
        name: validatedData.name,
        stock: validatedData.stock,
        unitPrice: validatedData.unitPrice,
        category: validatedData.category,
        description: validatedData.description,
        productCode,
        updated_at: new Date().toISOString(),
      })
      .eq("productId", validatedData.productId);

    if (error) {
      console.error("Error updating product:", error.message);
      return {
        success: false,
        message: "Échec lors de la mise à jour du produit.",
      };
    }

    revalidatePath("/products");
    return {
      success: true,
      message: "Produit mis à jour avec succès.",
      product: {
        ...existingProduct,
        ...validatedData,
        productCode,
      } as Product,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    if (error instanceof z.ZodError)
      return { success: false, message: error.errors[0].message };
    return { success: false, message: "Une erreur s'est produite." };
  }
}

// ─── ADJUST STOCK ─────────────────────────────────────────────────────────────

export async function adjustStockAction(formData: FormData) {
  try {
    const validatedData = stockAdjustmentSchema.parse({
      productId: formData.get("productId"),
      quantity: Number(formData.get("quantity")),
      type: formData.get("type") as "increase" | "decrease",
      reason: (formData.get("reason") as string) || undefined,
    });

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const profile = await getUserStore(user.id);
    if (!profile?.storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    const isSubscriptionActive = await isUserSubscriptionActive(
      profile.storeId
    );
    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Votre souscription a expiré, veuillez la renouveler.",
      };
    }

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("productId", validatedData.productId)
      .single();

    if (fetchError || !product) {
      return { success: false, message: "Produit introuvable." };
    }
    if (product.storeId !== profile.storeId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé à modifier ce produit.",
      };
    }
    if (
      validatedData.type === "decrease" &&
      validatedData.quantity > product.stock
    ) {
      return {
        success: false,
        message: `Stock insuffisant. Disponible : ${product.stock}`,
      };
    }

    const newStock =
      validatedData.type === "increase"
        ? product.stock + validatedData.quantity
        : product.stock - validatedData.quantity;

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("productId", validatedData.productId);

    if (updateError) {
      return {
        success: false,
        message: "Échec lors de la mise à jour du stock.",
      };
    }

    // Log as a transaction (no productId column in transactions table)
    await supabase.from("transactions").insert({
      userId: user.id,
      storeId: profile.storeId,
      productName: product.name,
      unitPrice: product.unitPrice,
      quantity: validatedData.quantity,
      totalPrice: product.unitPrice * validatedData.quantity,
      type: validatedData.type === "increase" ? "expense" : "sale",
      description:
        validatedData.reason ||
        `Ajustement stock : ${validatedData.type === "increase" ? "entrée" : "sortie"}`,
      created_at: new Date().toISOString(),
    });

    revalidatePath("/products");
    return {
      success: true,
      message: `Stock ${
        validatedData.type === "increase" ? "augmenté" : "réduit"
      } avec succès.`,
      newStock,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    if (error instanceof z.ZodError)
      return { success: false, message: error.errors[0].message };
    return { success: false, message: "Une erreur s'est produite." };
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteProductAction(productId: string) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const profile = await getUserStore(user.id);
    if (!profile?.storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }
    if (profile.role === "employee") {
      return {
        success: false,
        message: "Vous n'avez pas les droits pour supprimer ce produit.",
      };
    }

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("storeId")
      .eq("productId", productId)
      .single();

    if (fetchError || !product) {
      return { success: false, message: "Produit introuvable." };
    }
    if (product.storeId !== profile.storeId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé à supprimer ce produit.",
      };
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("productId", productId);

    if (error) {
      return {
        success: false,
        message: "Échec lors de la suppression du produit.",
      };
    }

    revalidatePath("/products");
    return { success: true, message: "Produit supprimé avec succès." };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, message: "Une erreur s'est produite." };
  }
}