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
  chartType: "area" | "line" | "bar";
}

const COLORS = {
  sales: "#10b981", // Emerald-500
  expenses: "#ef4444", // Red-500
  credits: "#f59e0b", // Amber-500
  revenue: "#3b82f6", // Blue-500
};

const METRICS = [
  { key: "sales", label: "Ventes", color: COLORS.sales },
  { key: "expenses", label: "Dépenses", color: COLORS.expenses },
  { key: "credits", label: "Crédits", color: COLORS.credits },
  { key: "revenue", label: "Revenus", color: COLORS.revenue },
];

export default function AnalyticsGraph({ data, chartType = "area" }: AnalyticsGraphProps) {
  const [visibleMetrics, setVisibleMetrics] = useState({
    sales: true,
    expenses: true,
    credits: true,
    revenue: true,
  });

  useEffect(() => {
    console.log("AnalyticsGraph received data:", data);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Pas de données disponibles</h3>
          <p className="text-gray-500 text-sm">Sélectionnez une période pour voir les graphiques</p>
        </div>
      </div>
    );
  }

  const handleMetricToggle = (metric: string) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric as keyof typeof prev],
    }));
  };

  const ChartComponent = chartType === "bar" ? BarChart : chartType === "area" ? AreaChart : LineChart;

  // Calculate max value for better Y-axis scaling
  const maxValue = Math.max(
    ...data.map(item => 
      Math.max(
        visibleMetrics.sales ? item.sales : 0,
        visibleMetrics.expenses ? item.expenses : 0,
        visibleMetrics.credits ? item.credits : 0,
        visibleMetrics.revenue ? item.revenue : 0
      )
    )
  );

  return (
    <div>
      {/* Metrics Toggle */}
      <div className="flex flex-wrap gap-3 mb-6">
        {METRICS.map(metric => (
          <button
            key={metric.key}
            onClick={() => handleMetricToggle(metric.key)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${visibleMetrics[metric.key as keyof typeof visibleMetrics] 
              ? 'bg-white border shadow-sm' 
              : 'bg-gray-100 border-transparent hover:bg-gray-200'
            }`}
            style={visibleMetrics[metric.key as keyof typeof visibleMetrics] ? {
              borderColor: `${metric.color}40`,
              color: metric.color
            } : {}}
          >
            <div className={`w-3 h-3 rounded-full ${!visibleMetrics[metric.key as keyof typeof visibleMetrics] && 'opacity-50'}`}
                 style={{ backgroundColor: metric.color }} />
            {metric.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent 
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              vertical={false}
            />
            
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12, fontFamily: 'Inter' }}
              tickMargin={10}
              minTickGap={10}
            />
            
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12, fontFamily: 'Inter' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              domain={[0, maxValue * 1.1]}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                fontFamily: 'Inter',
              }}
              labelStyle={{ 
                fontWeight: 600, 
                color: '#374151',
                marginBottom: '8px',
                fontSize: '12px'
              }}
              itemStyle={{ 
                color: '#374151',
                fontSize: '12px',
                padding: '2px 0'
              }}
              formatter={(value: number) => [
                `${value.toLocaleString()} Fcs`,
                ""
              ]}
            />
            
            <Legend 
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-xs text-gray-600 font-medium">{value}</span>
              )}
            />

            {/* Render based on chart type */}
            {chartType === "bar" && METRICS.map(metric => 
              visibleMetrics[metric.key as keyof typeof visibleMetrics] && (
                <Bar
                  key={metric.key}
                  dataKey={metric.key}
                  fill={metric.color}
                  name={metric.label}
                  radius={[4, 4, 0, 0]}
                  fillOpacity={0.8}
                />
              )
            )}

            {chartType === "area" && METRICS.map(metric => 
              visibleMetrics[metric.key as keyof typeof visibleMetrics] && (
                <Area
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  stroke={metric.color}
                  strokeWidth={2}
                  fillOpacity={0.2}
                  fill={`url(#color${metric.key.charAt(0).toUpperCase() + metric.key.slice(1)})`}
                  name={metric.label}
                  dot={data.length <= 31}
                  activeDot={{ r: 6, strokeWidth: 0 }}
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
                  strokeWidth={2}
                  strokeOpacity={0.8}
                  name={metric.label}
                  dot={data.length <= 31}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              )
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      {data.length > 0 && data[0].day !== "Total" && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {METRICS.map(metric => {
              const total = data.reduce((sum, item) => sum + (item[metric.key as keyof GraphData] as number), 0);
              const avg = total / data.length;
              
              return (
                <div key={metric.key} className="text-center">
                  <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                  <p className="text-lg font-semibold" style={{ color: metric.color }}>
                    {total.toLocaleString()} Fcs
                  </p>
                  <p className="text-xs text-gray-500">
                    Moyenne: {Math.round(avg).toLocaleString()} Fcs
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}