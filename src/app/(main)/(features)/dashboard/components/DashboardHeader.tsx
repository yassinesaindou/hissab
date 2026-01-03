"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ReactNode } from "react";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  children?: ReactNode;
}

export default function DashboardHeader({
  title,
  subtitle,
  onRefresh,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-gray-600">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {children}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            className="rounded-full border-gray-300 bg-white shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}