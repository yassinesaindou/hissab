// app/products/ClientProductsPage.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductsTable } from "./ProductsTable";
 
import AddProductForm from "@/components/AddProductForm";
import UpdateProductForm from "@/components/UpdateProductForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { productColumns } from "./ProductsColumns.tsx";

interface ClientProductsPageProps {
  products: any[];
}

export default function ClientProductsPage({ products }: ClientProductsPageProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const closeAddDialog = () => setIsAddDialogOpen(false);
  const closeEditDialog = () => setIsEditDialogOpen(false);

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="flex justify-end w-full mb-4">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Add a new Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <AddProductForm closeDialog={closeAddDialog} />
          </DialogContent>
        </Dialog>
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <UpdateProductForm
              closeDialog={closeEditDialog}
              product={selectedProduct}
            />
          )}
        </DialogContent>
      </Dialog>
      <ProductsTable
        columns={productColumns}
        data={products}
        onEditProduct={handleEditProduct}
      />
    </div>
  );
}