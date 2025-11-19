// app/products/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import ClientProductsPage from "./ClientProductsPage";
import { Loader2 } from "lucide-react";

type Product = {
  productId: string;
  name: string;
  stock: number;
  unitPrice: number;
  category: string;
  description: string | null;
  created_at: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    async function loadProducts() {
      try {
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

        if (!profile?.storeId) {
          console.warn("No store found for user");
          setLoading(false);
          return;
        }

        // Owners see their store's products
        // Employees see only their store's products (same as owner)
        const { data: productsData, error } = await supabase
          .from("products")
          .select("productId, name, stock, unitPrice, category, description, created_at")
          .eq("storeId", profile.storeId)
          .order("name", { ascending: true });

        if (error) {
          console.error("Failed to fetch products:", error);
          return;
        }

        setProducts(productsData || []);
      } catch (err) {
        console.error("Unexpected error loading products:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-4 text-lg font-medium text-gray-700">
          Chargement des produits...
        </span>
      </div>
    );
  }

  return <ClientProductsPage products={products} />;
}