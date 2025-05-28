// app/credits/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientCreditsPage from "./ClientCreditsPage";

export default async function CreditsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: credits, error: creditsError } = await supabase
    .from("credits")
    .select(
      "creditId, customerName, customerPhone, amount, status, description, productId, created_at"
    )
    .eq("userId", user.id);

 

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("productId, name, unitPrice, stock")
    .eq("userId", user.id);

  if (creditsError) {
    console.error("Error fetching credits:", creditsError.message);
  }
  if (productsError) {
    console.error("Error fetching products:", productsError.message);
  }

  return (
    <ClientCreditsPage credits={credits || []} products={products || []} />
  );
}
