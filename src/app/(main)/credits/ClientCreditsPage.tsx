/* eslint-disable @typescript-eslint/no-explicit-any */
// app/credits/ClientCreditsPage.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "./CreditTable";
import { columns } from "./CreditColumns";
import AddCreditForm from "@/components/AddCreditForm";
import UpdateCreditForm from "@/components/UpdateCreditForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ClientCreditsPageProps {
  credits: {
    creditId: string;
    customerName: string;
    customerPhone: string;
    amount: number;
    status: string | null;
    description: string | null;
    productId: string | null;
    created_at: string;
  }[];
  products: {
    productId: string;
    name: string;
    unitPrice: number;
    stock: number;
  }[];
}

export default function ClientCreditsPage({ credits, products }: ClientCreditsPageProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<any | null>(null);

  const closeAddDialog = () => setIsAddDialogOpen(false);
  const closeEditDialog = () => setIsEditDialogOpen(false);

  const handleEditCredit = (credit: any) => {
    setSelectedCredit(credit);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="w-full flex flex-col gap-4 p-8">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="self-end bg-blue-600 hover:bg-blue-700">
            Add New Credit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add A New Credit</DialogTitle>
          </DialogHeader>
          <AddCreditForm closeDialog={closeAddDialog} products={products} />
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Credit</DialogTitle>
          </DialogHeader>
          {console.log("Selected Credit:", selectedCredit)}
          {selectedCredit && (
            
            <UpdateCreditForm
              closeDialog={closeEditDialog}
              credit={selectedCredit}
              products={products}
            />
          )}
        </DialogContent>
      </Dialog>
      <DataTable columns={columns} data={credits} onEditCredit={handleEditCredit} />
    </div>
  );
}