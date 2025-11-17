// app/api/transactions/data/route.ts
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
      .select('userId, name, storeId, role')
      .eq('userId', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const modifiedStoreId = profile.role === 'employee' ? user.id : profile.storeId;
    const comparisonColumn = profile.role === 'employee' ? 'userId' : 'storeId';

    const [transactionsRes, productsRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('transactionId, created_at, userId, productId, productName, unitPrice, totalPrice, quantity, type')
        .eq(comparisonColumn, modifiedStoreId),

      supabase
        .from('products')
        .select('productId, name, unitPrice, stock')
        .eq('storeId', profile.storeId),
    ]);

    const productMap = new Map(productsRes.data?.map(p => [p.productId, p.name]) || []);
    const enrichedTransactions = transactionsRes.data?.map(t => ({
      ...t,
      productName: t.productName || (t.productId ? productMap.get(t.productId) || null : null),
    })) || [];

    return NextResponse.json({
      transactions: enrichedTransactions,
      products: productsRes.data || [],
    });
  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}