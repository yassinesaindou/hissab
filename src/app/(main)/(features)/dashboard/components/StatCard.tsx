'use client'
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import clsx from "clsx";
import { NumberTicker } from "@/components/ui/number-ticker";
 

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: number;
  subtitle: ReactNode;
  variant?: "default" | "blue" | "purple" | "emerald" | "red";
  format?: "currency" | "number";
}

const variantStyles = {
  default: "border-gray-200 bg-white",
  blue: "border-blue-200 bg-blue-50 ",
  purple: "border-orange-200 bg-orange-50 ",
  emerald: "border-emerald-200 bg-emerald-50 ",
  red: "border-red-200 bg-red-50 ",
};

const iconColors = {
  default: "text-gray-700",
  blue: "text-blue-600",
  purple: "text-purple-600",
  emerald: "text-emerald-600",
  red: "text-red-600",
};

export default function StatCard({
  icon,
  title,
  value,
  subtitle,
  variant = "default",
  format = "currency",
}: StatCardProps) {
  const formattedValue = format === "currency" 
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "KMF",
        maximumFractionDigits: 0,
      }).format(value)
    : value;

  return (
    <Card className={clsx(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2 rounded-2xl",
      variantStyles[variant]
    )}>
      <CardContent className="px-5 py-1">
        <div className="flex items-center justify-between mb-3">
          <div className={clsx(
            "p-2.5 bg-white/90 rounded-xl shadow-sm ring-1 ring-gray-200/50 group-hover:scale-110 transition-transform",
            iconColors[variant]
          )}>
            {icon}
          </div>
        </div>

        <div className="text-2xl font-bold text-gray-900">
          {format === "currency" ? (
            formattedValue
          ) : (
            <NumberTicker value={value} />
          )}
        </div>

        <h3 className="text-sm font-semibold text-gray-700 mt-1">{title}</h3>
        <p className="text-xs text-gray-600 mt-1.5 leading-tight">{subtitle}</p>
      </CardContent>
    </Card>
  );
}