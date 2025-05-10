'use client';
import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

interface ProductColumnProps {
  name: string;
  stock: number;
  unitPrice: number;
  category: string;
}

export const products: ProductColumnProps[] = [
    {
      name: "Wireless Mouse",
      stock: 25,
      unitPrice: 19.99,
      category: "Electronics",
    },
    {
      name: "Notebook (A5)",
      stock: 100,
      unitPrice: 2.5,
      category: "Stationery",
    },
    {
      name: "Bluetooth Speaker",
      stock: 15,
      unitPrice: 45.0,
      category: "Electronics",
    },
    {
      name: "Ceramic Mug",
      stock: 50,
      unitPrice: 6.75,
      category: "Kitchenware",
    },
    {
      name: "Desk Lamp",
      stock: 30,
      unitPrice: 22.99,
      category: "Home Decor",
    },
    {
      name: "Ballpoint Pen (Pack of 10)",
      stock: 200,
      unitPrice: 4.99,
      category: "Stationery",
    },
    {
      name: "USB-C Charger",
      stock: 40,
      unitPrice: 15.49,
      category: "Accessories",
    },
  ];
  

export const productColumns: ColumnDef<ProductColumnProps>[] = [
  {
    id: "sn",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Sr. No
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "unitPrice",
    header: "Unit Price",
  },
  {
    accessorKey: "category",
    header: "Category",
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const credit = row.original;

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
              onClick={() => navigator.clipboard.writeText(credit.name)}>
              Copy Cutomer Name
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View credit details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
