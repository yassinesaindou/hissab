/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import Dashboard from '@/app/components/Card';

import RecentTransactionTable from '@/app/components/RecentTransactionTable';
import RecentCredits from '@/app/components/RecentCredits';
import SubNavbar from '@/app/components/SubNavbar';
import Graph from '@/app/components/Graph';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login');
    });
  }, [supabase, router]);

  useEffect(() => {
    async function load() {
      const [d, y, t, c] = await Promise.all([
        fetch('/api/dashboard/data').then(r => r.json()),
        fetch('/api/dashboard/yearly').then(r => r.json()),
        fetch('/api/dashboard/recent-transactions').then(r => r.json()),
        fetch('/api/dashboard/recent-credits').then(r => r.json()),
      ]);

      setData({ dashboard: d, yearly: y, transactions: t, credits: c });
      setLoading(false);
    }
    load();
  }, []);

   if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">Chargement...</span>
      </div>
    );
  }


  const { dashboard, yearly, transactions, credits } = data;

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <SubNavbar />
      {dashboard.success && (
        <Dashboard
          sales={dashboard.data.sales}
          expenses={dashboard.data.expenses}
          credits={dashboard.data.credits}
          revenue={dashboard.data.revenue}
        />
      )}
      <Graph data={yearly.data || []} />
      <div className="flex gap-4 mt-10 flex-col lg:flex-row">
        <RecentTransactionTable transactions={transactions.transactions || []} />
        <RecentCredits credits={credits.credits || []} />
      </div>
    </div>
  );
}