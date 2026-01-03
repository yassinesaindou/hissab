/* eslint-disable @typescript-eslint/no-explicit-any */
// app/analytics/page.tsx
"use client";

 
import PeriodSelector from "@/components/PeriodSelector";
 
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  Activity,
  BarChart3,
  TrendingUp as ChartLine,
  CreditCard,
  Package,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AnalyticsGraph from "./components/AnalyticsGraph";
import StatCard from "../dashboard/components/StatCard";

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseClient();

  const [analytics, setAnalytics] = useState<any>(null);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<"area" | "line" | "bar">("area");

  const period = searchParams.get("period") || "last_30_days";
  const customStart = searchParams.get("start");
  const customEnd = searchParams.get("end");

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, storeId")
        .eq("userId", user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      const filterKey = profile.role === "employee" ? "userId" : "storeId";
      const filterValue = profile.role === "employee" ? user.id : profile.storeId;

      // === DATE RANGE ===
      let startDate: Date = new Date();
      const endDate = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (period) {
        case "today": startDate = today; break;
        case "this_week":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay());
          break;
        case "last_30_days":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          break;
        case "last_90_days":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 90);
          break;
        case "last_120_days":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 120);
          break;
        case "last_365_days":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 365);
          break;
        case "custom":
          if (!customStart || !customEnd) { setLoading(false); return; }
          startDate = new Date(customStart);
          endDate.setTime(new Date(customEnd).getTime());
          if (startDate > endDate) { setLoading(false); return; }
          break;
        default:
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
      }

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // === FETCH ALL DATA IN PARALLEL ===
      const [
        { data: transactions },
        { data: credits },
        { count: totalProducts }
      ] = await Promise.all([
        supabase
          .from("transactions")
          .select("type, totalPrice, created_at")
          .eq(filterKey, filterValue)
          .in("type", ["sale", "expense"])
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),

        supabase
          .from("credits")
          .select("amount, created_at")
          .eq(filterKey, filterValue)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),

        supabase
          .from("products")
          .select("productId", { count: "exact" })
          .eq("storeId", profile.storeId)
      ]);

      // === CALCULATE TOTALS ===
      const totalSales = (transactions || [])
        .filter(t => t.type === "sale")
        .reduce((sum, t) => sum + Number(t.totalPrice || 0), 0);

      const totalExpenses = (transactions || [])
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.totalPrice || 0), 0);

      const totalCredits = (credits || [])
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

      const totalRevenue = totalSales - totalExpenses;

      // Calculate transaction counts
      const salesCount = (transactions || []).filter(t => t.type === "sale").length;
      const expensesCount = (transactions || []).filter(t => t.type === "expense").length;

      setAnalytics({
        sales: { total: totalSales, count: salesCount },
        expenses: { total: totalExpenses, count: expensesCount },
        credits: { total: totalCredits, count: credits?.length || 0 },
        revenue: { total: totalRevenue },
        products: { total: totalProducts || 0 },
      });

      // === GRAPH DATA ===
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      const chartData: any[] = [];

      if (daysDiff <= 90) {
        // Daily
        for (let i = 0; i <= daysDiff; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dayStr = date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });

          const dayTxns = (transactions || []).filter(t =>
            new Date(t.created_at).toDateString() === date.toDateString()
          );
          const dayCredits = (credits || []).filter(c =>
            new Date(c.created_at).toDateString() === date.toDateString()
          );

          const daySales = dayTxns.filter(t => t.type === "sale").reduce((s, t) => s + Number(t.totalPrice || 0), 0);
          const dayExpenses = dayTxns.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.totalPrice || 0), 0);

          chartData.push({
            day: dayStr,
            sales: daySales,
            expenses: dayExpenses,
            credits: dayCredits.reduce((s, c) => s + Number(c.amount || 0), 0),
            revenue: daySales - dayExpenses
          });
        }
      } else {
        // For longer periods, group by week or month
        chartData.push({ day: "Total", sales: totalSales, expenses: totalExpenses, credits: totalCredits, revenue: totalRevenue });
      }

      setGraphData(chartData);
      setLoading(false);
    }

    load();
  }, [period, customStart, customEnd, supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Chargement des statistiques</h3>
            <p className="text-gray-600 mt-1">Récupération des données...</p>
          </div>
        </div>
      </div>
    );
  }


  if (!analytics) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytiques</h1>
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">Impossible de charger les données analytiques.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-shadow"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const getPeriodLabel = () => {
    switch (period) {
      case "today": return "Aujourd'hui";
      case "this_week": return "Cette semaine";
      case "last_30_days": return "Derniers 30 jours";
      case "last_90_days": return "Derniers 90 jours";
      case "last_120_days": return "Derniers 120 jours";
      case "last_365_days": return "Derniers 365 jours";
      case "custom": return "Période personnalisée";
      default: return "Derniers 30 jours";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Analyse des Performances
              </h1>
              <p className="text-gray-600 mt-2">Suivez les performances de votre entreprise en temps réel</p>
            </div>
            <PeriodSelector period={period} customStart={customStart ?? undefined} customEnd={customEnd ?? undefined} />
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm text-gray-600">Période: <span className="font-medium">{getPeriodLabel()}</span></span>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Ventes Totales"
            value={analytics.sales.total}
            subtitle={
              <span className="text-emerald-600 font-medium">
                {analytics.sales.count} transaction{analytics.sales.count !== 1 ? 's' : ''}
              </span>
            }
            variant="emerald"
            format="currency"
          />

          <StatCard
            icon={<TrendingDown className="h-6 w-6" />}
            title="Dépenses Totales"
            value={analytics.expenses.total}
            subtitle={
              <span className="text-rose-600 font-medium">
                {analytics.expenses.count} dépense{analytics.expenses.count !== 1 ? 's' : ''}
              </span>
            }
            variant="red"
            format="currency"
          />

          <StatCard
            icon={<ChartLine className="h-6 w-6" />}
            title="Revenus Nets"
            value={analytics.revenue.total}
            subtitle={
              <span className={analytics.revenue.total >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                {analytics.revenue.total >= 0 ? "Profit" : "Perte"}
              </span>
            }
            variant="blue"
            format="currency"
          />

          <StatCard
            icon={<CreditCard className="h-6 w-6" />}
            title="Crédits en Cours"
            value={analytics.credits.total}
            subtitle={
              <span className="text-amber-600 font-medium">
                {analytics.credits.count} crédit{analytics.credits.count !== 1 ? 's' : ''} actifs
              </span>
            }
            variant="purple"
            format="currency"
          />
        </div>

        {/* Products and Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<Package className="h-6 w-6" />}
            title="Articles Enregistrés"
            value={analytics.products.total}
            subtitle="Stock total disponible"
            variant="default"
            format="number"
          />

          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de la Période</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Taux de Conversion</span>
                  <span className="font-semibold text-emerald-600">--</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Vente Moyenne</span>
                  <span className="font-semibold text-gray-900">
                    {analytics.sales.count > 0 
                      ? Math.round(analytics.sales.total / analytics.sales.count).toLocaleString() 
                      : "0"} Fcs
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Dépense Moyenne</span>
                  <span className="font-semibold text-gray-900">
                    {analytics.expenses.count > 0 
                      ? Math.round(analytics.expenses.total / analytics.expenses.count).toLocaleString() 
                      : "0"} Fcs
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Marge</span>
                  <span className={`font-semibold ${analytics.revenue.total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {analytics.sales.total > 0 
                      ? Math.round((analytics.revenue.total / analytics.sales.total) * 100) 
                      : "0"}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Évolution des Performances</h2>
              <p className="text-gray-600">Visualisez les tendances des ventes, dépenses et revenus</p>
            </div>
            
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <div className="inline-flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveChart("area")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeChart === "area" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <BarChart3 className="h-4 w-4 inline mr-1.5" />
                  Zone
                </button>
                <button
                  onClick={() => setActiveChart("line")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeChart === "line" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Activity className="h-4 w-4 inline mr-1.5" />
                  Ligne
                </button>
                <button
                  onClick={() => setActiveChart("bar")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeChart === "bar" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <ChartLine className="h-4 w-4 inline mr-1.5" />
                  Barre
                </button>
              </div>
            </div>
          </div>

          <AnalyticsGraph data={graphData} chartType={activeChart} />
        </div>

        {/* Insights Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Insights & Recommandations
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <h4 className="font-medium text-gray-900 mb-2">Performance des Ventes</h4>
              <p className="text-sm text-gray-600">
                Vos ventes représentent <span className="font-semibold text-emerald-600">{analytics.sales.total.toLocaleString()} Fcs</span> sur la période sélectionnée.
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <h4 className="font-medium text-gray-900 mb-2">Gestion des Dépenses</h4>
              <p className="text-sm text-gray-600">
                Votre ratio dépenses/revenus est de <span className="font-semibold text-rose-600">
                  {analytics.sales.total > 0 ? Math.round((analytics.expenses.total / analytics.sales.total) * 100) : "0"}%
                </span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}