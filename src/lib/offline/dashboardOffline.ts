// lib/offline/dashboardOffline.ts

import { getAllProducts } from './products';
import { getRecentTransactions } from './transactions';

export async function fetchDashboardDataOffline(storeId: string) {
  const products = await getAllProducts(storeId);
  const allTransactions = await getRecentTransactions(storeId, 200); // enough for calculations

  // Today's date filtering
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const todayTransactions = allTransactions.filter(
    tx => tx.created_at >= startOfDay && tx.created_at <= endOfDay
  );

  const todaySales = todayTransactions
    .filter(tx => tx.type === 'sale')
    .reduce((sum, tx) => sum + tx.totalPrice, 0);

  const todayExpenses = todayTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.totalPrice, 0);

  const todayRevenue = todaySales - todayExpenses;

  // Low stock
  const lowStockProducts = products
    .filter(p => p.stock < 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  const lowStockCount = lowStockProducts.length;

  // Recent transactions (last 6) — uses productName directly, no productId involved
  const recentTransactions = allTransactions.slice(0, 6).map((tx, index) => ({
    id: tx.localId || index,
    srNo: index + 1,
    date: new Date(tx.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    time: new Date(tx.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    type: tx.type,
    amount: tx.totalPrice,
    unitPrice: tx.unitPrice || undefined,
    product: tx.productName || 'Article sans nom',
    quantity: tx.quantity,
  }));

  // ── Category breakdown (replaces the old productId-based "top products") ──
  // tx.productId only exists locally for stock-sync bookkeeping; it's never
  // reliable as a long-term grouping key (and doesn't exist server-side at
  // all). Instead, build a name -> category map from the local product
  // catalogue and fold the last 7 days of sales into category totals —
  // exactly mirroring the online dashboard's CategoryBreakdown widget.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentSales = allTransactions.filter(
    tx => tx.type === 'sale' && tx.created_at >= sevenDaysAgo
  );

  const categoryByName = new Map<string, string>();
  products.forEach(p => {
    categoryByName.set(p.name, p.category || 'Général');
  });

  const categoryMap = new Map<string, { sales: number; quantity: number }>();
  recentSales.forEach(tx => {
    const category = categoryByName.get(tx.productName || '') || 'Autre';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { sales: 0, quantity: 0 });
    }
    const entry = categoryMap.get(category)!;
    entry.sales += tx.totalPrice;
    entry.quantity += tx.quantity;
  });

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([name, v]) => ({ name, sales: v.sales, quantity: v.quantity }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Chart data - daily for last 7 days
  const dailyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
    const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();

    const dayTx = allTransactions.filter(tx => tx.created_at >= dayStart && tx.created_at <= dayEnd);
    const sales = dayTx.filter(tx => tx.type === 'sale').reduce((s, t) => s + t.totalPrice, 0);
    const expenses = dayTx.filter(tx => tx.type === 'expense').reduce((s, t) => s + t.totalPrice, 0);

    dailyData.push({
      name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      sales,
      expenses,
      revenue: sales - expenses,
    });
  }

  // Return shape matches the online DashboardData contract
  // (categoryBreakdown replaces topProducts; availableProducts now carries productCode
  // automatically since LocalProduct includes it and getAllProducts() returns full rows)
  return {
    todaySales,
    todayRevenue,
    pendingCredits: 0, // Not tracked offline yet
    totalProducts: products.length,
    lowStockCount,
    recentTransactions,
    lowStockProducts: lowStockProducts.map(p => ({
      productId: p.productId,
      name: p.name,
      stock: p.stock,
      unitPrice: p.unitPrice,
    })),
    categoryBreakdown,
    chartData: dailyData,
    availableProducts: products, // includes productCode — scanner works offline now
    dailyData,
    monthlyData: dailyData, // Simplified offline version
    quarterlyData: dailyData, // Simplified offline version
  };
}