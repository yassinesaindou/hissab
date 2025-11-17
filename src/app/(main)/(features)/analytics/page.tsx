/* eslint-disable @typescript-eslint/no-explicit-any */
// app/analytics/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import PeriodSelector from "@/components/PeriodSelector";
import AnalyticsCard from "@/components/AnalyticsCard";
import AnalyticsGraph from "@/components/AnalyticsGraph";
import { ChartArea, DollarSign, Loader2, Package } from "lucide-react";

type AnalyticsData = {
  sales: { total: number };
  expenses: { total: number };
  credits: { total: number };
  revenue: { total: number };
  products: { total: number };
};

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseClient();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const period = searchParams.get("period") || "last_30_days";
  const customStart = searchParams.get("start") || undefined;
  const customEnd = searchParams.get("end") || undefined;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      }
    });
  }, [supabase, router]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({
        period,
        ...(customStart && { start: customStart }),
        ...(customEnd && { end: customEnd }),
      });

      const res = await fetch(`/api/analytics?${params}`);
      if (!res.ok) {
        if (res.status === 401) router.replace("/login");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.analytics.success) {
        setAnalytics({
          sales: { total: Number(data.analytics.data.sales?.total || 0) },
          expenses: { total: Number(data.analytics.data.expenses?.total || 0) },
          credits: { total: Number(data.analytics.data.credits?.total || 0) },
          revenue: { total: Number(data.analytics.data.revenue?.total || 0) },
          products: { total: Number(data.analytics.data.products?.total || 0) },
        });
      }
      if (data.graph.success) {
        setGraphData(data.graph.data || []);
      }
      setLoading(false);
    }
    load();
  }, [period, customStart, customEnd, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <h1 className="text-2xl font-semibold mb-6">Analytiques</h1>
        <p className="text-red-600">Erreur de chargement des données.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 text-gray-700">
      <h1 className="text-2xl font-semibold mb-6">Analytiques</h1>
      <PeriodSelector
        period={period}
        customStart={customStart}
        customEnd={customEnd}
      />
      <div className="flex flex-wrap justify-start gap-4 my-6 w-full">
        <AnalyticsCard
          title="Ventes"
          value={analytics.sales.total}
          icon={ChartArea}
          color="green"
          unit="Fcs"
        />
        <AnalyticsCard
          title="Dépenses"
          value={analytics.expenses.total}
          icon={DollarSign}
          color="red"
          unit="Fcs"
        />
        <AnalyticsCard
          title="Revenus"
          value={analytics.revenue.total}
          icon={ChartArea}
          color="blue"
          unit="Fcs"
        />
        <AnalyticsCard
          title="Crédits"
          value={analytics.credits.total}
          icon={DollarSign}
          color="yellow"
          unit="Fcs"
        />
        <AnalyticsCard
          title="Articles Enregistrés"
          value={analytics.products.total}
          icon={Package}
          color="purple"
          unit=""
          isProducts={true}
        />
      </div>
      <AnalyticsGraph data={graphData} />
    </div>
  );
}
