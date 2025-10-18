// app/components/AddProductForm.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { newProductAction } from "@/app/actions";
import { ProductInterface } from "@/app/(main)/(features)/products/ProductsColumns.tsx";

interface AddProductFormProps {
  closeDialog: () => void;
  onAddProduct: (newProduct: ProductInterface) => void;
}

export default function AddProductForm({
  closeDialog,
  onAddProduct,
}: AddProductFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await newProductAction(formData);
    console.log("Add action result:", result);

    if (result.success) {
      setSuccess(result.message);
      // Create new product object
      const newProduct: ProductInterface = {
        productId: formData.get("productId") as string, // Assume server returns or generate client-side
        name: formData.get("name") as string,
        stock: Number(formData.get("stock")),
        unitPrice: Number(formData.get("unitPrice")),
        category: (formData.get("category") as string) || null,
        description: (formData.get("description") as string) || null,
        created_at: new Date().toISOString(),
      };
      onAddProduct(newProduct);
      closeDialog();
    } else {
      setError(result.message);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom de l&apos;article</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Entrez le nom de l'article"
          required
        />
      </div>
      <div>
        <Label htmlFor="stock">Stock</Label>
        <Input
          id="stock"
          name="stock"
          type="number"
          min="0"
          step="1"
          placeholder="Entrez la quantité en stock"
          required
        />
      </div>
      <div>
        <Label htmlFor="unitPrice">Prix unitaire</Label>
        <Input
          id="unitPrice"
          name="unitPrice"
          type="number"
          step="0.01"
          min="0"
          placeholder="Entrez le prix unitaire"
          required
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          name="category"
          type="text"
          placeholder="Entrez la catégorie (optionnel)"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Entrez une description (optionnel)"
          rows={4}
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <Button
        disabled={isLoading}
        type="submit"
        className="bg-blue-700 text-gray-50">
        Ajouter l&apos;article
      </Button>
    </form>
  );
}
