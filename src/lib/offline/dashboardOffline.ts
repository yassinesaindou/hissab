// lib/offline/dashboardOffline.ts
 
import { getAllProducts } from './products';
import { getRecentTransactions } from './transactions';

export async function fetchDashboardDataOffline(storeId: string) {
  const products = await getAllProducts(storeId);
  const allTransactions = await getRecentTransactions(storeId, 200); // Get enough for calculations

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

  // Recent transactions (last 6)
  const recentTransactions = allTransactions.slice(0, 6).map((tx, index) => ({
    id: tx.localId || index,
    srNo: index + 1,
    date: new Date(tx.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    time: new Date(tx.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    type: tx.type,
    amount: tx.totalPrice,
    product: tx.productName || 'N/A',
    quantity: tx.quantity,
  }));

  // Top products (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentSales = allTransactions.filter(
    tx => tx.type === 'sale' && tx.created_at >= sevenDaysAgo
  );

  const productMap = new Map();
  recentSales.forEach(tx => {
    const key = tx.productId || tx.productName || 'unknown';
    if (!productMap.has(key)) {
      productMap.set(key, { name: tx.productName || 'Inconnu', sales: 0, quantity: 0 });
    }
    const item = productMap.get(key);
    item.sales += tx.totalPrice;
    item.quantity += tx.quantity;
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

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

  // Return FULL DashboardData shape (including required chartData)
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
    topProducts,
    chartData: dailyData, // ← This was missing — now fixed
    availableProducts: products,
    dailyData,
    monthlyData: dailyData, // Simplified offline version
    quarterlyData: dailyData, // Simplified offline version
  };
}