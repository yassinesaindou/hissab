// app/api/credits/data/route.ts
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
      .select('role')
      .eq('userId', user.id)
      .single();

    if (profile?.role === 'employee') {
      return NextResponse.json({ redirect: '/' });
    }

    const [creditsRes, productsRes] = await Promise.all([
      supabase
        .from('credits')
        .select('creditId, customerName, customerPhone, amount, status, description, productId, created_at')
        .eq('userId', user.id),

      supabase
        .from('products')
        .select('productId, name, unitPrice, stock')
        .eq('userId', user.id),
    ]);

    return NextResponse.json({
      credits: creditsRes.data || [],
      products: productsRes.data || [],
    });
  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}