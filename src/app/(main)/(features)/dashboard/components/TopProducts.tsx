/* eslint-disable react/no-unescaped-entities */
// components/dashboard/TopProducts.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Trophy } from "lucide-react";

interface Product {
  id?: string;
  name: string;
  sales: number;
  quantity: number;
}

interface TopProductsProps {
  products: Product[];
}

export default function TopProducts({ products }: TopProductsProps) {
  if (products.length === 0) {
    return (
      <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Produits Populaires</CardTitle>
              <p className="text-sm text-gray-500">Aucune donnée aujourd'hui</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun produit vendu récemment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-amber-100 text-amber-800";
      case 1:
        return "bg-slate-100 text-slate-800";
      case 2:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `${index + 1}°`;
    }
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2">
            <Trophy className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Top Produits</CardTitle>
            <p className="text-sm text-gray-500">7 derniers jours</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={product.id || product.name}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <Badge className={getRankColor(index)}>
                  {getRankIcon(index)}
                </Badge>
                <div>
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <p className="text-xs text-gray-500">
                    {product.quantity} unités vendues
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {product.sales.toLocaleString()} Fcs
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  Top seller
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}