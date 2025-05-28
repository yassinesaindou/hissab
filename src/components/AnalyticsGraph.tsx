"use client";
import React, { useState, useEffect } from "react";
import {
  BarChart,
  LineChart,
  AreaChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface GraphData {
  day: string;
  sales: number;
  expenses: number;
  credits: number;
  revenue: number;
}

interface AnalyticsGraphProps {
  data: GraphData[];
}

const COLORS = {
  sales: "#34d399", // Green
  expenses: "#f87171", // Red
  credits: "#fbbf24", // Yellow
  revenue: "#60a5fa", // Blue
};

const METRICS = [
  { key: "sales", label: "Sales", color: COLORS.sales },
  { key: "expenses", label: "Expenses", color: COLORS.expenses },
  { key: "credits", label: "Credits", color: COLORS.credits },
  { key: "revenue", label: "Revenue", color: COLORS.revenue },
];

export default function AnalyticsGraph({ data }: AnalyticsGraphProps) {
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line");
  const [visibleMetrics, setVisibleMetrics] = useState({
    sales: true,
    expenses: true,
    credits: true,
    revenue: true,
  });

  useEffect(() => {
    console.log("AnalyticsGraph received data:", data);
    console.log("Non-zero data points:", data.filter(item => 
      item.sales !== 0 || item.expenses !== 0 || item.credits !== 0 || item.revenue !== 0
    ));
     
  }, [data, visibleMetrics]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
        <p className="text-gray-500 text-center">No data available</p>
      </div>
    );
  }

  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChartType(e.target.value as "line" | "bar" | "area");
  };

  const handleMetricToggle = (metric: string) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric as keyof typeof prev],
    }));
  };

  const ChartComponent = chartType === "bar" ? BarChart : chartType === "area" ? AreaChart : LineChart;

  return (
    <div className="bg-white p-10 rounded-2xl shadow-sm border border-green-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Analytics Overview</h2>
        <select
          value={chartType}
          onChange={handleChartTypeChange}
          className="border border-gray-300 rounded-md p-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="line">Line Chart</option>
          <option value="bar">Bar Chart</option>
          <option value="area">Area Chart</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-4 mb-4">
        {METRICS.map(metric => (
          <label key={metric.key} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={visibleMetrics[metric.key as keyof typeof visibleMetrics]}
              onChange={() => handleMetricToggle(metric.key)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600 capitalize">{metric.label}</span>
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: metric.color }}
            ></span>
          </label>
        ))}
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="day"
              tick={{ fill: "#4b5563", fontSize: 12 }}
              tickMargin={10}
              
              textAnchor="end"
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis
              tick={{ fill: "#4b5563", fontSize: 12 }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              domain={['auto', 'auto']}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: "4px",
                padding: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ fontWeight: "bold", color: "#333" }}
              itemStyle={{ color: "#333" }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className="text-gray-600 capitalize">{value}</span>
              )}
            />
            {chartType === "bar" && METRICS.map(metric => 
              visibleMetrics[metric.key as keyof typeof visibleMetrics] && (
                <Bar
                  key={metric.key}
                  dataKey={metric.key}
                  fill={metric.color}
                  name={metric.label}
                  radius={[4, 4, 0, 0]}
                />
              )
            )}
            {chartType === "area" && METRICS.map(metric => 
              visibleMetrics[metric.key as keyof typeof visibleMetrics] && (
                <Area
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  stackId="1"
                  stroke={metric.color}
                  fill={metric.color}
                  fillOpacity={0.6}
                  name={metric.label}
                />
              )
            )}
            {chartType === "line" && METRICS.map(metric => 
              visibleMetrics[metric.key as keyof typeof visibleMetrics] && (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  stroke={metric.color}
                  strokeWidth={1}
                  name={metric.label}
                  dot={false}
                />
              )
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
}