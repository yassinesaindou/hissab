// app/credits/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import ClientCreditsPage from "./ClientCreditsPage";
import { Loader2 } from "lucide-react";

type Credit = {
  creditId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  status: string;
  description: string | null;
  productId: string | null;
  created_at: string;
};

type Product = {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
};

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    // Auth guard
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });
  }, [supabase, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // Get profile to determine role + store
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, storeId")
          .eq("userId", user.id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        // Employee check — redirect if not allowed
        if (profile.role === "employee") {
          router.replace("/dashboard");
          return;
        }

        const filterKey = profile.role === "employee" ? "userId" : "storeId";
        const filterValue = profile.role === "employee" ? user.id : profile.storeId;

        // === 1. Fetch Credits ===
        const { data: creditsData } = await supabase
          .from("credits")
          .select("creditId, customerName, customerPhone, amount, status, description, productId, created_at")
          .eq(filterKey, filterValue)
          .order("created_at", { ascending: false });

        // === 2. Fetch Products ===
        const { data: productsData } = await supabase
          .from("products")
          .select("productId, name, unitPrice, stock")
          .eq("storeId", profile.storeId);

        setCredits(creditsData || []);
        setProducts(productsData || []);
      } catch (err) {
        console.error("Failed to load credits:", err);
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
        <span className="ml-4 text-lg font-medium text-gray-700">Chargement des crédits...</span>
      </div>
    );
  }

  return <ClientCreditsPage credits={credits} products={products} />;
}