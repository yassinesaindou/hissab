// app/products/ProductsColumns.tsx
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
import { ProductTableMeta } from "./ProductsTable";

export type ProductInterface = {
  productId: string;
  name: string;
  stock: number;
  unitPrice: number;
  category: string | null;
  description: string | null;
  created_at: string;
};

export const productColumns: ColumnDef<ProductInterface>[] = [
  {
    id: "sn",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        No
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Nom
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "unitPrice",
    header: "Prix Unitaire",
    cell: ({ row }) => `$${row.original.unitPrice.toFixed(2)}`,
  },
  {
    accessorKey: "category",
    header: "Categorie",
    cell: ({ row }) => row.original.category || "N/A",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description || "N/A",
  },
  {
    accessorKey: "created_at",
    header: "Créé le",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const product = row.original;

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
              onClick={() => navigator.clipboard.writeText(product.name)}>
              Copier le nom
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                // Trigger edit modal via table meta
                (table.options.meta as ProductTableMeta)?.onEditProduct?.(product);
              }}>
              Modifier
            </DropdownMenuItem>
             
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
