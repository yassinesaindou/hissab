// app/products/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import ClientProductsPage from './ClientProductsPage';
import { Loader2 } from 'lucide-react';

type Product = {
  productId: string;
  name: string;
  stock: number;
  unitPrice: number;
  category: string;
  description: string | null;
  created_at: string;
};

export default function ProductsPage() {
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
    async function loadProducts() {
      try {
        const res = await fetch('/api/products/data');
        if (!res.ok) {
          if (res.status === 401) {
            router.replace('/login');
          } else if (res.status === 404) {
            console.warn('Store not found for user');
          }
          return;
        }

        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [router]);

   if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">Chargement...</span>
      </div>
    );
  }


  return <ClientProductsPage products={products} />;
}