"use client";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react"
 

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
interface ColummnProps {
  name: string;
  date: string;
  number: string;
  item?: string;
  amount: string;
  status: "paid" | "unpaid";
}
import { ArrowUpDown } from "lucide-react";

export const creditData: ColummnProps[] = [
  {
    name: "Alice Morgan",
    date: "2025-05-01",
    number: "4578963210",
    item: "Subscription",
    amount: "$199",
    status: "paid",
  },
  {
    name: "John Doe",
    date: "2025-05-02",
    number: "9988776655",
    item: "License Renewal",
    amount: "$399",
    status: "paid",
  },
  {
    name: "Sandra Hill",
    date: "2025-05-03",
    number: "8855443366",
    item: "Consultation",
    amount: "$150",
    status: "unpaid",
  },
  {
    name: "Michael Smith",
    date: "2025-05-04",
    number: "7744112233",
    item: "App Purchase",
    amount: "$59",
    status: "paid",
  },
  {
    name: "Julia White",
    date: "2025-05-05",
    number: "6622334455",
    item: "Report",
    amount: "$275",
    status: "unpaid",
  },
  {
    name: "David Kim",
    date: "2025-05-06",
    number: "9911223344",
    item: "Audit Fee",
    amount: "$330",
    status: "unpaid",
  },
  {
    name: "Emily Clark",
    date: "2025-05-07",
    number: "4455667788",
    item: "Setup Service",
    amount: "$620",
    status: "paid",
  },
  {
    name: "John Doe",
    date: "2025-05-02",
    number: "9988776655",
    item: "License Renewal",
    amount: "$399",
    status: "unpaid",
  },
  {
    name: "Sandra Hill",
    date: "2025-05-03",
    number: "8855443366",
    item: "Consultation",
    amount: "$150",
    status: "unpaid",
  },
  {
    name: "Michael Smith",
    date: "2025-05-04",
    number: "7744112233",
    item: "App Purchase",
    amount: "$59",
    status: "unpaid",
  },
  {
    name: "Julia White",
    date: "2025-05-05",
    number: "6622334455",
    item: "Report",
    amount: "$275",
    status: "paid",
  },
  {
    name: "David Kim",
    date: "2025-05-06",
    number: "9911223344",
    item: "Audit Fee",
    amount: "$330",
    status: "paid",
  },
  {
    name: "Emily Clark",
    date: "2025-05-07",
    number: "4455667788",
    item: "Setup Service",
    amount: "$620",
    status: "paid",
  },
];

export const columns: ColumnDef<ColummnProps>[] = [
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
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "number",
    header: "Phone Number",
  },
  {
    accessorKey: "item",
    header: "Item Name",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Statuses
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    cell: ({ row }) => {
      const status = row.getValue("status");

      if (status === "paid") {
        return (
          <div className="bg-green-100 text-center text-green-600 py-1 px-3 rounded-full text-xs font-medium">
            Paid
          </div>
        );
      } else if (status === "unpaid") {
        return (
          <div className="bg-red-100 text-red-600 py-1 px-3 rounded-full text-xs font-medium text-center">
            Unpaid
          </div>
        );
      }
      return null;
    },
    },
    {
        id: "actions",
        cell: ({ row }) => {
          const credit = row.original
     
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
                  onClick={() => navigator.clipboard.writeText(credit.name)}
                >
                  Copy Cutomer Name
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View customer</DropdownMenuItem>
                <DropdownMenuItem>View credit details</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
];
