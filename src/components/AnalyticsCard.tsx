// "use client";
import React from "react";

interface AnalyticsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  unit?: string;
  isProducts?: boolean;
}

const colorClasses: { [key: string]: string } = {
  green: "bg-green-100",
  red: "bg-red-100",
  blue: "bg-blue-100",
  yellow: "bg-yellow-100",
  purple: "bg-purple-100",
};

const iconColorClasses: { [key: string]: string } = {
  green: "text-green-600",
  red: "text-red-600",
  blue: "text-blue-600",
  yellow: "text-yellow-600",
  purple: "text-purple-600",
};

export default function AnalyticsCard({
  title,
  value,
  icon: Icon,
  color,
  unit = "$",
  isProducts = false,
}: AnalyticsCardProps) {
  const backgroundColor = colorClasses[color] || "bg-green-100";
  const iconColor = iconColorClasses[color] || "text-green-600";
  const formattedValue = Number(value).toLocaleString();

  return (
    <div className="bg-green-50 max-w-[300px] min-w-[250px]  mx-auto rounded-2xl shadow-sm border border-green-100">
      <div className="bg-white rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 ${backgroundColor} rounded-full`}>
            <Icon size={16} className={`${iconColor}`} />
          </div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
        </div>
        <div className="flex items-center justify-between gap-1 text-xs text-gray-500 mt-1">
          <p className="text-2xl font-semibold text-gray-800">
            {unit}
            {formattedValue}
          </p>
          <span>{isProducts ? "All Time" : "Selected Period"}</span>
        </div>
      </div>
    </div>
  );
}