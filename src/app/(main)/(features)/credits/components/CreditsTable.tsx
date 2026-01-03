// app/credits/components/CreditsTable.tsx
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
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Package,
  Phone,
  Search,
  Trash2,
  User
} from "lucide-react";
import { useEffect, useState } from "react";
import { Credit } from "../types";

 

interface CreditsTableProps {
  credits: Credit[];
  onEdit: (credit: Credit) => void;
  onDelete: (creditId: string) => void;
}

export default function CreditsTable({ credits, onEdit, onDelete }: CreditsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [globalFilter, setGlobalFilter] = useState("");

  // Define columns with full features
  const columns: ColumnDef<Credit>[] = [
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
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300"
          aria-label="Sélectionner cette ligne"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          Client
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const credit = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <p className="font-medium">{credit.customerName}</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Phone className="h-3 w-3" />
              {credit.customerPhone}
            </div>
          </div>
        );
      },
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
        const productName = row.getValue("productName") as string;
        return (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-400" />
            <span className="max-w-[200px] truncate">
              {productName || "Aucun article"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          Montant
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-emerald-600">
              {amount.toLocaleString()} Fcs
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          Statut
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const isPaid = status === "paid";
        
        return (
          <Badge
            variant={isPaid ? "default" : "outline"}
            className={`
              capitalize font-medium
              ${isPaid 
                ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                : "bg-amber-100 text-amber-700 border-amber-200"
              }
            `}
          >
            {isPaid ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <Clock className="h-3 w-3 mr-1" />
            )}
            {isPaid ? "Payé" : "En attente"}
          </Badge>
        );
      },
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === "all") return true;
        return row.getValue(columnId) === filterValue;
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          Description
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return (
          <div className="flex items-start gap-2 max-w-[250px]">
            <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
            <span className="text-sm text-gray-600 line-clamp-2">
              {description || "Aucune description"}
            </span>
          </div>
        );
      },
    },
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
        const credit = row.original;
        
        const handleEdit = () => onEdit(credit);
        const handleDelete = () => onDelete(credit.creditId);

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: credits,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  // Apply status filter
  useEffect(() => {
    if (statusFilter === "all") {
      table.getColumn("status")?.setFilterValue(undefined);
    } else {
      table.getColumn("status")?.setFilterValue(statusFilter);
    }
  }, [statusFilter, table]);

  // Handle bulk actions
  const handleDeleteSelected = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedRows.length} crédit(s) ?`)) {
      return;
    }

    // Delete selected credits
    for (const row of selectedRows) {
      await onDelete(row.original.creditId);
    }
    
    table.resetRowSelection();
  };

  const handleMarkAsPaid = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    // Here you would typically make an API call to update status
    // For now, we'll just show a message
    alert(`${selectedRows.length} crédit(s) marqué(s) comme payés`);
    table.resetRowSelection();
  };

  if (credits.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <EyeOff className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun crédit</h3>
        <p className="text-gray-500 mb-6">Commencez par ajouter votre premier crédit.</p>
      </div>
    );
  }

  const pendingCreditsCount = credits.filter(c => c.status === "pending").length;
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <Card>
      <CardHeader>
        {/* Filters and Search - THIS WAS MISSING */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Global Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, téléphone, article..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payés</SelectItem>
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
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id === "productName" ? "Article" : 
                         column.id === "customerName" ? "Client" :
                         column.id === "description" ? "Description" :
                         column.id === "created_at" ? "Date" : column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="text-sm text-gray-600 whitespace-nowrap">
            {credits.length} crédit{credits.length > 1 ? 's' : ''} • 
            <span className="text-amber-600 font-medium ml-1">
              {pendingCreditsCount} en attente
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6">
        {/* Selected Rows Actions */}
        {selectedRowsCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-blue-800 font-medium">
              {selectedRowsCount} crédit{selectedRowsCount > 1 ? 's' : ''} sélectionné{selectedRowsCount > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsPaid}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                disabled={selectedRowsCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marquer comme payé
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteSelected}
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={selectedRowsCount === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="font-semibold text-gray-700">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const credit = row.original;
                  const isPending = credit.status === "pending";
                  
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={`
                        hover:bg-gray-50/50 transition-colors
                        ${isPending ? 'border-l-4 border-l-amber-500' : ''}
                        ${row.getIsSelected() ? 'bg-blue-50/50' : ''}
                      `}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
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
            Page {table.getState().pagination.pageIndex + 1} sur{" "}
            {table.getPageCount()} •{" "}
            {table.getFilteredRowModel().rows.length} résultat{table.getFilteredRowModel().rows.length > 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Lignes:</span>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 30, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page navigation */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Page précédente</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                  const pageIndex = table.getState().pagination.pageIndex;
                  const maxPages = table.getPageCount();
                  
                  // Calculate which page numbers to show
                  let startPage = Math.max(0, pageIndex - 2);
                  const endPage = Math.min(maxPages, startPage + 5);
                  
                  if (endPage - startPage < 5) {
                    startPage = Math.max(0, endPage - 5);
                  }

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
                <span className="sr-only">Page suivante</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}