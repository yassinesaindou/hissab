"use client";
import { useState } from "react";
import {
  getSortedRowModel,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  TableMeta,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,

  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransactionInterface } from "./TransactionColumns";


export interface TransactionTableMeta extends TableMeta<TransactionInterface> {
  onEditTransaction?: (transaction: TransactionInterface) => void;
}
interface DataTableProps<TValue> {
  columns: ColumnDef<TransactionInterface, TValue>[];
  data: TransactionInterface[];
  onEditTransaction?: (transaction: TransactionInterface) => void;
}

export function DataTable< TValue>({
  columns,
  data,
  onEditTransaction,
}: DataTableProps< TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,

      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue: string) => {
      const search = filterValue.toLowerCase();
      const productName = row.original.productName
        ? String(row.original.productName).toLowerCase()
        : "";
      const type = String(row.original.type).toLowerCase();
      return productName.includes(search) || type.includes(search);
    },
    meta: {
      onEditTransaction,
    } as TransactionTableMeta,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Input
          placeholder="Rechercher par nom ou type de produit..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </thead>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}>
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
                  colSpan={columns.length}
                  className="h-24 text-center">
                  Aucune donnée trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}>
          Précédente
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}>
          Suivante
        </Button>
      </div>
    </div>
  );
}
