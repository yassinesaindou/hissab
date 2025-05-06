"use client";
import React from "react";
import {
  AreaChart, // Replace LineChart with AreaChart
  Area, // Replace Line with Area
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  {
    name: "Jan",
    sales: 4000,
    expenses: 2400,
    credits: 1000,
    revenue: 3600,
  },
  {
    name: "Feb",
    sales: 3000,
    expenses: 2200,
    credits: 900,
    revenue: 3300,
  },
  {
    name: "Mar",
    sales: 5000,
    expenses: 2800,
    credits: 1200,
    revenue: 4200,
  },
  {
    name: "Apr",
    sales: 4000,
    expenses: 2500,
    credits: 1100,
    revenue: 3500,
  },
  {
    name: "May",
    sales: 6000,
    expenses: 3000,
    credits: 1300,
    revenue: 4700,
  },
  {
    name: "Jun",
    sales: 7000,
    expenses: 3500,
    credits: 1400,
    revenue: 5100,
  },
  {
    name: "Jul",
    sales: 8000,
    expenses: 3700,
    credits: 1500,
    revenue: 6300,
  },
  {
    name: "Aug",
    sales: 9000,
    expenses: 4000,
    credits: 1600,
    revenue: 7400,
  },
  {
    name: "Sep",
    sales: 10000,
    expenses: 4500,
    credits: 1700,
    revenue: 8500,
  },
  {
    name: "Oct",
    sales: 9500,
    expenses: 4200,
    credits: 1600,
    revenue: 7900,
  },
  {
    name: "Nov",
    sales: 11000,
    expenses: 4800,
    credits: 1800,
    revenue: 9200,
  },
  {
    name: "Dec",
    sales: 12000,
    expenses: 1000,
    credits: 1800,
    revenue: 10000,
  },
];

export default function Graph() {
  return (
    <div className="w-full bg-white shadow-md rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Yearly Overview</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          {" "}
          {/* Replace LineChart with AreaChart */}
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
          />{" "}
          {/* Replace Line with Area */}
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="#82ca9d"
            fill="#82ca9d"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="credits"
            stroke="#ffc658"
            fill="#ffc658"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#ff7300"
            fill="#ff7300"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
