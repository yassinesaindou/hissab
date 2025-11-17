"use server";
import {
  createSupabaseServerClient,
  createSubscription,
  createStore,
} from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isUserSubscriptionActive } from "@/lib/utils/utils";



const SignupFormSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Le nom doit avoir au moins 2 caractères." })
      .max(50, { message: "Le nom doit comporter au maximum 50 caractères." }),
    email: z
      .string()
      .min(7, { message: "L'email doit avoir au moins 7 caractères." })
      .max(50)
      .email({ message: "Veuillez entrer une adresse email valide." }),
    phone: z
      .string()
      .min(10, {
        message: "Le numero de telephone doit avoir au moins 10 chiffres.",
      })
      .max(15, {
        message: "Le numero de telephone doit avoir au maximum 15 chiffres.",
      })
      .regex(/^\+?\d+$/, {
        message:
          "Le numero de telephone doit contenir uniquement des chiffres et un signe plus (+) au debut.",
      }),
    password: z
      .string()
      .min(8, { message: "Le mot de passe doit avoir au moins 8 caractères." })
      .max(50),
    confirmPassword: z
      .string()
      .min(8, { message: "Le mot de passe doit avoir au moins 8 caractères." })
      .max(50),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });
const loginFormSchema = z.object({
  email: z
    .string()
    .min(7, { message: "Email must be at least 7 characters." })
    .max(50)
    .email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .max(50),
});

type LoginFormData = z.infer<typeof loginFormSchema>;
type SignupFormData = z.infer<typeof SignupFormSchema>;

export async function signupAction(formData: SignupFormData) {
  try {
    // Validate form data
    const validatedData = SignupFormSchema.parse(formData);

    // Initialize Supabase server client
    const supabase = createSupabaseServerClient();

    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
          phoneNumber: validatedData.phone,
        },
      },
    });

    if (authError || !authData.user) {
      return {
        success: false,
        message: authError?.message.includes("already registered")
          ? "L'email est déjà enregistré"
          : authError?.message || "Echec de l'inscription",
      };
    }

    // Create profile (skip if using Supabase trigger)
    const { error: profileError } = await supabase.from("profiles").insert({
      userId: authData.user.id,
      name: validatedData.name,
      phoneNumber: validatedData.phone,
      email: validatedData.email,
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Error creating profile:", profileError.message);
      return { success: false, message: "Failed to create profile" };
    }

    const storeData = await createStore(authData.user.id);

    if (!storeData) {
      return { success: false, message: "Failed to create store" };
    }

    // Create subscription
  const subscription = await createSubscription(
  authData.user.id,
  2, // ← Pro plan ID
  storeData.storeId
);
    if (!subscription) {
      return { success: false, message: "Echec durant la souscription" };
    }

    const { error: updateStoreError } = await supabase
      .from("stores")
      .update({ subscriptionId: subscription.subscriptionId })
      .eq("storeId", storeData.storeId);

    if (updateStoreError) {
      console.error(
        "Error updating store with subscription:",
        updateStoreError.message
      );
    }

    // Update profile with subscriptionId
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscriptionId: subscription.subscriptionId,
        storeId: storeData.storeId,
      })
      .eq("userId", authData.user.id);

    if (updateError) {
      console.error(
        "Error updating profile with subscription:",
        updateError.message
      );
      return { success: false, message: "Failed to link subscription" };
    }

    return {
      success: true,
      message:
        "Inscription réussie, veuilller verifier votre email pour confirmer votre compte.",
    };
  } catch (error) {
    console.error("Une erreur s'est produite lors de l'inscription:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite" };
  }
}

export async function loginAction(formData: LoginFormData) {
  try {
    // Validate form data
    const validatedData = loginFormSchema.parse(formData);

    // Initialize Supabase server client
    const supabase = createSupabaseServerClient();

    // Sign in user with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error || !data.session) {
      return {
        success: false,
        message: error?.message.includes("Invalid login credentials")
          ? "Mot de passe ou email incorrect"
          : error?.message || "Echec durant la connexion",
      };
    }

    // Session is automatically set via cookies by @supabase/ssr
    return { success: true, message: "Login successful" };
  } catch (error) {
    console.error("Unexpected error during login:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite" };
  }
}

export async function logoutAction() {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout error:", error.message);
    throw new Error("Failed to log out");
  }
  redirect("/login");
}

// Products

const productFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Le nom du produit doit avoir au moins 2 caractères." })
    .max(100, {
      message: "Le nom du produit doit avoir moins de 100 caractères.",
    }),
  stock: z
    .number()
    .int({ message: "Le stock doit etre un nombre entier." })
    .min(0, { message: "Le stock doit etre non-negative." }),
  unitPrice: z
    .number()
    .min(0, { message: "Le prix unitaire doit etre non-negative." })
    .max(1000000, {
      message: "Le prix unitaire doit avoir moins de 1 000 000.",
    }),
  category: z
    .string()
    .max(50, { message: "La categorie doit avoir moins de 50 caractères." })
    .optional(),
  description: z
    .string()
    .max(500, { message: "La description doit avoir moins de 500 caractères." })
    .optional(),
});

// type ProductFormData = z.infer<typeof productFormSchema>;

export async function newProductAction(formData: FormData) {
  try {
    const validatedData = productFormSchema.parse({
      name: formData.get("name"),
      stock: Number(formData.get("stock")),
      unitPrice: Number(formData.get("unitPrice")),
      category: formData.get("category") || undefined,
      description: formData.get("description") || undefined,
    });

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login"); // Redirect for auth errors
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();
    const storeId = data?.storeId;
    // Check if the user has an active subscription
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

    const { error } = await supabase.from("products").insert({
      userId: user.id,
      name: validatedData.name,
      stock: validatedData.stock,
      unitPrice: validatedData.unitPrice,
      storeId: storeId,
      category: validatedData.category,
      description: validatedData.description,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error creating product:", error.message);
      return { success: false, message: "Echec durant la creation du produit" };
    }

    return { success: true, message: "Produit ajouté avec succès." };
  } catch (error) {
    console.error("Unexpected error during product creation:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite" };
  }
}

const updateProductFormSchema = productFormSchema.extend({
  productId: z
    .string()
    .uuid({ message: "L' identifiant du produit est incorrect." }),
});

// type UpdateProductFormData = z.infer<typeof updateProductFormSchema>;

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

    if (data?.role === "employee")
      return {
        success: false,
        message: "Vous n'avez pas les droits pour modifier ce produit.",
      };
    const storeId = data?.storeId;
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    // Check if the user has an active subscription
    const isSubscriptionActive = await isUserSubscriptionActive(storeId);

    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Ta souscription a expiré, veuillez la renouveler.",
      };
    }

    // Verify the product exists and belongs to the user
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("storeId")
      .eq("productId", validatedData.productId)
      .single();

    if (fetchError || !product) {
      console.error(
        "Echec durant la recherche du produit",
        fetchError?.message
      );
      return { success: false, message: "Produit introuvable" };
    }

    if (product.storeId !== storeId) {
      return {
        success: false,
        message: "Vous n'êtes pas autorisé de modifier ce produit",
      };
    }

    // Update the product
    const { error } = await supabase
      .from("products")
      .update({
        name: validatedData.name,
        stock: validatedData.stock,
        unitPrice: validatedData.unitPrice,
        category: validatedData.category,
        description: validatedData.description,
      })
      .eq("productId", validatedData.productId);

    if (error) {
      console.error("Error updating product:", error.message);
      return {
        success: false,
        message: "Echec durant la mise à jour du produit",
      };
    }

    return { success: true, message: "Produit mis à jour avec succès." };
  } catch (error) {
    console.error("Unexpected error during product update:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite" };
  }
}

/// CREDITS

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
    .min(0, { message: "Le montant doit etre positif." })
    .max(1000000, { message: "Le montant doit pas exéder 1 000 000." }),
  status: z.enum(["pending", "paid", "overdue"]).optional().default("pending"),
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
    .int({ message: "Le nombre de produits pris doit etre entier." })
    .min(1, { message: "Le nombre de produits pris doit etre au moins 1." })
    .optional(),
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
      redirect("/login");
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();
    const storeId = data?.storeId;
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }
    // Check if the user has an active subscription
    const isSubscriptionActive = await isUserSubscriptionActive(storeId);

    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Ta souscription a expiré, veuillez la renouveler.",
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
          message: "Vous n'êtes pas autorisé de modifier ce produit",
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
          message: "Echec durant la mise à jour du produit",
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
      return { success: false, message: "Echec durant la création du crédit" };
    }

    return { success: true, message: "Création du crédit reussie" };
  } catch (error) {
    console.error("Unexpected error during credit creation:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite" };
  }
}

const updateCreditFormSchema = creditFormSchema.extend({
  creditId: z
    .string()
    .uuid({ message: "L'identifiant du crédit est incorrect." }),
});

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
      redirect("/login");
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();
    const storeId = data?.storeId;
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }
    // Check if the user has an active subscription
    const isSubscriptionActive = await isUserSubscriptionActive(storeId);

    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Ta souscription a expiré, veuillez la renouveler.",
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
        message: "Vous n'êtes pas autorisé de modifier ce crédit",
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
          message: "Vous n'êtes pas autorisé de modifier ce produit",
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
        message: "Echec durant la mise à jour du crédit",
      };
    }

    return { success: true, message: "Mise à jour du crédit reussie" };
  } catch (error) {
    console.error("Unexpected error during credit update:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite" };
  }
}

//Transactions

const baseTransactionFormSchema = z.object({
  productId: z
    .string()
    .uuid({ message: "L'identifiant du produit est incorrect." })
    .optional(),
  productName: z
    .string()
    .max(100, { message: "Product name must be at most 100 characters." })
    .optional(),
  unitPrice: z
    .number()
    .min(0, { message: "Unit price must be non-negative" })
    .max(1000000, { message: "Unit price too high" }),
  quantity: z
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

    // === 1. CHECK SUBSCRIPTION ACTIVE ===
    const isSubscriptionActive = await isUserSubscriptionActive(storeId);
    if (!isSubscriptionActive) {
      return { success: false, message: "Votre abonnement a expiré. Veuillez le renouveler." };
    }

    // === 2. GET PLAN'S DAILY TRANSACTION LIMIT ===
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

    // === 3. COUNT TODAY'S Transactions === 
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

    // === 4. PROCEED WITH TRANSACTION ===
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

    // === 5. INSERT TRANSACTION ===
    const { error: insertError } = await supabase.from("transactions").insert({
      storeId,
      userId: user.id,
      productId: validatedData.productId === "none" ? null : validatedData.productId,
      productName: validatedData.productName === "none" ? null : validatedData.productName,
      unitPrice,
      totalPrice,
      quantity: validatedData.quantity,
      type: validatedData.type,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return { success: false, message: "Échec création transaction." };
    }

    return { success: true, message: "Transaction ajoutée avec succès." };
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
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }
    // Check if the user has an active subscription
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

    return { success: true, message: "La transaction a bien été mise à jour" };
  } catch (error) {
    console.error("Unexpected error during transaction update:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "Une erreur s'est produite" };
  }
}


// Download transactions as CSV















// Dashbord Actions

export async function getRecentTransactions() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Non autorisé", transactions: [] };
    }

    const { data: storeData } = await supabase
      .from("profiles")
      .select("storeId, role")
      .eq("userId", user.id)
      .single();

    let storeId = storeData?.storeId;
    console.log("Store Data", storeData);

    if (storeData?.role === "employee") {
      storeId = user.id;
    }
    const comparionColumn =
      storeData?.role === "employee" ? "userId" : "storeId";
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("transactionId, created_at, type, totalPrice, productName")
      .eq(comparionColumn, storeId)
      .in("type", ["sale", "expense"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching transactions:", error.message);
      return {
        success: false,
        message: "Echec durant la recherche des transactions",
        transactions: [],
      };
    }

    // Map data to match RecentTransactionTable structure
    const transactions = data.map((t, index) => ({
      id: index + 1, // 1-based Sr No
      date: new Date(t.created_at).toISOString().split("T")[0], // YYYY-MM-DD
      type: t.type.charAt(0).toUpperCase() + t.type.slice(1), // Capitalize (Sale, Expense)
      amount: t.totalPrice,
      description: t.productName || "N/A",
    }));

    return {
      success: true,
      message: "Les transactions ont été récherchées avec succès",
      transactions,
    };
  } catch (error) {
    console.error("Unexpected error fetching transactions:", error);
    return {
      success: false,
      message: "Une erreur s'est produite",
      transactions: [],
    };
  }
}

export async function getRecentCredits() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Non autorisé", credits: [] };
    }

    const { data: storeData } = await supabase
      .from("profiles")
      .select("storeId , role")
      .eq("userId", user.id)
      .single();

    const storeId =
      storeData?.role === "employee" ? user.id : storeData?.storeId;

    console.log("Store Data", storeData);

    const comparionColumn =
      storeData?.role === "employee" ? "userId" : "storeId";
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    const { data, error } = await supabase
      .from("credits")
      .select("creditId, customerName, customerPhone, amount")
      .eq(comparionColumn, storeId)
      .order("created_at", { ascending: false })
      .limit(10);

    console.log("Credits ", data);

    if (error) {
      console.error("Error fetching credits:", error.message);
      return {
        success: false,
        message: "Echec durant la recherche des crédits",
        credits: [],
      };
    }

    const credits = data.map((c, index) => ({
      id: index + 1, // 1-based Sr No
      name: c.customerName,
      phone: c.customerPhone,
      amount: c.amount,
    }));

    return {
      success: true,
      message: "Crédits récherchés avec succès.",
      credits,
    };
  } catch (error) {
    console.error("Unexpected error fetching credits:", error);
    return {
      success: false,
      message: "Une erreur s'est produite",
      credits: [],
    };
  }
}

export async function getDashboardData() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Non autorisé", data: {} };
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId , role")
      .eq("userId", user.id)
      .single();
    let storeId = data?.storeId;

    if (data?.role === "employee") {
      storeId = user.id;
    }

    const comparionColumn = data?.role === "employee" ? "userId" : "storeId";
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Fetch transactions for sales and expenses
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("created_at, type, totalPrice")
      .eq(comparionColumn, storeId)
      .in("type", ["sale", "expense"])
      .gte("created_at", fourteenDaysAgo.toISOString());

    if (txError) {
      console.error("Error fetching transactions:", txError.message);
      return {
        success: false,
        message: "Echec durant la recherche des transactions",
        data: {},
      };
    }

    // Fetch credits
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select("created_at, amount")
      .eq(comparionColumn, storeId)
      .eq("status", "pending")
      .gte("created_at", fourteenDaysAgo.toISOString());

    if (creditsError) {
      console.error("Error fetching credits:", creditsError.message);
      return {
        success: false,
        message: "Echec durant la recherche des crédits",
        data: {},
      };
    }

    // Calculate totals
    const totalSales = transactions
      .filter((t) => t.type === "sale")
      .reduce((sum, t) => sum + t.totalPrice, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.totalPrice, 0);
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);

    const totalRevenue = totalSales - totalExpenses;

    // Generate daily data for 14 days
    const dailyData = Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.toLocaleString("en-US", { weekday: "short" });
      const dailySales = transactions
        .filter(
          (t) =>
            t.type === "sale" &&
            new Date(t.created_at).toDateString() === date.toDateString()
        )
        .reduce((sum, t) => sum + t.totalPrice, 0);
      const dailyExpenses = transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            new Date(t.created_at).toDateString() === date.toDateString()
        )
        .reduce((sum, t) => sum + t.totalPrice, 0);
      const dailyCredits = credits
        .filter(
          (c) => new Date(c.created_at).toDateString() === date.toDateString()
        )
        .reduce((sum, c) => sum + c.amount, 0);
      const dailyRevenue = dailySales - dailyExpenses;
      return {
        day,
        sales: dailySales,
        expenses: dailyExpenses,
        credits: dailyCredits,
        revenue: dailyRevenue,
      };
    }).reverse();

    return {
      success: true,
      message: "Les données du tableau de bord ont été récherchées avec succès",
      data: {
        sales: {
          total: totalSales,
          data: dailyData.map((d) => ({ day: d.day, sales: d.sales })),
        },
        expenses: {
          total: totalExpenses,
          data: dailyData.map((d) => ({ day: d.day, expenses: d.expenses })),
        },
        credits: {
          total: totalCredits,
          data: dailyData.map((d) => ({ day: d.day, credits: d.credits })),
        },
        revenue: {
          total: totalRevenue,
          data: dailyData.map((d) => ({ day: d.day, revenue: d.revenue })),
        },
      },
    };
  } catch (error) {
    console.error("Unexpected error fetching dashboard data:", error);
    return {
      success: false,
      message: "Une erreur s'est produite",
      data: {},
    };
  }
}

export async function getYearlyOverview() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Non autorisé", data: [] };
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId , role")
      .eq("userId", user.id)
      .single();
    const comparisonColumn = data?.role === "employee" ? "userId" : "storeId";
    const storeId = data?.role === "employee" ? user.id : data?.storeId;
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31);

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("created_at, type, totalPrice")
      .eq(comparisonColumn, storeId)
      .gte("created_at", startOfYear.toISOString())
      .lte("created_at", endOfYear.toISOString());

    if (txError) {
      console.error("Error fetching transactions:", txError.message);
      return {
        success: false,
        message: "Echec durant la recherche des transactions",
        data: [],
      };
    }

    // Fetch credits
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select("created_at, amount")
      .eq(comparisonColumn, storeId)
      .eq("status", "paid")
      .gte("created_at", startOfYear.toISOString())
      .lte("created_at", endOfYear.toISOString());

    if (creditsError) {
      console.error("Error fetching credits:", creditsError.message);
      return {
        success: false,
        message: "Echec durant la recherche des crédits",
        data: [],
      };
    }

    // Generate monthly data
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(new Date().getFullYear(), i, 1);
      return date.toLocaleString("en-US", { month: "short" });
    });

    const yearlyData = months.map((name, index) => {
      const monthStart = new Date(new Date().getFullYear(), index, 1);
      const monthEnd = new Date(new Date().getFullYear(), index + 1, 0);
      const monthTransactions = transactions.filter(
        (t) =>
          new Date(t.created_at) >= monthStart &&
          new Date(t.created_at) <= monthEnd
      );
      const monthCredits = credits.filter(
        (c) =>
          new Date(c.created_at) >= monthStart &&
          new Date(c.created_at) <= monthEnd
      );
      const sales = monthTransactions
        .filter((t) => t.type === "sale")
        .reduce((sum, t) => sum + t.totalPrice, 0);
      const expenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.totalPrice, 0);
      const creditsAmount = monthCredits.reduce((sum, c) => sum + c.amount, 0);
      const revenue = sales - expenses;
      return { name, sales, expenses, credits: creditsAmount, revenue };
    });

    return {
      success: true,
      message: "Les données annuelles ont été récherchées avec succès",
      data: yearlyData,
    };
  } catch (error) {
    console.error("Unexpected error fetching yearly data:", error);
    return {
      success: false,
      message: "Une erreur s'est produite",
      data: [],
    };
  }
}

// Graphs and Analytics

// New action for Analytics cards
// Updated action for Analytics cards
export async function getAnalyticsData(
  period: string,
  customStart?: string,
  customEnd?: string
) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Non autorisé", data: {} };
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId, role")
      .eq("userId", user.id)
      .single();
    const comparisonColumn = data?.role === "employee" ? "userId" : "storeId";
    const storeId = data?.role === "employee" ? user.id : data?.storeId;
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    // Calculate date range
    let startDate: Date;
    let endDate = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (period) {
      case "today":
        startDate = today;
        break;
      case "this_week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        break;
      case "last_30_days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case "last_90_days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        break;
      case "last_120_days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 120);
        break;
      case "last_365_days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 365);
        break;
      case "custom":
        if (!customStart || !customEnd) {
          return {
            success: false,
            message:
              "La durée personnalisée nécessite des dates de début et de fin.",
            data: {},
          };
        }
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        if (
          isNaN(startDate.getTime()) ||
          isNaN(endDate.getTime()) ||
          startDate > endDate
        ) {
          return {
            success: false,
            message: "Les dates personnalisées sont invalides",
            data: {},
          };
        }
        break;
      default:
        return { success: false, message: "Durée invalide", data: {} };
    }

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("type, totalPrice")
      .eq(comparisonColumn, storeId)
      .in("type", ["sale", "expense"])
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (txError) {
      console.error("Error fetching transactions:", txError.message);
      return {
        success: false,
        message: "Echec durant la recherche des transactions",
        data: {},
      };
    }

    // Fetch credits
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select("amount")
      .eq(comparisonColumn, storeId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (creditsError) {
      console.error("Error fetching credits:", creditsError.message);
      return {
        success: false,
        message: "Echec durant la recherche des crédits",
        data: {},
      };
    }

    // Fetch total products (no time filter)
    const { count: totalProducts, error: productsError } = await supabase
      .from("products")
      .select("productId", { count: "exact" })
      .eq("storeId", data?.storeId);

    if (productsError) {
      console.error("Error fetching products:", productsError.message);
      return {
        success: false,
        message: "Echec durant la recherche des produits",
        data: {},
      };
    }

    // Calculate totals
    const totalSales = transactions
      .filter((t) => t.type === "sale")
      .reduce((sum, t) => sum + Number(t.totalPrice || 0), 0);
    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.totalPrice || 0), 0);
    const totalCredits = credits.reduce(
      (sum, c) => sum + Number(c.amount || 0),
      0
    );
    const totalRevenue = totalSales - totalExpenses;

    // Validate serialization
    const analyticsData = {
      sales: { total: totalSales },
      expenses: { total: totalExpenses },
      credits: { total: totalCredits },
      revenue: { total: totalRevenue },
      products: { total: totalProducts || 0 },
    };

    try {
      JSON.stringify(analyticsData);
    } catch (e) {
      console.error("Analytics data serialization failed:", e);
      return {
        success: false,
        message: "Format de données analytiques invalide.",
        data: {
          sales: { total: 0 },
          expenses: { total: 0 },
          credits: { total: 0 },
          revenue: { total: 0 },
          products: { total: 0 },
        },
      };
    }

    console.log("Analytics data:", analyticsData);

    return {
      success: true,
      message: "Les données analytiques ont été récherchées avec succès",
      data: analyticsData,
    };
  } catch (error) {
    console.error("Unexpected error fetching analytics data:", error);
    return {
      success: false,
      message: "Une erreur s'est produite",
      data: {
        sales: { total: 0 },
        expenses: { total: 0 },
        credits: { total: 0 },
        revenue: { total: 0 },
        products: { total: 0 },
      },
    };
  }
}

export async function getGraphData(
  period: string,
  customStart?: string,
  customEnd?: string
) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return { success: false, message: "Non autorisé", data: [] };
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId, role")
      .eq("userId", user.id)
      .single();
    const storeId = data?.role === "employee" ? user.id : data?.storeId;
    const comparisonColumn = data?.role === "employee" ? "userId" : "storeId";
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    console.log("User ID:", user.id, "Period:", period, "Custom:", {
      customStart,
      customEnd,
    });

    // Calculate date range
    let startDate: Date;
    let endDate = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (period) {
      case "today":
        startDate = today;
        break;
      case "this_week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - (today.getDay() || 7) + 1); // Monday start
        break;
      case "last_30_days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case "last_90_days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        break;
      case "last_120_days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 120);
        break;
      case "last_365_days":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 365);
        break;
      case "custom":
        if (!customStart || !customEnd) {
          return {
            success: false,
            message:
              "La période personnalisée nécessite des dates de début et de fin.",
            data: [],
          };
        }
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        if (
          isNaN(startDate.getTime()) ||
          isNaN(endDate.getTime()) ||
          startDate > endDate
        ) {
          console.error("Invalid custom dates:", { customStart, customEnd });
          return {
            success: false,
            message: "Les dates personnalisées sont invalides",
            data: [],
          };
        }
        break;
      default:
        console.error("Invalid period:", period);
        return { success: false, message: "Période invalide", data: [] };
    }

    // Set precise time boundaries
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log("Date range:", {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("created_at, type, totalPrice")
      .eq(comparisonColumn, storeId)
      .in("type", ["sale", "expense"])
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (txError) {
      console.error("Transaction fetch error:", txError.message);
      return {
        success: false,
        message: "Echec durant la recherche des transactions",
        data: [],
      };
    }

    // Fetch credits
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select("created_at, amount")
      .eq(comparisonColumn, storeId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (creditsError) {
      console.error("Credits fetch error:", creditsError.message);
      return {
        success: false,
        message: "Echec durant la recherche des crédits",
        data: [],
      };
    }

    // Calculate granularity
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    let granularity: "daily" | "weekly" | "monthly";
    if (daysDiff <= 90) granularity = "daily";
    else if (daysDiff <= 120) granularity = "weekly";
    else granularity = "monthly";

    const chartData: {
      day: string;
      sales: number;
      expenses: number;
      credits: number;
      revenue: number;
    }[] = [];

    if (granularity === "daily") {
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const day = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const dailyTransactions = transactions.filter(
          (t) => new Date(t.created_at).toDateString() === date.toDateString()
        );
        const dailyCredits = credits.filter(
          (c) => new Date(c.created_at).toDateString() === date.toDateString()
        );

        const dailySales = dailyTransactions
          .filter((t) => t.type === "sale")
          .reduce((sum, t) => {
            const price = Number(t.totalPrice);
            if (isNaN(price)) {
              console.warn("Invalid transaction price:", t);
              return sum;
            }
            return sum + price;
          }, 0);
        const dailyExpenses = dailyTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => {
            const price = Number(t.totalPrice);
            if (isNaN(price)) {
              console.warn("Invalid transaction price:", t);
              return sum;
            }
            return sum + price;
          }, 0);
        const dailyCreditsSum = dailyCredits.reduce((sum, c) => {
          const amount = Number(c.amount);
          if (isNaN(amount)) {
            console.warn("Invalid credit amount:", c);
            return sum;
          }
          return sum + amount;
        }, 0);

        const revenue = dailySales - dailyExpenses;
        chartData.push({
          day,
          sales: dailySales,
          expenses: dailyExpenses,
          credits: dailyCreditsSum,
          revenue: isNaN(revenue) ? 0 : revenue,
        });
      }
    } else if (granularity === "weekly") {
      const startWeek = new Date(startDate);
      startWeek.setDate(startDate.getDate() - ((startWeek.getDay() || 7) - 1));
      for (let i = 0; i <= Math.ceil(daysDiff / 7); i++) {
        const weekStart = new Date(startWeek);
        weekStart.setDate(startWeek.getDate() + i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const day = `${weekStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${weekEnd.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`;
        const weeklySales = transactions
          .filter(
            (t) =>
              t.type === "sale" &&
              new Date(t.created_at) >= weekStart &&
              new Date(t.created_at) <= weekEnd
          )
          .reduce((sum, t) => {
            const price = Number(t.totalPrice);
            if (isNaN(price)) {
              console.warn("Invalid transaction price:", t);
              return sum;
            }
            return sum + price;
          }, 0);
        const weeklyExpenses = transactions
          .filter(
            (t) =>
              t.type === "expense" &&
              new Date(t.created_at) >= weekStart &&
              new Date(t.created_at) <= weekEnd
          )
          .reduce((sum, t) => {
            const price = Number(t.totalPrice);
            if (isNaN(price)) {
              console.warn("Invalid transaction price:", t);
              return sum;
            }
            return sum + price;
          }, 0);
        const weeklyCredits = credits
          .filter(
            (c) =>
              new Date(c.created_at) >= weekStart &&
              new Date(c.created_at) <= weekEnd
          )
          .reduce((sum, c) => {
            const amount = Number(c.amount);
            if (isNaN(amount)) {
              console.warn("Invalid credit amount:", c);
              return sum;
            }
            return sum + amount;
          }, 0);
        const revenue = weeklySales - weeklyExpenses;
        chartData.push({
          day,
          sales: weeklySales,
          expenses: weeklyExpenses,
          credits: weeklyCredits,
          revenue: isNaN(revenue) ? 0 : revenue,
        });
      }
    } else {
      const startMonth = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        1
      );
      const endMonth = new Date(
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        0
      );
      for (
        let month = new Date(startMonth);
        month <= endMonth;
        month.setMonth(month.getMonth() + 1)
      ) {
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        const day = month.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        const monthlySales = transactions
          .filter(
            (t) =>
              t.type === "sale" &&
              new Date(t.created_at) >= monthStart &&
              new Date(t.created_at) <= monthEnd
          )
          .reduce((sum, t) => {
            const price = Number(t.totalPrice);
            if (isNaN(price)) {
              console.warn("Invalid transaction price:", t);
              return sum;
            }
            return sum + price;
          }, 0);
        const monthlyExpenses = transactions
          .filter(
            (t) =>
              t.type === "expense" &&
              new Date(t.created_at) >= monthStart &&
              new Date(t.created_at) <= monthEnd
          )
          .reduce((sum, t) => {
            const price = Number(t.totalPrice);
            if (isNaN(price)) {
              console.warn("Invalid transaction price:", t);
              return sum;
            }
            return sum + price;
          }, 0);
        const monthlyCredits = credits
          .filter(
            (c) =>
              new Date(c.created_at) >= monthStart &&
              new Date(c.created_at) <= monthEnd
          )
          .reduce((sum, c) => {
            const amount = Number(c.amount);
            if (isNaN(amount)) {
              console.warn("Invalid credit amount:", c);
              return sum;
            }
            return sum + amount;
          }, 0);
        const revenue = monthlySales - monthlyExpenses;
        chartData.push({
          day,
          sales: monthlySales,
          expenses: monthlyExpenses,
          credits: monthlyCredits,
          revenue: isNaN(revenue) ? 0 : revenue,
        });
      }
    }

    // Validate serialization and data integrity
    for (const item of chartData) {
      if (
        isNaN(item.sales) ||
        isNaN(item.expenses) ||
        isNaN(item.credits) ||
        isNaN(item.revenue)
      ) {
        console.warn("Invalid chart data item:", item);
        return {
          success: false,
          message: "Invalid chart data values",
          data: [],
        };
      }
    }

    try {
      JSON.stringify(chartData);
    } catch (e) {
      console.error("Graph data serialization failed:", e);
      return {
        success: false,
        message: "Format de données de graphique invalide.",
        data: [],
      };
    }

    return {
      success: true,
      message: "Les données du graphique ont été récherchées avec succès",
      data: chartData,
    };
  } catch (error) {
    console.error("Unexpected error fetching graph data:", error);
    return {
      success: false,
      message: "Une erreur s'est produite",
      data: [],
    };
  }
}

// Invoice Page

export async function getProducts() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return { success: false, message: "Non autorisé", data: [] };
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();
    const storeId = data?.storeId;
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    const { data: products, error } = await supabase
      .from("products")
      .select("productId, name, unitPrice")
      .eq("storeId", storeId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching products:", error.message);
      return {
        success: false,
        message: "Echec durant la recherche des produits",
        data: [],
      };
    }

    return {
      success: true,
      message: "Les produits ont été récherchés avec succès",
      data: products,
    };
  } catch (error) {
    console.error("Unexpected error fetching products:", error);
    return {
      success: false,
      message: "Une erreur s'est produite",
      data: [],
    };
  }
}

interface ProductInput {
  productId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export async function createInvoice(formData: {
  clientName: string;
  clientPhone: string;
  storeName: string;
  storeAddress: string;
  products: ProductInput[];
}) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return { success: false, message: "Non autorisé" };
    }

    const { data } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();
    const storeId = data?.storeId;
    // Check if the user has an active subscription
    if (!storeId) {
      return {
        success: false,
        message: "Aucun magasin n'est associé à votre compte.",
      };
    }

    // Check if the user has an active subscription
    const isSubscriptionActive = await isUserSubscriptionActive(storeId);

    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Ta souscription a expiré, veuillez la renouveler.",
      };
    }

    const { clientName, clientPhone, storeName, storeAddress, products } =
      formData;

    // Validate inputs
    if (
      !clientName ||
      !clientPhone ||
      !storeName ||
      !storeAddress ||
      products.length === 0
    ) {
      return { success: false, message: "Veuillez remplir tous les champs" };
    }

    // Check stock for registered products
    for (const product of products) {
      if (product.productId) {
        const { data: productData, error: fetchError } = await supabase
          .from("products")
          .select("stock, name")
          .eq("productId", product.productId)
          .eq("storeId", storeId)
          .single();

        if (fetchError || !productData) {
          console.error("Error fetching product stock:", fetchError?.message);
          return {
            success: false,
            message: `Le produit ${product.name}  est introuvable ou n'est pas enregistré`,
          };
        }

        const currentStock = productData.stock ?? 0;
        if (currentStock < product.quantity) {
          return {
            success: false,
            message: `Le stock du produit ${productData.name} est insuffisant (Available: ${currentStock})`,
          };
        }
      }
    }

    // Build description and totals
    let totalPrice = 0;
    let totalQuantity = 0;
    let description = "";

    for (const product of products) {
      totalPrice += product.unitPrice * product.quantity;
      totalQuantity += product.quantity;
      description += `${product.name} (x${product.quantity}), `;
    }

    const transaction = {
      storeId,
      userId: user.id,
      productName: "Plusieurs articles",
      unitPrice: null, // not meaningful anymore
      totalPrice,
      quantity: totalQuantity,
      type: "sale",
      description: description.slice(0, -2), // remove last comma
    };

    // Insert single transaction
    const { error: txError } = await supabase
      .from("transactions")
      .insert([transaction]);
    if (txError) {
      console.error("Error inserting transactions:", txError.message);
      return {
        success: false,
        message: "Erreur durant la creation de la facture",
      };
    }

    // Update stock for registered products
    for (const product of products) {
      if (product.productId) {
        // Fetch current stock
        const { data: stockData, error: stockFetchError } = await supabase
          .from("products")
          .select("stock")
          .eq("productId", product.productId)
          .eq("storeId", storeId)
          .single();

        if (stockFetchError || !stockData) {
          console.error(
            "Error fetching current stock:",
            stockFetchError?.message
          );
          return {
            success: false,
            message: `Echec durant la recherche du stock de l'article: ${product.name}`,
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
            message: `Echec durant la mise à jour du stock de l'article: ${product.name}`,
          };
        }
      }
    }

    return { success: true, message: "success, La facture a été crée " };
  } catch (error) {
    console.error("Unexpected error creating invoice:", error);
    return { success: false, message: "Une erreur s'est produite" };
  }
}

// Settings

const userProfileSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  phoneNumber: z
    .string()
    .min(1, "Le numéro de téléphone est requis")
    .regex(/^\+?\d{10,15}$/, "Numéro de téléphone invalide"),
});

// Schema for store details
const storeDetailsSchema = z.object({
  storeName: z.string().min(1, "Le nom du magasin est requis"),
  storeAddress: z.string().min(1, "L'adresse du magasin est requise"),
  storePhoneNumber: z
    .string()
    .min(1, "Le numéro de téléphone du magasin est requis")
    .max(
      15,
      "Le numéro de téléphone du magasin ne doit pas dépasser 15 chiffres"
    )
    .regex(/^\+?\d{10,15}$/, "Numéro de téléphone du magasin invalide"),
});

async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("userId", userId)
    .single();

  console.log("User role data:", data, "Error:", error);
  if (error || !data) {
    console.error("Error checking admin status:", error?.message);
    return false;
  }
  return data.role === "admin" || data.role === "user";
}

// Schema for employee creation
// app/actions.ts
 

const createEmployeeFormSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\+?\d+$/).min(10).max(15),
  password: z.string().min(8).max(50),
  confirmPassword: z.string().min(8).max(50),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});


// app/actions.ts
export async function toggleEmployeeStatus(formData: FormData) {
  const employeeId = formData.get("employeeId") as string;
  const activate = formData.get("activate") === "true";

  const supabase = createSupabaseServerClient();

  // === 1. AUTH & ADMIN CHECK ===
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Non autorisé" };

  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) return { success: false, message: "Admin requis." };

  // === 2. GET ADMIN INFO ===
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("storeId, subscriptionId")
    .eq("userId", user.id)
    .single();

  if (!adminProfile?.storeId || !adminProfile?.subscriptionId)
    return { success: false, message: "Profil admin incomplet." };

  // === 3. GET EMPLOYEE FROM `employees` TABLE USING `employeeId` ===
  const { data: employeeRecord, error: empError } = await supabase
    .from("employees")
    .select("employeeId, isActive, storeId")
    .eq("employeeId", employeeId)  // ← USE employeeId (PK)
    .single();

  if (empError || !employeeRecord)
    return { success: false, message: "Employé introuvable dans le magasin." };

  if (employeeRecord.storeId !== adminProfile.storeId)
    return { success: false, message: "Accès refusé : employé d'un autre magasin." };

  const targetUserId = employeeRecord.employeeId;

  // === 4. GET SUBSCRIPTION PLAN LIMIT ===
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("planId, endAt")
    .eq("subscriptionId", adminProfile.subscriptionId)
    .single();

  if (!sub) return { success: false, message: "Abonnement introuvable." };

  const { data: plan } = await supabase
    .from("plans")
    .select("numberOfUsers")
    .eq("planId", sub.planId)
    .single();

  const daysLeft = Math.floor((new Date(sub.endAt).getTime() - Date.now()) / 86400000);

  // === 5. BLOCK ACTIVATION IF < 20 DAYS LEFT ===
  if (activate && daysLeft <= 20)
    return { success: false, message: "Activation impossible : moins de 20 jours restants." };

  // === 6. CHECK PLAN LIMIT BEFORE ACTIVATING ===
  if (activate) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("storeId", adminProfile.storeId)
      .eq("isActive", true);

    const activeCount = count ?? 0;
    const maxUsers = plan?.numberOfUsers ?? 0;

    if (activeCount >= maxUsers)
      return { success: false, message: `Limite atteinte : ${maxUsers} utilisateurs max.` };
  }

  // === 7. UPDATE BOTH TABLES ===
  const updatePayload = { isActive: activate };

  // Update `profiles`
  const { error: profileError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("userId", targetUserId);

  // Update `employees`
  const { error: employeeError } = await supabase
    .from("employees")
    .update(updatePayload)
    .eq("employeeId", employeeId);  // ← USE employeeId

  if (profileError || employeeError) {
    console.log("Update error:", { profileError, employeeError });
    return { success: false, message: `Échec de la mise à jour. ${profileError || employeeError}` };
  }

  return {
    success: true,
    message: activate ? "Employé activé avec succès." : "Employé désactivé avec succès."
  };
}

export async function createEmployeeAction(formData: FormData) {
  try {
    const validatedData = createEmployeeFormSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Non autorisé" };

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) return { success: false, message: "Seul un admin peut créer un employé." };

    const { data: profile } = await supabase
      .from("profiles")
      .select("storeId, subscriptionId")
      .eq("userId", user.id)
      .single();

    if (!profile?.storeId || !profile?.subscriptionId)
      return { success: false, message: "Aucun magasin ou abonnement." };

    // GET SUBSCRIPTION + PLAN
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("planId, endAt")
      .eq("subscriptionId", profile.subscriptionId)
      .single();

    if (!sub) return { success: false, message: "Abonnement introuvable." };

    const { data: plan } = await supabase
      .from("plans")
      .select("numberOfUsers")
      .eq("planId", sub.planId)
      .single();

    if (!plan) return { success: false, message: "Plan introuvable." };

    const maxUsers = plan.numberOfUsers;
    const daysLeft = Math.floor((new Date(sub.endAt).getTime() - Date.now()) / 86400000);

    if (daysLeft <= 0)
      return { success: false, message: "Votre abonnement a expiré." };

    // COUNT ACTIVE USERS (owner + active employees)
        const { count: activeCountRaw } = await supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .eq("storeId", profile.storeId)
          .eq("isActive", true);
    
        const activeCount = activeCountRaw ?? 0;
    
        if (activeCount >= maxUsers)
          return { success: false, message: `Limite atteinte : ${maxUsers} utilisateurs max.` };

    // CREATE EMPLOYEE
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (signUpError || !authData.user)
      return { success: false, message: signUpError?.message.includes("already registered")
        ? "Email déjà utilisé." : "Échec création compte." };

    await supabase.from("profiles").insert({
      userId: authData.user.id,
      name: validatedData.name,
      phoneNumber: validatedData.phone,
      email: validatedData.email,
      storeId: profile.storeId,
      role: "employee",
      isActive: true,
      created_at: new Date().toISOString(),
    });

    return { success: true, message: "Employé créé avec succès." };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, message: error.errors[0].message };
    return { success: false, message: "Erreur serveur." };
  }
}

// app/actions.ts
export async function getEmployeesByStore() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Non autorisé", employees: [] };
    }

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return {
        success: false,
        message: "Seul un administrateur peut voir les employés.",
        employees: [],
      };
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("storeId")
      .eq("userId", user.id)
      .single();

    if (profileError || !profileData?.storeId) {
      return {
        success: false,
        message: "Aucun magasin associé.",
        employees: [],
      };
    }

    const storeId = profileData.storeId;

    // Fetch employees with isActive
    const { data: employeesData, error: employeesError } = await supabase
      .from("profiles")
      .select("userId, name, email, phoneNumber, created_at, isActive")
      .eq("storeId", storeId)
      .eq("role", "employee")
      .order("created_at", { ascending: false });

    if (employeesError) {
      console.error("Error fetching employees:", employeesError.message);
      return {
        success: false,
        message: "Échec lors de la récupération des employés.",
        employees: [],
      };
    }

    const employees = employeesData.map((emp, index) => ({
      id: index + 1,
      userId: emp.userId,
      name: emp.name || "Inconnu",
      email: emp.email,
      phone: emp.phoneNumber || "N/A",
      created_at: new Date(emp.created_at).toLocaleDateString("fr-FR"),
      isActive: emp.isActive ?? true,
    }));

    return {
      success: true,
      message: "Employés récupérés avec succès.",
      employees,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      message: "Une erreur s'est produite.",
      employees: [],
    };
  }
}

export async function updateUserProfile(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "utilisateur non connecté" };
  }

  const { data } = await supabase
    .from("profiles")
    .select("storeId")
    .eq("userId", user.id)
    .single();
  const storeId = data?.storeId;
  // Check if the user has an active subscription
  if (!storeId) {
    return {
      success: false,
      message: "Aucun magasin n'est associé à votre compte.",
    };
  }

  // Check if the user has an active subscription
  const isSubscriptionActive = await isUserSubscriptionActive(storeId);

  if (!isSubscriptionActive) {
    return {
      success: false,
      message: "Ta souscription a expiré, veuillez la renouveler.",
    };
  }

  const validated = userProfileSchema.safeParse({
    name: formData.get("name"),
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!validated.success) {
    return { success: false, message: validated.error.errors[0].message };
  }

  const { name, phoneNumber } = validated.data;

  const { error } = await supabase
    .from("profiles")
    .update({ name, phoneNumber })
    .eq("userId", user.id);

  if (error) {
    console.error("Update profile error:", error);
    return { success: false, message: "Echec durant la mise à jour du profil" };
  }

  return { success: true, message: "success, Le profil a bien été mis à jour" };
}

export async function updateStoreDetails(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Magasin Non authorisé" };
  }

  // Check if the user has an active subscription
  const isSubscriptionActive = await isUserSubscriptionActive(user.id);

  if (!isSubscriptionActive) {
    return {
      success: false,
      message: "Ta souscription a expiré, veuillez la renouveler.",
    };
  }
  const validated = storeDetailsSchema.safeParse({
    storeName: formData.get("storeName"),
    storeAddress: formData.get("storeAddress"),
    storePhoneNumber: formData.get("storePhoneNumber"),
  });

  if (!validated.success) {
    return { success: false, message: validated.error.errors[0].message };
  }

  const { storeName, storeAddress, storePhoneNumber } = validated.data;

  // Check if store exists
  const { data: existingStore } = await supabase
    .from("stores")
    .select("storeId")
    .eq("userId", user.id)
    .single();

  let storeId = existingStore?.storeId;

  if (!storeId) {
    // Create new store
    storeId = crypto.randomUUID();
    const { error: insertError } = await supabase.from("stores").insert({
      storeId,
      userId: user.id,
      storeName,
      storeAddress,
      storePhoneNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Insert store error:", insertError);
      return { success: false, message: "Echec durant la création du magasin" };
    }

    // Update profiles.storeId
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ storeId })
      .eq("userId", user.id);

    if (profileError) {
      console.error("Update profile storeId error:", profileError);
      return {
        success: false,
        message: "Echec durant la mise à jour du magasin",
      };
    }
  } else {
    // Update existing store
    const { error: updateError } = await supabase
      .from("stores")
      .update({
        storeName,
        storeAddress,
        storePhoneNumber,
        updatedAt: new Date().toISOString(),
      })
      .eq("storeId", storeId);

    if (updateError) {
      console.error("Update store error:", updateError);
      return {
        success: false,
        message: "Echec durant la mise à jour du magasin",
      };
    }
  }

  return {
    success: true,
    message: "success, Les détails du magasin ont bien été mis à jour",
  };
}

export async function getStore() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { success: false, message: "Non autorisé" };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("storeId")
    .eq("userId", data.user.id)
    .single();

  if (profileError || !profileData?.storeId) {
    return {
      success: false,
      message: "Aucun magasin n'est associé à votre compte.",
    };
  }

  const { data: storeData, error: storeError } = await supabase
    .from("stores")
    .select("storeName, storeAddress, storePhoneNumber")
    .eq("storeId", profileData?.storeId)
    .single();

  if (storeError) {
    console.error("Error fetching store:", storeError.message);
    return { success: false, message: "Le magasin est introuvable" };
  }

  return { success: true, store: storeData };
}










// Managing Subscriptions by the admin

// app/actions.ts (or wherever you have the schema)




// app/actions.ts → updateSubscription function
// app/actions.ts
// app/actions.ts
// app/actions/updateSubscription.ts
export async function updateSubscription(formData: FormData) {
  const supabase = createSupabaseServerClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Non autorisé' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, storeId, subscriptionId')
      .eq('userId', user.id)
      .single();

    if (profile?.role !== 'admin')
      return { success: false, message: 'Accès admin requis' };

    const subscriptionId = formData.get('subscriptionId') as string;
    const months = Number(formData.get('months'));
    const planId = Number(formData.get('planId'));

    if (!subscriptionId || !months || !planId)
      return { success: false, message: 'Données manquantes' };

    // Validate new plan
    const { data: newPlan } = await supabase
      .from('plans')
      .select('planId, numberOfUsers')
      .eq('planId', planId)
      .single();

    if (!newPlan)
      return { success: false, message: 'Plan invalide' };

    // Get current subscription
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('planId, endAt, storeId')
      .eq('subscriptionId', subscriptionId)
      .single();

    if (!currentSub)
      return { success: false, message: 'Abonnement introuvable' };

    // Get current plan
    const { data: currentPlan } = await supabase
      .from('plans')
      .select('numberOfUsers')
      .eq('planId', currentSub.planId)
      .single();

    // Calculate new end date
    const baseDate = new Date(currentSub.endAt || new Date());
    const newEndAt = new Date(baseDate);
    newEndAt.setDate(baseDate.getDate() + months * 30);

    // === DOWNGRADE: DEACTIVATE EXCESS EMPLOYEES ===
    if (newPlan.numberOfUsers < (currentPlan?.numberOfUsers ?? 0)) {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('storeId', currentSub.storeId)
        .eq('isActive', true);

      const activeCount = count ?? 0;

      if (activeCount > newPlan.numberOfUsers) {
        const toDeactivate = activeCount - newPlan.numberOfUsers;

        // Get oldest active employees (from profiles)
        const { data: excessProfiles } = await supabase
          .from('profiles')
          .select('userId')
          .eq('storeId', currentSub.storeId)
          .eq('role', 'employee')
          .eq('isActive', true)
          .order('created_at', { ascending: true })
          .limit(toDeactivate);

        if (excessProfiles?.length) {
          const userIds = excessProfiles.map(p => p.userId);

          // UPDATE profiles
          await supabase
            .from('profiles')
            .update({ isActive: false })
            .in('userId', userIds);

          
          await supabase
            .from('employees')
            .update({ isActive: false })
            .in('employeeId', userIds);  // ← CORRECT: use `employeeId`
        }
      }
    }

    // === UPGRADE: REACTIVATE DEACTIVATED EMPLOYEES ===
    if (newPlan.numberOfUsers > (currentPlan?.numberOfUsers ?? 0)) {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('storeId', currentSub.storeId)
        .eq('isActive', true);

      const activeCount = count ?? 0;
      const needed = newPlan.numberOfUsers - activeCount;

      if (needed > 0) {
        const { data: inactiveProfiles } = await supabase
          .from('profiles')
          .select('userId')
          .eq('storeId', currentSub.storeId)
          .eq('role', 'employee')
          .eq('isActive', false)
          .order('created_at', { ascending: true })
          .limit(needed);

        if (inactiveProfiles?.length) {
          const userIds = inactiveProfiles.map(p => p.userId);

          await supabase
            .from('profiles')
            .update({ isActive: true })
            .in('userId', userIds);

          await supabase
            .from('employees')
            .update({ isActive: true })
            .in('employeeId', userIds);  // ← CORRECT
        }
      }
    }

    // Update subscription
    const { error } = await supabase
      .from('subscriptions')
      .update({
        planId,
        endAt: newEndAt.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('subscriptionId', subscriptionId);

    if (error) {
      console.error(error);
      return { success: false, message: 'Échec de la mise à jour' };
    }

    return { success: true, message: 'Abonnement mis à jour avec succès !' };
  } catch (error) {
    console.error('Update subscription error:', error);
    return { success: false, message: 'Erreur serveur' };
  }
}