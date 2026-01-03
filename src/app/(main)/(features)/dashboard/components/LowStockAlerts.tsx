/* eslint-disable react/no-unescaped-entities */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Product {
  productId: string;
  name: string;
  stock: number;
  unitPrice: number;
}

interface LowStockAlertsProps {
  products: Product[];
  lowStockCount: number;
}

export default function LowStockAlerts({ products, lowStockCount }: LowStockAlertsProps) {
  const router = useRouter();

  const getStockLevel = (stock: number) => {
    if (stock <= 2)
      return { label: "Critique", color: "bg-rose-100 text-rose-800" };
    if (stock <= 5)
      return { label: "Faible", color: "bg-amber-100 text-amber-800" };
    return { label: "Bientôt épuisé", color: "bg-yellow-100 text-yellow-800" };
  };

  if (products.length === 0) {
    return (
      <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Stock Faible</CardTitle>
                <p className="text-sm text-gray-500">Tous les produits sont en stock</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune alerte de stock</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/products")}
            >
              Gérer l'inventaire
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-100 p-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Stock Faible</CardTitle>
              <p className="text-sm text-gray-500">{lowStockCount} produits à réapprovisionner</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product) => {
            const stockLevel = getStockLevel(product.stock);
            return (
              <div
                key={product.productId}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <ShoppingBag className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-xs text-gray-500">
                      {product.unitPrice.toLocaleString()} Fcs/unité
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={stockLevel.color}>{stockLevel.label}</Badge>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {product.stock} restants
                  </p>
                </div>
              </div>
            );
          })}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => router.push("/products")}
          >
            <Package className="h-4 w-4" />
            Gérer l'inventaire
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}