/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/credits/components/EditCreditModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, User, Package, FileText, ArrowRightCircle } from "lucide-react";
import { updateCreditAction, getCreditItems } from "../actions/action";
import ProductCombobox from "../../invoices/components/ProductCombobox";
import { Credit, Product } from "../types";

const itemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Le nom de l'article est requis"),
  unitPrice: z.coerce.number().min(0, "Le prix doit être positif ou nul"),
  quantity: z.coerce.number().int().min(1, "La quantité doit être au moins 1"),
});

const formSchema = z.object({
  creditId: z.string(),
  customerName: z.string().min(1, "Le nom du client est requis"),
  customerPhone: z.string().min(1, "Le numéro de téléphone est requis"),
  status: z.enum(["pending", "paid"]),
  description: z.string().optional(),
  items: z.array(itemSchema).min(1, "Au moins un article est requis"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  credit: Credit | null;
  products: Product[];
  onSuccess: () => void;
}

export default function EditCreditModal({
  isOpen,
  onClose,
  credit,
  products,
  onSuccess,
}: EditCreditModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creditId: "",
      customerName: "",
      customerPhone: "",
      status: "pending",
      description: "",
      items: [{ productId: "", productName: "", unitPrice: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Load credit + its line items whenever a new credit is opened
  useEffect(() => {
    if (credit && isOpen) {
      setLoadingItems(true);
      getCreditItems(credit.creditId).then((items) => {
        form.reset({
          creditId: credit.creditId,
          customerName: credit.customerName,
          customerPhone: credit.customerPhone,
          status: credit.status,
          description: credit.description || "",
          items:
            items.length > 0
              ? items.map((i) => ({
                  productId: i.productId || "",
                  productName: i.productName,
                  unitPrice: i.unitPrice,
                  quantity: i.quantity,
                }))
              : [{ productId: "", productName: "", unitPrice: credit.amount, quantity: 1 }],
        });
        setLoadingItems(false);
      });
      setError(null);
    }
  }, [credit, isOpen, form]);

  const watchItems = form.watch("items");
  const watchStatus = form.watch("status");
  const totalAmount = watchItems.reduce(
    (sum, i) => sum + (i.unitPrice || 0) * (i.quantity || 1),
    0
  );

  const willConvertToSale = credit?.status !== "paid" && watchStatus === "paid";

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateCreditAction({
        creditId: values.creditId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        status: values.status,
        description: values.description,
        items: values.items.map((i) => ({
          productId: i.productId || undefined,
          productName: i.productName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Une erreur s'est produite");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!credit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Modifier le Crédit
          </DialogTitle>
        </DialogHeader>

        {loadingItems ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Chargement des articles...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="h-4 w-4 text-blue-600" />
                Client
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du Client</FormLabel>
                      <FormControl>
                        <Input placeholder="Entrez le nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="+261 34 00 000 00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Package className="h-4 w-4 text-emerald-600" />
                  Articles
                </div>
                <span className="text-xs text-gray-400">
                  {fields.length} article{fields.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => {
                  const lineTotal =
                    (watchItems[index]?.unitPrice || 0) * (watchItems[index]?.quantity || 1);
                  const hasProductId = !!watchItems[index]?.productId;

                  return (
                    <div
                      key={field.id}
                      className="rounded-lg border border-gray-200 p-3 space-y-3 bg-gray-50/50"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.productId`}
                            render={({ field: productIdField }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Article</FormLabel>
                                <FormControl>
                                  <ProductCombobox
                                    products={products}
                                    value={productIdField.value || ""}
                                    onChange={(productId:any, selectedProduct:any) => {
                                      productIdField.onChange(productId);
                                      if (selectedProduct) {
                                        form.setValue(`items.${index}.productName`, selectedProduct.name);
                                        form.setValue(`items.${index}.unitPrice`, selectedProduct.unitPrice);
                                      } else {
                                        form.setValue(`items.${index}.productId`, "");
                                      }
                                    }}
                                    onCustomProduct={(name :any) => {
                                      form.setValue(`items.${index}.productName`, name);
                                      form.setValue(`items.${index}.unitPrice`, 0);
                                      form.setValue(`items.${index}.productId`, "");
                                    }}
                                    placeholder="Sélectionner ou créer un article"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`items.${index}.productName`}
                            render={({ field }) => (
                              <FormItem className="hidden">
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="h-9 w-9 mt-5 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Prix unitaire</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                                    Fcs
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    className={hasProductId ? "pl-9 bg-gray-100" : "pl-9"}
                                    readOnly={hasProductId}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Quantité</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1.5">Total</p>
                          <div className="h-9 flex items-center justify-center font-medium text-emerald-700 bg-emerald-50 rounded-md border border-emerald-100 text-sm">
                            {lineTotal.toLocaleString()} Fcs
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => append({ productId: "", productName: "", unitPrice: 0, quantity: 1 })}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un article
              </Button>

              <Separator />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Clear warning about what happens on save when marking as paid */}
              {willConvertToSale && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-2.5">
                  <ArrowRightCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-700">
                    En enregistrant, ce crédit sera <strong>retiré de la liste des crédits</strong> et
                    enregistré comme une <strong>vente</strong> dans les transactions. Cette action est définitive.
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Note (Optionnel)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ajoutez une note..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">Montant total du crédit</span>
                <span className="text-lg font-bold text-blue-800">
                  {totalAmount.toLocaleString()} Fcs
                </span>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className={
                    willConvertToSale
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  }
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Mise à jour en cours..."
                    : willConvertToSale
                    ? "Marquer payé et transférer"
                    : "Mettre à jour"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}