// app/settings/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Schema for payment code submission
const paymentCodeSchema = z.object({
  code: z.string().min(1, "Le code est requis").max(50, "Code trop long"),
  planId: z.coerce.number().min(1, "Veuillez sélectionner un plan"),
});

export async function submitPaymentCode(formData: FormData) {
  try {
    // Validate form data
    const validatedData = paymentCodeSchema.parse({
      code: formData.get("code"),
      planId: formData.get("planId"),
    });

    // Get user and store info
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    // Get user's profile and store
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("storeId, role")
      .eq("userId", user.id)
      .single();

    if (profileError || !profile?.storeId) {
      return {
        success: false,
        error: "Impossible de trouver votre magasin. Veuillez réessayer.",
      };
    }

    // Check if user has permission (admin or employee)
    if (!["admin", "employee"].includes(profile.role)) {
      return {
        success: false,
        error: "Vous n'avez pas la permission de soumettre des codes de paiement.",
      };
    }

    // Get the selected plan
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("planId", validatedData.planId)
      .single();

    if (planError || !plan) {
      return {
        success: false,
        error: "Le plan sélectionné n'existe pas.",
      };
    }

    // Check if code already exists
    const { data: existingCode, error: checkError } = await supabase
      .from("subscription_codes")
      .select("codeId")
      .eq("code", validatedData.code.toUpperCase())
      .single();

    if (!checkError && existingCode) {
      return {
        success: false,
        error: "Ce code de paiement a déjà été utilisé.",
      };
    }

    // Insert the subscription code
    const { error: insertError } = await supabase
      .from("subscription_codes")
      .insert({
        code: validatedData.code.toUpperCase(),
        storeId: profile.storeId,
        createdAt: new Date().toISOString(),
        isSettled: false,
      });

    if (insertError) {
      console.error("Error inserting subscription code:", insertError);
      return {
        success: false,
        error: "Erreur lors de l'enregistrement du code. Veuillez réessayer.",
      };
    }

    // Note: The actual subscription renewal would be handled manually by an admin
    // who would verify the payment and update the subscription in the subscriptions table

    revalidatePath("/settings");
    return {
      success: true,
      message: "Code de paiement soumis avec succès. Votre abonnement sera activé après vérification manuelle.",
    };

  } catch (error) {
    console.error("Error submitting payment code:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: "Une erreur s'est produite. Veuillez réessayer.",
    };
  }
}