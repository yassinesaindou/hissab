// app/invoice/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import InvoiceForm from "@/components/InvoiceForm";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // Get profile → storeId
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

        // === FETCH PRODUCTS + STORE IN PARALLEL ===
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-lg font-medium text-gray-700">Chargement de la facture...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto px-4">
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-lg">
          <CardHeader className="bg-gradient-to-r from-rose-600 to-indigo-700 text-white rounded-t-xl py-4">
            <CardTitle className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              Créer une facture
            </CardTitle>
            <CardDescription className="text-white/90 mt-2">
              Remplissez les détails et générez une facture professionnelle
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <InvoiceForm
              products={products}
              storeAddress={store?.storeAddress}
              storeName={store?.storeName}
              storePhoneNumber={store?.storePhoneNumber}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}