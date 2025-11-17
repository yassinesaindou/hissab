// app/api/products/data/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('storeId')
      .eq('userId', user.id)
      .single();

    if (!profile?.storeId) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('productId, name, stock, unitPrice, category, description, created_at')
      .eq('storeId', profile.storeId);

    if (error) {
      console.error('Products API error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error('Unexpected API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}