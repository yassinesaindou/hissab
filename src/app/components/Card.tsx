/* eslint-disable @typescript-eslint/no-explicit-any */
// app/components/Card.tsx
"use client";

import React from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartArea, DollarSign } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { cn } from "@/lib/utils";

interface CardProps {
  title: string;
  value: number;
  data: { name: string; value: number }[];
  icon: React.ComponentType<any>;
  color: "green" | "red" | "blue" | "yellow";
}

const colors = {
  green: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", border: "border-emerald-200", gradient: "#10b981" },
  red: { bg: "bg-rose-50", icon: "bg-rose-100 text-rose-600", border: "border-rose-200", gradient: "#ef4444" },
  blue: { bg: "bg-sky-50", icon: "bg-sky-100 text-sky-600", border: "border-sky-200", gradient: "#0ea5e9" },
  yellow: { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-600", border: "border-amber-200", gradient: "#f59e0b" },
};

function Card({ title, value, data, icon: Icon, color }: CardProps) {
  const c = colors[color];

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border-2 bg-white p-4 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
      c.bg,
      c.border
    )}>
      <div className="relative">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          <div className={cn("rounded-xl p-2.5", c.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {/* Animated Number */}
        <div className="mb-2">
          <div className="flex items-end gap-1">
            <NumberTicker
              value={value}
              className="text-3xl font-bold text-gray-900"
              decimalPlaces={0}
            />
            <span className="mb-1 text-lg font-medium text-gray-600">Fcs</span>
          </div>
          <p className="text-xs text-gray-500">14 derniers jours</p>
        </div>

        {/* Mini Chart - Reduced height */}
        <div className="h-16 -mx-4 -mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.gradient} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={c.gradient} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{ fontSize: "11px", borderRadius: "8px", padding: "4px 8px" }}
                formatter={(v: number) => v.toLocaleString()}
              />
              <Bar dataKey="value" fill={`url(#grad-${color})`} radius={[8, 8, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function DashboardCards({
  sales,
  expenses,
  credits,
  revenue,
  salesData,
  expensesData,
  creditsData,
  revenueData,
}: {
  sales: number;
  expenses: number;
  credits: number;
  revenue: number;
  salesData: { name: string; value: number }[];
  expensesData: { name: string; value: number }[];
  creditsData: { name: string; value: number }[];
  revenueData: { name: string; value: number }[];
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50">
      <Card title="Ventes" value={sales} data={salesData} icon={ChartArea} color="green" />
      <Card title="Dépenses" value={expenses} data={expensesData} icon={DollarSign} color="red" />
      <Card title="Revenu Net" value={revenue} data={revenueData} icon={ChartArea} color="blue" />
      <Card title="Crédits" value={credits} data={creditsData} icon={DollarSign} color="yellow" />
    </div>
  );
}