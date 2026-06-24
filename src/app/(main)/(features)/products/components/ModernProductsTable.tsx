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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuCheckboxItem,
  DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown, Barcode, ChevronLeft, ChevronRight,
  Copy, Check, Edit, Eye, Filter, Minus, Package, Plus, Search,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Product } from "../actions/actions";
import ProductDetailSheet from "./ProductDetailSheet";
import { isValidEAN13 } from "@/lib/utils/ean13";

interface ModernProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product, type: "increase" | "decrease") => void;
  /** Hide edit/stock actions from employees — defaults to true */
  canMutate?: boolean;
}

/** Small inline copy button used in the code cell */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 text-gray-300 hover:text-indigo-500 transition-colors"
      title="Copier le code"
    >
      {copied
        ? <Check className="h-3 w-3 text-emerald-500" />
        : <Copy className="h-3 w-3" />}
    </button>
  );
}

export default function ModernProductsTable({
  products,
  onEdit,
  onAdjustStock,
  canMutate = true,
}: ModernProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");

  // ── Detail sheet state ────────────────────────────────────────────────────
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openDetail = (p: Product) => {
    setDetailProduct(p);
    setIsDetailOpen(true);
  };

  const columns: ColumnDef<Product>[] = [
    // ── Article ─────────────────────────────────────────────────────────────
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="font-semibold hover:bg-transparent p-0">
          <Package className="h-4 w-4 mr-2" />Article<ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const product = row.original;
        const isLow = product.stock > 0 && product.stock <= 10;
        const isOut = product.stock === 0;
        return (
          <div className="space-y-1">
            <div className="font-medium">{product.name}</div>
            <div className="text-xs text-gray-500">{product.category || "Général"}</div>
            {isLow && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Stock faible</Badge>}
            {isOut && <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">Rupture</Badge>}
          </div>
        );
      },
    },

    // ── Code EAN-13 ──────────────────────────────────────────────────────────
    {
      accessorKey: "productCode",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="font-semibold hover:bg-transparent p-0">
          <Barcode className="h-4 w-4 mr-2" />Code<ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const code = row.getValue("productCode") as string;
        if (!code) return <span className="text-gray-300 text-xs">—</span>;
        const formatted = code.length === 13
          ? `${code[0]} · ${code.slice(1, 7)} · ${code.slice(7)}`
          : code;
        const valid = isValidEAN13(code);
        return (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <span className={`font-mono text-xs font-semibold rounded px-2 py-1 tracking-wider whitespace-nowrap border ${
              valid
                ? "text-indigo-700 bg-indigo-50 border-indigo-100"
                : "text-amber-700 bg-amber-50 border-amber-200"
            }`} title={valid ? "EAN-13 valide" : "Checksum invalide — non scannable"}>
              {formatted}
            </span>
            <CopyButton text={code} />
          </div>
        );
      },
    },

    // ── Stock ────────────────────────────────────────────────────────────────
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="font-semibold hover:bg-transparent p-0">
          Stock<ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const stock = row.getValue("stock") as number;
        const color = stock === 0 ? "text-rose-600" : stock <= 10 ? "text-amber-600" : "text-emerald-600";
        return <div className={`text-lg font-bold ${color}`}>{stock}</div>;
      },
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === "all") return true;
        const s = row.getValue(columnId) as number;
        if (filterValue === "in_stock") return s > 0;
        if (filterValue === "low_stock") return s > 0 && s <= 10;
        if (filterValue === "out_of_stock") return s === 0;
        return true;
      },
    },

    // ── Prix ─────────────────────────────────────────────────────────────────
    {
      accessorKey: "unitPrice",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="font-semibold hover:bg-transparent p-0">
          Prix<ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {parseFloat(row.getValue("unitPrice")).toLocaleString()} Fcs
        </div>
      ),
    },

    // ── Description ──────────────────────────────────────────────────────────
    {
      accessorKey: "description",
      header: () => <span className="font-semibold text-gray-700">Description</span>,
      cell: ({ row }) => (
        <p className="text-sm text-gray-500 truncate max-w-[200px]">
          {(row.getValue("description") as string) || "—"}
        </p>
      ),
    },

    // ── Date ─────────────────────────────────────────────────────────────────
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="font-semibold hover:bg-transparent p-0">
          Ajouté le<ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {format(new Date(row.getValue("created_at")), "dd MMM yyyy", { locale: fr })}
        </div>
      ),
    },

    // ── Actions ──────────────────────────────────────────────────────────────
    {
      id: "actions",
      header: () => <div className="font-semibold text-gray-700">Actions</div>,
      cell: ({ row }) => {
        const product = row.original;
        if (!canMutate) return null;
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={() => onEdit(product)}
              className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Modifier">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onAdjustStock(product, "increase")}
              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" title="Ajouter au stock">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onAdjustStock(product, "decrease")}
              className="h-8 w-8 text-amber-600 hover:bg-amber-50" title="Réduire le stock"
              disabled={product.stock === 0}>
              <Minus className="h-4 w-4" />
            </Button>
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
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    onGlobalFilterChange: setGlobalFilter,
  });

  if (products.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun article</h3>
        <p className="text-gray-500">Commencez par ajouter votre premier article.</p>
      </div>
    );
  }

  const totalValue = products.reduce((s, p) => s + p.stock * p.unitPrice, 0);

  return (
    <>
      <div className="space-y-4 p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher article ou code…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={stockFilter} onValueChange={(v) => {
              setStockFilter(v);
              table.getColumn("stock")?.setFilterValue(v === "all" ? undefined : v);
            }}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les stocks</SelectItem>
                <SelectItem value="in_stock">En stock</SelectItem>
                <SelectItem value="low_stock">Stock faible (&lt;10)</SelectItem>
                <SelectItem value="out_of_stock">Rupture</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Eye className="h-4 w-4 mr-2" />Colonnes</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {col.id === "productCode" ? "Code EAN-13" :
                     col.id === "unitPrice" ? "Prix" :
                     col.id === "created_at" ? "Date" :
                     col.id === "description" ? "Description" : col.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="text-sm text-gray-500 whitespace-nowrap">
            {products.length} article{products.length > 1 ? "s" : ""} •{" "}
            <span className="text-emerald-600 font-medium">{totalValue.toLocaleString()} Fcs</span>
          </div>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Eye className="h-3 w-3" />
          Cliquez sur une ligne pour voir les détails
        </p>

        {/* Table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} className="font-semibold text-gray-700">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const p = row.original;
                  const isLow = p.stock > 0 && p.stock <= 10;
                  const isOut = p.stock === 0;
                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => openDetail(p)}
                      className={`hover:bg-blue-50/40 transition-colors cursor-pointer
                        ${isOut ? "border-l-4 border-l-rose-500" : ""}
                        ${isLow && !isOut ? "border-l-4 border-l-amber-400" : ""}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">Aucun résultat trouvé</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="text-sm text-gray-500">
            Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} •{" "}
            {table.getFilteredRowModel().rows.length} résultat{table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Lignes :</span>
              <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(v) => table.setPageSize(Number(v))}>
                <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 30, 50].map((s) => (
                    <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                const pi = table.getState().pagination.pageIndex;
                const max = table.getPageCount();
                let start = Math.max(0, pi - 2);
                const end = Math.min(max, start + 5);
                if (end - start < 5) start = Math.max(0, end - 5);
                const pn = start + i;
                if (pn >= max) return null;
                return (
                  <Button key={pn} variant={pi === pn ? "default" : "outline"} size="sm"
                    className="h-8 w-8 p-0 text-xs" onClick={() => table.setPageIndex(pn)}>
                    {pn + 1}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail sheet ───────────────────────────────────────────────────── */}
      <ProductDetailSheet
        product={detailProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(p) => {
          setIsDetailOpen(false);
          onEdit(p);
        }}
        onAdjustStock={(p, type) => {
          setIsDetailOpen(false);
          onAdjustStock(p, type);
        }}
        canMutate={canMutate}
      />
    </>
  );
}