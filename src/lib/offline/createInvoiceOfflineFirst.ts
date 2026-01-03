// lib/offline/createInvoiceOfflineFirst.ts
import { createLocalTransaction } from './transactions';
import { getUserProfile } from './session';
import { getAllProducts } from './products';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function createInvoiceOfflineFirst(params: {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  storeName: string;
  storeAddress: string;
  storePhoneNumber?: string;
  notes?: string;
  products: Array<{
    productId?: string;
    name: string;
    unitPrice: number;
    quantity: number;
  }>;
}) {
  const supabase = createSupabaseClient();

  // Get user and storeId
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
    if (!localProfile) throw new Error('Données locales manquantes');

    userId = localProfile.userId;
    storeId = localProfile.storeId;
  }

  // Calculate totals
  let totalPrice = 0;
  let totalQuantity = 0;
  let description = "";

  for (const product of params.products) {
    totalPrice += product.unitPrice * product.quantity;
    totalQuantity += product.quantity;
    description += `${product.name} (x${product.quantity}), `;
  }
  description = description.slice(0, -2);

  const transactionData = {
    userId,
    storeId,
    productId: null,
    productName: "Facture - Plusieurs articles",
    unitPrice: null,
    totalPrice,
    quantity: totalQuantity,
    type: 'sale' as const,
    description: description || null,
    created_at: new Date().toISOString(),
  };

  if (navigator.onLine) {
    // === ONLINE: Save ONLY to Supabase ===
    const { error: txError } = await supabase
      .from('transactions')
      .insert(transactionData);

    if (txError) throw txError;

    // Update stock online
    for (const product of params.products) {
      if (product.productId) {
        const { data: current, error: fetchErr } = await supabase
          .from('products')
          .select('stock')
          .eq('productId', product.productId)
          .single();

        if (fetchErr || !current) continue;

        const newStock = current.stock - product.quantity;

        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('productId', product.productId);
      }
    }
  } else {
    // === OFFLINE: Save ONLY locally ===
    await createLocalTransaction(transactionData);

    // Update stock locally
    for (const product of params.products) {
      if (product.productId) {
        const localProducts = await getAllProducts(storeId);
        const found = localProducts.find(p => p.productId === product.productId);
        if (found) {
          if (found.stock < product.quantity) {
            throw new Error(`Stock insuffisant pour ${product.name}. Disponible: ${found.stock}`);
          }
          found.stock -= product.quantity;
          const db = await import('@/lib/indexeddb').then(m => m.getDB());
          const tx = db.transaction('products', 'readwrite');
          await tx.store.put(found);
          await tx.done;
        }
      }
    }
  }

  return { success: true, invoiceData: params };
}