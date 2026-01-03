/* eslint-disable @typescript-eslint/no-explicit-any */
// app/products/components/AddProductModal.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { newProductAction } from "@/app/actions";

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  stock: z.coerce.number().min(0, "Le stock ne peut pas être négatif"),
  unitPrice: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
  category: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: any) => void;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
}: AddProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      stock: 0,
      unitPrice: 0,
      category: "",
      description: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("stock", data.stock.toString());
      formData.append("unitPrice", data.unitPrice.toString());
      if (data.category) formData.append("category", data.category);
      if (data.description) formData.append("description", data.description);

      const result = await newProductAction(formData);
      
      if (result.success) {
        const newProduct = {
          productId: `temp-${Date.now()}`,
          name: data.name,
          stock: data.stock,
          unitPrice: data.unitPrice,
          category: data.category || null,
          description: data.description || null,
          created_at: new Date().toISOString(),
        };
        
        onSuccess(newProduct);
        form.reset();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Ajouter un Nouvel Article
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-sm font-medium">Nom *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nom de l'article"
                        {...field}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Stock *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        className="h-11"
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
                    <FormLabel className="text-sm font-medium">Prix *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          Fcs
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          className="pl-12 h-11"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-sm font-medium">Catégorie</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Catégorie (optionnel)"
                        {...field}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-sm font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description (optionnel)"
                        {...field}
                        className="min-h-[100px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
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
                className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Création...
                  </>
                ) : (
                  "Créer l'article"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}