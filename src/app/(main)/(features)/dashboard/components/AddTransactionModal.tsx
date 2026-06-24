/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Plus, ScanBarcode, X, RefreshCw, Barcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { createTransaction } from "@/lib/offline/transactionService";

const formSchema = z
  .object({
    productName: z.string().min(1, "Le nom de l'article est requis"),
    productId: z.string().optional(),
    unitPrice: z
      .number()
      .min(0, { message: "Le prix unitaire doit être non-négatif" })
      .max(1000000, { message: "Prix unitaire trop élevé" }),
    quantity: z
      .number()
      .int({ message: "La quantité doit être un entier" })
      .min(1, { message: "La quantité doit être au moins 1" }),
    type: z.enum(["sale", "credit", "expense"], {
      message: "Type de transaction invalide",
    }),
  })
  .refine(
    (data) => data.type === "expense" || data.productName.trim().length > 0,
    {
      message: "Un nom d'article est requis pour les ventes et crédits",
      path: ["productName"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: {
    productId: string;
    name: string;
    unitPrice: number;
    stock: number;
    productCode?: string;
  }[];
  onSuccess: () => void;
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  products,
  onSuccess,
}: AddTransactionModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [productOpen, setProductOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExistingProduct, setIsExistingProduct] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

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
  console.log("Rendering AddTransactionModal with products:", products);

  const productNameValue = form.watch("productName");
  const transactionType = form.watch("type");
  const unitPriceValue = form.watch("unitPrice");
  const quantityValue = form.watch("quantity");
  const totalPrice = unitPriceValue * quantityValue;

  // ── Product search — matches on name OR productCode ──────────────
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const matchesName = product.name.toLowerCase().includes(query);
    const matchesCode = product.productCode
      ? product.productCode.toLowerCase().includes(query)
      : false;
    return matchesName || matchesCode;
  });

  // ── Camera ──────────────────────────────────────────────────────

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
          // normal while no barcode in frame
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
        setScannerError("Erreur: " + (err.message ?? "inconnue"));
      }
    }
  };

  // scannerOpen true → video element is now in DOM → start camera
  // scannerOpen false → kill stream immediately
  useEffect(() => {
    if (scannerOpen) {
      startCamera();
    } else {
      stopStream();
      setScannerError(null);
    }
  }, [scannerOpen]);

  // Modal closed → kill everything
  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setScannerOpen(false);
    }
  }, [isOpen]);

  // Unmount → kill everything
  useEffect(() => () => stopStream(), []);

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const next = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(next);
    startCamera(cameras[next].deviceId);
  };

  // ── Barcode match (camera scan) ────────────────────────────────────

  const handleBarcodeScan = (code: string) => {
    const match = products.find(
      (p) => p.productCode?.toLowerCase() === code.toLowerCase()
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

  // ── Product name watcher ─────────────────────────────────────────
  // Also matches if the typed value is an exact productCode, so pasting
  // a code into the field (without using the scanner) still resolves it.

  useEffect(() => {
    const typed = productNameValue.toLowerCase().trim();
    const exactMatch = products.find(
      (p) =>
        p.name.toLowerCase() === typed ||
        p.productCode?.toLowerCase() === typed
    );
    if (exactMatch) {
      form.setValue("productName", exactMatch.name);
      form.setValue("productId", exactMatch.productId);
      form.setValue("unitPrice", exactMatch.unitPrice);
      setIsExistingProduct(true);
    } else {
      form.setValue("productId", "");
      setIsExistingProduct(false);
    }
  }, [productNameValue, products, form]);

  // ── Submit ───────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const result = await createTransaction({
        productId: values.productId || undefined,
        productName: values.productName,
        unitPrice: values.unitPrice,
        quantity: values.quantity,
        type: values.type as "sale" | "expense" | "credit",
      });

      if (result.success) {
        onSuccess();
        form.reset({
          productName: "",
          productId: "",
          unitPrice: 0,
          quantity: 1,
          type: "sale",
        });
        setIsExistingProduct(false);
        setSearchQuery("");
        setScannerOpen(false);
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout de la transaction");
    }
  };

  useEffect(() => {
    if (productOpen && commandInputRef.current) {
      setTimeout(() => commandInputRef.current?.focus(), 0);
    }
  }, [productOpen]);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Nouvelle Transaction </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Transaction type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de Transaction</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "expense") {
                        form.setValue("productName", "Dépense diverse");
                        form.setValue("unitPrice", 0);
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
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

            {/* Product name + inline scanner */}
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    {transactionType === "expense" ? "Description" : "Article ⬇️"}
                  </FormLabel>

                  {/* Input + scan button row */}
                  <div className="flex gap-2">
                    <Popover open={productOpen} onOpenChange={setProductOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Input
                            placeholder="Nom ou code-barres du produit"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setSearchQuery(e.target.value);
                            }}
                            className="w-full"
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
                            placeholder="Rechercher par nom ou code..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            {searchQuery.trim() && filteredProducts.length === 0 && (
                              <CommandGroup heading="Utiliser ce nom">
                                <CommandItem
                                  onSelect={() => {
                                    form.setValue("productName", searchQuery);
                                    form.setValue("productId", "");
                                    setProductOpen(false);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Plus className="mr-2 h-4 w-4 text-emerald-600" />
                                  <div>
                                    <span className="font-medium">"{searchQuery}"</span>
                                    <span className="text-xs text-gray-500 block">
                                      Utiliser comme nouveau produit
                                    </span>
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
                                    onSelect={() => {
                                      form.setValue("productName", product.name);
                                      form.setValue("productId", product.productId);
                                      form.setValue("unitPrice", product.unitPrice);
                                      setProductOpen(false);
                                    }}
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
                                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                        <span>Stock: {product.stock}</span>
                                        <span>•</span>
                                        <span>{product.unitPrice.toLocaleString()} Fcs</span>
                                        {product.productCode && (
                                          <>
                                            <span>•</span>
                                            <span className="inline-flex items-center gap-0.5 font-mono">
                                              <Barcode className="h-3 w-3" />
                                              {product.productCode}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                            <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                              Tapez un nom ou un code-barres
                            </CommandEmpty>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Toggle scan button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setScannerOpen((v) => !v)}
                      className={cn(
                        "shrink-0 transition-colors",
                        scannerOpen
                          ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      )}
                    >
                      <ScanBarcode className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* ── Inline camera panel ── */}
                  {scannerOpen && (
                    <div
                      className="mt-2 rounded-lg overflow-hidden bg-black"
                      style={{ position: "relative" }}
                    >
                      {/* Top bar */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          zIndex: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 8px",
                          background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
                        }}
                      >
                        <span style={{ color: "white", fontSize: 12 }}>
                          Scanner un code-barres
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {cameras.length > 1 && (
                            <button
                              type="button"
                              onClick={switchCamera}
                              style={{
                                background: "none",
                                border: "none",
                                color: "white",
                                cursor: "pointer",
                                padding: 4,
                                borderRadius: 4,
                              }}
                            >
                              <RefreshCw size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setScannerOpen(false)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "white",
                              cursor: "pointer",
                              padding: 4,
                              borderRadius: 4,
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Video element */}
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        style={{
                          width: "100%",
                          height: 180,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />

                      {/* Scan frame overlay */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "none",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.25)",
                          }}
                        />
                        <div style={{ position: "relative", width: 200, height: 72, zIndex: 10 }}>
                          {/* corners */}
                          <div style={{ position: "absolute", top: 0, left: 0, width: 14, height: 14, borderTop: "2px solid #34d399", borderLeft: "2px solid #34d399", borderRadius: "4px 0 0 0" }} />
                          <div style={{ position: "absolute", top: 0, right: 0, width: 14, height: 14, borderTop: "2px solid #34d399", borderRight: "2px solid #34d399", borderRadius: "0 4px 0 0" }} />
                          <div style={{ position: "absolute", bottom: 0, left: 0, width: 14, height: 14, borderBottom: "2px solid #34d399", borderLeft: "2px solid #34d399", borderRadius: "0 0 0 4px" }} />
                          <div style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderBottom: "2px solid #34d399", borderRight: "2px solid #34d399", borderRadius: "0 0 4px 0" }} />
                          {/* scan line */}
                          <div
                            className="animate-scan"
                            style={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              height: 1,
                              background: "rgba(52,211,153,0.8)",
                              boxShadow: "0 0 6px 2px rgba(52,211,153,0.5)",
                            }}
                          />
                        </div>
                      </div>

                      {/* Bottom bar */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          zIndex: 10,
                          padding: "6px 8px",
                          background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                          textAlign: "center",
                        }}
                      >
                        {scannerError ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <p style={{ color: "#f87171", fontSize: 11, margin: 0 }}>{scannerError}</p>
                            <button
                              type="button"
                              onClick={() => startCamera()}
                              style={{ color: "white", fontSize: 11, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                            >
                              Réessayer
                            </button>
                          </div>
                        ) : (
                          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0 }}>
                            Placez le code-barres dans le cadre
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Product hint */}
                  {field.value && (
                    <div className="mt-1 text-xs">
                      {isExistingProduct ? (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Check className="h-3 w-3" />
                          <span>Produit existant — Prix automatiquement rempli</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Plus className="h-3 w-3" />
                          <span>Nouveau produit — Entrez le prix manuellement</span>
                        </div>
                      )}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price + quantity */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix Unitaire (Fcs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        className={isExistingProduct ? "bg-gray-100 cursor-help" : ""}
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
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Summary */}
            {productNameValue && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <div className="flex justify-between mb-1">
                  <span>Article:</span>
                  <span className="font-medium">{productNameValue}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Prix unitaire:</span>
                  <span className="font-medium">
                    {unitPriceValue.toLocaleString()} Fcs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium text-emerald-600">
                    {totalPrice.toLocaleString()} Fcs
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Ajout en cours..."
                  : "Ajouter la transaction"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}