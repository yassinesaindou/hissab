"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addCreditAction } from "@/app/actions";

interface AddCreditFormProps {
  closeDialog: () => void;
  products: {
    productId: string;
    name: string;
    unitPrice: number;
    stock: number;
  }[];
}

export default function AddCreditForm({ closeDialog, products }: AddCreditFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [numberOfProductsTaken, setNumberOfProductsTaken] = useState<number>(1);
  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (selectedProductId && selectedProductId !== "none") {
      const product = products.find((p) => p.productId === selectedProductId);
      if (product) {
        setAmount(product.unitPrice * numberOfProductsTaken);
      } else {
        setAmount(0);
      }
    } else {
      setAmount(0);
    }
  }, [selectedProductId, numberOfProductsTaken, products]);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(null);

    if (selectedProductId && selectedProductId !== "none") {
      formData.set("numberOfProductsTaken", numberOfProductsTaken.toString());

      const product = products.find((p) => p.productId === selectedProductId);
      if (product && numberOfProductsTaken > product.stock) {
        setError(`Only ${product.stock} units of ${product.name} are in stock.`);
        return;
      }
    } else {
      formData.delete("productId");
    }

    formData.set("amount", amount.toFixed(2));

    startTransition(async () => {
      const result = await addCreditAction(formData);

      if (result.success) {
        setSuccess(result.message);
        closeDialog();
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="customerName">Nom du client</Label>
        <Input
          id="customerName"
          name="customerName"
          type="text"
          placeholder="Enter customer name"
          required
        />
      </div>

      <div>
        <Label htmlFor="customerPhone">No de tel du client</Label>
        <Input
          id="customerPhone"
          name="customerPhone"
          type="tel"
          placeholder="Enter phone number (e.g., +1234567890)"
          required
        />
      </div>

      <div>
        <Label htmlFor="productId">Article (Optionnel)</Label>
        <Select
          name="productId"
          onValueChange={(value) =>
            setSelectedProductId(value === "none" ? null : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un article" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.productId} value={product.productId}>
                {product.name} (Stock: {product.stock})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="numberOfProductsTaken">No d&apos;articles pris</Label>
        <Input
          id="numberOfProductsTaken"
          name="numberOfProductsTaken"
          type="number"
          min="1"
          value={numberOfProductsTaken}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val >= 1) setNumberOfProductsTaken(val);
          }}
          disabled={!selectedProductId}
          required={!!selectedProductId}
        />
      </div>

      <div>
        <Label htmlFor="amount">Montant</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount.toFixed(2)}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Enter credit amount"
          required
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue="pending">
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="paid">Paye</SelectItem>
            <SelectItem value="overdue">En retard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Entrer une description (optional)"
          rows={4}
        />
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <Button type="submit" disabled={isPending} className="bg-blue-700 text-gray-50">
        {isPending ? "En cours..." : "Ajouter le crédit"}
      </Button>
    </form>
  );
}
