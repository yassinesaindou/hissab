// lib/offline/createTransactionOfflineFirst.ts
import { createLocalTransaction } from './transactions';
import { getUserProfile } from './session';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function createTransactionOfflineFirst(params: {
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  type: 'sale' | 'expense' | 'credit';
  description?: string;
}) {
  const supabase = createSupabaseClient();

  let userId: string;
  let storeId: string;

  if (navigator.onLine) {
    // === ONLINE: Get from Supabase ===
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data: profile } = await supabase
      .from('profiles')
      .select('storeId')
      .eq('userId', user.id)
      .single();

    if (!profile?.storeId) throw new Error('Magasin non trouvé');

    userId = user.id;
    storeId = profile.storeId;
  } else {
    // === OFFLINE: Use local data ===
    const localProfile = await getUserProfile();
    if (!localProfile) throw new Error('Données locales manquantes');

    userId = localProfile.userId;
    storeId = localProfile.storeId;
  }

  const transaction = {
    userId,
    storeId,
    productId: params.productId || null,
    productName: params.productName || null,
    unitPrice: params.unitPrice,
    totalPrice: params.unitPrice * params.quantity,
    quantity: params.quantity,
    type: params.type,
    description: params.description || null,
    created_at: new Date().toISOString(),
  };

  if (navigator.onLine) {
    // === ONLINE: Only save to Supabase ===
    const { error } = await supabase.from('transactions').insert(transaction);
    if (error) throw error;

    return { success: true };
  } else {
    // === OFFLINE: Only save locally ===
    await createLocalTransaction(transaction);
    return { success: true };
  }
}