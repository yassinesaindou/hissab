// components/SubNavbar.tsx
 
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { ClientAddTransactionForm } from "../(main)/transactions/ClientTransactionsPage";

export default async function SubNavbar() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("userId", user.id)
    .single();

  const userName = profile?.name || "User";

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("productId, name, unitPrice, stock")
    .eq("userId", user.id);

  if (productsError) {
    console.error("Products error:", productsError.message);
  }

  // Map product names to transactions

  return (
    <div className="w-full pb-3 border-b space-x-2 flex flex-col md:flex-row justify-between">
      <div className="min-w-fit">
        <h2>Welcome Back, {userName}</h2>
      </div>
      <div className="flex justify-end items-center w-full mt-3 md:mt-0 space-x-2">
        <ClientAddTransactionForm products={products ?? []} />
      </div>
    </div>
  );
}
