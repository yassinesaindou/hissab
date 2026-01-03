/* eslint-disable @typescript-eslint/no-explicit-any */
// app/transactions/page.tsx - FIXED VERSION
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
 
import TransactionsTable from "./components/TransactionsTable";
import AddTransactionModal from "./components/AddTransactionModal";
import DownloadModal from "./components/DownloadModal";
import { Button } from "@/components/ui/button";
import { PlusCircle, DownloadCloud } from "lucide-react";
import { Profile, TransactionWithUser, Product } from "@/lib/types/index";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("userId, name, storeId, role")
          .eq("userId", user.id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        setUserProfile(profile);

        const filterKey = profile.role === "employee" ? "userId" : "storeId";
        const filterValue = profile.role === "employee" ? user.id : profile.storeId;

        const transactionsQuery = supabase
          .from("transactions")
          .select(`
            transactionId,
            created_at,
            userId,
            productId,
            productName,
            unitPrice,
            totalPrice,
            quantity,
            type,
            storeId,
            profiles:userId (name)
          `)
          .eq(filterKey, filterValue)
          .order("created_at", { ascending: false });

        const { data: rawTransactions } = await transactionsQuery;

        const { data: rawProducts } = await supabase
          .from("products")
          .select("productId, name, unitPrice, stock, category")
          .eq("storeId", profile.storeId);

        const enrichedTransactions: TransactionWithUser[] = (rawTransactions || []).map(t => ({
          ...t,
          userName: (t as any).profiles?.name || "Utilisateur inconnu",
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
  }, [supabase, router]);

  const handleAddTransaction = (newTransaction: TransactionWithUser) => {
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const handleUpdateTransaction = (updatedTransaction: TransactionWithUser) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.transactionId === updatedTransaction.transactionId
          ? updatedTransaction
          : t
      )
    );
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactions((prev) =>
      prev.filter((t) => t.transactionId !== transactionId)
    );
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
            <h3 className="text-lg font-semibold text-gray-900">Chargement des transactions</h3>
            <p className="text-gray-600 mt-1">Récupération des données...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    
     
      <div className="max-w-7xl mx-auto bg-linear-to-br from-rose-100 to-gray-100/50 p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Transactions 
          </h1>
          <p className="text-gray-600">
            Gérez toutes les transactions de vente, crédit et dépense
          </p>
        </div>

        {/* Stats Cards - Optional, remove if you don't want them */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {transactions.length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventes</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {transactions.filter(t => t.type === 'sale').length}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Crédits</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {transactions.filter(t => t.type === 'credit').length}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dépenses</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">
                  {transactions.filter(t => t.type === 'expense').length}
                </p>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
            size="lg"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Nouvelle Transaction
          </Button>
          
          <Button
            onClick={() => setIsDownloadModalOpen(true)}
            variant="outline"
            size="lg"
            className="border-gray-300 hover:bg-gray-50"
          >
            <DownloadCloud className="mr-2 h-5 w-5" />
            Exporter les données
          </Button>
        </div>

        {/* Main Table - This will be the ONLY scrolling area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <TransactionsTable
            transactions={transactions}
            products={products}
            userProfile={userProfile}
            onEdit={handleUpdateTransaction}
            onDelete={handleDeleteTransaction}
          />
        </div>

        {/* Modals */}
        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          products={products}
          onSuccess={handleAddTransaction}
        />

        <DownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          transactions={transactions}
        />
      </div>
     
  );
}