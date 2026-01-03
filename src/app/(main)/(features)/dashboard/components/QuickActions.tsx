// components/dashboard/QuickActions.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ShoppingCart, FileText, UserPlus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: "Nouvelle Vente",
      icon: <ShoppingCart className="w-5 h-5 text-blue-600" />,
      description: "Créer une vente rapide",
      onClick: () => router.push("/pos"),
      color: "bg-blue-50",
    },
    {
      label: "Ajouter Produit",
      icon: <Plus className="w-5 h-5 text-emerald-600" />,
      description: "Nouvel article",
      onClick: () => router.push("/products/new"),
      color: "bg-emerald-50",
    },
    {
      label: "Nouvelle Facture",
      icon: <FileText className="w-5 h-5 text-purple-600" />,
      description: "Créer une facture",
      onClick: () => router.push("/invoices/new"),
      color: "bg-purple-50",
    },
    {
      label: "Nouveau Crédit",
      icon: <UserPlus className="w-5 h-5 text-amber-600" />,
      description: "Accorder un crédit",
      onClick: () => router.push("/credits/new"),
      color: "bg-amber-50",
    },
  ];

  return (
    <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2">
            <Package className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Actions Rapides</CardTitle>
            <p className="text-sm text-gray-500">Accès direct aux fonctions</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4 hover:bg-gray-50 border-gray-200"
              onClick={action.onClick}
            >
              <div className="flex items-center gap-3 text-left">
                <div className={`rounded-lg p-2 ${action.color}`}>
                  {action.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{action.label}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}