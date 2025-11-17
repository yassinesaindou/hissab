// app/api/user/profile/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, storeId')
    .eq('userId', user.id)
    .single();

  const { data: products } = await supabase
    .from('products')
    .select('productId, name, unitPrice, stock')
    .eq('storeId', profile?.storeId || '')
    .limit(100);

  return NextResponse.json({
    userName: profile?.name || 'User',
    products: products || [],
  });
}