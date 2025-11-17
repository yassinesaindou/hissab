// app/api/invoice/data/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getProducts, getStore } from '@/app/actions';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [productsRes, storeRes] = await Promise.all([
      getProducts(),
      getStore(),
    ]);

    return NextResponse.json({
      products: productsRes.success ? productsRes.data || [] : [],
      store: storeRes.store || null,
    });
  } catch (error) {
    console.error('Invoice API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}