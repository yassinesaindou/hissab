import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { CookieOptions } from '@supabase/ssr';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
export async function createSubscription(userId: string, planType: string = 'free') {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      userId,
      planType,
      created_at: new Date().toISOString(),
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
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