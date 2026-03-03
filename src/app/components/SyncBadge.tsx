// app/components/SyncBadge.tsx - FIXED
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getPendingTransactions } from "@/lib/offline/transactions";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export default function SyncBadge() {
  const [pendingCount, setPendingCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    async function updateCount() {
      // FIXED: getPendingTransactions takes NO parameters
      const pending = await getPendingTransactions();
      setPendingCount(pending.length);
    }

    updateCount();

    // Update every 10 seconds
    const interval = setInterval(updateCount, 10000);

    return () => clearInterval(interval);
  }, []);

  // Don't render if not on dashboard or no pending transactions
  if (pathname !== "/dashboard" || pendingCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Badge variant="destructive" className="flex items-center gap-2 px-4 py-2 text-sm font-medium shadow-lg">
        <AlertCircle className="h-4 w-4" />
        {pendingCount} transaction{pendingCount > 1 ? "s" : ""} non synchronisée(s)
      </Badge>
    </div>
  );
}