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
import { Check, Plus, X } from "lucide-react";
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

  // Watch form values
  const productNameValue = form.watch("productName");
  const transactionType = form.watch("type");
  const unitPriceValue = form.watch("unitPrice");
  const quantityValue = form.watch("quantity");
  
  // Calculate total price
  const totalPrice = unitPriceValue * quantityValue;

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check for existing product match
  useEffect(() => {
    const exactMatch = products.find(p => 
      p.name.toLowerCase() === productNameValue.toLowerCase().trim()
    );
    
    if (exactMatch) {
      form.setValue("productId", exactMatch.productId);
      form.setValue("unitPrice", exactMatch.unitPrice);
      setIsExistingProduct(true);
    } else {
      form.setValue("productId", "");
      setIsExistingProduct(false);
    }
  }, [productNameValue, products, form]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, form]);

  // Auto-set expense product name
  useEffect(() => {
    if (transactionType === "expense") {
      form.setValue("productName", "Dépense diverse");
      form.setValue("unitPrice", 0);
    }
  }, [transactionType, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await addTransactionAction(values);
      if (result.success) {
        setSuccess("Transaction ajoutée avec succès !");
        // Add a small delay before closing to show success message
        setTimeout(() => {
          onSuccess(result.transaction);
          onClose();
        }, 1500);
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

  // Focus command input when popover opens
  useEffect(() => {
    if (productOpen && commandInputRef.current) {
      setTimeout(() => {
        commandInputRef.current?.focus();
      }, 0);
    }
  }, [productOpen]);

  const handleProductSelect = (productName: string, productId?: string, unitPrice?: number) => {
    form.setValue("productName", productName);
    if (productId && unitPrice) {
      form.setValue("productId", productId);
      form.setValue("unitPrice", unitPrice);
      setIsExistingProduct(true);
    } else {
      form.setValue("productId", "");
      setIsExistingProduct(false);
    }
    setProductOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Nouvelle Transaction
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Transaction Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Type de Transaction
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sale" className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        Vente
                      </SelectItem>
                      <SelectItem value="credit" className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        Crédit
                      </SelectItem>
                      <SelectItem value="expense" className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                        Dépense
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Product Selection */}
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    {transactionType === "expense" ? "Description" : "Article"}
                  </FormLabel>
                  <Popover open={productOpen} onOpenChange={setProductOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder={
                              transactionType === "expense" 
                                ? "Description de la dépense"
                                : "Sélectionner ou créer un produit"
                            }
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setSearchQuery(e.target.value);
                            }}
                            className="h-11 pl-3 pr-10"
                            disabled={transactionType === "expense"}
                          />
                          {field.value && !productOpen && (
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange("");
                                setSearchQuery("");
                                form.setValue("productId", "");
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-[var(--radix-popover-trigger-width)] p-0" 
                      align="start"
                    >
                      <Command shouldFilter={false}>
                        <CommandInput 
                          ref={commandInputRef}
                          placeholder="Rechercher un produit..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          {/* New product option */}
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
                                      Nouveau produit - Entrez le prix manuellement
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            </CommandGroup>
                          )}
                          
                          {/* Existing products */}
                          {filteredProducts.length > 0 && (
                            <CommandGroup heading="Produits existants">
                              {filteredProducts.map((product) => (
                                <CommandItem
                                  key={product.productId}
                                  value={product.name}
                                  onSelect={() => handleProductSelect(
                                    product.name,
                                    product.productId,
                                    product.unitPrice
                                  )}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === product.name ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-xs text-gray-500">
                                      Stock: {product.stock} • {product.unitPrice.toLocaleString()} Fcs
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
                  
                  {/* Product info */}
                  {field.value && isExistingProduct && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 text-blue-600">
                        <Check className="h-3 w-3" />
                        <span>Produit existant</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">Prix automatique</span>
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Price and Quantity */}
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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          Fcs
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          className={cn(
                            "h-11 pl-12",
                            isExistingProduct && "bg-gray-50 text-gray-600"
                          )}
                          readOnly={isExistingProduct && transactionType !== "expense"}
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
                      <Input
                        type="number"
                        {...field}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Preview */}
            {productNameValue && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Résumé</span>
                  <div className={`h-2 w-2 rounded-full ${
                    transactionType === 'sale' ? 'bg-emerald-500' :
                    transactionType === 'credit' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Article:</span>
                    <span className="font-medium">{productNameValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prix unitaire:</span>
                    <span className="font-medium">
                      {unitPriceValue.toLocaleString()} Fcs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantité:</span>
                    <span className="font-medium">{quantityValue}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-700 font-medium">Total:</span>
                    <span className="font-bold text-emerald-600 text-lg">
                      {totalPrice.toLocaleString()} Fcs
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Messages */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">{success}</p>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
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
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
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