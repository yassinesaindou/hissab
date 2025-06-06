// app/credits/CreditColumns.tsx
"use client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown  } from "lucide-react";
import { Button } from "@/components/ui/button";
 
import { CreditTableMeta } from "./CreditTable";

export type CreditInterface = {
  creditId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  status: string | null;
  description: string | null;
  productId: string | null;
  created_at: string;
};

 

export const columns: ColumnDef<CreditInterface >[] = [
  {
    accessorKey: "customerName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Nom du client 
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    accessorKey: "customerPhone",
    header: "Numéro de tél",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description?.substring(0,20) || "N/A",
  },
  {
    accessorKey: "amount",
    header: "Montant",
    cell: ({ row }) => `$${Number(row.original.amount).toFixed(2)}`,
  },
  {
    accessorKey: "statut",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string | null;
      if (status === "paid") {
        return (
          <div className="bg-green-100 text-center text-green-600 py-1 px-3 rounded-full text-xs font-medium">
            Payé 
          </div>
        );
      } else if (status === "unpaid" || status === "pending") {
        return (
          <div className="bg-red-100 text-red-600 py-1 px-3 rounded-full text-xs font-medium text-center">
            {status === "pending" ? "En attente" : "Unpaid"}
          </div>
        );
      } else if (status === "overdue") {
        return (
          <div className="bg-yellow-100 text-yellow-600 py-1 px-3 rounded-full text-xs font-medium text-center">
            Overdue
          </div>
        );
      }
      return "N/A";
    },
  },
  {
      id: "actions",
      cell: ({ row, table }) => {
        const credit = row.original;
        return (
          <Button
            variant="ghost"
            className="text-blue-600 hover:text-blue-800"
            size="sm"
            onClick={() => {
              console.log("Editing credit:", credit.creditId);
              (table.options.meta as CreditTableMeta)?.onEditCredit?.(credit);
            }}
          >
            Modifier
          </Button>
        );
      },
    },
];
