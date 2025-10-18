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
import { updateSubscription } from "@/app/actions";
import { ArrowUpDown } from "lucide-react";

type ProfileWithSubscription = {
  userId: string;
  name: string | null;
  phoneNumber: string | null;
  subscriptionId: string | null;
  created_at: string | null;
  updatedAt: string | null;
  endAt: string | null;
  daysLeft: number;
};

const subscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "Please select a client"),
  months: z
    .number({ invalid_type_error: "Months must be a number" })
    .min(1, "Months must be at least 1")
    .max(12, "Months cannot exceed 12"),
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
    defaultValues: { subscriptionId: "", months: 1 },
  });

  const columns: ColumnDef<ProfileWithSubscription>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }>
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => row.original.name || "N/A",
      },
      {
        accessorKey: "phoneNumber",
        header: "Phone Number",
        cell: ({ row }) => row.original.phoneNumber || "N/A",
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }>
            Started
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) =>
          row.original.created_at
            ? new Date(row.original.created_at).toLocaleDateString()
            : "N/A",
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }>
            Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) =>
          row.original.updatedAt
            ? new Date(row.original.updatedAt).toLocaleDateString()
            : "N/A",
      },
      {
        accessorKey: "endAt",
        header: "Ends",
        cell: ({ row }) =>
          row.original.endAt
            ? new Date(row.original.endAt).toLocaleDateString()
            : "N/A",
      },
      {
        accessorKey: "daysLeft",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }>
            Days Left
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => row.original.daysLeft,
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
    globalFilterFn: (row, columnId, filterValue) => {
      const name = row.getValue("name") as string | null;
      return name
        ? name.toLowerCase().includes(filterValue.toLowerCase())
        : false;
    },
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

    const result = await updateSubscription(formData);
    setResultMessage(result.message);
    setIsResultOpen(true);

    if (result.success) {
      form.reset();
      setTimeout(() => window.location.reload(), 1000);
    }

    setPendingData(null);
  };

  return (
    <>
      {/* Profiles Table Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          User Profiles
        </h2>
        <div className="mb-4">
          <Input
            placeholder="Search by name..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="rounded-md border">
         <Table>
  <TableHeader className="bg-blue-200 hover:bg-blue-300">
    {table.getHeaderGroups().map((headerGroup) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => (
          <TableHead key={header.id} className="bg-blue-200 hover:bg-blue-300">
            {flexRender(header.column.columnDef.header, header.getContext())}
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
          className="odd:bg-white even:bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-24 text-center">
          No results.
        </TableCell>
      </TableRow>
    )}
  </TableBody>
</Table>
        </div>
      </div>

      {/* Divider */}
      <hr className="my-6 border-gray-200" />

      {/* Subscription Update Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Update Subscription
        </h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4  flex justify-between">
            <FormField
              control={form.control}
              name="subscriptionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select a client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profiles
                        .filter((p) => p.subscriptionId)
                        .map((p) => (
                          <SelectItem key={p.userId} value={p.subscriptionId!}>
                            {p.name || "Unnamed"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Months to Extend</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))} // Convert string to number
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-gray-100"
                disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Updating..."
                  : "Update Subscription"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subscription Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to extend the subscription by{" "}
              {pendingData?.months || 0} month(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-gray-100"
              onClick={confirmUpdate}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Result</DialogTitle>
            <DialogDescription>{resultMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-gray-100"
              onClick={() => setIsResultOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
