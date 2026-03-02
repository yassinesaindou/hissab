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

  // ── Get userId and storeId ────────────────────────────────────────────────
  let userId: string;
  let storeId: string;

  if (navigator.onLine) {
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
    const localProfile = await getUserProfile();
    if (!localProfile || !localProfile.storeId) {
      throw new Error('Données locales manquantes. Connectez-vous une première fois.');
    }

    userId = localProfile.userId;
    storeId = localProfile.storeId;
  }

  // ── Build transaction object ──────────────────────────────────────────────
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

  const transactionToBeAdded = {
    userId,
    storeId,
     
    productName: params.productName || null,
    unitPrice: params.unitPrice,
    totalPrice: params.unitPrice * params.quantity,
    quantity: params.quantity,
    type: params.type,
    description: params.description || null,
    created_at: new Date().toISOString(),
  }

  // ── STOCK CHECK & UPDATE ── only when online ──────────────────────────────
  if (navigator.onLine && params.productId && (params.type === 'sale' || params.type === 'credit')) {
    const { data: product, error: fetchErr } = await supabase
      .from('products')
      .select('stock, name')
      .eq('productId', params.productId)
      .eq('storeId', storeId)
      .single();

    if (fetchErr || !product) {
      throw new Error('Produit introuvable ou erreur réseau');
    }

    if (product.stock < params.quantity) {
      throw new Error(`Stock insuffisant pour ${product.name}. Disponible: ${product.stock}`);
    }

    const newStock = product.stock - params.quantity;

    const { error: updateErr } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('productId', params.productId);

    if (updateErr) throw updateErr;
  }

  // ── SAVE TRANSACTION ── exclusive paths ───────────────────────────────────
  if (navigator.onLine) {
    // Online → only Supabase
    const { error } = await supabase.from('transactions').insert(transactionToBeAdded);
    if (error) throw error;
  } else {
    // Offline → only local (no stock change here)
    await createLocalTransaction(transaction);
  }

  return { success: true };
}