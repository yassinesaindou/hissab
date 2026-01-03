/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { addTransactionAction } from "../actions/action";
import { createTransactionOfflineFirst } from "@/lib/offline/createTransactionOfflineFirst";

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
    (data) =>
      data.type === "expense" ||
      data.productName.trim().length > 0,
    {
      message: "Un nom d'article est requis pour les ventes et crédits",
      path: ["productName"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: { productId: string; name: string; unitPrice: number; stock: number }[];
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

  // Watch all the form values for real-time updates
  const productNameValue = form.watch("productName");
  const transactionType = form.watch("type");
  const unitPriceValue = form.watch("unitPrice");
  const quantityValue = form.watch("quantity");
  
  // Calculate total price based on watched values
  const totalPrice = unitPriceValue * quantityValue;

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if current input matches any existing product
  useEffect(() => {
    const exactMatch = products.find(p => 
      p.name.toLowerCase() === productNameValue.toLowerCase().trim()
    );
    
    if (exactMatch) {
      // It's an existing product
      form.setValue("productId", exactMatch.productId);
      form.setValue("unitPrice", exactMatch.unitPrice);
      setIsExistingProduct(true);
    } else {
      // It's a new product name
      form.setValue("productId", "");
      setIsExistingProduct(false);
    }
  }, [productNameValue, products, form]);

  const onSubmit = async (values: FormValues) => {
  setError(null);

  try {
    const result = await createTransactionOfflineFirst({
      productId: values.productId || undefined,
      productName: values.productName,
      unitPrice: values.unitPrice,
      quantity: values.quantity,
      type: values.type,
    });

    if (result.success) {
      // Success — refresh dashboard and close modal
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
      onClose();
    }
  } catch (err: any) {
    setError(err.message || "Erreur lors de l'ajout de la transaction");
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Nouvelle Transaction</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de Transaction</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset product for expense type
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
            
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    {transactionType === "expense" ? "Description" : "Article Entrez le nom de l'article ⬇️"}
                  </FormLabel>
                  <Popover open={productOpen} onOpenChange={setProductOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Input
                          placeholder="Sélectionner un produit ou taper un nouveau nom"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setSearchQuery(e.target.value);
                          }}
                          className="w-full"
                        />
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
                      <Command shouldFilter={false}>
                        <CommandInput 
                          ref={commandInputRef}
                          placeholder="Rechercher un produit..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          {/* If user typed something that doesn't match existing products */}
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
                            Tapez le nom d'un produit (nouveau ou existant)
                          </CommandEmpty>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Info about selected product */}
                  {field.value && (
                    <div className="mt-2 text-xs">
                      {isExistingProduct ? (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Check className="h-3 w-3" />
                          <span>Produit existant - Prix automatiquement rempli</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Plus className="h-3 w-3" />
                          <span>Nouveau produit - Entrez le prix manuellement</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                         
                        className={isExistingProduct ? 
                          "bg-gray-100 cursor-help" : ""
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
            </div>
            
            {/* Product info preview - NOW USING WATCHED VALUES */}
            {productNameValue && (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-sm text-gray-700">
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
              </div>
            )}
            
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Ajout en cours..." : "Ajouter la transaction"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}