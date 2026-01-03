/* eslint-disable @typescript-eslint/no-unused-vars */
// app/invoice/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isUserSubscriptionActive } from "@/lib/utils/utils";
 
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation schema
const productSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, "Le nom du produit est obligatoire"),
  unitPrice: z.coerce.number().min(0, "Le prix unitaire doit être positif ou nul"),
  quantity: z.coerce.number().min(1, "La quantité doit être au moins de 1"),
});

const invoiceSchema = z.object({
  clientName: z.string().min(1, "Le nom du client est obligatoire"),
  clientPhone: z.string().min(1, "Le téléphone du client est obligatoire"),
  clientEmail: z.string().email().optional().or(z.literal("")),
  clientAddress: z.string().optional(),
  storeName: z.string().min(1, "Le nom du magasin est obligatoire"),
  storeAddress: z.string().min(1, "L'adresse du magasin est obligatoire"),
  storePhoneNumber: z.string().optional(),
  notes: z.string().optional(),
  products: z.array(productSchema).min(1, "Au moins un produit est requis"),
});

export async function createInvoice(formData: FormData) {
  try {
    // Parse and validate form data
    const rawData = {
      clientName: formData.get("clientName") as string,
      clientPhone: formData.get("clientPhone") as string,
      clientEmail: formData.get("clientEmail") as string,
      clientAddress: formData.get("clientAddress") as string,
      storeName: formData.get("storeName") as string,
      storeAddress: formData.get("storeAddress") as string,
      storePhoneNumber: formData.get("storePhoneNumber") as string,
      notes: formData.get("notes") as string,
      products: JSON.parse(formData.get("products") as string),
    };

    const validatedData = invoiceSchema.parse(rawData);

    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Non autorisé" };
    }

    // Get user's store
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

    const { clientName, clientPhone, storeName, storeAddress, products } = validatedData;

    // Check stock for registered products
    for (const product of products) {
      if (product.productId) {
        const { data: productData, error } = await supabase
          .from("products")
          .select("stock, name")
          .eq("productId", product.productId)
          .eq("storeId", storeId)
          .single();

        if (error || !productData) {
          console.error("Error fetching product stock:", error?.message);
          return {
            success: false,
            message: `Le produit ${product.name} est introuvable ou n'est pas enregistré`,
          };
        }

        const currentStock = productData.stock ?? 0;
        if (currentStock < product.quantity) {
          return {
            success: false,
            message: `Le stock du produit ${productData.name} est insuffisant (Disponible: ${currentStock})`,
          };
        }
      }
    }

    // Calculate totals and description
    let totalPrice = 0;
    let totalQuantity = 0;
    let description = "";

    for (const product of products) {
      totalPrice += product.unitPrice * product.quantity;
      totalQuantity += product.quantity;
      description += `${product.name} (x${product.quantity}), `;
    }

    // Insert transaction
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        storeId,
        userId: user.id,
        productName: "Facture - Plusieurs articles",
        unitPrice: null,
        totalPrice,
        quantity: totalQuantity,
        type: "sale",
        description: description.slice(0, -2),
        created_at: new Date().toISOString(),
      });

    if (txError) {
      console.error("Error inserting transaction:", txError.message);
      return { success: false, message: "Erreur durant la création de la facture" };
    }

    // Update stock for registered products
    for (const product of products) {
      if (product.productId) {
        const { data: stockData, error: stockFetchError } = await supabase
          .from("products")
          .select("stock")
          .eq("productId", product.productId)
          .eq("storeId", storeId)
          .single();

        if (stockFetchError || !stockData) {
          console.error("Error fetching stock:", stockFetchError?.message);
          return {
            success: false,
            message: `Échec lors de la recherche du stock de l'article: ${product.name}`,
          };
        }

        const newStock = (stockData.stock ?? 0) - product.quantity;
        const { error: updateError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("productId", product.productId)
          .eq("storeId", storeId);

        if (updateError) {
          console.error("Error updating stock:", updateError.message);
          return {
            success: false,
            message: `Échec lors de la mise à jour du stock de l'article: ${product.name}`,
          };
        }
      }
    }

    revalidatePath("/invoice");
    return { 
      success: true, 
      message: "Facture créée avec succès!",
      invoiceData: validatedData
    };
  } catch (error) {
    console.error("Unexpected error creating invoice:", error);
    
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    
    return { success: false, message: "Une erreur s'est produite" };
  }
}