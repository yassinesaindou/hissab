// components/SubNavbar.tsx
'use client';
import { useEffect, useState } from 'react';
import { ClientAddTransactionForm } from '@/app/(main)/(features)/transactions/ClientTransactionsPage';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type SubNavbarData = {
  userName: string;
  products: Array<{
    productId: string;
    name: string;
    unitPrice: number;
    stock: number;
  }>;
};

export default function SubNavbar() {
  const [data, setData] = useState<SubNavbarData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      }
    });
  }, [supabase, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        router.replace('/login');
        return;
      }
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return <div className="pb-3 border-b">Chargement...</div>;

  return (
    <div className="w-full pb-3 border-b space-x-2 flex flex-col md:flex-row justify-between">
      <div className="min-w-fit">
        <h2>Mes Salutations, {data?.userName}</h2>
      </div>
      <div className="flex justify-end items-center w-full mt-3 md:mt-0 space-x-2">
        <ClientAddTransactionForm products={data?.products ?? []} />
      </div>
    </div>
  );
}