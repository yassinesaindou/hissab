/* eslint-disable react/no-unescaped-entities */
// app/manager/components/CodesTable.tsx
"use client";

import { useState } from "react";
import {
  Key,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  MoreHorizontal,
  Check,
  Trash2,
  Eye,
} from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

type SubscriptionCode = {
  codeId: string;
  code: string;
  storeId: string;
  createdAt: string;
  isSettled: boolean;
  store?: {
    storeId: string;
    storeName: string;
    storePhoneNumber?: string;
  };
  owner?: {
    name: string;
    email: string;
    phoneNumber?: string;
  };
};

interface CodesTableProps {
  codes: SubscriptionCode[];
  loading?: boolean;
  onProcessCode?: (code: SubscriptionCode) => void;
  onDeleteCode?: (codeId: string) => Promise<void>;
  onViewStore?: (storeId: string) => void;
}

export function CodesTable({
  codes,
  loading = false,
  onProcessCode,
  onDeleteCode,
  onViewStore,
}: CodesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (codeId: string) => {
    if (!onDeleteCode) return;
    
    setDeletingId(codeId);
    try {
      await onDeleteCode(codeId);
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<SubscriptionCode>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900 px-0"
        >
          <Key className="mr-2 h-4 w-4" />
          Code
          <svg className="ml-2 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </Button>
      ),
      cell: ({ row }) => {
        const code = row.original.code;
        return (
          <div className="font-mono font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded border">
            {code}
          </div>
        );
      },
    },
    {
      accessorKey: "store.storeName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900 px-0"
        >
          <Building2 className="mr-2 h-4 w-4" />
          Magasin
        </Button>
      ),
      cell: ({ row }) => {
        const store = row.original.store;
        const owner = row.original.owner;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {store?.storeName?.substring(0, 2).toUpperCase() || "MS"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{store?.storeName || "Magasin sans nom"}</p>
              <p className="text-xs text-gray-500">{owner?.name || "Propriétaire"}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const store = row.original.store;
        const owner = row.original.owner;
        return (
          <div className="space-y-1">
            {owner?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-gray-400" />
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {owner.email}
                </span>
              </div>
            )}
            {(owner?.phoneNumber || store?.storePhoneNumber) && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-gray-400" />
                <span className="text-sm font-medium">
                  {owner?.phoneNumber || store?.storePhoneNumber}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900 px-0"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Soumis le
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {format(date, "dd MMM yyyy", { locale: fr })}
            </span>
            <span className="text-xs text-gray-500">
              {format(date, "HH:mm", { locale: fr })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "isSettled",
      header: "Statut",
      cell: ({ row }) => {
        const isSettled = row.original.isSettled;
        return (
          <Badge className={isSettled 
            ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
            : "bg-amber-100 text-amber-700 border-amber-200"
          }>
            {isSettled ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Traité
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1" />
                En attente
              </>
            )}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const code = row.original;
        const isSettled = code.isSettled;
        const isDeleting = deletingId === code.codeId;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir le menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {!isSettled && onProcessCode && (
                <DropdownMenuItem onClick={() => onProcessCode(code)}>
                  <Check className="mr-2 h-4 w-4" />
                  Traiter
                </DropdownMenuItem>
              )}
              {onViewStore && (
                <DropdownMenuItem onClick={() => onViewStore(code.storeId)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir le magasin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDeleteCode && (
                <DropdownMenuItem 
                  onClick={() => handleDelete(code.codeId)}
                  disabled={isDeleting}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: codes,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Rechercher un code ou magasin..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
        <Select
          value={(table.getColumn("isSettled")?.getFilterValue() as string) || "all"}
          onValueChange={(value) => 
            table.getColumn("isSettled")?.setFilterValue(value === "all" ? undefined : value === "true")
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="true">Traité</SelectItem>
            <SelectItem value="false">En attente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-gray-700">
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
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    row.original.isSettled && "opacity-75"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
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
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Key className="h-8 w-8 text-gray-400" />
                    <p className="text-gray-500">Aucun code trouvé</p>
                    <p className="text-sm text-gray-400">
                      Aucun code n'a été soumis
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}