 
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientTransactionsPage from "./ClientTransactionsPage";

export default async function TransactionsPage() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      redirect("/login");
    }

    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        "transactionId, created_at, userId, productId, productName, unitPrice, totalPrice, quantity, type"
      )
      .eq("userId", user.id);

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("productId, name, unitPrice, stock")
      .eq("userId", user.id);

    if (transactionsError) {
      console.error("Transactions error:", transactionsError.message);
    }
    if (productsError) {
      console.error("Products error:", productsError.message);
    }

    // Map product names to transactions
    const productMap = new Map(products?.map(p => [p.productId, p.name]) || []);
    const enrichedTransactions = transactions?.map(t => ({
      ...t,
      productName: t.productName || (t.productId ? productMap.get(t.productId) : null) || null,
    })) || [];

    

    return (
      <ClientTransactionsPage
        transactions={enrichedTransactions}
        products={products ?? []}
      />
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    redirect("/login");
  }
}
 