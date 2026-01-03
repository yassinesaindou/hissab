// app/products/components/ModernProductsPage.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ModernProductsTable from "./ModernProductsTable";
import AddProductModal from "./AddProductModal";
import StockAdjustmentModal from "./StockAdjustmentModal";
import { PlusCircle } from "lucide-react";
import UpdateProductModal from "./UpdateProductModal";
import { Product } from "../actions/actions";

interface ModernProductsPageProps {
  products: Product[];
}

export default function ModernProductsPage({ products: initialProducts }: ModernProductsPageProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleAdjustStock = (product: Product, type: 'increase' | 'decrease') => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setIsAdjustStockModalOpen(true);
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.productId === updatedProduct.productId ? updatedProduct : p))
    );
    setIsEditModalOpen(false);
    setSelectedProduct(null);
  };

  const handleStockUpdate = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, stock: newStock } : p))
    );
    setIsAdjustStockModalOpen(false);
    setSelectedProduct(null);
  };

  // Update products when initialProducts changes (from parent)
  useEffect(() => {
  setProducts(initialProducts);
}, [initialProducts]);

  // Calculate stats
  const totalProducts = products.length;
  const inStockProducts = products.filter(p => p.stock > 0).length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestion des Articles
        </h1>
        <p className="text-gray-600">
          Gérez votre inventaire, ajustez les stocks et suivez vos produits
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Articles</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalProducts}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Stock</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {inStockProducts}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bas</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {lowStockProducts}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.73 0L4.347 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rupture</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {outOfStockProducts}
              </p>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg">
              <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
          size="lg"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nouvel Article
        </Button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <ModernProductsTable
          products={products}
          onEdit={handleEditProduct}
          onAdjustStock={handleAdjustStock}
        />
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddProduct}
      />

      <UpdateProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSuccess={handleUpdateProduct}
      />

      <StockAdjustmentModal
        isOpen={isAdjustStockModalOpen}
        onClose={() => {
          setIsAdjustStockModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        adjustmentType={adjustmentType}
        onSuccess={handleStockUpdate}
      />
    </div>
  );
}