import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export type ProfileWithSubscription = {
  userId: string;
  name: string | null;
  phoneNumber: string | null;
  subscriptionId: string | null;
  created_at: string | null;
  updatedAt: string | null;
  endAt: string | null;
  daysLeft: number;
};

export const profileColumns: ColumnDef<ProfileWithSubscription>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.original.name || "N/A",
    enableSorting: true,
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
    cell: ({ row }) => row.original.phoneNumber || "N/A",
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Started
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.created_at
        ? new Date(row.original.created_at).toLocaleDateString()
        : "N/A",
    enableSorting: true,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Updated
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.updatedAt
        ? new Date(row.original.updatedAt).toLocaleDateString()
        : "N/A",
    enableSorting: true,
  },
  {
    accessorKey: "endAt",
    header: "Ends",
    cell: ({ row }) =>
      row.original.endAt ? new Date(row.original.endAt).toLocaleDateString() : "N/A",
  },
  {
    accessorKey: "daysLeft",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Days Left
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => row.original.daysLeft,
    enableSorting: true,
  },
];