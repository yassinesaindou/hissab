// app/manager/components/Header.tsx
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onRefresh?: () => void;
}

export function Header({ onRefresh }: HeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Dashboard Administrateur
          </h1>
        </div>
        <p className="text-gray-600">
          Gérez les magasins, codes de paiement et abonnements
        </p>
      </div>
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </Button>
      )}
    </div>
  );
}