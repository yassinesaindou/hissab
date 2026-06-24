/* eslint-disable @typescript-eslint/no-explicit-any */
// app/transactions/components/TransactionsTable.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Edit,
  Eye,
  Filter,
  PlusCircle,
  Search,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Product, Profile, TransactionWithUser } from "@/lib/types/index";
import EditTransactionModal from "./EditTransactionModal";
import TransactionDetailSheet from "./TransactionDetailSheet";

interface TransactionsTableProps {
  transactions: TransactionWithUser[];
  products: Product[];
  userProfile: Profile | null;
  onEdit: (transaction: TransactionWithUser) => void;
  onDelete: (transactionId: string) => void;
}

export default function TransactionsTable({
  transactions,
  products,
  userProfile,
  onEdit,
  onDelete,
}: TransactionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithUser | null>(null);

  // ── Detail sheet state ─────────────────────────────────────────────────────
  const [detailTransaction, setDetailTransaction] = useState<TransactionWithUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isOwner = userProfile?.role === "user" || userProfile?.role === "admin";

  const openDetail = (t: TransactionWithUser) => {
    setDetailTransaction(t);
    setIsDetailOpen(true);
  };

  const columns: ColumnDef<TransactionWithUser>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
          aria-label="Sélectionner toutes les lignes"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          // Stop propagation so clicking the checkbox doesn't also open the detail sheet
          onClick={(e) => e.stopPropagation()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
          aria-label="Sélectionner cette ligne"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "productName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          Article
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {transaction.type === "sale" ? (
                <ShoppingCart className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : transaction.type === "credit" ? (
                <CreditCard className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-500 shrink-0" />
              )}
              <p className="font-medium truncate max-w-[160px]">
                {transaction.productName || "Dépense diverse"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        const getTypeConfig = (type: string) => {
          switch (type) {
            case "sale":
              return { label: "Vente", color: "bg-emerald-100 text-emerald-700", icon: <TrendingUp className="h-3 w-3 mr-1" /> };
            case "credit":
              return { label: "Crédit", color: "bg-amber-100 text-amber-700", icon: <CreditCard className="h-3 w-3 mr-1" /> };
            case "expense":
              return { label: "Dépense", color: "bg-rose-100 text-rose-700", icon: <TrendingDown className="h-3 w-3 mr-1" /> };
            default:
              return { label: type, color: "bg-gray-100 text-gray-700", icon: null };
          }
        };
        const config = getTypeConfig(type);
        return (
          <Badge variant="outline" className={`capitalize font-medium border-none ${config.color}`}>
            {config.icon}
            {config.label}
          </Badge>
        );
      },
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === "all") return true;
        return row.getValue(columnId) === filterValue;
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          Qté
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-center">{row.getValue("quantity")}</div>
      ),
    },
    {
      accessorKey: "unitPrice",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          P.U.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("unitPrice"));
        return <span className="font-medium">{price.toLocaleString()} Fcs</span>;
      },
    },
    {
      accessorKey: "totalPrice",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const total = parseFloat(row.getValue("totalPrice"));
        return (
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-emerald-600">
              {total.toLocaleString()} Fcs
            </span>
          </div>
        );
      },
    },
    ...(isOwner
      ? [
          {
            accessorKey: "userName",
            header: ({ column }: { column: any }) => (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="font-semibold hover:bg-transparent p-0"
              >
                Ajouté par
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            ),
            cell: ({ row }: { row: any }) => (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span>{row.getValue("userName")}</span>
              </div>
            ),
          },
        ]
      : []),
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {format(date, "dd MMM yyyy", { locale: fr })}
              </span>
              <span className="text-xs text-gray-500">
                {format(date, "HH:mm", { locale: fr })}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <div
            className="flex items-center gap-1"
            // Prevent row click from firing when clicking action buttons
            onClick={(e) => e.stopPropagation()}
          >
            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingTransaction(transaction)}
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Supprimer cette transaction ?")) {
                      onDelete(transaction.transactionId);
                    }
                  }}
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    onGlobalFilterChange: setGlobalFilter,
  });

  useEffect(() => {
    if (typeFilter === "all") {
      table.getColumn("type")?.setFilterValue(undefined);
    } else {
      table.getColumn("type")?.setFilterValue(typeFilter);
    }
  }, [typeFilter, table]);

  const handleDeleteSelected = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    if (!confirm(`Supprimer ${selectedRows.length} transaction(s) ?`)) return;
    for (const row of selectedRows) {
      await onDelete(row.original.transactionId);
    }
    table.resetRowSelection();
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune transaction</h3>
          <p className="text-gray-500 mb-4">Commencez par ajouter votre première transaction.</p>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter une transaction
          </Button>
        </CardContent>
      </Card>
    );
  }

  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;
  const totalRevenue = transactions
    .filter((t) => t.type === "sale")
    .reduce((sum, t) => sum + t.totalPrice, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {/* Global Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par article, type..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="sale">Ventes</SelectItem>
                  <SelectItem value="credit">Crédits</SelectItem>
                  <SelectItem value="expense">Dépenses</SelectItem>
                </SelectContent>
              </Select>

              {/* Column Visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Eye className="h-4 w-4 mr-2" />
                    Colonnes
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {table
                    .getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        className="capitalize"
                        checked={col.getIsVisible()}
                        onCheckedChange={(v) => col.toggleVisibility(!!v)}
                      >
                        {col.id === "productName" ? "Article" :
                         col.id === "userName" ? "Ajouté par" :
                         col.id === "type" ? "Type" :
                         col.id === "created_at" ? "Date" : col.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="text-sm text-gray-600 whitespace-nowrap">
              {transactions.length} transaction{transactions.length > 1 ? "s" : ""} •{" "}
              <span className="text-emerald-600 font-medium">
                {totalRevenue.toLocaleString()} KMF
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6">
          {/* Bulk actions */}
          {selectedRowsCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-800 font-medium">
                {selectedRowsCount} transaction{selectedRowsCount > 1 ? "s" : ""} sélectionnée{selectedRowsCount > 1 ? "s" : ""}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteSelected}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          )}

          {/* Hint for clickable rows */}
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Cliquez sur une ligne pour voir les détails
          </p>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-semibold text-gray-700">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      // ── Clickable row ──────────────────────────────────
                      onClick={() => openDetail(row.original)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="space-y-2">
                        <Search className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="text-gray-500">Aucun résultat trouvé</p>
                        <p className="text-sm text-gray-400">
                          Essayez de modifier vos critères de recherche
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="text-sm text-gray-600">
              Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()} •{" "}
              {table.getFilteredRowModel().rows.length} résultat{table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Lignes:</span>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(v) => table.setPageSize(Number(v))}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 30, 50].map((ps) => (
                      <SelectItem key={ps} value={`${ps}`}>{ps}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                    const pageIndex = table.getState().pagination.pageIndex;
                    const maxPages = table.getPageCount();
                    let startPage = Math.max(0, pageIndex - 2);
                    const endPage = Math.min(maxPages, startPage + 5);
                    if (endPage - startPage < 5) startPage = Math.max(0, endPage - 5);
                    const pageNumber = startPage + i;
                    if (pageNumber >= maxPages) return null;
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageIndex === pageNumber ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => table.setPageIndex(pageNumber)}
                      >
                        {pageNumber + 1}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Detail sheet ─────────────────────────────────────────────────────── */}
      <TransactionDetailSheet
        transaction={detailTransaction}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(t) => {
          setEditingTransaction(t);
        }}
        onDelete={onDelete}
        canMutate={isOwner}
      />

      {/* ── Edit modal ───────────────────────────────────────────────────────── */}
      {editingTransaction && (
        <EditTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          transaction={editingTransaction}
          products={products}
          onSuccess={(updated) => {
            onEdit(updated);
            setEditingTransaction(null);
          }}
        />
      )}
    </>
  );
}