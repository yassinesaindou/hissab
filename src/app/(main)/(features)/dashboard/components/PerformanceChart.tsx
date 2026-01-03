/* eslint-disable @typescript-eslint/no-explicit-any */
// components/dashboard/PerformanceChart.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface PerformanceChartProps {
  dailyData: Array<{
    name: string;
    sales: number;
    expenses: number;
    revenue: number;
  }>;
  monthlyData: Array<{
    name: string;
    sales: number;
    expenses: number;
    revenue: number;
  }>;
  quarterlyData: Array<{
    name: string;
    sales: number;
    expenses: number;
    revenue: number;
  }>;
}

type TimeFrame = "daily" | "monthly" | "quarterly";
type ChartType = "area" | "bar" | "line";

export default function PerformanceChart({ 
  dailyData, 
  monthlyData, 
  quarterlyData 
}: PerformanceChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("daily");
  const [chartType, setChartType] = useState<ChartType>("area");

  const getCurrentData = () => {
    switch (timeFrame) {
      case "daily":
        return dailyData;
      case "monthly":
        return monthlyData;
      case "quarterly":
        return quarterlyData;
      default:
        return dailyData;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "CDF",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-white p-4 shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="mt-1 flex items-center gap-2">
              <div 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.dataKey}:</span>
              <span className="text-sm font-semibold">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const data = getCurrentData();

    switch (chartType) {
      case "area":
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="sales"
              name="Ventes"
              stroke="#10b981"
              fill="url(#colorSales)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Dépenses"
              stroke="#ef4444"
              fill="url(#colorExpenses)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenu"
              stroke="#3b82f6"
              fill="url(#colorRevenue)"
              strokeWidth={2}
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="sales"
              name="Ventes"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              name="Dépenses"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="revenue"
              name="Revenu"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              name="Ventes"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Dépenses"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenu"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Performance</CardTitle>
              <p className="text-sm text-gray-500">Analyse des ventes et dépenses</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Chart Type Selection */}
            <div className="flex items-center rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setChartType("area")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  chartType === "area"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <TrendingUp className="h-4 w-4 inline-block mr-1" />
                Zone
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  chartType === "bar"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BarChart3 className="h-4 w-4 inline-block mr-1" />
                Barres
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  chartType === "line"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <LineChartIcon className="h-4 w-4 inline-block mr-1" />
                Ligne
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Time Frame Tabs */}
        <div className="mb-6">
          <Tabs value={timeFrame} onValueChange={(v) => setTimeFrame(v as TimeFrame)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Quotidien</TabsTrigger>
              <TabsTrigger value="monthly">Mensuel</TabsTrigger>
              <TabsTrigger value="quarterly">Trimestriel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="mt-4">
              <p className="text-sm text-gray-500">Derniers 7 jours</p>
            </TabsContent>
            <TabsContent value="monthly" className="mt-4">
              <p className="text-sm text-gray-500">Derniers 6 mois</p>
            </TabsContent>
            <TabsContent value="quarterly" className="mt-4">
              <p className="text-sm text-gray-500">Derniers 4 trimestres</p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}