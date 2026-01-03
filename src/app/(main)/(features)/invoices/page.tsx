// app/invoice/page.tsx
"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ModernInvoiceForm from "./components/ModernInvoiceForm";
import { getAllProducts } from '@/lib/offline/products';
import { getStoreInfo } from '@/lib/offline/session';

type Product = { productId: string; name: string; unitPrice: number; stock: number };
type Store = { storeName: string; storeAddress: string; storePhoneNumber: string };

export default function InvoicePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    async function loadData() {
      try {
        if (navigator.onLine) {
          // === ONLINE: Fetch from Supabase ===
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            router.replace("/login");
            return;
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("storeId")
            .eq("userId", user.id)
            .single();

          if (!profile?.storeId) {
            console.warn("No store found for user");
            setLoading(false);
            return;
          }

          const [
            { data: productsData },
            { data: storeData }
          ] = await Promise.all([
            supabase
              .from("products")
              .select("productId, name, unitPrice, stock")
              .eq("storeId", profile.storeId)
              .order("name", { ascending: true }),

            supabase
              .from("stores")
              .select("storeName, storeAddress, storePhoneNumber")
              .eq("storeId", profile.storeId)
              .single()
          ]);

          setProducts(productsData || []);
          setStore(storeData || null);
        } else {
          // === OFFLINE: Use local data from IndexedDB ===
          const localStore = await getStoreInfo();
          const localProducts = await getAllProducts(localStore?.storeId || '');

          if (!localStore) {
            console.warn("No local store info found");
          }

          setStore({
            storeName: localStore?.storeName || "Magasin",
            storeAddress: localStore?.storeAddress || "",
            storePhoneNumber: localStore?.storePhoneNumber || "",
          });

          setProducts(localProducts || []);
        }
      } catch (err) {
        console.error("Failed to load invoice data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
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
            <h3 className="text-lg font-semibold text-gray-900">Chargement de la page </h3>
            <p className="text-gray-600 mt-1">Récupération des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Créer une Facture
        </h1>
        <p className="text-gray-600">
          Générez des factures professionnelles pour vos clients
        </p>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-2xl px-4 border border-gray-200 shadow-sm">
        <ModernInvoiceForm
          products={products}
          storeAddress={store?.storeAddress || ""}
          storeName={store?.storeName || "Magasin"}
          storePhoneNumber={store?.storePhoneNumber || ""}
        />
      </div>
    </div>
  );
}