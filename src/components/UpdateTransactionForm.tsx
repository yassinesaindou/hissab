 
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
import { updateTransactionAction } from "@/app/actions";

const formSchema = z
  .object({
    transactionId: z.string().uuid("L'index de transaction doit être un UUID valide."),
    productId: z.string().optional(),
    productName: z
      .string()
      .max(100, { message: "Le nom de l'artice ne doit pas exéder 100 caractères" })
      .optional(),
    unitPrice: z
      .number()
      .min(0, { message: "Le prix unitaire doit être supérieur ou égal à 0" })
      .max(1000000, { message: "Le prix unitaire doit être inférieur ou égal à 1 000 000" }),
    quantity: z
      .number()
      .int({ message: "La quatité doit être un entier" })
      .min(1, { message: "Le quantité doit être supérieur ou égal à 1" }),
    type: z.enum(["sale", "credit", "expense"], {
      message: "Le type de transaction est invalide",
    }),
  })
  .refine(
    (data) =>
      data.type === "expense" ||
      (data.productId && data.productId !== "none") ||
      data.productName,
    {
      message:
        "Un produit doit être sélectionné ou un nom de produit doit être fourni pour les transactions de vente/crédit.",
      path: ["productId"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface UpdateTransactionFormProps {
  closeDialog: () => void;
  transaction: {
    transactionId: string;
    productId: string | null;
    productName: string | null;
    unitPrice: number;
    quantity: number;
    type: "sale" | "credit" | "expense";
  };
  products: {
    productId: string;
    name: string;
    unitPrice: number;
    stock: number;
  }[];
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

export default function UpdateTransactionForm({
  closeDialog,
  transaction,
  products,
  onSuccess,
}: UpdateTransactionFormProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactionId: transaction.transactionId,
      productId: transaction.productId || "",
      productName: transaction.productName || "",
      unitPrice: transaction.unitPrice,
      quantity: transaction.quantity,
      type: transaction.type,
    },
  });

  const onSubmit = async (values: FormValues) => {
    const formData = {
      transactionId: values.transactionId,
      productId: values.productId === "none" || !values.productId ? undefined : values.productId,
      productName: values.productName || undefined,
      unitPrice: values.unitPrice,
      quantity: values.quantity,
      type: values.type,
    };

    const result = await updateTransactionAction(formData);
    if (result.success) {
      // Construct transaction object for client-side update
      const product = products.find((p) => p.productId === formData.productId);
      const unitPrice = formData.productId && product ? product.unitPrice : formData.unitPrice;
      const updatedTransaction = {
        transactionId: formData.transactionId,
        created_at: new Date().toISOString(), // Approximation; ideally, fetch from server
        userId: "", // Unknown client-side; server sets this
        productId: formData.productId || null,
        productName: formData.productName || (formData.productId ? product?.name : null) || null,
        unitPrice,
        totalPrice: unitPrice * formData.quantity,
        quantity: formData.quantity,
        type: formData.type,
      };
      onSuccess(updatedTransaction);
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
                    <SelectValue placeholder="Choisir un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
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
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value && value !== "none") {
                    const product = products.find((p) => p.productId === value);
                    form.setValue("productName", product?.name || "");
                    form.setValue("unitPrice", product?.unitPrice || 0);
                  } else {
                    form.setValue("productName", "");
                    form.setValue("unitPrice", 0);
                  }
                }}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un article" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.productId} value={product.productId}>
                      {product.name} (Stock: {product.stock})
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
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l&apos;article</FormLabel>
              <FormControl>
                <Input
                  placeholder="Entrez un nom d'article"
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
              <FormLabel>Quantite</FormLabel>
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
          <Button disabled={form.formState.isSubmitting} type="button" variant="outline" onClick={closeDialog}>
            Annuler
          </Button>
          <Button disabled={form.formState.isSubmitting} className="bg-blue-600" type="submit">Mettre à jour</Button>
        </div>
      </form>
    </Form>
  );
}
