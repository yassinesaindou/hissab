// lib/offline/createInvoiceOfflineFirst.ts
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
import { createLocalTransaction } from './transactions';
import { getUserProfile } from './session';
import { createSupabaseClient } from '@/lib/supabase/client';

export async function createInvoiceOfflineFirst(params: {
  clientName: string | undefined;
  clientPhone: string | undefined;
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
  const invoiceId = uuidv4(); // unique per invoice (used for grouping)

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

  // Process each product as its own transaction line
  for (const product of params.products) {
    const lineTotal = product.unitPrice * product.quantity;

    const txData = {
      userId,
      storeId,
      productId: product.productId || null,
      productName: product.name,
      unitPrice: product.unitPrice,
      totalPrice: lineTotal,
      quantity: product.quantity,
      type: 'sale' as const,
      description: params.notes || null,
      created_at: new Date().toISOString(),
      invoiceId, // ← links all lines of this invoice
    };

    if (navigator.onLine) {
      // Online: check & update stock + insert transaction
      if (product.productId) {
        const { data: current, error: fetchErr } = await supabase
          .from('products')
          .select('stock, name')
          .eq('productId', product.productId)
          .single();

        if (fetchErr || !current) {
          throw new Error(`Produit ${product.name} introuvable`);
        }

        if (current.stock < product.quantity) {
          throw new Error(`Stock insuffisant pour ${current.name}. Disponible: ${current.stock}`);
        }

        await supabase
          .from('products')
          .update({ stock: current.stock - product.quantity })
          .eq('productId', product.productId);
      }

      await supabase.from('transactions').insert(txData);
    } else {
      // Offline: save locally (no stock change — server will handle during sync)
      await createLocalTransaction(txData);
    }
  }

  return { success: true, invoiceId, invoiceData: params };
}