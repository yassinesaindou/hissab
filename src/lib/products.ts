import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
 
export function createSupabaseServerClient() {
  return createServerComponentClient({ cookies });
}

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

export async function getMyProducts(): Promise<Product[] | null> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error('User not authenticated');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) throw new Error('Profile not found');

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('userId', profile.id);

  if (error) throw error;

  return products;
}

export async function createProduct(product: Omit<Product, 'productId' | 'created_at' | 'userId'>) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error('User not authenticated');

  const { error } = await supabase.from('products').insert({
    ...product,
    userId: user.id
  });

  if (error) throw error;
}

export async function updateProduct(productId: string, updates: Partial<Omit<Product, 'productId' | 'userId' | 'created_at'>>) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('productId', productId)
    .eq('userId', user.id);

  if (error) throw error;
}

export async function deleteMyProduct(productId: string) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('productId', productId)
    .eq('userId', user.id);

  if (error) throw error;
}
