// app/credits/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import ClientCreditsPage from './ClientCreditsPage';
import { Loader2 } from 'lucide-react';

type Credit = {
  creditId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  status: string;
  description: string | null;
  productId: string | null;
  created_at: string;
};

type Product = {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
};

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    // Auth guard
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      }
    });
  }, [supabase, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/credits/data');
        if (!res.ok) {
          if (res.status === 401) {
            router.replace('/login');
          }
          return;
        }

        const data = await res.json();

        // Handle employee redirect
        if (data.redirect) {
          router.replace(data.redirect);
          return;
        }

        setCredits(data.credits || []);
        setProducts(data.products || []);
      } catch (err) {
        console.error('Failed to load credits', err);
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
    <ClientCreditsPage credits={credits} products={products} />
  );
}