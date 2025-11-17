// app/transactions/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import ClientTransactionsPage from './ClientTransactionsPage';
import { Product, Transaction } from '@/lib/types';
import { Loader2 } from 'lucide-react';
 // ← IMPORT

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      }
    });
  }, [supabase, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/transactions/data');
        if (!res.ok) {
          if (res.status === 401) router.replace('/login');
          return;
        }
        const data = await res.json();
        setTransactions(data.transactions || []);
        setProducts(data.products || []);
      } catch (err) {
        console.error('Failed to load transactions', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

   if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">Chargement...</span>
      </div>
    );
  }


  return (
    <ClientTransactionsPage
      transactions={transactions}
      products={products}
    />
  );
}