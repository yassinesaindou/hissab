/* eslint-disable react-hooks/exhaustive-deps */
// app/credits/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Package,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AddCreditModal from "./components/AddCreditModal";
import CreditsTable from "./components/CreditsTable";
import EditCreditModal from "./components/EditCreditModal";
import StatCard from "./components/StatCard";
import { Credit, Product } from "./types";

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const router = useRouter();
  const supabase = createSupabaseClient();

  const fetchCredits = async () => {
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
        .select("role, storeId")
        .eq("userId", user.id)
        .single();

      if (!profile || profile.role === "employee") {
        setLoading(false);
        return;
      }

      // Fetch credits with product names
      const { data: creditsData } = await supabase
        .from("credits")
        .select(
          `
          *,
          products(name)
        `
        )
        .eq("storeId", profile.storeId)
        .order("created_at", { ascending: false });

      // Format credits data
      const formattedCredits: Credit[] = (creditsData || []).map((credit) => ({
        ...credit,
        productName: credit.products?.name || null,
      }));

      // Fetch products for the forms
      const { data: productsData } = await supabase
        .from("products")
        .select("productId, name, unitPrice, stock")
        .eq("storeId", profile.storeId);

      setCredits(formattedCredits);
      setProducts(productsData || []);
    } catch (err) {
      console.error("Failed to load credits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  // Calculate statistics
  const totalCredits = credits.length;
  const totalAmount = credits.reduce((sum, credit) => sum + credit.amount, 0);
  const pendingCredits = credits.filter((c) => c.status === "pending");
  const paidCredits = credits.filter((c) => c.status === "paid");
  const pendingAmount = pendingCredits.reduce(
    (sum, credit) => sum + credit.amount,
    0
  );
  const paidAmount = paidCredits.reduce(
    (sum, credit) => sum + credit.amount,
    0
  );
  const uniqueCustomers = new Set(credits.map((c) => c.customerPhone)).size;
  const creditsWithProducts = credits.filter((c) => c.productId).length;
  const averageCredit =
    totalCredits > 0 ? Math.round(totalAmount / totalCredits) : 0;
  const paymentRate =
    totalCredits > 0
      ? Math.round((paidCredits.length / totalCredits) * 100)
      : 0;
  const recentCredits = credits.filter((c) => {
    const creditDate = new Date(c.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return creditDate > weekAgo;
  }).length;

  const handleEdit = (credit: Credit) => {
    setEditingCredit(credit);
  };

  const handleDelete = async (creditId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce crédit ?")) {
      const response = await fetch("/api/credits", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditId }),
      });

      if (response.ok) {
        fetchCredits();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Chargement des crédits
            </h3>
            <p className="text-gray-600 mt-1">Récupération des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Gestion des Crédits
                </h1>
                <p className="text-gray-600 mt-1">
                  Gérez les crédits de vos clients en toute simplicité
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Crédit
            </Button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<DollarSign className="h-6 w-6" />}
            title="Total des Crédits"
            value={totalAmount}
            subtitle={
              <span className="text-gray-600">
                {totalCredits} crédit{totalCredits !== 1 ? "s" : ""}
              </span>
            }
            variant="emerald"
            format="currency"
          />

          <StatCard
            icon={<Clock className="h-6 w-6" />}
            title="En Attente"
            value={pendingAmount}
            subtitle={
              <span className="text-amber-600 font-medium">
                {pendingCredits.length} en attente
              </span>
            }
            variant="red"
            format="currency"
          />

          <StatCard
            icon={<CheckCircle className="h-6 w-6" />}
            title="Payés"
            value={paidAmount}
            subtitle={
              <span className="text-emerald-600 font-medium">
                {paidCredits.length} réglé{paidCredits.length !== 1 ? "s" : ""}
              </span>
            }
            variant="blue"
            format="currency"
          />

          <StatCard
            icon={<Users className="h-6 w-6" />}
            title="Clients Uniques"
            value={uniqueCustomers}
            subtitle={
              <span className="text-purple-600 font-medium">
                {creditsWithProducts} avec articles
              </span>
            }
            variant="purple"
            format="number"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Crédit Moyen</p>
                <p className="text-xl font-bold text-gray-900">
                  {averageCredit.toLocaleString()} Fcs
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full  ">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${Math.min(100, (averageCredit / 100000) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Taux de Paiement</p>
                <p className="text-xl font-bold text-gray-900">
                  {paymentRate}%
                </p>
              </div>
              {paymentRate >= 80 ? (
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${paymentRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cette semaine</p>
                <p className="text-xl font-bold text-gray-900">
                  {recentCredits}
                </p>
              </div>
              {recentCredits > 0 ? (
                <AlertCircle className="h-5 w-5 text-orange-600" />
              ) : (
                <Package className="h-5 w-5 text-gray-600" />
              )}
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                {recentCredits > 0
                  ? `${recentCredits} nouveau${
                      recentCredits !== 1 ? "x" : ""
                    } crédit${recentCredits !== 1 ? "s" : ""}`
                  : "Aucun nouveau crédit"}
              </p>
            </div>
          </div>
        </div>

        {/* Credits Table - This will now take available space */}

        <CreditsTable
          credits={credits}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modals */}
      <AddCreditModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        products={products}
        onSuccess={fetchCredits}
      />

      {editingCredit && (
        <EditCreditModal
          isOpen={!!editingCredit}
          onClose={() => setEditingCredit(null)}
          credit={editingCredit}
          products={products}
          onSuccess={fetchCredits}
        />
      )}
    </div>
  );
}
