/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowUpDown,
} from "lucide-react";

interface Transaction {
  id: string;
  srNo: number;
  date: string;
  time: string;
  type: "sale" | "expense" | "credit";
  amount: number;
  product: string;
  quantity: number;
  unitPrice?: number;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);

  // Calculate totals
  const totalSales = transactions
    .filter(tx => tx.type === "sale")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter(tx => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Helper functions
  const getTypeColor = (type: Transaction["type"]) => {
    switch (type) {
      case "sale":
        return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", icon: ArrowUpRight };
      case "credit":
        return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", icon: Receipt };
      case "expense":
        return { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", icon: ArrowDownRight };
    }
  };

  const getTypeLabel = (type: Transaction["type"]) => {
    switch (type) {
      case "sale": return "Vente";
      case "credit": return "Crédit";
      case "expense": return "Dépense";
    }
  };

  // Define columns
  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "product",
      header: ({ column }) => (
        <div className="flex items-center text-gray-600 font-medium">
          Produit
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="ml-1 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <ArrowUpDown className="h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const transaction = row.original;
        const colors = getTypeColor(transaction.type);
        const Icon = colors.icon;
        
        return (
          <div className="flex items-center gap-2">
            <div className={`rounded-md p-1.5 ${colors.bg} ${colors.text}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-gray-900 truncate text-sm">{transaction.product}</p>
              <p className="text-xs text-gray-500">{transaction.date}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as Transaction["type"];
        const colors = getTypeColor(type);
        
        return (
          <Badge 
            variant="outline"
            className={`${colors.bg} ${colors.text} ${colors.border} text-xs font-normal px-2 py-0.5`}
          >
            {getTypeLabel(type)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "Qté",
      cell: ({ row }) => {
        const quantity = row.getValue("quantity") as number;
        return (
          <div className="text-gray-700 text-sm">
            x{quantity}
          </div>
        );
      },
    },
    {
      accessorKey: "unitPrice",
      header: "Prix Unitaire",
      cell: ({ row }) => {
        const transaction = row.original;
        const unitPrice = transaction.unitPrice || Math.round(transaction.amount / transaction.quantity);
        return (
          <div className="text-gray-700 text-sm">
            {unitPrice.toLocaleString()} Fcs
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <div className="flex items-center text-gray-600 font-medium">
          Montant
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="ml-1 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <ArrowUpDown className="h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        const type = row.original.type;
        const colors = getTypeColor(type);
        
        return (
          <div className={`${colors.text} text-sm`}>
            {type === "sale" ? "+" : type === "credit" ? "→" : "-"}
            {" "}{amount.toLocaleString()} Fcs
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/transactions/${transaction.id}`)}
            className="h-7 w-7 p-0 hover:bg-gray-100"
          >
            <Eye className="h-3.5 w-3.5 text-gray-400" />
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (transactions.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm rounded-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-800">Transactions Récentes</CardTitle>
              <CardDescription>Aucune transaction aujourd'hui</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
              <Receipt className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-700 mb-2">Aucune transaction</h3>
            <p className="text-gray-500 text-sm mb-4 max-w-xs mx-auto">
              Ajoutez votre première vente ou dépense.
            </p>
            <Button
              onClick={() => router.push("/transactions/new")}
              className="bg-blue-600 hover:bg-blue-700 text-sm"
            >
              + Créer Transaction
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm rounded-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-800">Transactions Récentes</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                {transactions.length} transaction{transactions.length > 1 ? 's' : ''} aujourd'hui
              </CardDescription>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">
                +{totalSales.toLocaleString()} Fcs
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
              <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
              <span className="text-xs font-medium text-rose-700">
                -{totalExpenses.toLocaleString()} Fcs
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-2.5 text-left text-xs font-medium text-gray-600"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {table.getRowModel().rows.map((row) => (
                  <tr 
                    key={row.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-2 p-3">
          {transactions.slice(0, 5).map((tx) => {
            const colors = getTypeColor(tx.type);
            const Icon = colors.icon;
            const unitPrice = tx.unitPrice || Math.round(tx.amount / tx.quantity);
            
            return (
              <div
                key={tx.id}
                className="rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div className={`rounded-md p-1.5 mt-0.5 ${colors.bg} ${colors.text}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 text-sm truncate">{tx.product}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge 
                          variant="outline"
                          className={`${colors.bg} ${colors.text} ${colors.border} text-xs font-normal px-1.5 py-0`}
                        >
                          {getTypeLabel(tx.type)}
                        </Badge>
                        <span className="text-xs text-gray-500">x{tx.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`${colors.text} text-sm`}>
                      {tx.type === "sale" ? "+" : tx.type === "credit" ? "→" : "-"}
                      {" "}{tx.amount.toLocaleString()} Fcs
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{tx.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-600">
                    Prix: {unitPrice.toLocaleString()} Fcs/unité
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/transactions/${tx.id}`)}
                    className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Voir
                  </Button>
                </div>
              </div>
            );
          })}
          
          {transactions.length > 5 && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/transactions")}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                + {transactions.length - 5} autres transactions
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer with View All Button */}
      {transactions.length > 0 && (
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Affichage de {Math.min(transactions.length, 5)} sur {transactions.length}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/transactions")}
              className="text-xs border-gray-300 hover:bg-gray-50 h-8"
            >
              Voir Tout
              <ArrowUpRight className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}