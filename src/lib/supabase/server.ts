import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
 
import { CookieOptions } from '@supabase/ssr';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase instance
 

// Server-side Supabase client
export const createSupabaseServerClient = () => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async getAll() {
        const cookieStore = await cookies(); // Await the promise
        return cookieStore.getAll(); // Returns { name, value }[]
      },
      async setAll(cookiesToSet) {
        try {
          const cookieStore = await cookies(); // Await the promise
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions);
          });
        } catch (error) {
          console.error('Error setting cookies:', error);
        }
      },
    },
  });
};

// Create subscription
// app/actions.ts or wherever
export async function createSubscription(
  userId: string,
  planId: number = 2, // default = Pro
  storeId: string
) {
  const supabase = createSupabaseServerClient();

  const endAt = new Date();
  endAt.setDate(endAt.getDate() + 7); // 7-day trial

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      userId,
      planId, // ← integer ID
      storeId,
      created_at: new Date().toISOString(),
      endAt: endAt.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating subscription:', error.message);
    return null;
  }

  return data;
}

export async function createStore(userId: string) {
  const supabase = createSupabaseServerClient();
  const { data: storeData, error: storeError } = await supabase.from('stores').insert({
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).select().single();

  if (storeError) {
    console.error('Error creating store:', storeError.message);
    return null;        
  }

  return storeData;
}