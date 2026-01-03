/* eslint-disable @typescript-eslint/no-explicit-any */
// app/transactions/components/DownloadModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TransactionWithUser } from "@/lib/types/index";
 
import { format } from "date-fns";
import { Calendar, DownloadCloud } from "lucide-react";
import { useState } from "react";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionWithUser[];
}

export default function DownloadModal({ isOpen, onClose, transactions }: DownloadModalProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [formatType, setFormatType] = useState<"csv" | "excel">("csv");
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      // Filter transactions by date if dates are provided
      let filteredTransactions = transactions;
      
      if (startDate) {
        const start = new Date(startDate);
        filteredTransactions = filteredTransactions.filter(t => 
          new Date(t.created_at) >= start
        );
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filteredTransactions = filteredTransactions.filter(t => 
          new Date(t.created_at) <= end
        );
      }

      if (filteredTransactions.length === 0) {
        setError("Aucune transaction trouvée pour cette période");
        setIsDownloading(false);
        return;
      }

      // Prepare data for export
      const headers = [
        "ID",
        "Date",
        "Article",
        "Type",
        "Quantité",
        "Prix Unitaire (Fcs)",
        "Total (Fcs)",
        "Ajouté par",
        "Produit ID"
      ];

      const data = filteredTransactions.map(t => [
        t.transactionId,
        format(new Date(t.created_at), "yyyy-MM-dd HH:mm:ss"),
        t.productName || "Dépense diverse",
        t.type === 'sale' ? 'Vente' : t.type === 'credit' ? 'Crédit' : 'Dépense',
        t.quantity,
        t.unitPrice,
        t.totalPrice,
        (t as any).userName || "Inconnu",
        t.productId || ""
      ]);

      if (formatType === "csv") {
        // Create CSV
        const csvContent = [
          headers.join(","),
          ...data.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        // For Excel, we'll create a CSV with .xls extension (simplified)
        const excelContent = [
          headers.join("\t"),
          ...data.map(row => row.join("\t"))
        ].join("\n");

        const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.xls`;
        link.click();
        window.URL.revokeObjectURL(url);
      }

      // Close modal after successful download
      setTimeout(() => {
        onClose();
        setIsDownloading(false);
      }, 500);

    } catch (err) {
        setError("Erreur lors du téléchargement. Veuillez réessayer.");
        console.error(err);
      setIsDownloading(false);
    }
  };

  // Get default dates (last 30 days)
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0]
    };
  };

  // Set default dates when modal opens
  useState(() => {
    if (isOpen) {
      const defaults = getDefaultDates();
      setStartDate(defaults.start);
      setEndDate(defaults.end);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Exporter les transactions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Period Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="period" className="text-sm font-medium text-gray-700">
                Période
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-xs">
                    Date de début
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-xs">
                    Date de fin
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label htmlFor="format" className="text-sm font-medium text-gray-700">
                Format
              </Label>
              <Select value={formatType} onValueChange={(value: "csv" | "excel") => setFormatType(value)}>
                <SelectTrigger id="format">
                  <SelectValue placeholder="Sélectionner un format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel)</SelectItem>
                  <SelectItem value="excel">Excel (.xls)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transaction Count */}
          {startDate && endDate && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  Transactions dans cette période:
                </span>
                <span className="font-semibold text-blue-800">
                  {transactions.filter(t => {
                    const date = new Date(t.created_at);
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    return date >= start && date <= end;
                  }).length}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6"
              disabled={isDownloading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleDownload}
              className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={isDownloading || !startDate || !endDate}
            >
              {isDownloading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Téléchargement...
                </>
              ) : (
                <>
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Télécharger
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}