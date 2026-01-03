/* eslint-disable @typescript-eslint/no-unused-vars */
// app/manager/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ========================
// SCHEMAS
// ========================

const subscriptionUpdateSchema = z.object({
  subscriptionId: z.string().uuid({ message: "ID d'abonnement invalide" }),
  months: z.coerce
    .number({ invalid_type_error: "Nombre requis" })
    .int({ message: "Doit être un nombre entier" })
    .min(1, { message: "Minimum 1 mois" })
    .max(12, { message: "Maximum 12 mois" }),
  planId: z.coerce
    .number({ invalid_type_error: "Plan requis" })
    .int({ message: "Plan invalide" })
    .min(1, { message: "Plan invalide" })
    .max(3, { message: "Plan invalide" }),
});

const processCodeSchema = z.object({
  codeId: z.string().uuid({ message: "ID de code invalide" }),
  planId: z.coerce
    .number({ invalid_type_error: "Plan requis" })
    .int({ message: "Plan invalide" })
    .min(1, { message: "Plan invalide" })
    .max(3, { message: "Plan invalide" }),
  months: z.coerce
    .number({ invalid_type_error: "Nombre requis" })
    .int({ message: "Doit être un nombre entier" })
    .min(1, { message: "Minimum 1 mois" })
    .max(36, { message: "Maximum 36 mois" }),
});

// ========================
// TYPES
// ========================

export type SubscriptionUpdateData = z.infer<typeof subscriptionUpdateSchema>;
export type ProcessCodeData = z.infer<typeof processCodeSchema>;

// ========================
// HELPER FUNCTIONS
// ========================

async function checkAdminAccess() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("userId", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Accès administrateur requis");
  }

  return { supabase, user };
}

async function handleEmployeeActivation(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  storeId: string,
  newPlanNumberOfUsers: number,
  currentPlanNumberOfUsers: number = 0
) {
  // === DOWNGRADE: DEACTIVATE EXCESS EMPLOYEES ===
  if (newPlanNumberOfUsers < currentPlanNumberOfUsers) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: 'exact' })
      .eq("storeId", storeId)
      .eq("isActive", true);

    const activeCount = count ?? 0;

    if (activeCount > newPlanNumberOfUsers) {
      const toDeactivate = activeCount - newPlanNumberOfUsers;

      // Get oldest active employees (from profiles)
      const { data: excessProfiles } = await supabase
        .from("profiles")
        .select("userId")
        .eq("storeId", storeId)
        .eq("role", "employee")
        .eq("isActive", true)
        .order("created_at", { ascending: true })
        .limit(toDeactivate);

      if (excessProfiles?.length) {
        const userIds = excessProfiles.map(p => p.userId);

        // UPDATE profiles
        await supabase
          .from("profiles")
          .update({ isActive: false })
          .in("userId", userIds);

        // UPDATE employees table
        await supabase
          .from("employees")
          .update({ isActive: false })
          .in("employeeId", userIds);
      }
    }
  }

  // === UPGRADE: REACTIVATE DEACTIVATED EMPLOYEES ===
  if (newPlanNumberOfUsers > currentPlanNumberOfUsers) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: 'exact' })
      .eq("storeId", storeId)
      .eq("isActive", true);

    const activeCount = count ?? 0;
    const needed = newPlanNumberOfUsers - activeCount;

    if (needed > 0) {
      const { data: inactiveProfiles } = await supabase
        .from("profiles")
        .select("userId")
        .eq("storeId", storeId)
        .eq("role", "employee")
        .eq("isActive", false)
        .order("created_at", { ascending: true })
        .limit(needed);

      if (inactiveProfiles?.length) {
        const userIds = inactiveProfiles.map(p => p.userId);

        await supabase
          .from("profiles")
          .update({ isActive: true })
          .in("userId", userIds);

        await supabase
          .from("employees")
          .update({ isActive: true })
          .in("employeeId", userIds);
      }
    }
  }
}

// ========================
// MAIN ACTIONS
// ========================

export async function updateSubscription(formData: FormData) {
  try {
    const validatedData = subscriptionUpdateSchema.parse({
      subscriptionId: formData.get("subscriptionId"),
      months: formData.get("months"),
      planId: formData.get("planId"),
    });

    const { supabase } = await checkAdminAccess();

    // Validate new plan
    const { data: newPlan } = await supabase
      .from("plans")
      .select("planId, numberOfUsers")
      .eq("planId", validatedData.planId)
      .single();

    if (!newPlan) {
      return {
        success: false,
        message: "Plan invalide",
      };
    }

    // Get current subscription
    const { data: currentSub } = await supabase
      .from("subscriptions")
      .select("planId, endAt, storeId")
      .eq("subscriptionId", validatedData.subscriptionId)
      .single();

    if (!currentSub) {
      return {
        success: false,
        message: "Abonnement introuvable",
      };
    }

    // Get current plan
    const { data: currentPlan } = await supabase
      .from("plans")
      .select("numberOfUsers")
      .eq("planId", currentSub.planId)
      .single();

    // Calculate new end date
    const baseDate = new Date(currentSub.endAt || new Date());
    const newEndAt = new Date(baseDate);
    newEndAt.setDate(baseDate.getDate() + validatedData.months * 30);

    // Handle employee activation/deactivation based on plan changes
    await handleEmployeeActivation(
      supabase,
      currentSub.storeId,
      newPlan.numberOfUsers,
      currentPlan?.numberOfUsers ?? 0
    );

    // Update subscription
    const { error } = await supabase
      .from("subscriptions")
      .update({
        planId: validatedData.planId,
        endAt: newEndAt.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq("subscriptionId", validatedData.subscriptionId);

    if (error) {
      console.error("Error updating subscription:", error);
      return {
        success: false,
        message: "Échec de la mise à jour de l'abonnement",
      };
    }

    revalidatePath("/manager");
    return {
      success: true,
      message: `Abonnement mis à jour avec succès ! Nouvelle date d'expiration : ${format(newEndAt, "dd MMMM yyyy", { locale: fr })}`,
    };
  } catch (error) {
    console.error("Update subscription error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message,
      };
    }

    if (error instanceof Error && error.message === "Accès administrateur requis") {
      return {
        success: false,
        message: "Accès administrateur requis",
      };
    }

    return {
      success: false,
      message: "Une erreur serveur s'est produite",
    };
  }
}

export async function processSubscriptionCode(formData: FormData) {
  try {
    const validatedData = processCodeSchema.parse({
      codeId: formData.get("codeId"),
      planId: formData.get("planId"),
      months: formData.get("months"),
    });

    const { supabase } = await checkAdminAccess();

    // Get the subscription code with store info
    const { data: subscriptionCode, error: codeError } = await supabase
      .from("subscription_codes")
      .select(`
        *,
        stores!subscription_codes_storeId_fkey (
          storeId
        )
      `)
      .eq("codeId", validatedData.codeId)
      .single();

    if (codeError || !subscriptionCode) {
      return {
        success: false,
        message: "Code de paiement introuvable",
      };
    }

    // Check if code is already settled
    if (subscriptionCode.isSettled) {
      return {
        success: false,
        message: "Ce code a déjà été traité",
      };
    }

    const storeId = subscriptionCode.storeId;

    // Validate the plan
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("planId, name, price, numberOfUsers")
      .eq("planId", validatedData.planId)
      .single();

    if (planError || !plan) {
      return {
        success: false,
        message: "Plan invalide",
      };
    }

    // Get or create subscription for this store
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("storeId", storeId)
      .single();

    // Calculate new end date
    const baseDate = existingSubscription?.endAt
      ? new Date(existingSubscription.endAt)
      : new Date();

    const newEndAt = new Date(baseDate);
    newEndAt.setMonth(newEndAt.getMonth() + validatedData.months);

    let subscriptionId: string;

    if (existingSubscription) {
      // Get current plan for employee management
      const { data: currentPlan } = await supabase
        .from("plans")
        .select("numberOfUsers")
        .eq("planId", existingSubscription.planId)
        .single();

      // Handle employee activation/deactivation
      await handleEmployeeActivation(
        supabase,
        storeId,
        plan.numberOfUsers,
        currentPlan?.numberOfUsers ?? 0
      );

      // Update existing subscription
      const { data: updatedSub, error: updateError } = await supabase
        .from("subscriptions")
        .update({
          planId: validatedData.planId,
          endAt: newEndAt.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq("subscriptionId", existingSubscription.subscriptionId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        return {
          success: false,
          message: "Erreur lors de la mise à jour de l'abonnement",
        };
      }
      subscriptionId = updatedSub.subscriptionId;
    } else {
      // Get store owner
      const { data: storeOwner } = await supabase
        .from("profiles")
        .select("userId")
        .eq("storeId", storeId)
        .eq("role", "user")
        .single();

      // Create new subscription
      const { data: newSub, error: createError } = await supabase
        .from("subscriptions")
        .insert({
          userId: storeOwner?.userId,
          storeId: storeId,
          planId: validatedData.planId,
          endAt: newEndAt.toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating subscription:", createError);
        return {
          success: false,
          message: "Erreur lors de la création de l'abonnement",
        };
      }
      subscriptionId = newSub.subscriptionId;

      // Update store with subscription ID
      await supabase
        .from("stores")
        .update({ subscriptionId: newSub.subscriptionId })
        .eq("storeId", storeId);
    }

    // Mark subscription code as settled
    const { error: settleError } = await supabase
      .from("subscription_codes")
      .update({
        isSettled: true,
        updatedAt: new Date().toISOString(),
      })
      .eq("codeId", validatedData.codeId);

    if (settleError) {
      console.error("Error settling code:", settleError);
      return {
        success: false,
        message: "Erreur lors de la validation du code",
      };
    }

    // Create a transaction record
    await supabase
      .from("transactions")
      .insert({
        userId: subscriptionCode.storeId, // Using storeId as reference
        storeId: storeId,
        type: "subscription_payment",
        description: `Paiement d'abonnement ${plan.name} - Code: ${subscriptionCode.code}`,
        totalPrice: plan.price * validatedData.months,
        created_at: new Date().toISOString(),
      });

    revalidatePath("/manager");
    return {
      success: true,
      message: `Abonnement ${plan.name} activé avec succès pour ${validatedData.months} mois. Valable jusqu'au ${format(newEndAt, "dd MMMM yyyy", { locale: fr })}`,
    };
  } catch (error) {
    console.error("Error processing subscription code:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message,
      };
    }

    if (error instanceof Error && error.message === "Accès administrateur requis") {
      return {
        success: false,
        message: "Accès administrateur requis",
      };
    }

    return {
      success: false,
      message: "Une erreur s'est produite lors du traitement du code",
    };
  }
}

export async function rejectSubscriptionCode(codeId: string) {
  try {
    const { supabase } = await checkAdminAccess();

    // Check if code exists
    const { data: subscriptionCode, error: codeError } = await supabase
      .from("subscription_codes")
      .select("*")
      .eq("codeId", codeId)
      .single();

    if (codeError || !subscriptionCode) {
      return {
        success: false,
        message: "Code de paiement introuvable",
      };
    }

    // Check if code is already settled
    if (subscriptionCode.isSettled) {
      return {
        success: false,
        message: "Ce code a déjà été traité",
      };
    }

    // Mark code as settled but with a rejected status (we'll add a reason field)
    const { error: rejectError } = await supabase
      .from("subscription_codes")
      .update({
        isSettled: true,
        updatedAt: new Date().toISOString(),
      })
      .eq("codeId", codeId);

    if (rejectError) {
      console.error("Error rejecting code:", rejectError);
      return {
        success: false,
        message: "Erreur lors du rejet du code",
      };
    }

    revalidatePath("/manager");
    return {
      success: true,
      message: "Code rejeté avec succès",
    };
  } catch (error) {
    console.error("Error rejecting subscription code:", error);

    if (error instanceof Error && error.message === "Accès administrateur requis") {
      return {
        success: false,
        message: "Accès administrateur requis",
      };
    }

    return {
      success: false,
      message: "Une erreur s'est produite lors du rejet du code",
    };
  }
}

export async function getManagerStats() {
  try {
    const { supabase } = await checkAdminAccess();

    // Get all subscription codes
    const { data: subscriptionCodes, error: codesError } = await supabase
      .from("subscription_codes")
      .select("*");

    if (codesError) {
      console.error("Error fetching subscription codes:", codesError);
      throw new Error("Erreur de chargement des statistiques");
    }

    // Get all stores
    const { data: stores, error: storesError } = await supabase
      .from("stores")
      .select("storeId");

    if (storesError) {
      console.error("Error fetching stores:", storesError);
      throw new Error("Erreur de chargement des statistiques");
    }

    // Get all active subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select("planId, endAt")
      .gte("endAt", new Date().toISOString());

    if (subsError) {
      console.error("Error fetching subscriptions:", subsError);
      throw new Error("Erreur de chargement des statistiques");
    }

    // Get all plans for revenue calculation
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("planId, price");

    if (plansError) {
      console.error("Error fetching plans:", plansError);
      throw new Error("Erreur de chargement des statistiques");
    }

    // Calculate stats
    const totalCodes = subscriptionCodes?.length || 0;
    const pendingCodes = subscriptionCodes?.filter(code => !code.isSettled).length || 0;
    const settledCodes = subscriptionCodes?.filter(code => code.isSettled).length || 0;
    const totalStores = stores?.length || 0;
    const activeSubscriptions = subscriptions?.length || 0;

    // Calculate expiring soon (within 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const expiringSoon = subscriptions?.filter(sub => {
      const endDate = new Date(sub.endAt);
      return endDate >= today && endDate <= nextWeek;
    }).length || 0;

    // Calculate total revenue from settled codes
    const totalRevenue = subscriptionCodes
      ?.filter(code => code.isSettled)
      .reduce((sum, code) => {
        // We need to get the plan price for each settled code
        // This is a simplified calculation - in reality you'd need to know which plan was purchased
        const averagePlanPrice = 25000; // Average plan price in KMF
        return sum + averagePlanPrice;
      }, 0) || 0;

    return {
      success: true,
      data: {
        totalCodes,
        pendingCodes,
        settledCodes,
        totalStores,
        activeSubscriptions,
        expiringSoon,
        totalRevenue,
      },
    };
  } catch (error) {
    console.error("Error getting manager stats:", error);

    if (error instanceof Error && error.message === "Accès administrateur requis") {
      return {
        success: false,
        message: "Accès administrateur requis",
      };
    }

    return {
      success: false,
      message: "Une erreur s'est produite lors du chargement des statistiques",
    };
  }
}


export async function deleteSubscriptionCode(codeId: string) {
  try {
    const { supabase } = await checkAdminAccess();

    // Check if code exists
    const { data: subscriptionCode, error: codeError } = await supabase
      .from("subscription_codes")
      .select("*")
      .eq("codeId", codeId)
      .single();

    if (codeError || !subscriptionCode) {
      return {
        success: false,
        message: "Code de paiement introuvable",
      };
    }

    // Delete the code
    const { error: deleteError } = await supabase
      .from("subscription_codes")
      .delete()
      .eq("codeId", codeId);

    if (deleteError) {
      console.error("Error deleting code:", deleteError);
      return {
        success: false,
        message: "Erreur lors de la suppression du code",
      };
    }

    revalidatePath("/manager");
    return {
      success: true,
      message: "Code supprimé avec succès",
    };
  } catch (error) {
    console.error("Error deleting subscription code:", error);

    if (error instanceof Error && error.message === "Accès administrateur requis") {
      return {
        success: false,
        message: "Accès administrateur requis",
      };
    }

    return {
      success: false,
      message: "Une erreur s'est produite lors de la suppression du code",
    };
  }
}



export async function renewSubscription(formData: FormData) {
  try {
    const subscriptionId = formData.get("subscriptionId") as string;
    const months = parseInt(formData.get("months") as string);
    const planId = parseInt(formData.get("planId") as string);

    // Validation
    if (!subscriptionId) {
      return {
        success: false,
        message: "ID d'abonnement requis",
      };
    }

    if (!months || months < 1 || months > 12) {
      return {
        success: false,
        message: "Durée invalide (1-12 mois)",
      };
    }

    if (!planId || planId < 1 || planId > 3) {
      return {
        success: false,
        message: "Plan invalide",
      };
    }

    const { supabase } = await checkAdminAccess();

    // Get current subscription
    const { data: currentSub, error: subError } = await supabase
      .from("subscriptions")
      .select("endAt, planId, storeId")
      .eq("subscriptionId", subscriptionId)
      .single();

    if (subError || !currentSub) {
      return {
        success: false,
        message: "Abonnement introuvable",
      };
    }

    // CRITICAL FIX: Check if subscription has expired
    const today = new Date();
    const currentEndDate = currentSub.endAt ? new Date(currentSub.endAt) : null;
    
    let newEndAt: Date;
    
    if (currentEndDate && currentEndDate > today) {
      // Subscription is still active - renew from end date
      // Example: Ends May 15th, renewing 1 month => Ends June 15th
      newEndAt = new Date(currentEndDate);
      newEndAt.setMonth(newEndAt.getMonth() + months);
    } else {
      // Subscription has expired or no end date - start from today
      // Example: Expired Nov 15th, renewing 1 month => Ends Dec 15th (from today)
      newEndAt = new Date(today);
      newEndAt.setMonth(newEndAt.getMonth() + months);
    }

    // Also handle employee activation/deactivation based on plan change
    // Get the current plan to compare with new plan
    const { data: currentPlan } = await supabase
      .from("plans")
      .select("numberOfUsers")
      .eq("planId", currentSub.planId)
      .single();

    const { data: newPlan } = await supabase
      .from("plans")
      .select("numberOfUsers")
      .eq("planId", planId)
      .single();

    if (currentPlan && newPlan && currentSub.storeId) {
      // Handle employee activation/deactivation
      if (newPlan.numberOfUsers < currentPlan.numberOfUsers) {
        // Downgrade: Need to deactivate excess employees
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: 'exact' })
          .eq("storeId", currentSub.storeId)
          .eq("isActive", true);

        const activeCount = count ?? 0;

        if (activeCount > newPlan.numberOfUsers) {
          const toDeactivate = activeCount - newPlan.numberOfUsers;

          // Get oldest active employees (profiles with role "employee")
          const { data: excessProfiles } = await supabase
            .from("profiles")
            .select("userId")
            .eq("storeId", currentSub.storeId)
            .eq("role", "employee")
            .eq("isActive", true)
            .order("created_at", { ascending: true })
            .limit(toDeactivate);

          if (excessProfiles?.length) {
            const userIds = excessProfiles.map(p => p.userId);

            // Deactivate in profiles table
            await supabase
              .from("profiles")
              .update({ isActive: false })
              .in("userId", userIds);

            // Deactivate in employees table
            await supabase
              .from("employees")
              .update({ isActive: false })
              .in("employeeId", userIds);
          }
        }
      } else if (newPlan.numberOfUsers > currentPlan.numberOfUsers) {
        // Upgrade: Can reactivate deactivated employees
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: 'exact' })
          .eq("storeId", currentSub.storeId)
          .eq("isActive", true);

        const activeCount = count ?? 0;
        const needed = newPlan.numberOfUsers - activeCount;

        if (needed > 0) {
          const { data: inactiveProfiles } = await supabase
            .from("profiles")
            .select("userId")
            .eq("storeId", currentSub.storeId)
            .eq("role", "employee")
            .eq("isActive", false)
            .order("created_at", { ascending: true })
            .limit(needed);

          if (inactiveProfiles?.length) {
            const userIds = inactiveProfiles.map(p => p.userId);

            // Reactivate in profiles table
            await supabase
              .from("profiles")
              .update({ isActive: true })
              .in("userId", userIds);

            // Reactivate in employees table
            await supabase
              .from("employees")
              .update({ isActive: true })
              .in("employeeId", userIds);
          }
        }
      }
    }

    // Update subscription
    const { error } = await supabase
      .from("subscriptions")
      .update({
        planId,
        endAt: newEndAt.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq("subscriptionId", subscriptionId);

    if (error) {
      console.error("Error renewing subscription:", error);
      return {
        success: false,
        message: "Échec du renouvellement",
      };
    }

    // Also update the planId in the store for consistency
    await supabase
      .from("stores")
      .update({ 
        subscriptionId: subscriptionId,
        updatedAt: new Date().toISOString()
      })
      .eq("storeId", currentSub.storeId);

    revalidatePath("/manager");
    
    // Provide informative message
    const baseDateMessage = currentEndDate && currentEndDate > today 
      ? "à partir de la date d'expiration actuelle"
      : "à partir d'aujourd'hui (abonnement expiré)";
    
    return {
      success: true,
      message: `Abonnement renouvelé avec succès ! ${baseDateMessage}. Nouvelle date d'expiration : ${format(newEndAt, "dd MMMM yyyy", { locale: fr })}`,
    };
  } catch (error) {
    console.error("Error renewing subscription:", error);

    if (error instanceof Error && error.message === "Accès administrateur requis") {
      return {
        success: false,
        message: "Accès administrateur requis",
      };
    }

    return {
      success: false,
      message: "Une erreur s'est produite lors du renouvellement",
    };
  }
}




const renewSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid({ message: "ID d'abonnement invalide" }),
  months: z.coerce
    .number({ invalid_type_error: "Nombre requis" })
    .int({ message: "Doit être un nombre entier" })
    .min(1, { message: "Minimum 1 mois" })
    .max(12, { message: "Maximum 12 mois" }),
  planId: z.coerce
    .number({ invalid_type_error: "Plan requis" })
    .int({ message: "Plan invalide" })
    .min(1, { message: "Plan invalide" })
    .max(3, { message: "Plan invalide" }),
});

// export async function renewSubscription(formData: FormData) {
//   try {
//     const validatedData = renewSubscriptionSchema.parse({
//       subscriptionId: formData.get("subscriptionId"),
//       months: formData.get("months"),
//       planId: formData.get("planId"),
//     });

//     const supabase = createSupabaseServerClient();
    
//     // Check admin access
//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       return {
//         success: false,
//         message: "Authentification requise",
//       };
//     }

//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("role")
//       .eq("userId", user.id)
//       .single();

//     if (profile?.role !== "admin") {
//       return {
//         success: false,
//         message: "Accès administrateur requis",
//       };
//     }

//     // Get current subscription
//     const { data: currentSub, error: subError } = await supabase
//       .from("subscriptions")
//       .select("endAt, planId, storeId")
//       .eq("subscriptionId", validatedData.subscriptionId)
//       .single();

//     if (subError || !currentSub) {
//       return {
//         success: false,
//         message: "Abonnement introuvable",
//       };
//     }

//     // Calculate new end date
//     const baseDate = new Date(currentSub.endAt || new Date());
//     const newEndAt = new Date(baseDate);
//     newEndAt.setMonth(newEndAt.getMonth() + validatedData.months);

//     // Update subscription
//     const { error } = await supabase
//       .from("subscriptions")
//       .update({
//         planId: validatedData.planId,
//         endAt: newEndAt.toISOString(),
//         updatedAt: new Date().toISOString(),
//       })
//       .eq("subscriptionId", validatedData.subscriptionId);

//     if (error) {
//       console.error("Error renewing subscription:", error);
//       return {
//         success: false,
//         message: "Échec du renouvellement",
//       };
//     }

//     revalidatePath("/manager");
//     return {
//       success: true,
//       message: `Abonnement renouvelé avec succès ! Nouvelle date d'expiration : ${format(newEndAt, "dd MMMM yyyy", { locale: fr })}`,
//     };
//   } catch (error) {
//     console.error("Error renewing subscription:", error);

//     if (error instanceof z.ZodError) {
//       return {
//         success: false,
//         message: error.errors[0].message,
//       };
//     }

//     return {
//       success: false,
//       message: "Une erreur s'est produite lors du renouvellement",
//     };
//   }
// }