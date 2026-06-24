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
  ArrowUpDown,
  ShoppingBag,
} from "lucide-react";

interface Transaction {
  id: string;
  srNo: number;
  date: string;
  time: string;
  type: "sale" | "expense" | "credit";
  amount: number;
  product: string;     // this IS the transaction's productName — no productId involved
  quantity: number;
  unitPrice?: number;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const TYPE_STYLES = {
  sale: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
    ring: "ring-emerald-100",
    icon: ArrowUpRight,
    label: "Vente",
    sign: "+",
  },
  credit: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    ring: "ring-blue-100",
    icon: Receipt,
    label: "Crédit",
    sign: "→",
  },
  expense: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200",
    ring: "ring-rose-100",
    icon: ArrowDownRight,
    label: "Dépense",
    sign: "-",
  },
} as const;

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);

  const totalSales = transactions.filter((t) => t.type === "sale").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "product",
      header: ({ column }) => (
        <div className="flex items-center text-gray-500 font-medium text-xs uppercase tracking-wide">
          Article
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="ml-1 h-5 w-5 p-0 hover:bg-gray-100"
          >
            <ArrowUpDown className="h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const t = row.original;
        const style = TYPE_STYLES[t.type];
        const Icon = style.icon;
        return (
          <div className="flex items-center gap-2.5">
            <div className={`rounded-lg p-2 ${style.bg} ring-1 ${style.ring}`}>
              <Icon className={`h-3.5 w-3.5 ${style.text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-gray-900 truncate text-sm font-medium">{t.product}</p>
              <p className="text-xs text-gray-400">{t.date} · {t.time}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: () => <span className="text-gray-500 font-medium text-xs uppercase tracking-wide">Type</span>,
      cell: ({ row }) => {
        const type = row.getValue("type") as Transaction["type"];
        const style = TYPE_STYLES[type];
        return (
          <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} text-xs font-medium px-2 py-0.5 rounded-full`}>
            {style.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: () => <span className="text-gray-500 font-medium text-xs uppercase tracking-wide">Qté</span>,
      cell: ({ row }) => <span className="text-gray-600 text-sm tabular-nums">×{row.getValue("quantity") as number}</span>,
    },
    {
      accessorKey: "unitPrice",
      header: () => <span className="text-gray-500 font-medium text-xs uppercase tracking-wide">P. Unitaire</span>,
      cell: ({ row }) => {
        const t = row.original;
        const unitPrice = t.unitPrice || Math.round(t.amount / t.quantity);
        return <span className="text-gray-600 text-sm tabular-nums">{unitPrice.toLocaleString()} Fcs</span>;
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <div className="flex items-center text-gray-500 font-medium text-xs uppercase tracking-wide">
          Montant
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="ml-1 h-5 w-5 p-0 hover:bg-gray-100"
          >
            <ArrowUpDown className="h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        const type = row.original.type;
        const style = TYPE_STYLES[type];
        return (
          <span className={`${style.text} text-sm font-semibold tabular-nums`}>
            {style.sign} {amount.toLocaleString()} Fcs
          </span>
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
    state: { sorting },
  });

  if (transactions.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Transactions Récentes</CardTitle>
              <CardDescription>Aucune transaction aujourd'hui</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-3">
              <ShoppingBag className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-700 mb-1">Aucune transaction</h3>
            <p className="text-gray-500 text-sm mb-5 max-w-xs mx-auto">
              Ajoutez votre première vente ou dépense pour commencer.
            </p>
            <Button onClick={() => router.push("/transactions")} className="bg-blue-600 hover:bg-blue-700 text-sm">
              + Créer une transaction
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Transactions Récentes</CardTitle>
              <CardDescription className="text-gray-500 text-sm">
                {transactions.length} transaction{transactions.length > 1 ? "s" : ""} aujourd'hui
              </CardDescription>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full ring-1 ring-emerald-100">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">
                +{totalSales.toLocaleString()} Fcs
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-full ring-1 ring-rose-100">
              <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
              <span className="text-xs font-semibold text-rose-700">
                -{totalExpenses.toLocaleString()} Fcs
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-y border-gray-100">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th key={h.id} className="px-5 py-3 text-left">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-50">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2 p-3">
          {transactions.slice(0, 5).map((t) => {
            const style = TYPE_STYLES[t.type];
            const Icon = style.icon;
            const unitPrice = t.unitPrice || Math.round(t.amount / t.quantity);

            return (
              <div key={t.id} className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className={`rounded-lg p-2 mt-0.5 ${style.bg} ring-1 ${style.ring}`}>
                      <Icon className={`h-3.5 w-3.5 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 text-sm font-medium truncate">{t.product}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} text-xs px-1.5 py-0 rounded-full`}>
                          {style.label}
                        </Badge>
                        <span className="text-xs text-gray-400">×{t.quantity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`${style.text} text-sm font-semibold tabular-nums`}>
                      {style.sign} {t.amount.toLocaleString()} Fcs
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{t.date}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-50">
                  <span className="text-xs text-gray-500">
                    {unitPrice.toLocaleString()} Fcs / unité
                  </span>
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

      {transactions.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {Math.min(transactions.length, 5)} sur {transactions.length} affichées
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/transactions")}
              className="text-xs border-gray-200 hover:bg-gray-50 h-8 rounded-full"
            >
              Voir tout
              <ArrowUpRight className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}