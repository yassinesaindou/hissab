/* eslint-disable react/no-unescaped-entities */
// src/app/(main)/(features)/credits/components/EditCreditModal.tsx
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
import { updateCreditAction } from "../actions/action";

const formSchema = z.object({
  creditId: z.string(),
  customerName: z.string().min(1, "Le nom du client est requis"),
  customerPhone: z.string().min(1, "Le numéro de téléphone est requis"),
  productId: z.string().optional(),
  productName: z.string().optional(),
  amount: z.number().min(1, "Le montant doit être positif"),
  status: z.enum(["pending", "paid"]),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  credit: {
    creditId: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    status: string;
    description: string | null;
    productId: string | null;
    productName?: string | null;
  } | null; // Make credit nullable
  products: { productId: string; name: string; unitPrice: number; stock: number }[];
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
  const [productOpen, setProductOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExistingProduct, setIsExistingProduct] = useState(false);
  const commandInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creditId: "",
      customerName: "",
      customerPhone: "",
      productId: "",
      productName: "",
      amount: 0,
      status: "pending",
      description: "",
    },
  });

  // Reset form when credit changes
  useEffect(() => {
    if (credit) {
      form.reset({
        creditId: credit.creditId,
        customerName: credit.customerName,
        customerPhone: credit.customerPhone,
        productId: credit.productId || "",
        productName: credit.productName || "",
        amount: credit.amount,
        status: credit.status as "pending" | "paid",
        description: credit.description || "",
      });
      setIsExistingProduct(!!credit.productId);
    }
  }, [credit, form]);

  // Watch values for real-time updates
  

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = async (values: FormValues) => {
    setError(null);
    
    const formData = new FormData();
    formData.append("creditId", values.creditId);
    formData.append("customerName", values.customerName);
    formData.append("customerPhone", values.customerPhone);
    if (values.productId) {
      formData.append("productId", values.productId);
    }
    formData.append("amount", values.amount.toString());
    formData.append("status", values.status);
    if (values.description) {
      formData.append("description", values.description);
    }

    const result = await updateCreditAction(formData);
    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.message);
    }
  };

  // Don't render if no credit
  if (!credit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Modifier le Crédit</DialogTitle>
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
                                  setIsExistingProduct(false);
                                  setProductOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Plus className="mr-2 h-4 w-4 text-emerald-600" />
                                <div>
                                  <span className="font-medium">"{searchQuery}"</span>
                                  <span className="text-xs text-gray-500 block">
                                    Délier du produit
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
                                    setIsExistingProduct(true);
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
                          <span>Produit lié</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Plus className="h-3 w-3" />
                          <span>Crédit sans produit</span>
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant (Fcs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
            </div>

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
                {form.formState.isSubmitting ? "Mise à jour en cours..." : "Mettre à jour"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}