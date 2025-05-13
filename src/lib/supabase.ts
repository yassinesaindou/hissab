import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

interface Profile {
  userId: string;
  name: string;
  phoneNumber: string;
  email: string;
  subscription: string | null;
  created_at: string;
}

export async function getProfile(): Promise<{
  data: Profile | null;
  error: string | null;
}> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("userId, name, phoneNumber, email, subscription, created_at")
      .eq("userId", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error.message);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return { data: null, error: "An unexpected error occurred" };
  }
}
export async function createSubscription(userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      userId,
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      updatedAt: new Date(),
      planType: "starter",
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Error creating subscription:",
      error.message,
      error.details,
      error.hint
    );
    return null;
  }

  console.log("Subscription data:", data); // Debug log
  return data;
}

// Product Management

// types.ts
export interface Product {
  productId: string;
  created_at: Date;
  userId: string;
  name: string;
  stock: number;
  unitPrice: number;
  category?: string;
  description?: string;
}

export async function getMyProducts(): Promise<{ data: Product[] | null; error: string | null }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('products')
      .select('productId, created_at, userId, name, stock, unitPrice, category, description');
      // RLS ensures only the user's products are returned

    if (error) {
      console.error('Error fetching products:', error.message);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in getMyProducts:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

// Add a new product for the authenticated user
export async function addProduct(
  name: string,
  description: string,
  unitPrice: number,
  stock: number,
  category?: string
): Promise<{ data: Product | null; error: string | null }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Input validation
    if (!name || name.trim() === '') {
      return { data: null, error: 'Product name is required' };
    }
    if (unitPrice < 0) {
      return { data: null, error: 'Unit price must be non-negative' };
    }
    if (stock < 0 || !Number.isInteger(stock)) {
      return { data: null, error: 'Stock must be a non-negative integer' };
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        userId: user.id,
        name,
        description,
        unitPrice,
        stock,
        category,
      })
      .select('productId, created_at, userId, name, stock, unitPrice, category, description')
      .single();

    if (error) {
      console.error('Error adding product:', error.message);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in addProduct:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}

// Delete a product by ID for the authenticated user
export async function deleteMyProduct(
  productId: string
): Promise<{ data: boolean; error: string | null }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('productId', productId);
      // RLS ensures only the user's product is deleted

    if (error) {
      console.error('Error deleting product:', error.message);
      return { data: false, error: error.message };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Unexpected error in deleteMyProduct:', error);
    return { data: false, error: 'An unexpected error occurred' };
  }
}

// Update a product by ID for the authenticated user
export async function updateMyProduct(
  productId: string,
  updates: {
    name?: string;
    description?: string;
    unitPrice?: number;
    stock?: number;
    category?: string;
  }
): Promise<{ data: Product | null; error: string | null }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Input validation
    if (updates.name && updates.name.trim() === '') {
      return { data: null, error: 'Product name cannot be empty' };
    }
    if (updates.unitPrice !== undefined && updates.unitPrice < 0) {
      return { data: null, error: 'Unit price must be non-negative' };
    }
    if (updates.stock !== undefined && (updates.stock < 0 || !Number.isInteger(updates.stock))) {
      return { data: null, error: 'Stock must be a non-negative integer' };
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('productId', productId)
      .select('productId, created_at, userId, name, stock, unitPrice, category, description')
      .single();
      // RLS ensures only the user's product is updated

    if (error) {
      console.error('Error updating product:', error.message);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in updateMyProduct:', error);
    return { data: null, error: 'An unexpected error occurred' };
  }
}