// app/products/components/StockAdjustmentModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown } from "lucide-react";
import { adjustStockAction } from "../actions/actions";

interface Product {
  productId: string;
  name: string;
  stock: number;
  unitPrice: number;
}

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  adjustmentType: 'increase' | 'decrease';
  onSuccess: (productId: string, newStock: number) => void;
}

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  product,
  adjustmentType,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setQuantity(1);
    setReason("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate quantity
      if (quantity <= 0) {
        setError("La quantité doit être supérieure à 0");
        setIsSubmitting(false);
        return;
      }

      if (adjustmentType === 'decrease' && quantity > product.stock) {
        setError(`Quantité insuffisante. Stock disponible: ${product.stock}`);
        setIsSubmitting(false);
        return;
      }

      // Call server action
      const formData = new FormData();
      formData.append("productId", product.productId);
      formData.append("quantity", quantity.toString());
      formData.append("type", adjustmentType);
      if (reason) formData.append("reason", reason);

      const result = await adjustStockAction(formData);
      
      if (result.success) {
        onSuccess(product.productId, result.newStock!);
        resetForm();
        onClose();
      } else {
        setError(result.message || "Une erreur s'est produite");
      }
    } catch (err) {
      setError("Une erreur s'est produite");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = adjustmentType === 'increase' 
    ? "Ajouter au stock" 
    : "Réduire le stock";

  const maxDecrease = product.stock;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600">Stock actuel: {product.stock}</p>
              </div>
              <div className={`p-2 rounded-full ${
                adjustmentType === 'increase' 
                  ? 'bg-emerald-100' 
                  : 'bg-amber-100'
              }`}>
                {adjustmentType === 'increase' ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantité à {adjustmentType === 'increase' ? 'ajouter' : 'retirer'} *
              </Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={adjustmentType === 'decrease' ? maxDecrease : undefined}
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setQuantity(isNaN(value) ? 1 : Math.max(1, value));
                }}
                className="h-11 text-center text-lg font-medium"
                required
                disabled={isSubmitting}
              />
              {adjustmentType === 'decrease' && (
                <p className="text-xs text-gray-500">
                  Maximum disponible: {maxDecrease}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Raison (optionnel)</Label>
              <Input
                id="reason"
                type="text"
                placeholder="Ex: Réapprovisionnement, Vente, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-11"
                disabled={isSubmitting}
              />
            </div>

            {/* Preview */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">
                  Nouveau stock après ajustement:
                </span>
                <span className="text-lg font-bold text-blue-800">
                  {adjustmentType === 'increase' 
                    ? product.stock + quantity 
                    : product.stock - quantity}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-11 px-6"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className={`h-11 px-6 ${
                  adjustmentType === 'increase'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Traitement...
                  </>
                ) : (
                  `Confirmer l'ajustement`
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}