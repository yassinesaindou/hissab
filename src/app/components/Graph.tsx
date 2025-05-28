"use client";
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface GraphProps {
  data: { name: string; sales: number; expenses: number; credits: number; revenue: number }[];
}

export default function Graph({ data }: GraphProps) {
  return (
    <div className="w-full bg-white shadow-md rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Yearly Overview</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
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
          />
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