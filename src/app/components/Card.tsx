"use client";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ChartArea, DollarSign } from "lucide-react";
import { creditsData, revenueData } from "@/constants/data";

// Define the sales data
const salesData = [
  { day: "Mon", sales: 1200 },
  { day: "Tue", sales: 800 },
  { day: "Wed", sales: 1400 },
  { day: "Thu", sales: 1000 },
  { day: "Fri", sales: 1800 },
  { day: "Sat", sales: 1600 },
  { day: "Sun", sales: 1300 },
  { day: "Mon", sales: 1500 },
  { day: "Tue", sales: 1900 },
  { day: "Wed", sales: 1700 },
  { day: "Thu", sales: 2000 },
  { day: "Fri", sales: 900 },
  { day: "Sat", sales: 1200 },
  { day: "Sun", sales: 1500 },
];

// Define expenses data (for demonstration; you can adjust as needed)
const expensesData = [
  { day: "Mon", expenses: 700 },
  { day: "Tue", expenses: 500 },
  { day: "Wed", expenses: 900 },
  { day: "Thu", expenses: 600 },
  { day: "Fri", expenses: 1100 },
  { day: "Sat", expenses: 1000 },
  { day: "Sun", expenses: 800 },
  { day: "Mon", expenses: 900 },
  { day: "Tue", expenses: 1200 },
  { day: "Wed", expenses: 1000 },
  { day: "Thu", expenses: 1300 },
  { day: "Fri", expenses: 600 },
  { day: "Sat", expenses: 700 },
  { day: "Sun", expenses: 900 },
];

interface CardProps {
  title: string;
  value: number;
  data: any[];
  dataKey: string; // Added to dynamically handle different data keys (sales, expenses, etc.)
  icon: React.ComponentType<any>;
  color: string;
  unit?: string;
  change?: number; // Added for percentage change
}

const colorClasses: { [key: string]: string } = {
  green: "bg-green-100",
  red: "bg-red-100",
  blue: "bg-blue-100",
  yellow: "bg-yellow-100",
  purple: "bg-purple-100",
};

// Map color names to Tailwind text classes for icons
const iconColorClasses: { [key: string]: string } = {
  green: "text-green-600",
  red: "text-red-600",
  blue: "text-blue-600",
  yellow: "text-yellow-600",
  purple: "text-purple-600",
};

// Map color names to hex values for gradients
const colorValues: { [key: string]: string } = {
  green: "#34d399",
  red: "#f87171",
  blue: "#60a5fa",
  yellow: "#fbbf24",
  purple: "#a855f7",
};
function Card({
  title,
  value,
  data,
  dataKey,
  icon: Icon,
  color,
  unit = "$",
}: CardProps) {
  const backgroundColor = colorClasses[color] || "bg-green-100";
  const gradientColor = colorValues[color] || colorValues.green;
  const iconColor = iconColorClasses[color] || "text-green-600";
  // Format the value with commas for thousands
  const formattedValue = value.toLocaleString();

  return (
    <div className=" bg-green-50 max-w-[300px] min-w-[250px] flex-1 mx-auto rounded-2xl shadow-sm border  border-green-100">
      <div className="bg-white rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 ${backgroundColor} rounded-full`}>
            <Icon size={16} className={`${iconColor}`} />
          </div>
          <p className={`text-gray-600 text-sm font-medium`}>{title}</p>
        </div>
        <div className="flex items-center justify-between gap-1 text-xs text-gray-500 mt-1">
          <p className="text-2xl font-semibold text-gray-800">
            {unit}
            {formattedValue}
          </p>
          <span>Last 14 Days</span>
        </div>
        <div className="h-16 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Bar
                dataKey={dataKey} // Use the dynamic dataKey
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
                <linearGradient
                  id={`gradient-${color}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1">
                  <stop
                    offset="0%"
                    stopColor={gradientColor}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="100%"
                    stopColor={gradientColor}
                    stopOpacity={0.2}
                  />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="flex flex-wrap mx-auto justify-between gap-4 p-4 bg-gray-50 ">
      {/* Sales Card */}
      <Card
        title="Total Sales"
        value={12000}
        data={salesData}
        dataKey="sales"
        icon={ChartArea}
        color="green"
        unit="$"
        // Example percentage change
      />
      {/* Expenses Card */}
      <Card
        title="Total Expenses"
        value={5758}
        data={expensesData}
        dataKey="expenses"
        icon={DollarSign}
        color="red"
        unit="$"
        // Example percentage change
      />
      {/* Revenue Card */}
      <Card
        title="Revenue"
        value={458750}
        data={revenueData}
        dataKey="revenue"
        icon={ChartArea}
        color="blue"
        unit="$"
      />
      {/* Amount Credited Card */}
      <Card
        title="Amount Credited"
        value={3450}
        data={creditsData}
        dataKey="credits"
        icon={DollarSign}
        color="yellow"
        unit="$"
      />
    </div>
  );
}
