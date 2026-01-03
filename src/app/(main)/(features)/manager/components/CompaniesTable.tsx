/* eslint-disable react/no-unescaped-entities */
// app/manager/components/CompaniesTable.tsx - UPDATED
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
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
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    Eye,
    Mail,
    MessageSquare,
    MoreHorizontal,
    Phone,
    PhoneCall,
    RefreshCw,
    User,
    XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { renewSubscription } from "../actions/actions";

type Company = {
  storeId: string;
  storeName: string;
  storePhoneNumber?: string;
  storeAddress?: string;
  createdAt: string;
  subscription?: {
    subscriptionId: string;
    endAt: string;
    planId: number;
  };
  plan?: {
    planId: number;
    name: string;
    price: number;
    numberOfUsers: number;
  };
  owner?: {
    userId: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role: string;
  };
};

interface CompaniesTableProps {
  companies: Company[];
  loading?: boolean;
  onViewCodes?: (storeId: string) => void;
  onRenewSubscription?: (company: Company) => void;
  onContactOwner?: (company: Company) => void;
}

// Custom filter function for subscription status
const subscriptionStatusFilterFn: FilterFn<Company> = (row, columnId, filterValue) => {
  if (filterValue === "all") return true;
  
  const company = row.original;
  const status = getSubscriptionStatus(company).status;
  
  return status === filterValue;
};

// Calculate subscription status
const getSubscriptionStatus = (company: Company) => {
  if (!company.subscription?.endAt) {
    return { status: "no_subscription", label: "Sans abonnement", color: "bg-gray-100 text-gray-700", icon: <XCircle className="h-3 w-3" /> };
  }

  const endDate = new Date(company.subscription.endAt);
  const today = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { status: "expired", label: "Expiré", color: "bg-red-100 text-red-700", icon: <XCircle className="h-3 w-3" /> };
  } else if (daysLeft <= 7) {
    return { status: "expiring_soon", label: "Expire bientôt", color: "bg-amber-100 text-amber-700", icon: <AlertCircle className="h-3 w-3" /> };
  } else {
    return { status: "active", label: "Actif", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle className="h-3 w-3" /> };
  }
};

export function CompaniesTable({
  companies,
  loading = false,
  onViewCodes,
  onRenewSubscription,
  onContactOwner,
}: CompaniesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);

  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: "storeName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900 px-0"
        >
          <Building2 className="mr-2 h-4 w-4" />
          Magasin
          <svg className="ml-2 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </Button>
      ),
      cell: ({ row }) => {
        const company = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 bg-gradient-to-br from-blue-500 to-indigo-600">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {company.storeName?.substring(0, 2).toUpperCase() || "MS"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{company.storeName}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <User className="h-3 w-3" />
                {company.owner?.name || "Propriétaire"}
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
        const company = row.original;
        return (
          <div className="space-y-1">
            {company.owner?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-gray-400" />
                <span className="text-sm font-medium truncate max-w-[180px]">
                  {company.owner.email}
                </span>
              </div>
            )}
            {(company.owner?.phoneNumber || company.storePhoneNumber) && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-gray-400" />
                <span className="text-sm font-medium">
                  {company.owner?.phoneNumber || company.storePhoneNumber}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "subscription",
      header: "Abonnement",
      filterFn: subscriptionStatusFilterFn,
      cell: ({ row }) => {
        const company = row.original;
        const status = getSubscriptionStatus(company);
        const planName = company.plan?.name;
        const daysLeft = company.subscription?.endAt 
          ? Math.ceil((new Date(company.subscription.endAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return (
          <div className="space-y-2">
            <Badge className={status.color}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </Badge>
            {planName && (
              <div className="text-xs text-gray-600">
                {planName} • {company.plan?.numberOfUsers || 0} utilisateurs
              </div>
            )}
            {daysLeft !== null && daysLeft > 0 && (
              <div className="text-xs text-gray-500">
                {daysLeft} jour{daysLeft !== 1 ? 's' : ''} restant{daysLeft !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "expiration",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-semibold text-gray-700 hover:bg-transparent hover:text-gray-900 px-0"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Expiration
        </Button>
      ),
      cell: ({ row }) => {
        const company = row.original;
        if (!company.subscription?.endAt) {
          return <span className="text-gray-400">—</span>;
        }
        return (
          <div className="text-sm">
            {format(new Date(company.subscription.endAt), "dd MMM yyyy", { locale: fr })}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const company = row.original;
        
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
              {onViewCodes && (
                <DropdownMenuItem onClick={() => onViewCodes(company.storeId)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir les codes
                </DropdownMenuItem>
              )}
              {company.subscription?.subscriptionId && (
                <DropdownMenuItem 
                  onClick={() => {
                    setSelectedCompany(company);
                    setRenewDialogOpen(true);
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renouveler
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedCompany(company);
                  setContactDialogOpen(true);
                }}
              >
                <PhoneCall className="mr-2 h-4 w-4" />
                Contacter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: companies,
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

  useEffect(() => {
    // Reset filters when data changes
    if (!loading) {
      table.setColumnFilters([]);
      setGlobalFilter("");
    }
  }, [loading, table]);

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
            placeholder="Rechercher un magasin ou propriétaire..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
        <Select
          value={(table.getColumn("subscription")?.getFilterValue() as string) || "all"}
          onValueChange={(value) => 
            table.getColumn("subscription")?.setFilterValue(value)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="expiring_soon">Expire bientôt</SelectItem>
            <SelectItem value="expired">Expiré</SelectItem>
            <SelectItem value="no_subscription">Sans abonnement</SelectItem>
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
                    getSubscriptionStatus(row.original).status === "expired" && "bg-red-50/50"
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
                    <Building2 className="h-8 w-8 text-gray-400" />
                    <p className="text-gray-500">Aucun magasin trouvé</p>
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

      {/* Contact Dialog */}
      {selectedCompany && (
        <ContactDialog
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          company={selectedCompany}
          onContact={onContactOwner}
        />
      )}

      {/* Renew Dialog */}
      {selectedCompany && (
        <RenewSubscriptionDialog
          open={renewDialogOpen}
          onOpenChange={setRenewDialogOpen}
          company={selectedCompany}
          onRenew={onRenewSubscription}
        />
      )}
    </div>
  );
}

// Contact Dialog Component
function ContactDialog({
  open,
  onOpenChange,
  company,
  onContact,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onContact?: (company: Company) => void;
}) {
  const handleCall = () => {
    const phoneNumber = company.owner?.phoneNumber || company.storePhoneNumber;
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_blank');
    }
    if (onContact) onContact(company);
  };

  const handleEmail = () => {
    const email = company.owner?.email;
    if (email) {
      window.open(`mailto:${email}`, '_blank');
    }
    if (onContact) onContact(company);
  };

  const handleWhatsApp = () => {
    const phoneNumber = company.owner?.phoneNumber || company.storePhoneNumber;
    if (phoneNumber) {
      window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}`, '_blank');
    }
    if (onContact) onContact(company);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contacter le propriétaire</DialogTitle>
          <DialogDescription>
            Choisissez comment contacter {company.owner?.name || "le propriétaire"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{company.storeName}</h4>
            <div className="space-y-2 text-sm text-gray-600">
              {company.owner?.name && (
                <p>Propriétaire : {company.owner.name}</p>
              )}
              {company.owner?.email && (
                <p>Email : {company.owner.email}</p>
              )}
              {(company.owner?.phoneNumber || company.storePhoneNumber) && (
                <p>Téléphone : {company.owner?.phoneNumber || company.storePhoneNumber}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(company.owner?.phoneNumber || company.storePhoneNumber) && (
              <Button onClick={handleCall} className="gap-2">
                <PhoneCall className="h-4 w-4" />
                Appeler
              </Button>
            )}
            {company.owner?.email && (
              <Button onClick={handleEmail} variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Button>
            )}
            {(company.owner?.phoneNumber || company.storePhoneNumber) && (
              <Button onClick={handleWhatsApp} variant="outline" className="gap-2 bg-green-50 text-green-700 hover:bg-green-100">
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Renew Subscription Dialog Component
// Update the RenewSubscriptionDialog component in CompaniesTable.tsx
function RenewSubscriptionDialog({
  open,
  onOpenChange,
  company,
  onRenew,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onRenew?: (company: Company) => void;
}) {
  const [months, setMonths] = useState(1);
  const [planId, setPlanId] = useState(company.plan?.planId || 2);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Calculate new end date correctly
  const calculateNewEndDate = () => {
    if (!company.subscription?.endAt) {
      return new Date(); // Return today if no end date
    }

    const today = new Date();
    const currentEndDate = new Date(company.subscription.endAt);
    
    let newEndDate: Date;
    
    if (currentEndDate > today) {
      // Subscription is still active - add to current end date
      newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);
    } else {
      // Subscription has expired - start from today
      newEndDate = new Date(today);
      newEndDate.setMonth(newEndDate.getMonth() + months);
    }
    
    return newEndDate;
  };

  const handleSubmit = async () => {
    if (!company.subscription?.subscriptionId) return;

    setSubmitting(true);
    setResult(null);

    try {
      // Create FormData to match the server action signature
      const formData = new FormData();
      formData.append("subscriptionId", company.subscription.subscriptionId);
      formData.append("months", months.toString());
      formData.append("planId", planId.toString());

      // Call the server action directly
      const result = await renewSubscription(formData);

      if (result.success) {
        setResult({
          success: true,
          message: result.message,
        });

        // Call the callback if provided
        if (onRenew) {
          onRenew(company);
        }

        // Close dialog after 2 seconds
        setTimeout(() => {
          onOpenChange(false);
          setSubmitting(false);
          setResult(null);
          // Refresh the page to show updated data
          window.location.reload();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: result.message,
        });
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Error renewing subscription:", error);
      setResult({
        success: false,
        message: "Une erreur s'est produite",
      });
      setSubmitting(false);
    }
  };

  // Calculate subscription status
  const getSubscriptionStatus = () => {
    if (!company.subscription?.endAt) {
      return { isExpired: true, label: "Pas d'abonnement", color: "bg-gray-100 text-gray-700" };
    }

    const today = new Date();
    const endDate = new Date(company.subscription.endAt);
    const isExpired = endDate < today;
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (isExpired) {
      return { 
        isExpired: true, 
        label: "Expiré", 
        color: "bg-red-100 text-red-700",
        daysExpired: Math.abs(daysLeft)
      };
    } else {
      return { 
        isExpired: false, 
        label: "Actif", 
        color: "bg-emerald-100 text-emerald-700",
        daysLeft
      };
    }
  };

  const status = getSubscriptionStatus();
  const newEndDate = calculateNewEndDate();
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renouveler l'abonnement</DialogTitle>
          <DialogDescription>
            Ajoutez des mois à l'abonnement de {company.storeName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Subscription Status Info */}
          <div className={`p-4 rounded-lg ${status.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{status.label}</p>
                <p className="text-sm opacity-90">
                  {status.isExpired ? (
                    <>Expiré depuis {status.daysExpired} jour{status.daysExpired !== 1 ? 's' : ''}</>
                  ) : (
                    <>{status.daysLeft} jour{status.daysLeft !== 1 ? 's' : ''} restant{status.daysLeft !== 1 ? 's' : ''}</>
                  )}
                </p>
              </div>
              {status.isExpired ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
            </div>
            {company.subscription?.endAt && (
              <p className="text-sm mt-2">
                Date d'expiration actuelle : {format(new Date(company.subscription.endAt), "dd MMM yyyy", { locale: fr })}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {/* Current Plan */}
            <div>
              <label className="text-sm font-medium text-gray-700">Plan actuel</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{company.plan?.name || "Pro"}</p>
                <p className="text-sm text-gray-600">
                  {company.plan?.numberOfUsers} utilisateurs • 
                  {company.plan?.price?.toLocaleString() || "25,000"} KMF/mois
                </p>
              </div>
            </div>

            {/* Duration to add */}
            <div>
              <label className="text-sm font-medium text-gray-700">Durée à ajouter (mois)</label>
              <div className="mt-1 flex gap-2">
                {[1, 3, 6, 12].map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={months === value ? "default" : "outline"}
                    onClick={() => setMonths(value)}
                    className="flex-1"
                  >
                    {value} mois
                  </Button>
                ))}
              </div>
            </div>

            {/* Plan selection */}
            <div>
              <label className="text-sm font-medium text-gray-700">Nouveau plan</label>
              <Select value={planId.toString()} onValueChange={(value) => setPlanId(parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionnez un plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Starter (3 users) - 15,000 KMF/mois</SelectItem>
                  <SelectItem value="2">Pro (10 users) - 25,000 KMF/mois</SelectItem>
                  <SelectItem value="3">Entreprise (999 users) - 50,000 KMF/mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* New End Date Preview */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Nouvelle date d'expiration</span>
                <span className="font-bold text-blue-900">
                  {format(newEndDate, "dd MMM yyyy", { locale: fr })}
                </span>
              </div>
              <div className="text-xs text-blue-600">
                {status.isExpired ? (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Renouvellement à partir d'aujourd'hui (abonnement expiré)
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Renouvellement à partir de la date d'expiration actuelle
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Result Message */}
          {result && (
            <div className={`p-4 rounded-lg ${
              result.success 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <p className="font-medium">{result.message}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              onOpenChange(false);
              setResult(null);
              setMonths(1);
            }} disabled={submitting}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !company.subscription?.subscriptionId}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer le renouvellement
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// You need to create these UI components or use your existing ones
