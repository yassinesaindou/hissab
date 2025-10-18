/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { addTransactionAction } from "@/app/actions";

const formSchema = z
  .object({
    productId: z.string().optional(),
    productName: z
      .string()
      .max(100, { message: "Product name must be at most 100 characters." })
      .optional(),
    unitPrice: z
      .number()
      .min(0, { message: "Unit price must be non-negative" })
      .max(1000000, { message: "Unit price too high" }),
    quantity: z
      .number()
      .int({ message: "Quantity must be an integer" })
      .min(1, { message: "Quantity must be at least 1" }),
    type: z.enum(["sale", "credit", "expense"], {
      message: "Invalid transaction type",
    }),
  })
  .refine(
    (data) =>
      data.type === "expense" ||
      (data.productId && data.productId !== "none") ||
      data.productName,
    {
      message:
        "Either a product must be selected or a product name must be provided for sale/credit transactions.",
      path: ["productId"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface AddTransactionFormProps {
  closeDialog: () => void;
  products: { productId: string; name: string; unitPrice: number; stock: number }[];
  onSuccess: (transaction: {
    transactionId: string;
    created_at: string;
    userId: string;
    productId: string | null;
    productName: string | null;
    unitPrice: number;
    totalPrice: number;
    quantity: number;
    type: "sale" | "credit" | "expense";
  }) => void;
}

export default function AddTransactionForm({
  closeDialog,
  products,
  onSuccess,
}: AddTransactionFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      productName: "",
      unitPrice: 0,
      quantity: 1,
      type: "sale",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const formData = {
      productId: values.productId === "none" || !values.productId ? undefined : values.productId,
      productName: values.productName || undefined,
      unitPrice: values.unitPrice,
      quantity: values.quantity,
      type: values.type,
    };

    const result = await addTransactionAction(formData);
    if (result.success) {
      const product = products.find((p) => p.productId === formData.productId);
      const unitPrice = formData.productId && product ? product.unitPrice : formData.unitPrice;
      const newTransaction = {
        transactionId: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        userId: "",
        productId: formData.productId || null,
        productName: formData.productName || (formData.productId ? product?.name : null) || null,
        unitPrice,
        totalPrice: unitPrice * formData.quantity,
        quantity: formData.quantity,
        type: formData.type,
      };
      onSuccess(newTransaction);
      closeDialog();
    } else {
      setError(result.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sale">Vente</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="expense">Depense</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Article (Optionnel)</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedProduct
                        ? products.find((p) => p.productId === selectedProduct)?.name || "Select a product"
                        : "Select a product"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search product..." />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            form.setValue("productId", "");
                            form.setValue("productName", "");
                            form.setValue("unitPrice", 0);
                            setSelectedProduct(null);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !selectedProduct ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None
                        </CommandItem>
                        {products.map((product) => (
                          <CommandItem
                            key={product.productId}
                            value={product.name}
                            onSelect={() => {
                              form.setValue("productId", product.productId);
                              form.setValue("productName", product.name);
                              form.setValue("unitPrice", product.unitPrice);
                              setSelectedProduct(product.productId);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProduct === product.productId ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {product.name} (Stock: {product.stock})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l&apos;article (Optionnel)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Entrez le nom d'un article (optionnel)"
                  {...field}
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unitPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prix Unitaire</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantité</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button
            disabled={form.formState.isSubmitting}
            type="button"
            variant="outline"
            onClick={closeDialog}
          >
            Annuler
          </Button>
          <Button
            disabled={form.formState.isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
            type="submit"
          >
            Ajouter la transaction
          </Button>
        </div>
      </form>
    </Form>
  );
}