// app/dashboard/components/CategoryBreakdown.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CategoryData {
  name: string;
  sales: number;
  quantity: number;
}

interface CategoryBreakdownProps {
  categories: CategoryData[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (categories.length === 0) {
    return (
      <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <Layers className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Ventes par Catégorie</CardTitle>
              <p className="text-sm text-gray-500">Aucune donnée cette semaine</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <PieChartIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune vente récente à analyser</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSales = categories.reduce((sum, c) => sum + c.sales, 0);
  const chartData = categories.map((c, i) => ({ ...c, color: COLORS[i % COLORS.length] }));

  return (
    <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2">
            <Layers className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Ventes par Catégorie</CardTitle>
            <p className="text-sm text-gray-500">7 derniers jours</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Donut chart */}
        <div className="h-44 -mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="sales"
                nameKey="name"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()} Fcs`, "Ventes"]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: "-176px", height: 176 }}>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-medium">Total</p>
              <p className="text-lg font-bold text-gray-900">
                {totalSales >= 1000 ? `${(totalSales / 1000).toFixed(1)}k` : totalSales}
              </p>
            </div>
          </div>
        </div>

        {/* Legend / breakdown list */}
        <div className="space-y-2.5 mt-2">
          {chartData.map((cat) => {
            const percentage = totalSales > 0 ? Math.round((cat.sales / totalSales) * 100) : 0;
            return (
              <div
                key={cat.name}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{cat.name}</h4>
                    <p className="text-xs text-gray-500">{cat.quantity} unité{cat.quantity > 1 ? "s" : ""} vendue{cat.quantity > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 text-sm">
                    {cat.sales.toLocaleString()} Fcs
                  </div>
                  <div className="flex items-center justify-end gap-1 text-xs text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}