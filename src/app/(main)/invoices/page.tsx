import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";
import { getProducts, getStore } from "@/app/actions";

export default async function InvoicePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { success, data: products, message } = await getProducts();
  if (!success) {
    console.error("Error fetching products:", message);
  }

  const { store } = await getStore();

  if (!store) {
    console.error("Error fetching store data");
  }


  return (
    <div className="min-h-screen p-6 bg-gray-50 text-gray-700">
      <h1 className="text-2xl font-semibold mb-6">Créer une facture</h1>
      <div className="max-w-4xl mx-auto">
        <InvoiceForm
          products={products || []}
          storeAddress={store?.storeAddress}
          storeName={store?.storeName}
          storePhoneNumber={store?.storePhoneNumber}
        />
      </div>
    </div>
  );
}
