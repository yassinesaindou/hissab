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
import { productColumns, ProductInterface } from "./ProductsColumns.tsx";
import { PlusCircle } from "lucide-react";
 

interface ClientProductsPageProps {
  products: ProductInterface[];
}

export default function ClientProductsPage({ products: initialProducts }: ClientProductsPageProps) {
  const [products, setProducts] = useState<ProductInterface[]>(initialProducts);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductInterface | null>(null);
   

  const closeAddDialog = () => setIsAddDialogOpen(false);
  const closeEditDialog = () => setIsEditDialogOpen(false);

  const handleEditProduct = (product: ProductInterface) => {
    console.log("Opening edit dialog for:", product.productId);
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleAddProduct = (newProduct: ProductInterface) => {
    setProducts((prev) => [...prev, newProduct]);
    closeAddDialog();
  };

  const handleUpdateProduct = (updatedProduct: ProductInterface) => {
    setProducts((prev) =>
      prev.map((p) => (p.productId === updatedProduct.productId ? updatedProduct : p))
    );
    closeEditDialog();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Articles</h1>
      <div className="flex justify-end w-full mb-4">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="mr-1 font-medium" />
              Ajouter un article
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un article</DialogTitle>
            </DialogHeader>
            <AddProductForm closeDialog={closeAddDialog} onAddProduct={handleAddProduct} />
          </DialogContent>
        </Dialog>
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) setSelectedProduct(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;article</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <UpdateProductForm
              closeDialog={closeEditDialog}
              product={selectedProduct}
              onUpdateProduct={handleUpdateProduct}
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