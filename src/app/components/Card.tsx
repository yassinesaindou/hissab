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

interface CardProps {
  title: string;
  value: number;
  data: { day: string; [key: string]: number }[];
  dataKey: string;
  icon: React.ComponentType<unknown>;
  color: string;
  unit?: string;
}

interface DashboardProps {
  sales: { total: number; data: { day: string; sales: number }[] };
  expenses: { total: number; data: { day: string; expenses: number }[] };
  credits: { total: number; data: { day: string; credits: number }[] };
  revenue: { total: number; data: { day: string; revenue: number }[] };
}

const colorClasses: { [key: string]: string } = {
  green: "bg-green-100",
  red: "bg-red-100",
  blue: "bg-blue-100",
  yellow: "bg-yellow-100",
};

const iconColorClasses: { [key: string]: string } = {
  green: "text-green-600",
  red: "text-red-600",
  blue: "text-blue-600",
  yellow: "text-yellow-600",
};

const colorValues: { [key: string]: string } = {
  green: "#34d399",
  red: "#f87171",
  blue: "#60a5fa",
  yellow: "#fbbf24",
};

function Card({ title, value, data, dataKey, icon: Icon, color, unit = "$" }: CardProps) {
  const backgroundColor = colorClasses[color] || "bg-green-100";
  const gradientColor = colorValues[color] || colorValues.green;
  const iconColor = iconColorClasses[color] || "text-green-600";
  const formattedValue = value.toLocaleString();

  return (
    <div className="bg-green-50 max-w-[300px] min-w-[250px] flex-1 mx-auto rounded-2xl shadow-sm border border-green-100">
      <div className="bg-white rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 ${backgroundColor} rounded-full`}>
            <Icon size={16} className={`${iconColor}`} />
          </div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
        </div>
        <div className="flex items-center justify-between gap-1 text-xs text-gray-500 mt-1">
          <p className="text-2xl font-semibold text-gray-800">
            {formattedValue} {' '}
           <span className="text-sm text-gray-600">{unit}</span> 
          </p>
          <span>Derniers 14 jours</span>
        </div>
        <div className="h-16 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Bar
                dataKey={dataKey}
                radius={[4, 4, 0, 0]}
                fill={`url(#gradient-${color})`}
                barSize={8}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "5px",
                  fontSize: "12px",
                }}
                labelStyle={{
                  fontWeight: "bold",
                  color: "#333",
                }}
                itemStyle={{
                  color: "#333",
                }}
              />
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientColor} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={gradientColor} stopOpacity={0.2} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ sales, expenses, credits, revenue }: DashboardProps) {
  return (
    <div className="flex flex-wrap mx-auto justify-between gap-4 p-4 bg-gray-50">
      <Card
        title="Ventes"
        value={sales.total}
        data={sales.data}
        dataKey="sales"
        icon={ChartArea}
        color="green"
        unit="Fcs"
      />
      <Card
        title="Dépenses"
        value={expenses.total}
        data={expenses.data}
        dataKey="expenses"
        icon={DollarSign}
        color="red"
        unit="Fcs"
      />
      <Card
        title="Revenus"
        value={revenue.total}
        data={revenue.data}
        dataKey="revenue"
        icon={ChartArea}
        color="blue"
        unit="Fcs"
      />
      <Card
        title="Montant Crédité"
        value={credits.total}
        data={credits.data}
        dataKey="credits"
        icon={DollarSign}
        color="yellow"
        unit="Fcs"
      />
    </div>
  );
}