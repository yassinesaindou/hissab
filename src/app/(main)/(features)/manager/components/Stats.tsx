// app/manager/components/Stats.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Key, Clock, CheckCircle, DollarSign } from "lucide-react";

interface StatsProps {
  totalStores: number;
  totalCodes: number;
  pendingCodes: number;
  settledCodes: number;
  totalRevenue: number;
}

export function Stats({
  totalStores,
  totalCodes,
  pendingCodes,
  settledCodes,
  totalRevenue,
}: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Magasins</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{totalStores}</p>
              <p className="text-xs text-blue-600 mt-1">Total actif</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Codes totaux</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalCodes}</p>
              <p className="text-xs text-gray-600 mt-1">Codes soumis</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100">
              <Key className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">En attente</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">{pendingCodes}</p>
              <p className="text-xs text-amber-600 mt-1">À traiter</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">Traités</p>
              <p className="text-3xl font-bold text-emerald-900 mt-2">{settledCodes}</p>
              <p className="text-xs text-emerald-600 mt-1">Validés</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Revenu total</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {totalRevenue.toLocaleString()} KMF
              </p>
              <p className="text-xs text-purple-600 mt-1">Revenue généré</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}