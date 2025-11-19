// app/transactions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import ClientTransactionsPage from "./ClientTransactionsPage";
import { Product, Transaction } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

        const filterKey = profile.role === "employee" ? "userId" : "storeId";
        const filterValue = profile.role === "employee" ? user.id : profile.storeId;

        // === FETCH BOTH IN PARALLEL ===
        const [
          { data: rawTransactions },
          { data: rawProducts }
        ] = await Promise.all([
          supabase
            .from("transactions")
            .select("transactionId, created_at, userId, productId, productName, unitPrice, totalPrice, quantity, type")
            .eq(filterKey, filterValue)
            .order("created_at", { ascending: false }),

          supabase
            .from("products")
            .select("productId, name, unitPrice, stock")
            .eq("storeId", profile.storeId)
        ]);

        // === ENRICH PRODUCT NAMES (exactly like your old API) ===
        const productMap = new Map<string, string>(
          (rawProducts || []).map(p => [p.productId, p.name])
        );

        const enrichedTransactions: Transaction[] = (rawTransactions || []).map(t => ({
          ...t,
          productName: t.productName || (t.productId ? productMap.get(t.productId) || "Produit inconnu" : null),
        })) as Transaction[];

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-4 text-lg font-medium text-gray-700">
          Chargement des transactions...
        </span>
      </div>
    );
  }

  return (
    <ClientTransactionsPage
      transactions={transactions}
      products={products}
    />
  );
}