// app/products/components/ModernProductsTable.tsx
"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Eye, 
  Filter, 
  Minus, 
  Package, 
  Plus, 
  Search 
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Product {
  productId: string;
  name: string;
  stock: number;
  unitPrice: number;
  category: string | null;
  description: string | null;
  created_at: string;
}

interface ModernProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product, type: 'increase' | 'decrease') => void;
}

export default function ModernProductsTable({ 
  products, 
  onEdit, 
  onAdjustStock 
}: ModernProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");

  // Define columns
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          <Package className="h-4 w-4 mr-2" />
          Article
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original;
        const isLowStock = product.stock > 0 && product.stock <= 10;
        const isOutOfStock = product.stock === 0;
        
        return (
          <div className="space-y-1">
            <div className="font-medium">{product.name}</div>
            <div className="text-xs text-gray-500">
              {product.category || "Général"}
            </div>
            {isLowStock && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Stock faible
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                Rupture
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const stock = row.getValue("stock") as number;
        const getStockColor = (stock: number) => {
          if (stock === 0) return "text-rose-600";
          if (stock <= 10) return "text-amber-600";
          return "text-emerald-600";
        };
        
        return (
          <div className="flex items-center gap-2">
            <div className={`text-lg font-bold ${getStockColor(stock)}`}>
              {stock}
            </div>
          </div>
        );
      },
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === "all") return true;
        if (filterValue === "in_stock") return row.getValue(columnId)  as number> 0;
        if (filterValue === "low_stock") {
          const stock = row.getValue(columnId) as number;
          return stock > 0 && stock <= 10;
        }
        if (filterValue === "out_of_stock") return row.getValue(columnId) === 0;
        return true;
      },
    },
    {
      accessorKey: "unitPrice",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold hover:bg-transparent p-0"
        >
          Prix
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("unitPrice"));
        return (
          <div className="font-medium">
            {price.toLocaleString()} Fcs
          </div>
        );
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
          <div className="max-w-[250px]">
            <p className="text-sm text-gray-600 truncate">
              {description || "Aucune description"}
            </p>
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
          Ajouté le
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="text-sm text-gray-600">
            {format(date, "dd MMM yyyy", { locale: fr })}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="font-semibold text-gray-700">Actions</div>,
      cell: ({ row }) => {
        const product = row.original;
        const stock = product.stock;
        
        return (
          <div className="flex items-center gap-2">
            {/* Edit Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(product)}
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            {/* Stock Adjustment Buttons */}
            <div className="flex gap-1">
              {/* Increase Stock */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAdjustStock(product, 'increase')}
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                title="Ajouter au stock"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              {/* Decrease Stock */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAdjustStock(product, 'decrease')}
                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                title="Réduire le stock"
                disabled={stock === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: products,
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

  // Apply stock filter
  useState(() => {
    if (stockFilter !== "all") {
      table.getColumn("stock")?.setFilterValue(stockFilter);
    }
  });

  if (products.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun article</h3>
        <p className="text-gray-500 mb-4">Commencez par ajouter votre premier article.</p>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un article
        </Button>
      </div>
    );
  }

  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.unitPrice), 0);

  return (
    <div className="space-y-4 p-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Global Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un article..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stock Filter */}
          <Select value={stockFilter} onValueChange={(value) => {
            setStockFilter(value);
            if (value === "all") {
              table.getColumn("stock")?.setFilterValue(undefined);
            } else {
              table.getColumn("stock")?.setFilterValue(value);
            }
          }}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les stocks</SelectItem>
              <SelectItem value="in_stock">En stock</SelectItem>
              <SelectItem value="low_stock">Stock faible (&lt;10)</SelectItem>
              <SelectItem value="out_of_stock">Rupture</SelectItem>
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
                      {column.id === "unitPrice" ? "Prix" : 
                       column.id === "created_at" ? "Date" : 
                       column.id === "description" ? "Description" : 
                       column.id === "actions" ? "Actions" : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-600 whitespace-nowrap">
          {products.length} article{products.length > 1 ? 's' : ''} • 
          <span className="text-emerald-600 font-medium ml-1">
            {totalStockValue.toLocaleString()} Fcs de valeur
          </span>
        </div>
      </div>

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
                const product = row.original;
                const isLowStock = product.stock > 0 && product.stock <= 10;
                const isOutOfStock = product.stock === 0;
                
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`
                      hover:bg-gray-50/50 transition-colors
                      ${isLowStock ? 'border-l-4 border-l-amber-500' : ''}
                      ${isOutOfStock ? 'border-l-4 border-l-rose-500' : ''}
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
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                const pageIndex = table.getState().pagination.pageIndex;
                const maxPages = table.getPageCount();
                
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}