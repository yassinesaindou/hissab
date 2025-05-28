"use client";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { profileColumns, ProfileWithSubscription } from "./ProfilesColumns";

export default function ProfileTable({
  profiles,
}: {
  profiles: ProfileWithSubscription[];
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  // Debug: Log profiles
  console.log("ProfileTable profiles:", profiles);

  const table = useReactTable({
    data: profiles,
    columns:profileColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue: string) => {
      const name = row.getValue("name") as string | null;
      const result = name
        ? name.toLowerCase().includes(filterValue.toLowerCase())
        : false;
      console.log("Filtering:", { name, filterValue, result });
      return result;
    },
  });

  // Debug: Log table state
  console.log("Table state:", table.getState());

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">
        User Profiles
      </h2>
      <div className="mb-4">
        <Input
          placeholder="Search by name..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm text-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={profileColumns.length}
                  className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
