/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import Dashboard from "@/app/components/Card";
import RecentTransactionTable from "@/app/components/RecentTransactionTable";
import RecentCredits from "@/app/components/RecentCredits";
import SubNavbar from "@/app/components/SubNavbar";
import Graph from "@/app/components/Graph";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  // first load spinner only
  const [loading, setLoading] = useState(true);

  // silent background refresh indicator
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const supabase = createSupabaseClient();

  // keep a ref to the latest loadData so the event handler can call it
  const loadDataRef = useRef<(opts?: { showLoading?: boolean }) => Promise<void> | null>(null);

  // auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });
  }, [supabase, router]);

  // core loader
  const loadData = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // debug
      console.debug("[Dashboard] loadData() start. showLoading=", showLoading);

      const [d, y, t, c] = await Promise.all([
        fetch("/api/dashboard/data").then((r) => r.json()),
        fetch("/api/dashboard/yearly").then((r) => r.json()),
        fetch("/api/dashboard/recent-transactions").then((r) => r.json()),
        fetch("/api/dashboard/recent-credits").then((r) => r.json()),
      ]);

      setData({
        dashboard: d,
        yearly: y,
        transactions: t,
        credits: c,
      });

      console.debug("[Dashboard] loadData() success", { d, y, t, c });
    } catch (err) {
      console.error("[Dashboard] loadData error:", err);
    } finally {
      if (showLoading) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  // expose to ref so event handler always calls latest
  loadDataRef.current = loadData;

  // initial load
  useEffect(() => {
    loadData({ showLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // named event handler so removeEventListener works
  useEffect(() => {
    function handleRefreshEvent(e: Event) {
      console.debug("[Dashboard] received refresh-dashboard event", e);
      // silent refresh (no full spinner)
      loadDataRef.current?.({ showLoading: false });
    }

    window.addEventListener("refresh-dashboard", handleRefreshEvent);
    console.debug("[Dashboard] registered refresh-dashboard listener");

    return () => {
      window.removeEventListener("refresh-dashboard", handleRefreshEvent);
      console.debug("[Dashboard] removed refresh-dashboard listener");
    };
  }, []);

  if (loading || !data) {
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

      {refreshing && <div className="text-xs text-gray-400 mb-2">Updating…</div>}

      {dashboard?.success && (
        <Dashboard
          sales={dashboard.data?.sales}
          expenses={dashboard.data?.expenses}
          credits={dashboard.data?.credits}
          revenue={dashboard.data?.revenue}
        />
      )}

      <Graph data={yearly?.data || []} />

      <div className="flex gap-4 mt-10 flex-col lg:flex-row">
        <RecentTransactionTable transactions={transactions?.transactions || []} />
        <RecentCredits credits={credits?.credits || []} />
      </div>
    </div>
  );
}
