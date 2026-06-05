/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import LowStockAlerts from "./components/LowStockAlerts";
import PerformanceChart from "./components/PerformanceChart";
import RecentTransactions from "./components/RecentTransactions";
import StatsOverview from "./components/StatsOverview";
import TopProducts from "./components/TopProducts";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

import QuickActionsButton from "./components/QuickActionsButton";
import AddTransactionModal from "./components/AddTransactionModal";
 
import InstallPrompt from "@/components/pwa/PWAInstallPromt";
import { fetchDashboardDataOffline } from "@/lib/offline/dashboardOffline";
import { getUserProfile } from "@/lib/offline/session";
 import * as XLSX from "xlsx";
import { aggregateOldTransactions } from "./actions/aggregateOldTransactions";
 

interface DashboardData {
  monthlyData: {
    name: string;
    sales: number;
    expenses: number;
    revenue: number;
  }[];
  quarterlyData: {
    name: string;
    sales: number;
    expenses: number;
    revenue: number;
  }[];
  dailyData: {
    name: string;
    sales: number;
    expenses: number;
    revenue: number;
  }[];
  todaySales: number;
  todayRevenue: number;
  pendingCredits: number;
  totalProducts: number;
  lowStockCount: number;
  recentTransactions: any[];
  lowStockProducts: any[];
  topProducts: any[];
  chartData: any[];
  availableProducts: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();

 useEffect(() => {
  async function checkEmployeeStatus() {
    if (!navigator.onLine) {
      const profile = await getUserProfile();
      if (profile?.role === 'employee' && !profile.isActive) {
        router.push("/deactivated");
      }
    }
  }
  checkEmployeeStatus();
}, []);
 

  const refreshData = async () => {
    await fetchDashboardData();
  };

async function fetchDashboardData() {
  try {
    setLoading(true);
    setError(null);

    let profile: { storeId: string; role: string, userId:string } | null = null;
    let filterKey: string;
    let filterValue: string;

    if (navigator.onLine) {
      // === ONLINE: Fetch user and profile from Supabase ===
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Non autorisé");
        router.push("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("storeId, role, userId")
        .eq("userId", user.id)
        .single();

      if (profileError || !profileData?.storeId) {
        setError("Aucun magasin associé");
        return;
      }

      profile = profileData;
    } else {
      // === OFFLINE: Use local profile from IndexedDB ===
      const localProfile = await getUserProfile();
      if (!localProfile || !localProfile.storeId) {
        setError("Pas de données locales. Connectez-vous avec internet pour synchroniser.");
        return;
      }

      profile = {
        storeId: localProfile.storeId,
        role: localProfile.role || "user",
        userId: localProfile.userId
      };
    }

    // Common setup
    const isEmployee = profile.role === "employee";
    filterKey = isEmployee ? "userId" : "storeId";
     
     filterValue = isEmployee ? profile.userId : profile.storeId;

    let data: DashboardData;

    if (navigator.onLine) {
      // === ONLINE: Your original Supabase fetches ===
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const [
        salesResponse,
        expensesResponse,
        creditsResponse,
        productsResponse,
        lowStockResponse,
        transactionsResponse,
        topProductsResponse,
        availableProductsResponse,
        dailyChartResponse,
        monthlyChartResponse,
        quarterlyChartResponse,
      ] = await Promise.all([
        supabase
          .from("transactions")
          .select("totalPrice")
          .eq(filterKey, filterValue)
          .eq("type", "sale")
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString()),
        supabase
          .from("transactions")
          .select("totalPrice")
          .eq(filterKey, filterValue)
          .eq("type", "expense")
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString()),
        supabase
          .from("credits")
          .select("amount")
          .eq(filterKey, filterValue)
          .eq("status", "pending"),
        supabase
          .from("products")
          .select("productId", { count: "exact" })
          .eq("storeId", profile.storeId),
        supabase
          .from("products")
          .select("productId, name, stock, unitPrice")
          .eq("storeId", profile.storeId)
          .lt("stock", 10)
          .order("stock", { ascending: true })
          .limit(5),
        supabase
          .from("transactions")
          .select(`
            transactionId,
            created_at,
            type,
            totalPrice,
            productName,
            quantity
          `)
          .eq(filterKey, filterValue)
          .in("type", ["sale", "expense"])
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("transactions")
          .select("productId, productName, totalPrice, quantity")
          .eq(filterKey, filterValue)
          .eq("type", "sale")
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from("products")
          .select("productId, name, unitPrice, stock")
          .eq("storeId", profile.storeId)
          .order("name", { ascending: true }),
        supabase
          .from("transactions")
          .select("created_at, type, totalPrice")
          .eq(filterKey, filterValue)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from("transactions")
          .select("created_at, type, totalPrice")
          .eq(filterKey, filterValue)
          .gte("created_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from("transactions")
          .select("created_at, type, totalPrice")
          .eq(filterKey, filterValue)
          .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      // Your original calculations
      const todaySales = salesResponse.data?.reduce((sum, t) => sum + (t.totalPrice || 0), 0) || 0;
      const todayExpenses = expensesResponse.data?.reduce((sum, t) => sum + (t.totalPrice || 0), 0) || 0;
      const todayRevenue = todaySales - todayExpenses;
      const pendingCredits = creditsResponse.data?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const totalProducts = productsResponse.count || 0;
      const lowStockCount = lowStockResponse.data?.length || 0;

      // Process recent transactions
      const recentTransactions = transactionsResponse.data?.map((t, index) => ({
        id: t.transactionId,
        srNo: index + 1,
        date: new Date(t.created_at).toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
        time: new Date(t.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        type: t.type === "sale" ? "sale" : "expense",
        amount: t.totalPrice || 0,
        product: t.productName || "N/A",
        quantity: t.quantity || 1,
      })) || [];

      // Process top products
      const productMap = new Map();
      topProductsResponse.data?.forEach((t) => {
        const key = t.productId || t.productName;
        if (!productMap.has(key)) {
          productMap.set(key, {
            id: t.productId,
            name: t.productName,
            sales: 0,
            quantity: 0,
          });
        }
        const product = productMap.get(key);
        product.sales += t.totalPrice || 0;
        product.quantity += t.quantity || 1;
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 3);

      // Process chart data (use your processChartData function)
      const dailyData = processChartData(dailyChartResponse.data || [], "daily");
      const monthlyData = processChartData(monthlyChartResponse.data || [], "monthly");
      const quarterlyData = processChartData(quarterlyChartResponse.data || [], "quarterly");

      data = {
        todaySales,
        todayRevenue,
        pendingCredits,
        totalProducts,
        lowStockCount,
        recentTransactions,
        lowStockProducts: lowStockResponse.data || [],
        topProducts,
        chartData: dailyData,
        availableProducts: availableProductsResponse.data || [],
        dailyData,
        monthlyData,
        quarterlyData,
      };
    } else {
      // === OFFLINE: Use IndexedDB ===
      data = await fetchDashboardDataOffline(profile.storeId);
    }

    setData(data);
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    setError("Erreur lors du chargement des données");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function downloadTransactionsAsXlsx(transactions: any[], year: number) {
  const rows = transactions.map((t) => ({
    "Transaction ID": t.transactionId,
    Date: t.created_at,
    Type: t.type,
    "Nom produit": t.productName || "",
    Quantité: t.quantity || 0,
    "Prix unitaire": t.unitPrice || 0,
    "Prix total": t.totalPrice || 0,
    Description: t.description || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Transactions ${year}`);
  XLSX.writeFile(workbook, `transactions_${year}.xlsx`);
}


  useEffect(() => {
  const checkAndAggregate = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Only run for 'user' role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, storeId")
        .eq("userId", user.id)
        .single();

      if (!profile || profile.role !== "user" || !profile.storeId) return;

      // Only on January 1st
      const today = new Date();
      const isJanuaryFirst = today.getMonth() === 0 && today.getDate() === 1;
      if (!isJanuaryFirst) return;

      // Guard: only once per year via localStorage
      const lockKey = `aggregated_${today.getFullYear()}_${profile.storeId}`;
      if (localStorage.getItem(lockKey)) {
        console.log("✅ Agrégation déjà effectuée aujourd'hui.");
        return;
      }

      console.log("🚀 Démarrage de l'agrégation annuelle...");
      const result = await aggregateOldTransactions(profile.storeId);

      if (result.success && result.aggregated) {
        // 1. Download XLSX first, before anything else is lost
        const aggregateYear = today.getFullYear() - 2;
        downloadTransactionsAsXlsx(result.data, aggregateYear);

        // 2. Mark as done
        localStorage.setItem(lockKey, today.toISOString());

        console.log(`✅ ${result.message}`);
        console.log(`📊 Ventes: ${result.stats?.totalSales} | Dépenses: ${result.stats?.totalExpenses}`);
      } else if (result.success && !result.aggregated) {
        console.log("ℹ️ " + result.message);
      } else {
        console.error("❌ Échec:", result.message);
      }
    } catch (error) {
      console.error("Erreur lors de l'agrégation:", error);
    }
  };

  checkAndAggregate();
}, [supabase]);


   
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:opacity-90">
              Réessayer
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune donnée disponible</p>
          </div>
        </div>
      </main>
    );
  }

  const handleTransactionSuccess = () => {
    setShowTransactionModal(false);
    refreshData();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Actions Rapides button inline */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de Bord
            </h1>
            <p className="mt-1 text-gray-600">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <QuickActionsButton
              onNewTransaction={() => setShowTransactionModal(true)}
            />
            <button
              onClick={refreshData}
              className="p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 shadow-sm">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats cards in one line */}
        <StatsOverview
          todaySales={data.todaySales}
          todayRevenue={data.todayRevenue}
          pendingCredits={data.pendingCredits}
          totalProducts={data.totalProducts}
        />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Left Column - Charts and Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Chart with Tabs */}
            <PerformanceChart
              dailyData={data.dailyData}
              monthlyData={data.monthlyData}
              quarterlyData={data.quarterlyData}
            />

            {/* Recent Transactions only */}
            <RecentTransactions transactions={data.recentTransactions} />
          </div>

          {/* Right Column - Alerts and Top Products */}
          <div className="space-y-6">
            <LowStockAlerts
              products={data.lowStockProducts}
              lowStockCount={data.lowStockCount}
            />
            <TopProducts products={data.topProducts} />
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <AddTransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        products={data.availableProducts}
        onSuccess={handleTransactionSuccess}
      />
      <InstallPrompt />
    </main>
  );
}

function processChartData(
  transactions: any[],
  timeframe: "daily" | "monthly" | "quarterly"
) {
  const map = new Map();

  transactions.forEach((t) => {
    const date = new Date(t.created_at);
    let key = "";

    switch (timeframe) {
      case "daily":
        key = date.toLocaleDateString("fr-FR", { weekday: "short" });
        break;
      case "monthly":
        key = date.toLocaleDateString("fr-FR", { month: "short" });
        break;
      case "quarterly":
        const month = date.getMonth();
        const quarter = Math.floor(month / 3) + 1;
        key = `Q${quarter}`;
        break;
    }

    if (!map.has(key)) {
      map.set(key, { sales: 0, expenses: 0 });
    }

    const data = map.get(key);
    if (t.type === "sale") {
      data.sales += t.totalPrice || 0;
    } else if (t.type === "expense") {
      data.expenses += t.totalPrice || 0;
    }
  });

  return Array.from(map.entries()).map(([name, values]) => ({
    name,
    sales: values.sales,
    expenses: values.expenses,
    revenue: values.sales - values.expenses,
  }));
}

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-10 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>

          {/* Stats cards skeleton - In one line */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>

          {/* Main content skeleton */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded-xl"></div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded-xl"></div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
