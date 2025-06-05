"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { newProductAction } from "@/app/actions";

interface AddProductFormProps {
  closeDialog: () => void;
}

export default function AddProductForm({ closeDialog }: AddProductFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
  setIsLoading(true);
  setError(null);
  setSuccess(null);

  const result = await newProductAction(formData);

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
    <form
      onSubmit={(e) => {
        e.preventDefault(); // prevent page reload
        const formData = new FormData(e.currentTarget);
        handleSubmit(formData);
      }}
      className="space-y-4">
      <div>
        <Label htmlFor="name">Nom de l&apos;article</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Enter product name"
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
          placeholder="Enter stock quantity"
          required
        />
      </div>
      <div>
        <Label htmlFor="unitPrice">Prix Unitaire</Label>
        <Input
          id="unitPrice"
          name="unitPrice"
          type="number"
          step="0.01"
          min="0"
          placeholder="Enter unit price"
          required
        />
      </div>
      <div>
        <Label htmlFor="category">Categorie</Label>
        <Input
          id="category"
          name="category"
          type="text"
          placeholder="Enter category (optional)"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Enter description (optional)"
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
