// app/products/components/UpdateProductModal.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { updateProductAction, Product } from "../actions/actions";
import { Barcode, Copy, Check, Edit3, Printer } from "lucide-react";
import EAN13Barcode from "./Ean13Barcode";
import { isValidEAN13, encodeEAN13, bitsToBars } from "@/lib/utils/ean13";

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

interface UpdateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: (product: Product) => void;
}

export default function UpdateProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: UpdateProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      stock: 0,
      unitPrice: 0,
      category: "",
      description: "",
      productCode: "",
    },
  });

  const productCodeValue = form.watch("productCode") ?? "";
  const nameValue = form.watch("name");

  useEffect(() => {
    if (product && isOpen) {
      form.reset({
        name: product.name || "",
        stock: product.stock || 0,
        unitPrice: product.unitPrice || 0,
        category: product.category || "",
        description: product.description || "",
        productCode: product.productCode || "",
      });
      setError(null);
      setCopied(false);
    }
  }, [product, isOpen, form]);

  const handleClose = () => {
    setError(null);
    setCopied(false);
    onClose();
  };

  const handleCopy = () => {
    if (!productCodeValue) return;
    navigator.clipboard.writeText(productCodeValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  // Opens a print window with a real, scannable EAN-13 label —
  // same encoder/logic as ProductDetailSheet, so what you preview here
  // is exactly what gets printed.
  const handlePrint = () => {
    const code = productCodeValue;
    if (!code || !isValidEAN13(code) || !product) return;

    const printWindow = window.open("", "_blank", "width=420,height=320");
    if (!printWindow) return;

    const bits = encodeEAN13(code);
    const bars = bitsToBars(bits);
    const unitWidth = 2.6;
    const barHeight = 70;
    const quietZone = 10 * unitWidth;

    let x = quietZone;
    const rects: string[] = [];
    for (const bar of bars) {
      const w = bar.width * unitWidth;
      if (bar.isBar) rects.push(`<rect x="${x}" y="0" width="${w}" height="${barHeight}" fill="#000"/>`);
      x += w;
    }
    const svgWidth = x + quietZone;
    const barcodeSvg = `<svg viewBox="0 0 ${svgWidth} ${barHeight}" width="${svgWidth}" height="${barHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="${svgWidth}" height="${barHeight}" fill="#fff"/>${rects.join("")}</svg>`;
    const formatted = `${code[0]} ${code.slice(1, 7)} ${code.slice(7)}`;
    const name = form.watch("name") || product.name;
    const price = form.watch("unitPrice") ?? product.unitPrice;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Étiquette — ${name}</title>
          <style>
            @page { size: 70mm 40mm; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, Helvetica, Arial, sans-serif;
              width: 70mm; height: 40mm;
              display: flex; flex-direction: column;
              align-items: center; justify-content: center;
              padding: 4mm; gap: 1.5mm;
            }
            .name { font-size: 11px; font-weight: 700; text-align: center; max-width: 62mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .price { font-size: 13px; font-weight: 800; color: #047857; }
            svg { max-width: 62mm; height: auto; }
            .code { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 2px; font-weight: 600; }
            @media print { html, body { width: 70mm; height: 40mm; } }
          </style>
        </head>
        <body onload="window.print(); window.onafterprint = () => window.close();">
          
          <div class="price">${price.toLocaleString()} Fcs</div>
          ${barcodeSvg}
          <div class="code">${formatted}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const onSubmit = async (data: FormValues) => {
    if (!product) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("productId", product.productId);
      fd.append("name", data.name);
      fd.append("stock", data.stock.toString());
      fd.append("unitPrice", data.unitPrice.toString());
      if (data.category) fd.append("category", data.category);
      if (data.description) fd.append("description", data.description);
      if (data.productCode) fd.append("productCode", data.productCode);

      const result = await updateProductAction(fd);

      if (result.success && result.product) {
        onSuccess(result.product);
        handleClose();
      } else {
        setError(result.message || "Une erreur s'est produite");
      }
    } catch (err) {
      setError("Une erreur s'est produite");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <SheetHeader className="space-y-1 text-left">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Edit3 className="h-4 w-4 text-white" />
              </div>
              <SheetTitle className="text-base font-semibold">Modifier l&apos;article</SheetTitle>
            </div>
            <SheetDescription className="text-xs text-gray-400 truncate">
              {product.name}
            </SheetDescription>
          </SheetHeader>
        </div>

        <Separator />

        {/* Scrollable body */}
        <div className="flex-1  overflow-y-auto px-5 py-4">
          <Form {...form}>
            <form id="update-product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Name */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Nom *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de l'article" {...field} className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              {/* Stock + Price */}
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
                        {...field}
                        value={field.value ?? ""}
                        maxLength={13}
                        inputMode="numeric"
                        className="h-9 text-sm font-mono tracking-widest pr-20"
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {field.value && (
                          <span className={`text-xs font-medium tabular-nums ${
                            field.value.length === 13 ? "text-emerald-600" : "text-amber-500"
                          }`}>
                            {field.value.length}/13
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleCopy}
                          disabled={!field.value || field.value.length !== 13}
                          className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                          title="Copier le code"
                        >
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                  <p className="text-[11px] text-gray-400">
                    Modifiez uniquement si nécessaire — doit rester unique dans votre boutique.
                  </p>

                  {/* Barcode preview — real, scannable encoding */}
                  {productCodeValue.length === 13 ? (
                    isValidEAN13(productCodeValue) ? (
                      <div className="mt-2 rounded-lg border border-gray-100 bg-white px-3 py-2.5 flex items-center gap-3">
                        <EAN13Barcode code={productCodeValue} unitWidth={1.4} height={32} showText={false} />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs font-bold text-gray-800 tracking-wider truncate">
                            {productCodeValue[0]} · {productCodeValue.slice(1, 7)} · {productCodeValue.slice(7)}
                          </p>
                          <p className="text-[10px] text-emerald-500 mt-0.5">✓ EAN-13 valide — scannable</p>
                        </div>
                        <button
                          type="button"
                          onClick={handlePrint}
                          className="shrink-0 text-gray-400 hover:text-indigo-600 transition-colors p-1"
                          title="Imprimer l'étiquette"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                        <p className="text-xs text-amber-700">
                          ⚠ Checksum invalide. Ce code ne sera pas lisible par un scanner.
                        </p>
                      </div>
                    )
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
          <Button form="update-product-form" type="submit" className="flex-1 h-9 text-sm bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting
              ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />Mise à jour...</>
              : "Mettre à jour"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}