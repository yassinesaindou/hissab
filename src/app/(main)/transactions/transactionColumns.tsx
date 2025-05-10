"use client";
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

interface TransactionsColumnProps {
  item: string;
  date: string;
  unitPrice: number;
  quantity: number;

  category: string;
    description: string;
    
}

export const transactions: TransactionsColumnProps[] = [
    {
      item: "Cement Bag",
      date: "2025-05-01",
      unitPrice: 450,
      quantity: 10,
      category: "Building Materials",
      description: "Used for foundation work",
    },
    {
      item: "Steel Rod",
      date: "2025-05-02",
      unitPrice: 1200,
      quantity: 5,
      category: "Construction",
      description: "12mm rods for beams",
    },
    {
      item: "Bricks",
      date: "2025-05-03",
      unitPrice: 7,
      quantity: 1000,
      category: "Building Materials",
      description: "For wall construction",
    },
    {
      item: "Paint (White)",
      date: "2025-05-04",
      unitPrice: 850,
      quantity: 3,
      category: "Finishing",
      description: "Interior wall paint",
    },
    {
      item: "PVC Pipes",
      date: "2025-05-05",
      unitPrice: 250,
      quantity: 8,
      category: "Plumbing",
      description: "For drainage system",
    },
    {
      item: "Tiles (Floor)",
      date: "2025-05-06",
      unitPrice: 600,
      quantity: 20,
      category: "Flooring",
      description: "Ceramic tiles for flooring",
    },
    {
      item: "Sand (Truckload)",
      date: "2025-05-07",
      unitPrice: 1500,
      quantity: 2,
      category: "Raw Material",
      description: "For mixing with cement",
    },
    {
      item: "Door Frame",
      date: "2025-05-08",
      unitPrice: 1800,
      quantity: 4,
      category: "Woodwork",
      description: "Wooden frames for doors",
    },
    {
      item: "Electrical Wire",
      date: "2025-05-09",
      unitPrice: 900,
      quantity: 5,
      category: "Electrical",
      description: "Used for interior wiring",
    },
    {
      item: "Glass Window",
      date: "2025-05-10",
      unitPrice: 2500,
      quantity: 3,
      category: "Fittings",
      description: "Windows for main hall",
    },
    {
      item: "Roof Sheets",
      date: "2025-05-11",
      unitPrice: 2000,
      quantity: 6,
      category: "Roofing",
      description: "Galvanized iron sheets",
    },
  ];
  
export const transactionsColumns: ColumnDef<TransactionsColumnProps>[] = [
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
    accessorKey: "item",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Item Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "unitPrice",
    header: "Unit Price",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    id: "totalPrice",
    header: "Total Price",
    cell: ({ row }) => {
      const unitPrice = row.original.unitPrice;
      const quantity = row.original.quantity;
      const total = unitPrice * quantity;
      return `₹${total.toFixed(2)}`;
    },
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "description",
    header: "Description",
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
              onClick={() => navigator.clipboard.writeText(credit.item)}>
              Copy Item Name
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
