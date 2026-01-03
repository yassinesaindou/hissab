// app/components/SyncBadge.tsx
"use client";

import { useEffect, useState } from "react";
import { getPendingTransactions } from "@/lib/offline/transactions";
import { getStoreInfo } from "@/lib/offline/session";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export default function SyncBadge() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function updateCount() {
      const store = await getStoreInfo();
      if (!store?.storeId) return;

      const pending = await getPendingTransactions(store.storeId);
      setPendingCount(pending.length);
    }

    updateCount();

    // Update every 10 seconds
    const interval = setInterval(updateCount, 10000);

    return () => clearInterval(interval);
  }, []);

  if (pendingCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Badge variant="destructive" className="flex items-center gap-2 px-4 py-2 text-sm font-medium shadow-lg">
        <AlertCircle className="h-4 w-4" />
        {pendingCount} transaction{pendingCount > 1 ? "s" : ""} en attente de synchronisation
      </Badge>
    </div>
  );
}