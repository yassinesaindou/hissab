// components/SubNavbar.tsx
"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ClientAddTransactionForm } from "@/app/(main)/(features)/transactions/ClientTransactionsPage";
import { Loader2 } from "lucide-react";

type SubNavbarData = {
  userName: string;
  products: Array<{
    productId: string;
    name: string;
    unitPrice: number;
    stock: number;
  }>;
};

export default function SubNavbar() {
  const [data, setData] = useState<SubNavbarData | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    async function loadUserAndProducts() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // Fetch profile + products in parallel
        const [
          { data: profile },
          { data: products }
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("name, storeId")
            .eq("userId", user.id)
            .single(),

          supabase
            .from("products")
            .select("productId, name, unitPrice, stock")
            .eq("storeId", (await supabase.from("profiles").select("storeId").eq("userId", user.id).single()).data?.storeId || "")
            .limit(200)
            .order("name")
        ]);

        if (!profile) {
          router.replace("/login");
          return;
        }

        setData({
          userName: profile.name || "Utilisateur",
          products: products || [],
        });
      } catch (err) {
        console.error("Failed to load navbar data:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadUserAndProducts();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="w-full pb-3 border-b flex items-center justify-center gap-3 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Chargement...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full pb-4 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="min-w-fit">
          <h2 className="text-lg font-semibold text-gray-800">
            Bonjour, <span className="text-blue-600">{data.userName}</span>
          </h2>
        </div>
        <div className="w-full md:w-auto">
          <ClientAddTransactionForm products={data.products} />
        </div>
      </div>
    </div>
  );
}