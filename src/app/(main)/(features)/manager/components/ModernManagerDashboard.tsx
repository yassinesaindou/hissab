/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/manager/components/ModernManagerDashboard.tsx
"use client";

import { processSubscriptionCode } from "../actions/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    AlertCircle,
    ArrowUpDown,
    Calendar,
    Check,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    Eye,
    Filter,
    Key,
    Loader2,
    Mail,
    Phone,
    Search,
    Store,
    User,
    Users,
    XCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
  subscription?: {
    subscriptionId: string;
    endAt: string;
    planId: number;
    storeId: string;
  };
  plan?: {
    planId: number;
    name: string;
    price: number;
    numberOfUsers: number;
  };
  profile?: {
    userId: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
};

type Plan = {
  planId: number;
  name: string;
  price: number;
  numberOfUsers: number;
  transactionsPerDay: number;
};

interface StatsData {
  totalCodes: number;
  pendingCodes: number;
  settledCodes: number;
  totalRevenue: number;
}

interface ModernManagerDashboardProps {
  subscriptionCodes: SubscriptionCode[];
  plans: Plan[];
  stats: StatsData;
}

const processCodeSchema = z.object({
  codeId: z.string().min(1, "Code requis"),
  planId: z.coerce.number().int().min(1, "Plan requis"),
  months: z.coerce.number().int().min(1, "Min 1 mois").max(36, "Max 36 mois"),
});

type ProcessCodeForm = z.infer<typeof processCodeSchema>;

export default function ModernManagerDashboard({ 
  subscriptionCodes, 
  plans,
  stats 
}: ModernManagerDashboardProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [selectedCode, setSelectedCode] = useState<SubscriptionCode | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "pending" | "all">("overview");

  const form = useForm<ProcessCodeForm>({
    resolver: zodResolver(processCodeSchema),
    defaultValues: { codeId: "", planId: 2, months: 1 },
  });

  // Filter codes based on active tab
  const filteredCodes = useMemo(() => {
    if (activeTab === "pending") {
      return subscriptionCodes.filter(code => !code.isSettled);
    }
    return subscriptionCodes;
  }, [subscriptionCodes, activeTab]);

  // Columns for codes table
  const columns: ColumnDef<SubscriptionCode>[] = useMemo(
    () => [
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
            <ArrowUpDown className="ml-2 h-3 w-3" />
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
            <Store className="mr-2 h-4 w-4" />
            Magasin
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const store = row.original.store;
          const profile = row.original.profile;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 bg-gradient-to-br from-blue-500 to-indigo-600">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {store?.storeName?.substring(0, 2).toUpperCase() || "MS"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{store?.storeName || "Magasin sans nom"}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {profile?.name || "Propriétaire"}
                </p>
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
          const profile = row.original.profile;
          return (
            <div className="space-y-1">
              {profile?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <span className="text-sm font-medium">{profile.email}</span>
                </div>
              )}
              {(profile?.phoneNumber || store?.storePhoneNumber) && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span className="text-sm font-medium">
                    {profile?.phoneNumber || store?.storePhoneNumber}
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
            <ArrowUpDown className="ml-2 h-3 w-3" />
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
          
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedCode(code);
                  form.setValue("codeId", code.codeId);
                  setIsProcessOpen(true);
                }}
                disabled={isSettled}
              >
                <Check className="h-3 w-3 mr-1" />
                Traiter
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredCodes,
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

  const onSubmit = async (data: ProcessCodeForm) => {
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("codeId", data.codeId);
      formData.append("planId", data.planId.toString());
      formData.append("months", data.months.toString());

      const result = await processSubscriptionCode(formData);
      setResultMessage(result.message || "");
      
      if (result.success) {
        setIsProcessOpen(false);
        form.reset();
        setSelectedCode(null);
        
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Error processing code:", error);
      setResultMessage("Une erreur s'est produite lors du traitement");
    } finally {
      setProcessing(false);
      setIsResultOpen(true);
    }
  };

  // Get subscription end date for display
  const getSubscriptionEndDate = (code: SubscriptionCode) => {
    if (!code.subscription?.endAt) return null;
    const endDate = new Date(code.subscription.endAt);
    const today = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      date: endDate,
      daysLeft,
      isExpired: daysLeft < 0,
      isExpiringSoon: daysLeft >= 0 && daysLeft <= 7,
    };
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Dashboard Administrateur
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les codes de paiement et les abonnements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Codes totaux</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalCodes}</p>
                <p className="text-xs text-blue-600 mt-1">Codes soumis</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">En attente</p>
                <p className="text-3xl font-bold text-amber-900 mt-2">{stats.pendingCodes}</p>
                <p className="text-xs text-amber-600 mt-1">À traiter</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Traités</p>
                <p className="text-3xl font-bold text-emerald-900 mt-2">{stats.settledCodes}</p>
                <p className="text-xs text-emerald-600 mt-1">Validés</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Revenu total</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  {stats.totalRevenue.toLocaleString()} KMF
                </p>
                <p className="text-xs text-purple-600 mt-1">Revenue généré</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            En attente ({stats.pendingCodes})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Key className="h-4 w-4" />
            Tous les codes
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Codes récents</h3>
              <div className="space-y-3">
                {subscriptionCodes.slice(0, 5).map((code) => {
                  const subscriptionInfo = getSubscriptionEndDate(code);
                  return (
                    <div key={code.codeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          code.isSettled 
                            ? "bg-emerald-100 text-emerald-600" 
                            : "bg-amber-100 text-amber-600"
                        )}>
                          {code.isSettled ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="font-mono font-bold text-gray-900">
                              {code.code}
                            </code>
                            <span className="text-xs text-gray-500">
                              {format(new Date(code.createdAt), "dd/MM HH:mm")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{code.store?.storeName}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={code.isSettled ? "outline" : "default"}
                        onClick={() => {
                          setSelectedCode(code);
                          form.setValue("codeId", code.codeId);
                          setIsProcessOpen(true);
                        }}
                        disabled={code.isSettled}
                      >
                        {code.isSettled ? "Traité" : "Traiter"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plans disponibles</h3>
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <div key={plan.planId} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-gray-600">
                            {plan.numberOfUsers} utilisateurs • {plan.transactionsPerDay} trans./jour
                          </p>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                          {plan.price.toLocaleString()} KMF
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Voir tous les magasins
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Rapports financiers
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Abonnements expirants
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Pending & All Codes Tabs */}
        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <div className="p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {activeTab === "pending" ? "Codes en attente" : "Tous les codes"}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {table.getFilteredRowModel().rows.length} code{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''} trouvé{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 lg:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un code ou magasin..."
                      value={globalFilter}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="pl-10 w-full lg:w-64"
                    />
                  </div>
                  <Select
                    value={(table.getColumn("isSettled")?.getFilterValue() as string) || "all"}
                    onValueChange={(value) => 
                      table.getColumn("isSettled")?.setFilterValue(value === "all" ? undefined : value === "true")
                    }
                  >
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="true">Traité</SelectItem>
                      <SelectItem value="false">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="font-semibold text-gray-700">
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
                              {activeTab === "pending" 
                                ? "Aucun code en attente de traitement" 
                                : "Aucun code n'a été soumis"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Code Dialog */}
      <Dialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Traiter un code de paiement</DialogTitle>
            <DialogDescription>
              Validez le paiement et activez l'abonnement
            </DialogDescription>
          </DialogHeader>
          
          {selectedCode && (
            <div className="space-y-6">
              {/* Code Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-blue-600" />
                    <code className="font-mono font-bold text-lg">{selectedCode.code}</code>
                  </div>
                  <Badge className={selectedCode.isSettled 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-amber-100 text-amber-700"
                  }>
                    {selectedCode.isSettled ? "Déjà traité" : "En attente"}
                  </Badge>
                </div>
                <p className="text-sm text-blue-700">
                  Soumis le {format(new Date(selectedCode.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </p>
              </div>

              {/* Store Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Informations du magasin</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Magasin</p>
                    <p className="font-medium">{selectedCode.store?.storeName}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Propriétaire</p>
                    <p className="font-medium">{selectedCode.profile?.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedCode.profile?.email || "N/A"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-medium">
                      {selectedCode.profile?.phoneNumber || selectedCode.store?.storePhoneNumber || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Subscription Info */}
              {selectedCode.subscription && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Abonnement actuel</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Plan actuel</p>
                      <p className="font-medium">{selectedCode.plan?.name || "Inconnu"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expire le</p>
                      <p className="font-medium">
                        {selectedCode.subscription.endAt 
                          ? format(new Date(selectedCode.subscription.endAt), "dd MMM yyyy", { locale: fr })
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Processing Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Plan Selection */}
                    <FormField
                      control={form.control}
                      name="planId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Plan à activer</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(Number(v))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem key={plan.planId} value={plan.planId.toString()}>
                                  <div className="flex items-center justify-between">
                                    <span>{plan.name}</span>
                                    <span className="text-sm font-medium">
                                      {plan.price.toLocaleString()} KMF
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Months */}
                    <FormField
                      control={form.control}
                      name="months"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Durée (mois)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="36"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsProcessOpen(false);
                        form.reset();
                        setSelectedCode(null);
                      }}
                      disabled={processing}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={processing || selectedCode.isSettled}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Valider et activer
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résultat du traitement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              resultMessage.includes("succès") || resultMessage.includes("activé")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              <div className="flex items-center gap-3">
                {resultMessage.includes("succès") || resultMessage.includes("activé") ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <p className="font-medium">{resultMessage}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsResultOpen(false)}>Fermer</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}