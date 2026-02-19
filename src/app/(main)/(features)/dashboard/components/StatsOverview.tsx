"use client";

import { DollarSign, TrendingUp, CreditCard, Package } from "lucide-react";
import StatCard from "./StatCard";

interface StatsOverviewProps {
  todaySales: number;
  todayRevenue: number;
  pendingCredits: number;
  totalProducts: number;
}

export default function StatsOverview({
  todaySales,
  todayRevenue,
  pendingCredits,
  totalProducts,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<DollarSign className="w-5 h-5" />}
        title="Ventes Aujourd'hui"
        value={todaySales}
        subtitle="Total des ventes"
        variant="blue"
        format="currency"
      />

      <StatCard
        icon={<TrendingUp className="w-5 h-5" />}
        title="Revenu Net"
        value={todayRevenue}
        subtitle="Après dépenses"
        variant="emerald"
        format="currency"
      />

      <StatCard
        icon={<CreditCard className="w-5 h-5" />}
        title="Crédits en Attente"
        value={pendingCredits}
        subtitle="Montant total"
        variant="purple"
        format="currency"
      />

      <StatCard
        icon={<Package className="w-5 h-5" />}
        title="Produits Totaux"
        value={totalProducts}
        subtitle="En inventaire"
        variant="default"
        format="number"
      />
    </div>
  );
}
