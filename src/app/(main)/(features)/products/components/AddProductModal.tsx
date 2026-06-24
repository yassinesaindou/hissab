/* eslint-disable @typescript-eslint/no-explicit-any */
// app/products/components/AddProductModal.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { createProductAction } from "../actions/actions";
import { Barcode, Sparkles, Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import EAN13Barcode from "./Ean13Barcode";
import { isValidEAN13 } from "@/lib/utils/ean13";

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  stock: z.coerce.number().min(0, "Le stock ne peut pas être négatif"),
  unitPrice: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
  category: z.string().optional(),
  description: z.string().optional(),
  productCode: z
    .string()
    .regex(/^\d{13}$/, { message: "Le code EAN-13 doit contenir exactement 13 chiffres." })
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

type FormValues = z.infer<typeof formSchema>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: any) => void;
}

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", stock: 0, unitPrice: 0, category: "", description: "", productCode: "" },
  });

  const productCodeValue = form.watch("productCode") ?? "";
  const nameValue = form.watch("name");

  const handleClose = () => {
    form.reset();
    setError(null);
    onClose();
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("stock", data.stock.toString());
      fd.append("unitPrice", data.unitPrice.toString());
      if (data.category) fd.append("category", data.category);
      if (data.description) fd.append("description", data.description);
      if (data.productCode) fd.append("productCode", data.productCode);

      const result = await createProductAction(fd);
      if (result.success && result.product) {
        onSuccess(result.product);
        handleClose();
      } else {
        setError(result.message);
      }
    } catch {
      setError("Une erreur s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <SheetHeader className="space-y-1 text-left">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Package className="h-4 w-4 text-white" />
              </div>
              <SheetTitle className="text-base font-semibold">Nouvel article</SheetTitle>
            </div>
            <SheetDescription className="text-xs text-gray-400">
              Remplissez les informations ci-dessous. Le code EAN-13 sera généré si laissé vide.
            </SheetDescription>
          </SheetHeader>
        </div>

        <Separator />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Form {...form}>
            <form id="add-product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Name */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Nom *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Coca-Cola 33cl" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              {/* Stock + Price side by side */}
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Stock *
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} className="h-9 text-sm" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="unitPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Prix *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Fcs</span>
                        <Input type="number" step="0.01" {...field} className="h-9 pl-9 text-sm" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>

              {/* Category */}
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Catégorie
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Boissons" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              {/* Description */}
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Optionnel" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <Separator />

              {/* EAN-13 */}
              <FormField control={form.control} name="productCode" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    <Barcode className="h-3.5 w-3.5" />
                    Code EAN-13
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Laissez vide → auto"
                        {...field}
                        value={field.value ?? ""}
                        maxLength={13}
                        inputMode="numeric"
                        className="h-9 text-sm font-mono tracking-widest pr-12"
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                      />
                      {field.value && (
                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium tabular-nums ${
                          field.value.length === 13 ? "text-emerald-600" : "text-amber-500"
                        }`}>
                          {field.value.length}/13
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />

                  {/* Barcode preview card — only shown for a structurally valid AND checksum-valid code */}
                  {productCodeValue.length === 13 ? (
                    isValidEAN13(productCodeValue) ? (
                      <div className="mt-2 rounded-lg border border-indigo-100 bg-white px-3 py-2.5 flex items-center gap-3">
                        <EAN13Barcode code={productCodeValue} unitWidth={1.4} height={32} showText={false} />
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold text-gray-800 tracking-wider truncate">
                            {productCodeValue[0]} · {productCodeValue.slice(1,7)} · {productCodeValue.slice(7)}
                          </p>
                          <p className="text-[10px] text-emerald-500 mt-0.5">✓ EAN-13 valide — scannable</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                        <p className="text-xs text-amber-700">
                          ⚠ Checksum invalide pour un EAN-13. Ce code ne sera pas lisible par un scanner. Laissez le champ vide pour en générer un automatiquement.
                        </p>
                      </div>
                    )
                  ) : !field.value ? (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
                      <Sparkles className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-400">Code généré automatiquement à la création</p>
                    </div>
                  ) : null}
                </FormItem>
              )} />

              {/* Live summary */}
              {nameValue && (
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Résumé</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Article</span>
                    <span className="font-medium text-gray-900 truncate max-w-[160px]">{nameValue}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stock</span>
                    <span className="font-medium">{form.watch("stock")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Prix</span>
                    <span className="font-semibold text-emerald-600">
                      {(form.watch("unitPrice") ?? 0).toLocaleString()} Fcs
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* Footer */}
        <Separator />
        <div className="px-5 py-4 flex gap-2.5">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1 h-9 text-sm" disabled={isSubmitting}>
            Annuler
          </Button>
          <Button form="add-product-form" type="submit" className="flex-1 h-9 text-sm bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting
              ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />Création...</>
              : "Créer l'article"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}