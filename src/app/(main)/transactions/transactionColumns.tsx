"use client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Transaction = {
  transactionId: string;
  created_at: string;
  userId: string;
  productName: string | null;
  productId: string | null;
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  type: "sale" | "credit" | "expense";
};

export const transactionColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "created_at",
    id: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    accessorKey: "productName",
    id: "productName",
    header: "Article",
    cell: ({ row }) => row.original.productName || "N/A",
  },
  {
    accessorKey: "unitPrice",
    id: "unitPrice",
    header: "Prix Unitaire",
    cell: ({ row }) => `$${Number(row.original.unitPrice).toFixed(2)}`,
  },
  {
    accessorKey: "quantity",
    id: "quantity",
    header: "Quantite",
  },
  {
    accessorKey: "totalPrice",
    id: "totalPrice",
    header: "Prix Total",
    cell: ({ row }) => `$${Number(row.original.totalPrice).toFixed(2)}`,
  },
  {
    accessorKey: "type",
    id: "type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Type
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <div
          className={`text-center py-1 px-3 rounded-full text-xs font-medium ${
            type === "sale"
              ? "bg-green-100 text-green-600"
              : type === "credit"
              ? "bg-yellow-100 text-yellow-600"
              : "bg-red-100 text-red-600"
          }`}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const transaction = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                navigator.clipboard.writeText(transaction.productName || "")
              }>
              Copier le nom de l&apos;article
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                table.options.meta?.onEditTransaction?.(transaction)
              }>
              Modifier la transaction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
