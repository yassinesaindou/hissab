"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProductAction } from "@/app/actions";

interface UpdateProductFormProps {
  closeDialog: () => void;
  product: {
    productId: string;
    name: string;
    stock: number;
    unitPrice: number;
    category: string | null;
    description: string | null;
  };
}

export default function UpdateProductForm({
  closeDialog,
  product,
}: UpdateProductFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateProductAction(formData);
    console.log("Update action result:", result);

    if (result.success) {
      setSuccess(result.message);
      closeDialog();
      router.refresh();
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="productId" value={product.productId} />
      <div>
        <Label htmlFor="name">Nom de l&apos;article</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Entrez le nom de l'article"
          defaultValue={product.name}
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
          defaultValue={product.stock}
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
          defaultValue={product.unitPrice}
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
          defaultValue={product.category || ""}
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Entrez une description (optionnel)"
          defaultValue={product.description || ""}
          rows={4}
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <Button disabled={isLoading} type="submit" className="bg-blue-700 text-gray-50">
        Mettre à jour l&apos;article
      </Button>
    </form>
  );
}
