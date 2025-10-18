// app/products/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientProductsPage from "./ClientProductsPage";

export default async function ProductsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {data: profile} = await supabase.from('profiles').select('storeId').eq('userId', user.id).single();
  const { data: products, error } = await supabase
    .from("products")
    .select("productId, name, stock, unitPrice, category, description, created_at")
    .eq("storeId", profile?.storeId);

  if (error) {
    console.error("Error fetching products:", error.message);
  }

 

  return <ClientProductsPage products={products || []} />;
}