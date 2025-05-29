"use server";
import {
  createSupabaseServerClient,
  createSubscription,
} from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cookies } from "next/headers";

import { isUserSubscriptionActive } from "@/lib/utils/utils";

const SignupFormSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters." })
      .max(50, { message: "Name must be at most 50 characters." }),
    email: z
      .string()
      .min(7, { message: "Email must be at least 7 characters." })
      .max(50)
      .email({ message: "Please enter a valid email." }),
    phone: z
      .string()
      .min(10, { message: "Phone number must be at least 10 digits." })
      .max(15, { message: "Phone number must be at most 15 digits." })
      .regex(/^\+?\d+$/, {
        message:
          "Phone number must contain only digits and an optional leading +.",
      }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .max(50),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .max(50),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
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
          ? "Email already in use"
          : authError?.message || "Signup failed",
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

    // Create subscription
    const subscription = await createSubscription(authData.user.id, "pro");
    if (!subscription) {
      return { success: false, message: "Failed to create subscription" };
    }

    // Update profile with subscriptionId
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ subscriptionId: subscription.subscriptionId })
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
      message: "Signup successful! Please check your email to confirm.",
    };
  } catch (error) {
    console.error("Unexpected error during signup:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "An unexpected error occurred" };
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
          ? "Invalid email or password"
          : error?.message || "Login failed",
      };
    }

    // Session is automatically set via cookies by @supabase/ssr
    return { success: true, message: "Login successful" };
  } catch (error) {
    console.error("Unexpected error during login:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "An unexpected error occurred" };
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
    .min(2, { message: "Product name must be at least 2 characters." })
    .max(100, { message: "Product name must be at most 100 characters." }),
  stock: z
    .number()
    .int({ message: "Stock must be an integer." })
    .min(0, { message: "Stock must be non-negative." }),
  unitPrice: z
    .number()
    .min(0, { message: "Unit price must be non-negative." })
    .max(1000000, { message: "Unit price must be less than 1,000,000." }),
  category: z
    .string()
    .max(50, { message: "Category must be at most 50 characters." })
    .optional(),
  description: z
    .string()
    .max(500, { message: "Description must be at most 500 characters." })
    .optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export async function newProductAction(formData: ProductFormData) {
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

    // Check if the user has an active subscription

    const isSubscriptionActive = await isUserSubscriptionActive(user.id);

    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Your subscription has expired, please renew it.",
      };
    }

    const { error } = await supabase.from("products").insert({
      userId: user.id,
      name: validatedData.name,
      stock: validatedData.stock,
      unitPrice: validatedData.unitPrice,
      category: validatedData.category,
      description: validatedData.description,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error creating product:", error.message);
      return { success: false, message: "Failed to create product" };
    }

    return { success: true, message: "Product added successfully" };
  } catch (error) {
    console.error("Unexpected error during product creation:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}

const updateProductFormSchema = productFormSchema.extend({
  productId: z.string().uuid({ message: "Invalid product ID." }),
});

type UpdateProductFormData = z.infer<typeof updateProductFormSchema>;

export async function updateProductAction(formData: UpdateProductFormData) {
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

    // Check if the user has an active subscription
    const isSubscriptionActive = await isUserSubscriptionActive(user.id);

    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Your subscription has expired, please renew it.",
      };
    }

    // Verify the product exists and belongs to the user
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("userId")
      .eq("productId", validatedData.productId)
      .single();

    if (fetchError || !product) {
      console.error("Error fetching product:", fetchError?.message);
      return { success: false, message: "Product not found" };
    }

    if (product.userId !== user.id) {
      return { success: false, message: "Unauthorized to update this product" };
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
      return { success: false, message: "Failed to update product" };
    }

    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    console.error("Unexpected error during product update:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}

/// PRODUCTS

const creditFormSchema = z.object({
  customerName: z
    .string()
    .min(2, { message: "Customer name must be at least 2 characters." })
    .max(100, { message: "Customer name must be at most 100 characters." }),
  customerPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number format." })
    .min(5, { message: "Phone number must be at least 5 digits." })
    .max(15, { message: "Phone number must be at most 15 digits." }),
  amount: z
    .number()
    .min(0, { message: "Amount must be non-negative." })
    .max(1000000, { message: "Amount must be less than 1,000,000." }),
  status: z.enum(["pending", "paid", "overdue"]).optional().default("pending"),
  description: z
    .string()
    .max(500, { message: "Description must be at most 500 characters." })
    .optional(),
  productId: z.string().uuid({ message: "Invalid product ID." }).optional(),
  numberOfProductsTaken: z
    .number()
    .int({ message: "Number of products taken must be an integer." })
    .min(1, { message: "Number of products taken must be at least 1." })
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

    // Check if the user has an active subscription
    const isSubscriptionActive = await isUserSubscriptionActive(user.id);

    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Your subscription has expired, please renew it.",
      };
    }

    // If productId is provided, verify it exists, belongs to the user, and check stock
    if (validatedData.productId && validatedData.numberOfProductsTaken) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("userId, stock")
        .eq("productId", validatedData.productId)
        .single();

      if (productError || !product) {
        console.error("Error fetching product:", productError?.message);
        return { success: false, message: "Invalid product ID" };
      }

      if (product.userId !== user.id) {
        return { success: false, message: "Unauthorized to link this product" };
      }

      if (product.stock < validatedData.numberOfProductsTaken) {
        return {
          success: false,
          message: `Insufficient stock. Available: ${product.stock}, Requested: ${validatedData.numberOfProductsTaken}`,
        };
      }

      // Update product stock
      const { error: stockError } = await supabase
        .from("products")
        .update({ stock: product.stock - validatedData.numberOfProductsTaken })
        .eq("productId", validatedData.productId);

      if (stockError) {
        console.error("Error updating product stock:", stockError.message);
        return { success: false, message: "Failed to update product stock" };
      }
    } else if (
      validatedData.productId &&
      !validatedData.numberOfProductsTaken
    ) {
      return {
        success: false,
        message:
          "Number of products taken is required when a product is selected",
      };
    } else if (
      !validatedData.productId &&
      validatedData.numberOfProductsTaken
    ) {
      return {
        success: false,
        message:
          "Product ID is required when number of products taken is provided",
      };
    }

    const { error } = await supabase.from("credits").insert({
      userId: user.id,
      customerName: validatedData.customerName,
      customerPhone: validatedData.customerPhone,
      amount: validatedData.amount,
      status: validatedData.status,
      description: validatedData.description,
      productId: validatedData.productId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error creating credit:", error.message);
      return { success: false, message: "Failed to create credit" };
    }

    return { success: true, message: "Credit added successfully" };
  } catch (error) {
    console.error("Unexpected error during credit creation:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}

const updateCreditFormSchema = creditFormSchema.extend({
  creditId: z.string().uuid({ message: "Invalid credit ID." }),
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

    // Check if the user has an active subscription
    const isSubscriptionActive = await isUserSubscriptionActive(user.id);

    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Your subscription has expired, please renew it.",
      };
    }

    // Verify the credit exists and belongs to the user
    const { data: credit, error: fetchError } = await supabase
      .from("credits")
      .select("userId")
      .eq("creditId", validatedData.creditId)
      .single();

    if (fetchError || !credit) {
      console.error("Error fetching credit:", fetchError?.message);
      return { success: false, message: "Credit not found" };
    }

    if (credit.userId !== user.id) {
      return { success: false, message: "Unauthorized to update this credit" };
    }

    // If productId is provided, verify it exists and belongs to the user
    if (validatedData.productId) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("userId")
        .eq("productId", validatedData.productId)
        .single();

      if (productError || !product) {
        console.error("Error fetching product:", productError?.message);
        return { success: false, message: "Invalid product ID" };
      }

      if (product.userId !== user.id) {
        return { success: false, message: "Unauthorized to link this product" };
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
      return { success: false, message: "Failed to update credit" };
    }

    return { success: true, message: "Credit updated successfully" };
  } catch (error) {
    console.error("Unexpected error during credit update:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}

//Transactions

const baseTransactionFormSchema = z.object({
  productId: z.string().uuid({ message: "Invalid product ID." }).optional(),
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
    .min(1, { message: "Quantity must be at least 1" }),
  type: z.enum(["sale", "credit", "expense"], {
    message: "Invalid transaction type.",
  }),
});

const transactionFormSchema = baseTransactionFormSchema.refine(
  (data) =>
    data.type === "expense" ||
    (data.productId && data.productId !== "none") ||
    data.productName,
  {
    message:
      "Either a product must be selected or a product name must be provided for sale/credit transactions.",
    path: ["productId"],
  }
);

type TransactionFormData = z.infer<typeof transactionFormSchema>;

export async function addTransactionAction(formData: TransactionFormData) {
  try {
    const validatedData = transactionFormSchema.parse(formData);
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    // Check if the user has an active subscription
    const isSubscriptionActive = await isUserSubscriptionActive(user.id);

    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Your subscription has expired, please renew it.",
      };
    }

    let unitPrice = validatedData.unitPrice;
    let totalPrice = validatedData.unitPrice * validatedData.quantity;

    if (validatedData.productId && validatedData.productId !== "none") {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("userId, unitPrice, stock, name")
        .eq("productId", validatedData.productId)
        .single();

      if (productError || !product) {
        console.error("Error fetching product:", productError?.message);
        return { success: false, message: "Invalid product ID" };
      }

      if (product.userId !== user.id) {
        return { success: false, message: "Unauthorized to use this product" };
      }

      if (
        (validatedData.type === "sale" || validatedData.type === "credit") &&
        product.stock < validatedData.quantity
      ) {
        return {
          success: false,
          message: `Insufficient stock. Available: ${product.stock}, Requested: ${validatedData.quantity}`,
        };
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
          console.error("Error updating product stock:", stockError.message);
          return { success: false, message: "Failed to update product stock" };
        }
      }
    }

    const { error } = await supabase.from("transactions").insert({
      userId: user.id,
      productId: validatedData.productId || null,
      productName: validatedData.productName || null,
      unitPrice,
      totalPrice,
      quantity: validatedData.quantity,
      type: validatedData.type,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error creating transaction:", error.message);
      return { success: false, message: "Failed to create transaction" };
    }

    return { success: true, message: "Transaction added successfully" };
  } catch (error) {
    console.error("Unexpected error during transaction creation:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}

const updateTransactionFormSchema = baseTransactionFormSchema
  .extend({
    transactionId: z.string().uuid({ message: "Invalid transaction ID." }),
  })
  .refine(
    (data) =>
      data.type === "expense" ||
      (data.productId && data.productId !== "none") ||
      data.productName,
    {
      message:
        "Either a product must be selected or a product name must be provided for sale/credit transactions.",
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

    // Check if the user has an active subscription
    const isSubscriptionActive = await isUserSubscriptionActive(user.id);

    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Your subscription has expired, please renew it.",
      };
    }

    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("userId, productId, quantity, type")
      .eq("transactionId", validatedData.transactionId)
      .single();

    if (fetchError || !transaction) {
      console.error("Error fetching transaction:", fetchError?.message);
      return { success: false, message: "Transaction not found" };
    }

    if (transaction.userId !== user.id) {
      return {
        success: false,
        message: "Unauthorized to update this transaction",
      };
    }

    let unitPrice = validatedData.unitPrice;
    let totalPrice = validatedData.unitPrice * validatedData.quantity;

    if (validatedData.productId && validatedData.productId !== "none") {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("userId, unitPrice, stock, name")
        .eq("productId", validatedData.productId)
        .single();

      if (productError || !product) {
        console.error("Error fetching product:", productError?.message);
        return { success: false, message: "Invalid product ID" };
      }

      if (product.userId !== user.id) {
        return { success: false, message: "Unauthorized to use this product" };
      }

      const stockAdjustment = transaction.quantity - validatedData.quantity;
      const newStock = product.stock + stockAdjustment;

      if (
        (validatedData.type === "sale" || validatedData.type === "credit") &&
        newStock < 0
      ) {
        return {
          success: false,
          message: `Insufficient stock. Available: ${product.stock}, Required: ${validatedData.quantity}`,
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
          return { success: false, message: "Failed to update product stock" };
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
        return { success: false, message: "Invalid old product ID" };
      }

      const { error: stockError } = await supabase
        .from("products")
        .update({ stock: oldProduct.stock + transaction.quantity })
        .eq("productId", transaction.productId);

      if (stockError) {
        console.error("Error restoring product stock:", stockError.message);
        return { success: false, message: "Failed to restore product stock" };
      }
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        productId: validatedData.productId || null,
        productName: validatedData.productName || null,
        unitPrice,
        totalPrice,
        quantity: validatedData.quantity,
        type: validatedData.type,
      })
      .eq("transactionId", validatedData.transactionId);

    if (error) {
      console.error("Error updating transaction:", error.message);
      return { success: false, message: "Failed to update transaction" };
    }

    return { success: true, message: "Transaction updated successfully" };
  } catch (error) {
    console.error("Unexpected error during transaction update:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}

// Dashbord Actions

export async function getRecentTransactions() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Unauthorized", transactions: [] };
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("transactionId, created_at, type, totalPrice, productName")
      .eq("userId", user.id)
      .in("type", ["sale", "expense"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching transactions:", error.message);
      return {
        success: false,
        message: "Failed to fetch transactions",
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
      message: "Transactions fetched successfully",
      transactions,
    };
  } catch (error) {
    console.error("Unexpected error fetching transactions:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
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
      return { success: false, message: "Unauthorized", credits: [] };
    }

    const { data, error } = await supabase
      .from("credits")
      .select("creditId, customerName, customerPhone, amount")
      .eq("userId", user.id)
      .order("created_at", { ascending: false })
      .limit(7);

    if (error) {
      console.error("Error fetching credits:", error.message);
      return {
        success: false,
        message: "Failed to fetch credits",
        credits: [],
      };
    }

    const credits = data.map((c, index) => ({
      id: index + 1, // 1-based Sr No
      name: c.customerName,
      phone: c.customerPhone,
      amount: c.amount,
    }));

    return { success: true, message: "Credits fetched successfully", credits };
  } catch (error) {
    console.error("Unexpected error fetching credits:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
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
      return { success: false, message: "Unauthorized", data: {} };
    }

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Fetch transactions for sales and expenses
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("created_at, type, totalPrice")
      .eq("userId", user.id)
      .in("type", ["sale", "expense"])
      .gte("created_at", fourteenDaysAgo.toISOString());

    if (txError) {
      console.error("Error fetching transactions:", txError.message);
      return {
        success: false,
        message: "Failed to fetch transactions",
        data: {},
      };
    }

    // Fetch credits
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select("created_at, amount")
      .eq("userId", user.id)
      .eq("status", "pending")
      .gte("created_at", fourteenDaysAgo.toISOString());

    if (creditsError) {
      console.error("Error fetching credits:", creditsError.message);
      return { success: false, message: "Failed to fetch credits", data: {} };
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
      message: "Dashboard data fetched successfully",
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
      message: "An unexpected error occurred",
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
      return { success: false, message: "Unauthorized", data: [] };
    }

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31);

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("created_at, type, totalPrice")
      .eq("userId", user.id)
      .gte("created_at", startOfYear.toISOString())
      .lte("created_at", endOfYear.toISOString());

    if (txError) {
      console.error("Error fetching transactions:", txError.message);
      return {
        success: false,
        message: "Failed to fetch transactions",
        data: [],
      };
    }

    // Fetch credits
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select("created_at, amount")
      .eq("userId", user.id)
      .eq("status", "paid")
      .gte("created_at", startOfYear.toISOString())
      .lte("created_at", endOfYear.toISOString());

    if (creditsError) {
      console.error("Error fetching credits:", creditsError.message);
      return { success: false, message: "Failed to fetch credits", data: [] };
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
      message: "Yearly data fetched successfully",
      data: yearlyData,
    };
  } catch (error) {
    console.error("Unexpected error fetching yearly data:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
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
      return { success: false, message: "Unauthorized", data: {} };
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
            message: "Custom range requires start and end dates",
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
            message: "Invalid custom date range",
            data: {},
          };
        }
        break;
      default:
        return { success: false, message: "Invalid period", data: {} };
    }

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("type, totalPrice")
      .eq("userId", user.id)
      .in("type", ["sale", "expense"])
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (txError) {
      console.error("Error fetching transactions:", txError.message);
      return {
        success: false,
        message: "Failed to fetch transactions",
        data: {},
      };
    }

    // Fetch credits
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select("amount")
      .eq("userId", user.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (creditsError) {
      console.error("Error fetching credits:", creditsError.message);
      return { success: false, message: "Failed to fetch credits", data: {} };
    }

    // Fetch total products (no time filter)
    const { count: totalProducts, error: productsError } = await supabase
      .from("products")
      .select("productId", { count: "exact" })
      .eq("userId", user.id);

    if (productsError) {
      console.error("Error fetching products:", productsError.message);
      return { success: false, message: "Failed to fetch products", data: {} };
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
        message: "Invalid analytics data format",
        data: {},
      };
    }

    console.log("Analytics data:", analyticsData);

    return {
      success: true,
      message: "Analytics data fetched successfully",
      data: analyticsData,
    };
  } catch (error) {
    console.error("Unexpected error fetching analytics data:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      data: {},
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
      return { success: false, message: "Unauthorized", data: [] };
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
            message: "Custom range requires start and end dates",
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
            message: "Invalid custom date range",
            data: [],
          };
        }
        break;
      default:
        console.error("Invalid period:", period);
        return { success: false, message: "Invalid period", data: [] };
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
      .eq("userId", user.id)
      .in("type", ["sale", "expense"])
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (txError) {
      console.error("Transaction fetch error:", txError.message);
      return {
        success: false,
        message: "Failed to fetch transactions",
        data: [],
      };
    }

    // Fetch credits
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select("created_at, amount")
      .eq("userId", user.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (creditsError) {
      console.error("Credits fetch error:", creditsError.message);
      return { success: false, message: "Failed to fetch credits", data: [] };
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
      return { success: false, message: "Invalid graph data format", data: [] };
    }

    return {
      success: true,
      message: "Graph data fetched successfully",
      data: chartData,
    };
  } catch (error) {
    console.error("Unexpected error fetching graph data:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
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
      return { success: false, message: "Unauthorized", data: [] };
    }

    const { data: products, error } = await supabase
      .from("products")
      .select("productId, name, unitPrice")
      .eq("userId", user.id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching products:", error.message);
      return { success: false, message: "Failed to fetch products", data: [] };
    }

    return {
      success: true,
      message: "Products fetched successfully",
      data: products,
    };
  } catch (error) {
    console.error("Unexpected error fetching products:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
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
      return { success: false, message: "Unauthorized" };
    }

    // Check if the user has an active subscription
    const isSubscriptionActive = await isUserSubscriptionActive(user.id);

    if (!isSubscriptionActive) {
      return {
        success: false,
        message: "Your subscription has expired, please renew it.",
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
      return { success: false, message: "All fields are required" };
    }

    // Check stock for registered products
    for (const product of products) {
      if (product.productId) {
        const { data: productData, error: fetchError } = await supabase
          .from("products")
          .select("stock, name")
          .eq("productId", product.productId)
          .eq("userId", user.id)
          .single();

        if (fetchError || !productData) {
          console.error("Error fetching product stock:", fetchError?.message);
          return {
            success: false,
            message: `Product ${product.name} not found`,
          };
        }

        const currentStock = productData.stock ?? 0;
        if (currentStock < product.quantity) {
          return {
            success: false,
            message: `Insufficient stock for ${productData.name} (Available: ${currentStock})`,
          };
        }
      }
    }

    // Prepare transactions
    const transactions = products.map((product) => ({
      userId: user.id,
      productName: product.name,
      unitPrice: product.unitPrice,
      totalPrice: product.unitPrice * product.quantity,
      quantity: product.quantity,
      type: "sale",
      productId: product.productId || null,
    }));

    // Perform transaction: insert transactions and update stock
    const { error: txError } = await supabase
      .from("transactions")
      .insert(transactions);
    if (txError) {
      console.error("Error inserting transactions:", txError.message);
      return { success: false, message: "Failed to create invoice" };
    }

    // Update stock for registered products
    for (const product of products) {
      if (product.productId) {
        // Fetch current stock
        const { data: stockData, error: stockFetchError } = await supabase
          .from("products")
          .select("stock")
          .eq("productId", product.productId)
          .eq("userId", user.id)
          .single();

        if (stockFetchError || !stockData) {
          console.error(
            "Error fetching current stock:",
            stockFetchError?.message
          );
          return {
            success: false,
            message: `Failed to fetch current stock for ${product.name}`,
          };
        }

        const newStock = (stockData.stock ?? 0) - product.quantity;

        const { error: updateError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("productId", product.productId)
          .eq("userId", user.id);

        if (updateError) {
          console.error("Error updating stock:", updateError.message);
          return {
            success: false,
            message: `Failed to update stock for ${product.name}`,
          };
        }
      }
    }

    return { success: true, message: "Invoice created successfully" };
  } catch (error) {
    console.error("Unexpected error creating invoice:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// Settings

const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?\d{10,15}$/, "Invalid phone number"),
});

// Schema for store details
const storeDetailsSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  storeAddress: z.string().min(1, "Store address is required"),
  storePhoneNumber: z
    .string()
    .min(1, "Store phone is required")
    .regex(/^\+?\d{10,15}$/, "Invalid store phone number"),
});

export async function updateUserProfile(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Unauthorized User" };
  }

  // Check if the user has an active subscription
  const isSubscriptionActive = await isUserSubscriptionActive(user.id);

  if (!isSubscriptionActive) {
    return {
      success: false,
      message: "Your subscription has expired, please renew it.",
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
    return { success: false, message: "Failed to update profile" };
  }

  return { success: true, message: "Profile updated successfully" };
}

export async function updateStoreDetails(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Unauthorized  Stores" };
  }

  // Check if the user has an active subscription
  const isSubscriptionActive = await isUserSubscriptionActive(user.id);

  if (!isSubscriptionActive) {
    return {
      success: false,
      message: "Your subscription has expired, please renew it.",
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
      return { success: false, message: "Failed to create store" };
    }

    // Update profiles.storeId
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ storeId })
      .eq("userId", user.id);

    if (profileError) {
      console.error("Update profile storeId error:", profileError);
      return { success: false, message: "Failed to link store to profile" };
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
      return { success: false, message: "Failed to update store" };
    }
  }

  return { success: true, message: "Store details updated successfully" };
}

export async function getStore() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { success: false, message: "Unauthorized" };
  }

  const { data: storeData, error: storeError } = await supabase
    .from("stores")
    .select("storeName, storeAddress, storePhoneNumber")
    .eq("userId", data.user.id)
    .single();

  if (storeError) {
    console.error("Error fetching store:", storeError.message);
    return { success: false, message: "Failed to fetch store" };
  }

  return { success: true, store: storeData };
}

// Managing Subscriptions by the admin

const updateSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  months: z
    .number()
    .min(1, "At least 1 month is required")
    .max(12, "Maximum 12 months"),
});

export async function updateSubscription(formData: FormData) {
  console.log("Starting updateSubscription:", new Date().toISOString());

  const supabase = createSupabaseServerClient();
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return { success: false, message: "Unauthorized" };
    }

    console.log("User authenticated:", user.id);

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("userId", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      console.error("Profile error or not admin:", profileError);
      return { success: false, message: "Admin access required" };
    }

    console.log("Admin role verified");

    const validated = updateSubscriptionSchema.safeParse({
      subscriptionId: formData.get("subscriptionId"),
      months: Number(formData.get("months")),
    });

    if (!validated.success) {
      console.error("Validation error:", validated.error.errors);
      return { success: false, message: validated.error.errors[0].message };
    }

    const { subscriptionId, months } = validated.data;
    console.log("Validated data:", { subscriptionId, months });

    // Fetch current endAt with timeout
    const subscriptionPromise = supabase
      .from("subscriptions")
      .select("endAt")
      .eq("subscriptionId", subscriptionId)
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Subscription fetch timeout")), 5000)
    );

    const { data: subscription } = await Promise.race([
      subscriptionPromise,
      timeoutPromise,
    ]);

    if (!subscription) {
      console.error("Subscription not found for ID:", subscriptionId);
      return { success: false, message: "Subscription not found" };
    }

    console.log("Current endAt:", subscription.endAt);

    // Calculate new endAt
    const currentEndAt = new Date(subscription.endAt || new Date());
    const newEndAt = new Date(currentEndAt);
    newEndAt.setDate(currentEndAt.getDate() + months * 30);

    console.log("New endAt:", newEndAt.toISOString());

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        endAt: newEndAt.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq("subscriptionId", subscriptionId);

    if (updateError) {
      console.error("Update subscription error:", updateError);
      return { success: false, message: "Failed to update subscription" };
    }

    console.log("Subscription updated successfully");
    return { success: true, message: "Subscription updated successfully" };
  } catch (error) {
    console.error("Update subscription exception:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
