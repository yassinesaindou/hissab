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
import { updateCreditAction } from "@/app/actions";

interface UpdateCreditFormProps {
  closeDialog: () => void;
  credit: {
    creditId: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    status: string | null;
    description: string | null;
    productId: string | null;
  };
  products: {
    productId: string;
    name: string;
    unitPrice: number;
    stock: number;
  }[];
}

export default function UpdateCreditForm({
  closeDialog,
  credit,
  products,
}: UpdateCreditFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    credit.productId
  );
  const [numberOfProductsTaken, setNumberOfProductsTaken] = useState<number>(
    Number(credit.amount) /
      (products.find((p) => p.productId === credit.productId)?.unitPrice || 1)
  );
  const [amount, setAmount] = useState<number>(credit.amount || 0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (selectedProductId && selectedProductId !== "none") {
      const product = products.find((p) => p.productId === selectedProductId);
      if (product) {
        const calculatedAmount = product.unitPrice * numberOfProductsTaken;
        setAmount(calculatedAmount);
        if (numberOfProductsTaken > product.stock) {
          setError(
            `Cannot select more than ${product.stock} items (current stock).`
          );
        } else {
          setError(null);
        }
      }
    }
  }, [selectedProductId, numberOfProductsTaken, products]);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const amountValue = Number(formData.get("amount"));
      const phone = formData.get("customerPhone") as string;

      if (amountValue <= 0) {
        setError("Amount must be greater than 0.");
        return;
      }

      if (!validatePhone(phone)) {
        setError("Please enter a valid phone number (e.g., +1234567890).");
        return;
      }

      if (!selectedProductId || selectedProductId === "none") {
        formData.delete("productId");
      }

      const result = await updateCreditAction(formData);
      console.log("Update credit action result:", result);

      if (result.success) {
        setSuccess(result.message);
        setError(null);
        closeDialog();
        router.refresh();
      } else {
        setError(result.message);
        setSuccess(null);
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="creditId" value={credit.creditId} />

      <div>
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          id="customerName"
          name="customerName"
          type="text"
          placeholder="Enter customer name"
          defaultValue={credit.customerName}
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
          defaultValue={credit.customerPhone}
          required
        />
      </div>

      <div>
        <Label htmlFor="productId">Product (Optional)</Label>
        <Select
          name="productId"
          defaultValue={credit.productId || "none"}
          onValueChange={(value) =>
            setSelectedProductId(value === "none" ? null : value)
          }
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
        <Label htmlFor="numberOfProductsTaken">
          Number of Products Taken
        </Label>
        <Input
          id="numberOfProductsTaken"
          name="numberOfProductsTaken"
          type="number"
          min="1"
          max={
            products.find((p) => p.productId === selectedProductId)?.stock || 1
          }
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
          min="0"
          value={amount || 1}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Enter credit amount"
          readOnly={!!selectedProductId && selectedProductId !== "none"}
          required
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={credit.status || "pending"}>
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
          defaultValue={credit.description || ""}
          rows={4}
        />
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <Button
        type="submit"
        className="bg-blue-700 text-gray-50"
        disabled={isPending}
      >
        {isPending ? "Updating..." : "Update Credit"}
      </Button>
    </form>
  );
}
