// components/AddCreditForm.tsx
"use client";
import { useState, useEffect } from "react";
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
  products: { productId: string; name: string; unitPrice: number; stock: number }[];
}

export default function AddCreditForm({ closeDialog, products }: AddCreditFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [numberOfProductsTaken, setNumberOfProductsTaken] = useState<number>(1);
  const [amount, setAmount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    if (selectedProductId && selectedProductId !== "none") {
      const product = products.find((p) => p.productId === selectedProductId);
      if (product) {
        const calculatedAmount = product.unitPrice * numberOfProductsTaken;
        setAmount(calculatedAmount);
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

    // Only set numberOfProductsTaken if a product is selected
    if (selectedProductId && selectedProductId !== "none") {
      formData.set('numberOfProductsTaken', numberOfProductsTaken.toString());

      const product = products.find((p) => p.productId === selectedProductId);
      if (product && numberOfProductsTaken > product.stock) {
        setError(`Number of products taken (${numberOfProductsTaken}) exceeds available stock (${product.stock})`);
        return;
      }
    } else {
      // Clear productId if "none" is selected
      formData.delete('productId');
    }

    const result = await addCreditAction(formData);
    console.log('Add credit action result:', result);
    if (result.success) {
      setSuccess(result.message);
      closeDialog();
      router.refresh();
    } else {
      setError(result.message);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          id="customerName"
          name="customerName"
          type="text"
          placeholder="Enter customer name"
          required
        />
      </div>
      <div>
        <Label htmlFor="customerPhone">Customer Phone</Label>
        <Input
          id="customerPhone"
          name="customerPhone"
          type="tel"
          placeholder="Enter phone number (e.g., +1234567890)"
          required
        />
      </div>
      <div>
        <Label htmlFor="productId">Product (Optional)</Label>
        <Select
          name="productId"
          onValueChange={(value) => setSelectedProductId(value === "none" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a product" />
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
        <Label htmlFor="numberOfProductsTaken">Number of Products Taken</Label>
        <Input
          id="numberOfProductsTaken"
          name="numberOfProductsTaken"
          type="number"
          min="1"
          value={numberOfProductsTaken}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value >= 1) {
              setNumberOfProductsTaken(value);
            }
          }}
          placeholder="Enter number of products taken"
          disabled={!selectedProductId || selectedProductId === "none"}
          required={!!selectedProductId && selectedProductId !== "none"}
        />
      </div>
      <div>
        <Label htmlFor="amount">Amount</Label>
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
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
      <Button type="submit" className="bg-blue-700 text-gray-50">
        Add Credit
      </Button>
    </form>
  );
}