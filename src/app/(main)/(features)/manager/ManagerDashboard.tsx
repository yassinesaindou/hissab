// components/ManagerDashboard.tsx
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ColumnDef,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateSubscription } from "@/app/actions";
import {
  ArrowUpDown,
  Calendar,
  Clock,
  User,
  Zap,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import clsx from "clsx";

type ProfileWithSubscription = {
  userId: string;
  name: string | null;
  phoneNumber: string | null;
  subscriptionId: string | null;
  endAt: string | null;
  daysLeft: number;
  planId: number | null;
  planName: "starter" | "pro" | "entreprise" | null;
  maxUsers: number;
};

const subscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "Sélectionnez un client"),
  months: z
    .number({ invalid_type_error: "Nombre requis" })
    .min(1, "Min 1 mois")
    .max(12, "Max 12 mois"),
  planId: z.coerce.number().int().min(1).max(3),
});

type SubscriptionForm = z.infer<typeof subscriptionSchema>;

export default function ManagerDashboard({
  profiles,
}: {
  profiles: ProfileWithSubscription[];
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [pendingData, setPendingData] = useState<SubscriptionForm | null>(null);

  const form = useForm<SubscriptionForm>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: { subscriptionId: "", months: 1, planId: 2 },
  });

  const columns: ColumnDef<ProfileWithSubscription>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium"
          >
            <User className="mr-1 h-4 w-4" />
            Nom
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name || "Anonyme"}</div>
        ),
      },
      {
        accessorKey: "planName",
        header: "Plan",
        cell: ({ row }) => {
          const planName = row.original.planName;
          const maxUsers = row.original.maxUsers;

          if (!planName) {
            return <span className="text-xs text-gray-400">—</span>;
          }

          const colors: Record<string, string> = {
            starter: "bg-gray-100 text-gray-700",
            pro: "bg-blue-100 text-blue-700",
            entreprise: "bg-purple-100 text-purple-700",
          };

          return (
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[planName]}`}
              >
                {planName.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">
                ({maxUsers} {maxUsers === 1 ? "user" : "users"})
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "endAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <Calendar className="mr-1 h-4 w-4" />
            Fin
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) =>
          row.original.endAt
            ? new Date(row.original.endAt).toLocaleDateString("fr-FR")
            : "—",
      },
      {
        accessorKey: "daysLeft",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <Clock className="mr-1 h-4 w-4" />
            Jours restants
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const days = row.original.daysLeft;
          return (
            <span
              className={`font-medium ${
                days <= 7
                  ? "text-red-600"
                  : days <= 30
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {days}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: profiles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  const onSubmit = (data: SubscriptionForm) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const confirmUpdate = async () => {
    if (!pendingData) return;
    setIsConfirmOpen(false);

    const formData = new FormData();
    formData.append("subscriptionId", pendingData.subscriptionId);
    formData.append("months", pendingData.months.toString());
    formData.append("planId", pendingData.planId.toString());

    const result = await updateSubscription(formData);
    setResultMessage(result.message);
    setIsResultOpen(true);

    if (result.success) {
      form.reset();
      setTimeout(() => window.location.reload(), 1200);
    }
    setPendingData(null);
  };

  return (
    <div className="space-y-8">
      {/* Table Card */}
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Abonnements Actifs
          </h2>
          <Input
            placeholder="Rechercher un client..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-xs border-gray-300 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-gray-700 font-semibold"
                    >
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
                    className="hover:bg-blue-50/50 transition-colors duration-200"
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
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-gray-500"
                  >
                    Aucun abonnement trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Update Form */}
      <div className="bg-gradient-to-br from-rose-500 to-indigo-600 text-white p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Zap className="h-6 w-6" />
          Mettre à jour un abonnement
        </h2>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Searchable Combobox */}
            <FormField
              control={form.control}
              name="subscriptionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/90">Client</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={clsx(
                            "w-full justify-between bg-white/10 border-white/20 text-white hover:bg-white/20",
                            !field.value && "text-white/50"
                          )}
                        >
                          {field.value
                            ? profiles.find(
                                (p) => p.subscriptionId === field.value
                              )?.name || "Client inconnu"
                            : "Rechercher un client..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Nom ou téléphone..." />
                        <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {profiles
                            .filter((p) => p.subscriptionId)
                            .map((p) => (
                              <CommandItem
                                key={p.userId}
                                value={`${p.name} ${p.phoneNumber}`}
                                onSelect={() => {
                                  form.setValue("subscriptionId", p.subscriptionId!);
                                }}
                              >
                                <Check
                                  className={clsx(
                                    "mr-2 h-4 w-4",
                                    p.subscriptionId === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div>
                                  <div className="font-medium">
                                    {p.name || "Anonyme"}
                                  </div>
                                  <div className="text-xs text-gray-300">
                                    {p.phoneNumber}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan Select */}
            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/90">Plan</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Choisir un plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Starter (3 users)</SelectItem>
                      <SelectItem value="2">Pro (10 users)</SelectItem>
                      <SelectItem value="3">Entreprise (999 users)</SelectItem>
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
                <FormItem className="md:col-span-1">
                  <FormLabel className="text-white/90">Mois à ajouter</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-3 flex justify-end">
              <Button
                type="submit"
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-medium shadow-lg"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Mise à jour..."
                  : "Mettre à jour"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Confirmation */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer</DialogTitle>
            <DialogDescription>
              Étendre de <strong>{pendingData?.months} mois</strong> vers le plan{" "}
              <strong className="uppercase">
                {pendingData?.planId === 1
                  ? "Starter"
                  : pendingData?.planId === 2
                  ? "Pro"
                  : "Entreprise"}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmUpdate} className="bg-blue-600 hover:bg-blue-700">
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résultat</DialogTitle>
            <DialogDescription>{resultMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsResultOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}