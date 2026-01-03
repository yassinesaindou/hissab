// app/products/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUserSubscriptionActive } from "@/lib/utils/utils";
 

// Product Interface
export interface Product {
  productId: string;
  name: string;
  stock: number;
  unitPrice: number;
  category: string | null;
  description: string | null;
  created_at: string;
  updated_at?: string;
  userId?: string;
  storeId?: string;
}

// Product Schema
const productFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Le nom du produit doit avoir au moins 2 caractères." })
    .max(100, {
      message: "Le nom du produit doit avoir moins de 100 caractères.",
    }),
  stock: z
    .number()
    .int({ message: "Le stock doit être un nombre entier." })
    .min(0, { message: "Le stock doit être non-négatif." }),
  unitPrice: z
    .number()
    .min(0, { message: "Le prix unitaire doit être non-négatif." })
    .max(1000000, {
      message: "Le prix unitaire doit être inférieur à 1 000 000.",
    }),
  category: z
    .string()
    .max(50, { message: "La catégorie doit avoir moins de 50 caractères." })
    .optional(),
  description: z
    .string()
    .max(500, { message: "La description doit avoir moins de 500 caractères." })
    .optional(),
});

// Stock Adjustment Schema
const stockAdjustmentSchema = z.object({
  productId: z.string().uuid({ message: "L'identifiant du produit est incorrect." }),
  quantity: z.number().int().min(1, { message: "La quantité doit être au moins 1." }),
  type: z.enum(['increase', 'decrease']),
  reason: z.string().max(200, { message: "La raison doit avoir moins de 200 caractères." }).optional(),
});

// Update Product Schema
const updateProductFormSchema = productFormSchema.extend({
  productId: z
    .string()
    .uuid({ message: "L'identifiant du produit est incorrect." }),
});

// Types
export type ProductFormData = z.infer<typeof productFormSchema>;
export type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductFormSchema>;

// Helper function to check store access
async function getUserStore(userId: string) {
  const supabase = createSupabaseServerClient();
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("storeId, role")
    .eq("userId", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error.message);
    return null;
  }

  return profile;
}

// Create Product Action
export async function createProductAction(formData: FormData) {
  try {
    const validatedData = productFormSchema.parse({
      name: formData.get("name"),
      stock: Number(formData.get("stock")),
      unitPrice: Number(formData.get("unitPrice")),
      category: formData.get("category") || undefined,
      description: formData.get("description") || undefined,
    });

    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const profile = await getUserStore(user.id);
    if (!profile?.storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    // Check subscription
    const isSubscriptionActive = await isUserSubscriptionActive(profile.storeId);
    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Votre souscription a expiré, veuillez la renouveler.",
      };
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        userId: user.id,
        name: validatedData.name,
        stock: validatedData.stock,
        unitPrice: validatedData.unitPrice,
        storeId: profile.storeId,
        category: validatedData.category,
        description: validatedData.description,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error.message);
      return { success: false, message: "Échec lors de la création du produit." };
    }

    revalidatePath("/products");
    return { 
      success: true, 
      message: "Produit ajouté avec succès.",
      product: product as Product
    };
  } catch (error) {
    console.error("Unexpected error during product creation:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite." };
  }
}

// Update Product Action
export async function updateProductAction(formData: FormData) {
  try {
    const validatedData = updateProductFormSchema.parse({
      productId: formData.get("productId"),
      name: formData.get("name"),
      stock: Number(formData.get("stock")),
      unitPrice: Number(formData.get("unitPrice")),
      category: formData.get("category") || undefined,
      description: formData.get("description") || undefined,
    });

    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const profile = await getUserStore(user.id);
    if (!profile?.storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    // Check employee permissions
    if (profile?.role === "employee") {
      return {
        success: false,
        message: "Vous n'avez pas les droits pour modifier ce produit.",
      };
    }

    // Check subscription
    const isSubscriptionActive = await isUserSubscriptionActive(profile.storeId);
    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Votre souscription a expiré, veuillez la renouveler.",
      };
    }

    // Verify product ownership
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("productId", validatedData.productId)
      .single();

    if (fetchError || !product) {
      console.error("Product not found:", fetchError?.message);
      return { success: false, message: "Produit introuvable." };
    }

    if (product.storeId !== profile.storeId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé à modifier ce produit.",
      };
    }

    // Update product
    const { error } = await supabase
      .from("products")
      .update({
        name: validatedData.name,
        stock: validatedData.stock,
        unitPrice: validatedData.unitPrice,
        category: validatedData.category,
        description: validatedData.description,
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
      product: { ...product, ...validatedData } as Product
    };
  } catch (error) {
    console.error("Unexpected error during product update:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite." };
  }
}

// Adjust Stock Action
export async function adjustStockAction(formData: FormData) {
  try {
    const validatedData = stockAdjustmentSchema.parse({
      productId: formData.get("productId"),
      quantity: Number(formData.get("quantity")),
      type: formData.get("type") as 'increase' | 'decrease',
      reason: formData.get("reason") || undefined,
    });

    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const profile = await getUserStore(user.id);
    if (!profile?.storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    // Check subscription
    const isSubscriptionActive = await isUserSubscriptionActive(profile.storeId);
    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Votre souscription a expiré, veuillez la renouveler.",
      };
    }

    // Get current product
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("productId", validatedData.productId)
      .single();

    if (fetchError || !product) {
      console.error("Product not found:", fetchError?.message);
      return { success: false, message: "Produit introuvable." };
    }

    if (product.storeId !== profile.storeId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé à modifier ce produit.",
      };
    }

    // Validate stock for decrease
    if (validatedData.type === 'decrease' && validatedData.quantity > product.stock) {
      return {
        success: false,
        message: `Quantité insuffisante. Stock disponible: ${product.stock}`,
      };
    }

    // Calculate new stock
    const newStock = validatedData.type === 'increase' 
      ? product.stock + validatedData.quantity 
      : product.stock - validatedData.quantity;

    // Update product stock
    const { error: updateError } = await supabase
      .from("products")
      .update({ 
        stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq("productId", validatedData.productId);

    if (updateError) {
      console.error("Error updating stock:", updateError.message);
      return {
        success: false,
        message: "Échec lors de la mise à jour du stock.",
      };
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        userId: user.id,
        productId: validatedData.productId,
        productName: product.name,
        unitPrice: product.unitPrice,
        quantity: validatedData.quantity,
        type: validatedData.type === 'increase' ? 'stock_in' : 'stock_out',
        storeId: profile.storeId,
        description: validatedData.reason || `Ajustement de stock: ${validatedData.type === 'increase' ? 'Ajout' : 'Retrait'}`,
        created_at: new Date().toISOString(),
      });

    if (transactionError) {
      console.error("Error creating transaction:", transactionError.message);
      // Don't fail the whole operation if transaction logging fails
    }

    revalidatePath("/products");
    return {
      success: true,
      message: `Stock ${validatedData.type === 'increase' ? 'ajouté' : 'réduit'} avec succès.`,
      newStock
    };
  } catch (error) {
    console.error("Unexpected error during stock adjustment:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite." };
  }
}

// Delete Product Action
export async function deleteProductAction(productId: string) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const profile = await getUserStore(user.id);
    if (!profile?.storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    // Check employee permissions
    if (profile?.role === "employee") {
      return {
        success: false,
        message: "Vous n'avez pas les droits pour supprimer ce produit.",
      };
    }

    // Verify product ownership
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("storeId")
      .eq("productId", productId)
      .single();

    if (fetchError || !product) {
      console.error("Product not found:", fetchError?.message);
      return { success: false, message: "Produit introuvable." };
    }

    if (product.storeId !== profile.storeId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé à supprimer ce produit.",
      };
    }

    // Delete product
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("productId", productId);

    if (error) {
      console.error("Error deleting product:", error.message);
      return {
        success: false,
        message: "Échec lors de la suppression du produit.",
      };
    }

    revalidatePath("/products");
    return { success: true, message: "Produit supprimé avec succès." };
  } catch (error) {
    console.error("Unexpected error during product deletion:", error);
    return { success: false, message: "Une erreur s'est produite." };
  }
}