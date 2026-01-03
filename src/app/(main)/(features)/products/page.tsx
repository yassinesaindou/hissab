// app/products/page.tsx
"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ModernProductsPage from "./components/ModernProductsPage";

type Product = {
  productId: string;
  name: string;
  stock: number;
  unitPrice: number;
  category: string | null;
  description: string | null;
  created_at: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    async function loadProducts() {
      try {
        setError(null);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, storeId")
          .eq("userId", user.id)
          .single();

        if (profileError) {
          console.error("Failed to fetch profile:", profileError);
          setError("Erreur lors du chargement du profil");
          return;
        }

        if (!profile?.storeId) {
          setError("Aucun magasin n'est associé à votre compte");
          setLoading(false);
          return;
        }

        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("productId, name, stock, unitPrice, category, description, created_at")
          .eq("storeId", profile.storeId)
          .order("created_at", { ascending: false });

        if (productsError) {
          console.error("Failed to fetch products:", productsError);
          setError("Erreur lors du chargement des produits");
          return;
        }

        setProducts(productsData || []);
      } catch (err) {
        console.error("Unexpected error loading products:", err);
        setError("Une erreur inattendue s'est produite");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Chargement des produits</h3>
            <p className="text-gray-600 mt-1">Récupération des données...</p>
          </div>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return <ModernProductsPage products={products} />;
}