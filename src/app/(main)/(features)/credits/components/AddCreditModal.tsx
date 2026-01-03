/* eslint-disable react/no-unescaped-entities */
// app/credits/components/AddCreditModal.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addCreditAction } from "../actions/action";

const formSchema = z.object({
  customerName: z.string().min(1, "Le nom du client est requis"),
  customerPhone: z.string().min(1, "Le numéro de téléphone est requis"),
  productId: z.string().optional(),
  productName: z.string().optional(),
  amount: z.number().min(1, "Le montant doit être positif"),
  quantity: z.number().min(1, "La quantité doit être au moins 1"),
  status: z.enum(["pending", "paid"]).default("pending"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: { productId: string; name: string; unitPrice: number; stock: number }[];
  onSuccess: () => void;
}

export default function AddCreditModal({
  isOpen,
  onClose,
  products,
  onSuccess,
}: AddCreditModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [productOpen, setProductOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExistingProduct, setIsExistingProduct] = useState(false);
  const commandInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      productId: "",
      productName: "",
      amount: 0,
      quantity: 1,
      status: "pending",
      description: "",
    },
  });

  // Watch values for real-time updates
  const productNameValue = form.watch("productName");
  const quantityValue = form.watch("quantity");
  

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if current input matches any existing product
  useEffect(() => {
    const exactMatch = products.find(p => 
      p.name.toLowerCase() === productNameValue?.toLowerCase().trim()
    );
    
    if (exactMatch) {
      form.setValue("productId", exactMatch.productId);
      form.setValue("amount", exactMatch.unitPrice * quantityValue);
      setIsExistingProduct(true);
    } else {
      form.setValue("productId", "");
      setIsExistingProduct(false);
    }
  }, [productNameValue, products, form, quantityValue]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    
    const formData = new FormData();
    formData.append("customerName", values.customerName);
    formData.append("customerPhone", values.customerPhone);
    if (values.productId) {
      formData.append("productId", values.productId);
      formData.append("numberOfProductsTaken", values.quantity.toString());
    }
    formData.append("amount", values.amount.toString());
    formData.append("status", values.status);
    if (values.description) {
      formData.append("description", values.description);
    }

    const result = await addCreditAction(formData);
    if (result.success) {
      onSuccess();
      form.reset();
      setIsExistingProduct(false);
      setSearchQuery("");
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Nouveau Crédit</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Article (Optionnel)</FormLabel>
                  <Popover open={productOpen} onOpenChange={setProductOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Input
                          placeholder="Rechercher un article..."
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
                          placeholder="Rechercher un article..."
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
                                    Créer sans lier à un produit
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
                                    form.setValue("amount", product.unitPrice * quantityValue);
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
                            Tapez le nom d'un produit
                          </CommandEmpty>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {field.value && (
                    <div className="mt-2 text-xs">
                      {isExistingProduct ? (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Check className="h-3 w-3" />
                          <span>Produit existant - Prix automatiquement calculé</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Plus className="h-3 w-3" />
                          <span>Crédit sans produit - Entrez le montant manuellement</span>
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          field.onChange(value);
                          if (isExistingProduct && productNameValue) {
                            const product = products.find(p => p.name === productNameValue);
                            if (product) {
                              form.setValue("amount", product.unitPrice * value);
                            }
                          }
                        }}
                        disabled={!!(isExistingProduct && productNameValue)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (Fcs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={!!(isExistingProduct && productNameValue)}
                        className={isExistingProduct ? "bg-gray-100 cursor-help" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ajoutez une description..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {form.formState.isSubmitting ? "Ajout en cours..." : "Ajouter le crédit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}