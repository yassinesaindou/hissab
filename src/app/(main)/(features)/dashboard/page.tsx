/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(main)/(features)/dashboard/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import Dashboard from "@/app/components/Card";
import RecentTransactionTable from "@/app/components/RecentTransactionTable";
import RecentCredits from "@/app/components/RecentCredits";
import SubNavbar from "@/app/components/SubNavbar";
import Graph from "@/app/components/Graph";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    sales: 0,
    expenses: 0,
    credits: 0,
    revenue: 0,
  });

  const [yearlyData, setYearlyData] = useState<Array<{ name: string; sales: number; expenses: number; credits: number; revenue: number }>>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [recentCredits, setRecentCredits] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const supabase = createSupabaseClient();
  const loadDataRef = useRef<(() => void) | undefined>(undefined);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("storeId, role")
        .eq("userId", user.id)
        .single();

      if (!profile) return;

      const isEmployee = profile.role === "employee";
      const filterKey = isEmployee ? "userId" : "storeId";
      const filterValue = isEmployee ? user.id : profile.storeId;

      // Recent Transactions
      const { data: txns } = await supabase
        .from("transactions")
        .select("created_at, type, totalPrice, productName")
        .eq(filterKey, filterValue)
        .in("type", ["sale", "expense"])
        .order("created_at", { ascending: false })
        .limit(10);

      const formattedTxns = (txns || []).map((t: any, i: number) => ({
        id: i + 1,
        date: new Date(t.created_at).toISOString().split("T")[0],
        type: t.type === "sale" ? "Vente" : "Dépense",
        amount: t.totalPrice || 0,
        description: t.productName || "N/A",
      }));

      // Recent Credits
      const { data: credits } = await supabase
        .from("credits")
        .select("customerName, customerPhone, amount")
        .eq(filterKey, filterValue)
        .order("created_at", { ascending: false })
        .limit(10);

      const formattedCredits = (credits || []).map((c: any, i: number) => ({
        id: i + 1,
        name: c.customerName || "Inconnu",
        phone: c.customerPhone || "N/A",
        amount: c.amount || 0,
      }));

      // Last 14 days stats
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data: recentTxns } = await supabase
        .from("transactions")
        .select("type, totalPrice")
        .eq(filterKey, filterValue)
        .in("type", ["sale", "expense"])
        .gte("created_at", fourteenDaysAgo.toISOString());

      const sales = (recentTxns || []).filter(t => t.type === "sale").reduce((s, t) => s + (t.totalPrice || 0), 0);
      const expenses = (recentTxns || []).filter(t => t.type === "expense").reduce((s, t) => s + (t.totalPrice || 0), 0);

      const { data: pendingCredits } = await supabase
        .from("credits")
        .select("amount")
        .eq(filterKey, filterValue)
        .eq("status", "pending")
        .gte("created_at", fourteenDaysAgo.toISOString());

      const totalPendingCredits = (pendingCredits || []).reduce((s, c) => s + (c.amount || 0), 0);
      const revenue = sales - expenses;

      // Yearly data
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const { data: yearlyTxns } = await supabase
        .from("transactions")
        .select("created_at, type, totalPrice")
        .eq(filterKey, filterValue)
        .gte("created_at", startOfYear.toISOString());

      const monthly = Array.from({ length: 12 }, (_, i) => {
        const monthStart = new Date(new Date().getFullYear(), i, 1);
        const monthEnd = new Date(new Date().getFullYear(), i + 1, 0);

        const monthTxns = (yearlyTxns || []).filter((t: any) => {
          const d = new Date(t.created_at);
          return d >= monthStart && d <= monthEnd;
        });

        const monthSales = monthTxns.filter(t => t.type === "sale").reduce((s, t) => s + (t.totalPrice || 0), 0);
        const monthExpenses = monthTxns.filter(t => t.type === "expense").reduce((s, t) => s + (t.totalPrice || 0), 0);

        return {
          name: monthStart.toLocaleString("default", { month: "short" }),
          sales: monthSales,
          expenses: monthExpenses,
          credits: 0,
          revenue: monthSales - monthExpenses,
        };
      });

      setStats({ sales, expenses, credits: totalPendingCredits, revenue });
      setYearlyData(monthly);
      setRecentTransactions(formattedTxns);
      setRecentCredits(formattedCredits);
    } catch (err) {
      console.error("Load failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  // THIS WAS THE BUG — it was outside useEffect
  useEffect(() => {
    loadDataRef.current = () => loadData(true);
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh listener
  useEffect(() => {
    const handler = () => loadDataRef.current?.();
    window.addEventListener("refresh-dashboard", handler);
    return () => window.removeEventListener("refresh-dashboard", handler);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-4 text-xl">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SubNavbar />
      {refreshing && <div className="text-center py-2 text-sm text-gray-500">Mise à jour...</div>}

      <Dashboard
        sales={stats.sales}
        expenses={stats.expenses}
        credits={stats.credits}
        revenue={stats.revenue}
        salesData={yearlyData.map(d => ({ name: d.name, value: d.sales }))}
        expensesData={yearlyData.map(d => ({ name: d.name, value: d.expenses }))}
        creditsData={yearlyData.map(d => ({ name: d.name, value: 0 }))}
        revenueData={yearlyData.map(d => ({ name: d.name, value: d.revenue }))}
      />

      <div className="mt-8">
        <Graph data={yearlyData} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <RecentTransactionTable transactions={recentTransactions} />
        <RecentCredits credits={recentCredits} />
      </div>
    </div>
  );
}