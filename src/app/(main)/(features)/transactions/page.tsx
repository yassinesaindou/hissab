/* eslint-disable @typescript-eslint/no-explicit-any */
// app/transactions/page.tsx
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

import TransactionsTable from "./components/TransactionsTable";
import AddTransactionModal from "./components/AddTransactionModal";
import DownloadModal from "./components/DownloadModal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PlusCircle, DownloadCloud, TrendingUp, TrendingDown, CreditCard, BarChart3, Search, CalendarDays } from "lucide-react";
import { Profile, TransactionWithUser, Product } from "@/lib/types/index";

// ─── Analytics helpers ────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // ── Filters (owner-level analytics) ────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "sale" | "credit" | "expense">("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const router = useRouter();

  // ── Stable supabase client ref — never recreated ───────────────────────────
  // This is the PRIMARY bug fix: putting `supabase` in the useEffect dependency
  // array caused an infinite re-render loop because createSupabaseClient()
  // returns a new object reference on every render.
  const supabaseRef = useRef(createSupabaseClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("userId, name, storeId, role")
          .eq("userId", user.id)
          .single();

        if (!profile?.storeId) {
          setLoading(false);
          return;
        }

        setUserProfile(profile);

        // ── Role-based transaction query ───────────────────────────────────
        // employee  → see all transactions for their store (not just their own,
        //             because they need context of the full shop floor)
        // user/admin → see all transactions for the store
        //
        // Both roles filter by storeId.  The only difference is that on the
        // UI side we hide the "who added it" column for employees so they
        // cannot see each other's performance data.

        const { data: rawTransactions } = await supabase
          .from("transactions")
          .select(
            `
            transactionId,
            created_at,
            userId,
            productName,
            unitPrice,
            totalPrice,
            quantity,
            type,
            storeId,
            description,
            canBeAggragated,
            profiles:userId (name)
          `
          )
          .eq("storeId", profile.storeId)
          .order("created_at", { ascending: false });

        const { data: rawProducts } = await supabase
          .from("products")
          .select("productId, name, unitPrice, stock, category")
          .eq("storeId", profile.storeId);

        const enrichedTransactions: TransactionWithUser[] = (
          rawTransactions || []
        ).map((t) => ({
          ...t,
          userName: (t as any).profiles?.name ?? "Utilisateur inconnu",
        })) as TransactionWithUser[];

        setTransactions(enrichedTransactions);
        setProducts(rawProducts || []);
      } catch (err) {
        console.error("Failed to load transactions:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // supabase is stable (ref), router is stable — safe dependency array
  }, [supabase, router]);

  // ── Derived: unique users in this store's transactions ────────────────────
  const storeUsers = useMemo(() => {
    const map = new Map<string, string>();
    transactions.forEach((t) => {
      if (t.userId) map.set(t.userId, (t as any).userName ?? t.userId);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [transactions]);

  // ── Filtered transactions ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();

    return transactions.filter((t) => {
      // Type
      if (typeFilter !== "all" && t.type !== typeFilter) return false;

      // User (owner can filter by employee)
      if (userFilter !== "all" && t.userId !== userFilter) return false;

      // Search (product name or description)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (t.productName ?? "").toLowerCase();
        const desc = (t.description ?? "").toLowerCase();
        const user = ((t as any).userName ?? "").toLowerCase();
        if (!name.includes(q) && !desc.includes(q) && !user.includes(q))
          return false;
      }

      // Period presets
      const d = new Date(t.created_at);
      if (periodFilter === "today") {
        if (d.toDateString() !== now.toDateString()) return false;
      } else if (periodFilter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        if (d < weekAgo) return false;
      } else if (periodFilter === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        if (d < monthAgo) return false;
      } else if (periodFilter === "year") {
        if (d.getFullYear() !== now.getFullYear()) return false;
      } else if (periodFilter === "custom") {
        if (startDate && d < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    typeFilter,
    userFilter,
    searchQuery,
    periodFilter,
    startDate,
    endDate,
  ]);

  // ── Analytics over filtered set ───────────────────────────────────────────
  const analytics = useMemo(() => {
    const sales = filtered.filter((t) => t.type === "sale");
    const expenses = filtered.filter((t) => t.type === "expense");
    const credits = filtered.filter((t) => t.type === "credit");

    const totalSales = sales.reduce((s, t) => s + (t.totalPrice ?? 0), 0);
    const totalExpenses = expenses.reduce((s, t) => s + (t.totalPrice ?? 0), 0);
    const totalCredits = credits.reduce((s, t) => s + (t.totalPrice ?? 0), 0);
    const netProfit = totalSales - totalExpenses;

    // Per-user breakdown (for owner)
    const byUser: Record<string, { name: string; sales: number; expenses: number; credits: number; count: number }> = {};
    filtered.forEach((t) => {
      const uid = t.userId ?? "unknown";
      if (!byUser[uid])
        byUser[uid] = {
          name: (t as any).userName ?? "Inconnu",
          sales: 0,
          expenses: 0,
          credits: 0,
          count: 0,
        };
      byUser[uid].count++;
      if (t.type === "sale") byUser[uid].sales += t.totalPrice ?? 0;
      if (t.type === "expense") byUser[uid].expenses += t.totalPrice ?? 0;
      if (t.type === "credit") byUser[uid].credits += t.totalPrice ?? 0;
    });

    return { totalSales, totalExpenses, totalCredits, netProfit, byUser, salesCount: sales.length, expenseCount: expenses.length, creditCount: credits.length };
  }, [filtered]);

  // ── Mutation handlers ─────────────────────────────────────────────────────
  const handleAddTransaction = (t: TransactionWithUser) =>
    setTransactions((prev) => [t, ...prev]);

  const handleUpdateTransaction = (t: TransactionWithUser) =>
    setTransactions((prev) =>
      prev.map((x) => (x.transactionId === t.transactionId ? t : x))
    );

  const handleDeleteTransaction = (id: string) =>
    setTransactions((prev) => prev.filter((t) => t.transactionId !== id));

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200" />
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Chargement des transactions
            </h3>
            <p className="text-gray-600 mt-1">Récupération des données…</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = userProfile?.role === "user" || userProfile?.role === "admin";

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isOwner
              ? "Vue complète de votre boutique"
              : "Transactions de votre caisse"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouvelle transaction
          </Button>
          <Button
            onClick={() => setIsDownloadModalOpen(true)}
            variant="outline"
          >
            <DownloadCloud className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Ventes"
          value={`${fmt(analytics.totalSales)} Fcs`}
          sub={`${analytics.salesCount} transaction${analytics.salesCount > 1 ? "s" : ""}`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          bg="bg-emerald-50"
          color="text-emerald-700"
        />
        <KpiCard
          label="Dépenses"
          value={`${fmt(analytics.totalExpenses)} Fcs`}
          sub={`${analytics.expenseCount} transaction${analytics.expenseCount > 1 ? "s" : ""}`}
          icon={<TrendingDown className="h-5 w-5 text-rose-600" />}
          bg="bg-rose-50"
          color="text-rose-700"
        />
        <KpiCard
          label="Crédits"
          value={`${fmt(analytics.totalCredits)} Fcs`}
          sub={`${analytics.creditCount} transaction${analytics.creditCount > 1 ? "s" : ""}`}
          icon={<CreditCard className="h-5 w-5 text-amber-600" />}
          bg="bg-amber-50"
          color="text-amber-700"
        />
        <KpiCard
          label="Bénéfice net"
          value={`${fmt(analytics.netProfit)} Fcs`}
          sub="Ventes − Dépenses"
          icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
          bg="bg-blue-50"
          color={analytics.netProfit >= 0 ? "text-blue-700" : "text-red-700"}
        />
      </div>

      {/* ── Per-user breakdown (owners only) ───────────────────────────────── */}
      {isOwner && Object.keys(analytics.byUser).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Performance par employé (période sélectionnée)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Employé</th>
                  <th className="text-right px-5 py-3 text-gray-600 font-medium">Transactions</th>
                  <th className="text-right px-5 py-3 text-emerald-700 font-medium">Ventes</th>
                  <th className="text-right px-5 py-3 text-rose-700 font-medium">Dépenses</th>
                  <th className="text-right px-5 py-3 text-amber-700 font-medium">Crédits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.values(analytics.byUser)
                  .sort((a, b) => b.sales - a.sales)
                  .map((u) => (
                    <tr key={u.name} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{u.count}</td>
                      <td className="px-5 py-3 text-right text-emerald-700 font-semibold">{fmt(u.sales)} Fcs</td>
                      <td className="px-5 py-3 text-right text-rose-700">{fmt(u.expenses)} Fcs</td>
                      <td className="px-5 py-3 text-right text-amber-700">{fmt(u.credits)} Fcs</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher article, employé…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Type */}
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as any)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="sale">Ventes</SelectItem>
              <SelectItem value="credit">Crédits</SelectItem>
              <SelectItem value="expense">Dépenses</SelectItem>
            </SelectContent>
          </Select>

          {/* Employee filter (owner only) */}
          {isOwner && storeUsers.length > 0 && (
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Employé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les employés</SelectItem>
                {storeUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Period */}
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-40">
              <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toute la période</SelectItem>
              <SelectItem value="today">Aujourd&apos;hui</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
              <SelectItem value="custom">Personnalisé</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom date range */}
          {periodFilter === "custom" && (
            <>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </>
          )}
        </div>

        {/* Active filter summary */}
        {filtered.length !== transactions.length && (
          <p className="mt-3 text-xs text-gray-500">
            {filtered.length} sur {transactions.length} transaction{transactions.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
            {" · "}
            <button
              className="text-blue-600 hover:underline"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setUserFilter("all");
                setPeriodFilter("all");
                setStartDate("");
                setEndDate("");
              }}
            >
              Réinitialiser les filtres
            </button>
          </p>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <TransactionsTable
          transactions={filtered}
          products={products}
          userProfile={userProfile}
          onEdit={handleUpdateTransaction}
          onDelete={handleDeleteTransaction}
        />
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        products={products}
        onSuccess={handleAddTransaction}
      />
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        transactions={filtered}
      />
    </div>
  );
}

// ── KPI card sub-component ────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  bg,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className={`text-lg font-bold truncate ${color}`}>{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
      <div className={`p-2.5 rounded-lg shrink-0 ${bg}`}>{icon}</div>
    </div>
  );
}