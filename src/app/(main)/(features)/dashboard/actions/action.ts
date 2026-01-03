/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const transactionFormSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().optional(),
  unitPrice: z.number(),
  quantity: z.number(),
  type: z.enum(["sale", "credit", "expense"]),
});

export async function addTransactionAction(formData: any) {
  try {
    const validatedData = transactionFormSchema.parse(formData);
    
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, message: "Non autorisé" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();

    if (!profile?.storeId) {
      return { success: false, message: "Aucun magasin associé" };
    }

    // Use the price provided by the user (formData.unitPrice) - DO NOT fetch from products table
    const unitPrice = validatedData.unitPrice; // Always use user-provided price
    const totalPrice = validatedData.unitPrice * validatedData.quantity;
    let productName = validatedData.productName;

    // If product is selected, only get its stock information (not price)
    if (validatedData.productId) {
      const { data: product } = await supabase
        .from("products")
        .select("stock, name")
        .eq("productId", validatedData.productId)
        .eq("storeId", profile.storeId)
        .single();

      if (product) {
        productName = product.name; // Only use the name from product table

        // Update stock for sales and credits
        if (validatedData.type === "sale" || validatedData.type === "credit") {
          if (product.stock < validatedData.quantity) {
            return { 
              success: false, 
              message: `Stock insuffisant. Disponible: ${product.stock}` 
            };
          }

          // Update stock only, not price
          await supabase
            .from("products")
            .update({ stock: product.stock - validatedData.quantity })
            .eq("productId", validatedData.productId);
        }
      }
    }

    // Insert transaction with user-provided price
    const { error } = await supabase.from("transactions").insert({
      storeId: profile.storeId,
      userId: user.id,
      productId: validatedData.productId || null,
      productName: productName || null,
      unitPrice: unitPrice, // This is the user-provided price, not from products table
      totalPrice: totalPrice,
      quantity: validatedData.quantity,
      type: validatedData.type,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true, message: "Transaction ajoutée avec succès" }; // Fixed: success should be true

  } catch (error) {
    console.error("Add transaction error:", error);
    return { success: false, message: "Échec de l'ajout de la transaction" };
  }
}