/* eslint-disable @typescript-eslint/no-explicit-any */
// app/transactions/components/AddTransactionModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Check, Plus, RefreshCw, ScanBarcode, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addTransactionAction } from "../actions";

const formSchema = z.object({
  productName: z.string().min(1, "Le nom de l'article est requis"),
  productId: z.string().optional(),
  unitPrice: z.coerce
    .number()
    .min(0, { message: "Le prix unitaire doit être non-négatif" })
    .max(1000000, { message: "Prix unitaire trop élevé" }),
  quantity: z.coerce
    .number()
    .int({ message: "La quantité doit être un entier" })
    .min(1, { message: "La quantité doit être au moins 1" }),
  type: z.enum(["sale", "credit", "expense"], {
    message: "Type de transaction invalide",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSuccess: (transaction: any) => void;
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  products,
  onSuccess,
}: AddTransactionModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [productOpen, setProductOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExistingProduct, setIsExistingProduct] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Scanner state ──────────────────────────────────────────────────────────
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Track whether user has intentionally changed the product name, so the
  // auto-fill effect doesn't overwrite an already-valid price on open.
  const userEditedProduct = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      productId: "",
      unitPrice: 0,
      quantity: 1,
      type: "sale",
    },
  });

  const productNameValue = form.watch("productName");
  const transactionType = form.watch("type");
  const unitPriceValue = form.watch("unitPrice");
  const quantityValue = form.watch("quantity");
  const totalPrice = (unitPriceValue ?? 0) * (quantityValue ?? 1);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      userEditedProduct.current = false;
      form.reset({
        productName: "",
        productId: "",
        unitPrice: 0,
        quantity: 1,
        type: "sale",
      });
      setError(null);
      setSuccess(null);
      setIsExistingProduct(false);
      setSearchQuery("");
      setScannerOpen(false);
    }
  }, [isOpen, form]);

  // ── Auto-set expense label ─────────────────────────────────────────────────
  useEffect(() => {
    if (transactionType === "expense") {
      form.setValue("productName", "Dépense diverse");
      form.setValue("unitPrice", 0);
      setIsExistingProduct(false);
    }
  }, [transactionType, form]);

  // ── Auto-fill price from catalogue when user types a matching name ─────────
  useEffect(() => {
    if (!userEditedProduct.current) return;
    const match = products.find(
      (p) => p.name.toLowerCase() === productNameValue.toLowerCase().trim()
    );
    if (match) {
      form.setValue("productId", match.productId);
      form.setValue("unitPrice", match.unitPrice);
      setIsExistingProduct(true);
    } else {
      form.setValue("productId", "");
      setIsExistingProduct(false);
    }
  }, [productNameValue, products, form]);

  // ── Focus command input when popover opens ────────────────────────────────
  useEffect(() => {
    if (productOpen && commandInputRef.current) {
      setTimeout(() => commandInputRef.current?.focus(), 0);
    }
  }, [productOpen]);

  // ── Camera helpers ─────────────────────────────────────────────────────────
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
  };

  const startCamera = async (deviceId?: string) => {
    if (!videoRef.current) return;
    setScannerError(null);
    stopStream();

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setScannerError("Caméra non supportée par ce navigateur.");
        return;
      }

      const constraints: MediaStreamConstraints = deviceId
        ? { video: { deviceId: { exact: deviceId } } }
        : { video: { facingMode: { ideal: "environment" } } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const vids = all.filter((d) => d.kind === "videoinput");
        if (vids.length > 0) setCameras(vids);
      } catch {
        // non-fatal
      }

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      reader.decodeFromStream(stream, videoRef.current, (result, err) => {
        if (result) {
          const code = result.getText();
          stopStream();
          setScannerOpen(false);
          handleBarcodeScan(code);
        }
        if (err && !(err instanceof NotFoundException)) {
          // normal while no barcode in frame — ignore
        }
      });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setScannerError("Accès refusé — autorisez la caméra dans les paramètres.");
      } else if (err.name === "NotFoundError") {
        setScannerError("Aucune caméra trouvée.");
      } else if (err.name === "NotReadableError") {
        setScannerError("Caméra déjà utilisée par une autre application.");
      } else {
        setScannerError("Erreur : " + (err.message ?? "inconnue"));
      }
    }
  };

  // Scanner open → start; closed → stop
  useEffect(() => {
    if (scannerOpen) {
      startCamera();
    } else {
      stopStream();
      setScannerError(null);
    }
  }, [scannerOpen]);

  // Modal closed → stop everything
  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setScannerOpen(false);
    }
  }, [isOpen]);

  // Unmount → stop everything
  useEffect(() => () => stopStream(), []);

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const next = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(next);
    startCamera(cameras[next].deviceId);
  };

  // ── Barcode match ──────────────────────────────────────────────────────────
  const handleBarcodeScan = (code: string) => {
    userEditedProduct.current = true;
    const match = products.find(
      (p) => (p as any).productCode?.toLowerCase() === code.toLowerCase()
    );
    if (match) {
      form.setValue("productName", match.name);
      form.setValue("productId", match.productId);
      form.setValue("unitPrice", match.unitPrice);
      setIsExistingProduct(true);
      setSearchQuery(match.name);
    } else {
      form.setValue("productName", code);
      form.setValue("productId", "");
      setIsExistingProduct(false);
      setSearchQuery(code);
    }
  };

  // ── Product select from dropdown ───────────────────────────────────────────
  const handleProductSelect = (
    productName: string,
    productId?: string,
    unitPrice?: number
  ) => {
    userEditedProduct.current = true;
    form.setValue("productName", productName);
    if (productId && unitPrice !== undefined) {
      form.setValue("productId", productId);
      form.setValue("unitPrice", unitPrice);
      setIsExistingProduct(true);
    } else {
      form.setValue("productId", "");
      setIsExistingProduct(false);
    }
    setProductOpen(false);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await addTransactionAction(values);
      if (result.success) {
        setSuccess("Transaction ajoutée avec succès !");
        setTimeout(() => {
          onSuccess(result.transaction);
          onClose();
        }, 1200);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Une erreur s'est produite. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Nouvelle Transaction
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Type ──────────────────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Type de Transaction
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sale">Vente</SelectItem>
                      <SelectItem value="credit">Crédit</SelectItem>
                      <SelectItem value="expense">Dépense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Product / Description ──────────────────────────────────── */}
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    {transactionType === "expense" ? "Description" : "Article"}
                  </FormLabel>

                  {/* Input row with scanner button */}
                  <div className="flex gap-2">
                    <Popover open={productOpen} onOpenChange={setProductOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Input
                            placeholder={
                              transactionType === "expense"
                                ? "Description de la dépense"
                                : "Sélectionner ou créer un produit"
                            }
                            {...field}
                            onChange={(e) => {
                              userEditedProduct.current = true;
                              field.onChange(e.target.value);
                              setSearchQuery(e.target.value);
                            }}
                            className="h-11"
                            disabled={transactionType === "expense"}
                          />
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="p-0"
                        align="start"
                        style={{ width: "var(--radix-popover-trigger-width)" }}
                      >
                        <Command shouldFilter={false}>
                          <CommandInput
                            ref={commandInputRef}
                            placeholder="Rechercher un produit..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            {searchQuery.trim() && (
                              <CommandGroup heading="Créer nouveau">
                                <CommandItem
                                  onSelect={() => handleProductSelect(searchQuery)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                                      <Plus className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{searchQuery}</div>
                                      <div className="text-xs text-gray-500">
                                        Nouveau produit — entrez le prix manuellement
                                      </div>
                                    </div>
                                  </div>
                                </CommandItem>
                              </CommandGroup>
                            )}
                            {filteredProducts.length > 0 && (
                              <CommandGroup heading="Produits existants">
                                {filteredProducts.map((product) => (
                                  <CommandItem
                                    key={product.productId}
                                    value={product.name}
                                    onSelect={() =>
                                      handleProductSelect(
                                        product.name,
                                        product.productId,
                                        product.unitPrice
                                      )
                                    }
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === product.name
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-xs text-gray-500">
                                        Stock: {product.stock} •{" "}
                                        {product.unitPrice.toLocaleString()} Fcs
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                            <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                              Aucun produit trouvé. Tapez pour créer un nouveau.
                            </CommandEmpty>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Barcode scan toggle — hidden for expenses */}
                    {transactionType !== "expense" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setScannerOpen((v) => !v)}
                        className={cn(
                          "h-11 w-11 shrink-0 transition-colors",
                          scannerOpen
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                            : "border-gray-300 text-gray-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                        )}
                        title="Scanner un code-barres"
                      >
                        <ScanBarcode className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* ── Inline camera panel ────────────────────────────── */}
                  {scannerOpen && (
                    <div className="mt-2 rounded-xl overflow-hidden bg-black relative">
                      {/* Top bar */}
                      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2"
                        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)" }}>
                        <span className="text-white text-xs font-medium">Scanner un code-barres</span>
                        <div className="flex gap-1">
                          {cameras.length > 1 && (
                            <button
                              type="button"
                              onClick={switchCamera}
                              className="text-white p-1 rounded hover:bg-white/10 transition-colors"
                              title="Changer de caméra"
                            >
                              <RefreshCw size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setScannerOpen(false)}
                            className="text-white p-1 rounded hover:bg-white/10 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Video */}
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full block"
                        style={{ height: 190, objectFit: "cover" }}
                      />

                      {/* Scan frame overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="absolute inset-0 bg-black/25" />
                        <div className="relative w-52 h-20 z-10">
                          {/* Corner marks */}
                          {[
                            "top-0 left-0 border-t-2 border-l-2 rounded-tl",
                            "top-0 right-0 border-t-2 border-r-2 rounded-tr",
                            "bottom-0 left-0 border-b-2 border-l-2 rounded-bl",
                            "bottom-0 right-0 border-b-2 border-r-2 rounded-br",
                          ].map((cls, i) => (
                            <div
                              key={i}
                              className={`absolute w-4 h-4 border-emerald-400 ${cls}`}
                            />
                          ))}
                          {/* Animated scan line */}
                          <div
                            className="absolute left-0 right-0 h-px bg-emerald-400 animate-bounce"
                            style={{ boxShadow: "0 0 8px 2px rgba(52,211,153,0.6)", top: "50%" }}
                          />
                        </div>
                      </div>

                      {/* Bottom bar */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 text-center px-3 py-2"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }}>
                        {scannerError ? (
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-red-400 text-xs">{scannerError}</p>
                            <button
                              type="button"
                              onClick={() => startCamera()}
                              className="text-white text-xs underline"
                            >
                              Réessayer
                            </button>
                          </div>
                        ) : (
                          <p className="text-white/60 text-xs">
                            Placez le code-barres dans le cadre
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Product status hint */}
                  {field.value && !scannerOpen && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                      {isExistingProduct ? (
                        <>
                          <Check className="h-3 w-3 text-blue-600" />
                          <span className="text-blue-600">Produit existant</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">Prix automatique</span>
                        </>
                      ) : field.value.trim() ? (
                        <>
                          <Plus className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Nouveau produit</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">Entrez le prix manuellement</span>
                        </>
                      ) : null}
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── Price & Quantity ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Prix Unitaire (Fcs)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          Fcs
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          className={cn(
                            "h-11 pl-12",
                            isExistingProduct && transactionType !== "expense"
                              ? "bg-gray-50 text-gray-600"
                              : ""
                          )}
                          readOnly={
                            isExistingProduct && transactionType !== "expense"
                          }
                        />
                      </div>
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
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Quantité
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Summary preview ────────────────────────────────────────── */}
            {productNameValue && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Résumé</span>
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      transactionType === "sale"
                        ? "bg-emerald-500"
                        : transactionType === "credit"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    )}
                  />
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Article</span>
                    <span className="font-medium">{productNameValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Prix unitaire</span>
                    <span className="font-medium">
                      {(unitPriceValue ?? 0).toLocaleString()} Fcs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantité</span>
                    <span className="font-medium">{quantityValue}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-700">Total</span>
                    <span className="font-bold text-emerald-600 text-base">
                      {totalPrice.toLocaleString()} Fcs
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Error / success banners ────────────────────────────────── */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* ── Actions ───────────────────────────────────────────────── */}
            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 px-6"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Ajout en cours...
                  </>
                ) : (
                  "Ajouter la transaction"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}