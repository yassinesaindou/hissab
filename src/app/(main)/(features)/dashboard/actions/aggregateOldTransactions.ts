"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function aggregateOldTransactions(storeId: string) {
  try {
    const supabase = createSupabaseServerClient();
    const today = new Date();
    const currentYear = today.getFullYear();
    const aggregateYear = currentYear - 2; // e.g. 2024 if we're in 2026

    // Define date range
    const startOfYear = new Date(aggregateYear, 0, 1).toISOString();
    const endOfYear = new Date(aggregateYear, 11, 31, 23, 59, 59, 999).toISOString();

    // Fetch all aggregatable transactions for that year
    const { data: oldTransactions, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("storeId", storeId)
      .eq("canBeAggragated", true)
      .gte("created_at", startOfYear)
      .lte("created_at", endOfYear);

    if (fetchError) throw fetchError;
    if (!oldTransactions || oldTransactions.length === 0) {
      return { success: true, aggregated: false, message: `Aucune transaction à agréger pour ${aggregateYear}.`, data: [] };
    }

    // Separate sales and expenses
    const sales = oldTransactions.filter((t) => t.type === "sale");
    const expenses = oldTransactions.filter((t) => t.type === "expense");

    const totalSales = sales.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + (t.totalPrice || 0), 0);

    // Delete old aggregatable transactions
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("storeId", storeId)
      .eq("canBeAggragated", true)
      .gte("created_at", startOfYear)
      .lte("created_at", endOfYear);

    if (deleteError) throw deleteError;

    // Insert summary rows (canBeAggragated = false so they're never touched again)
    const summaries = [];

    if (sales.length > 0) {
      summaries.push({
        storeId,
        type: "sale",
        productName: `Vente ${aggregateYear}`,
        totalPrice: totalSales,
        unitPrice: totalSales,
        quantity: sales.length,
        description: `Agrégation des ventes de ${aggregateYear}`,
        canBeAggragated: false,
        created_at: new Date(aggregateYear, 11, 31).toISOString(),
      });
    }

    if (expenses.length > 0) {
      summaries.push({
        storeId,
        type: "expense",
        productName: `Dépense ${aggregateYear}`,
        totalPrice: totalExpenses,
        unitPrice: totalExpenses,
        quantity: expenses.length,
        description: `Agrégation des dépenses de ${aggregateYear}`,
        canBeAggragated: false,
        created_at: new Date(aggregateYear, 11, 31).toISOString(),
      });
    }

    if (summaries.length > 0) {
      const { error: insertError } = await supabase
        .from("transactions")
        .insert(summaries);
      if (insertError) throw insertError;
    }

    return {
      success: true,
      aggregated: true,
      message: `${oldTransactions.length} transactions de ${aggregateYear} agrégées avec succès.`,
      data: oldTransactions, // returned to client for XLSX download
      stats: {
        aggregateYear,
        totalSales,
        totalExpenses,
        salesCount: sales.length,
        expensesCount: expenses.length,
      },
    };
  } catch (error) {
    console.error("Erreur lors de l'agrégation:", error);
    return { success: false, aggregated: false, message: "Erreur lors de l'agrégation.", data: [] };
  }
}