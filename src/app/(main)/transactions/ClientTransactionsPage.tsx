"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "./TransactionTable";
import { columns } from "./TransactionColumns";
import AddTransactionForm from "@/components/AddTransactionForm";
import UpdateTransactionForm from "@/components/UpdateTransactionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
 

interface ClientTransactionsPageProps {
  transactions: {
    transactionId: string;
    created_at: string;
    userId: string;
    productId: string | null;
    productName: string | null;
    unitPrice: number;
    totalPrice: number;
    quantity: number;
    type: "sale" | "credit" | "expense";
  }[];
  products: {
    productId: string;
    name: string;
    unitPrice: number;
    stock: number;
  }[];
}

export default function ClientTransactionsPage({
  transactions: initialTransactions,
  products,
}: ClientTransactionsPageProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    ClientTransactionsPageProps["transactions"][0] | null
  >(null);

  const closeAddDialog = () => setIsAddDialogOpen(false);
  const closeEditDialog = () => setIsEditDialogOpen(false);

  const handleAddTransaction = (
    newTransaction: ClientTransactionsPageProps["transactions"][0]
  ) => {
    setTransactions((prev) => [newTransaction, ...prev]);
    closeAddDialog();
  };

  const handleUpdateTransaction = (
    updatedTransaction: ClientTransactionsPageProps["transactions"][0]
  ) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.transactionId === updatedTransaction.transactionId
          ? updatedTransaction
          : t
      )
    );
    closeEditDialog();
  };

  const handleEditTransaction = (
    transaction: ClientTransactionsPageProps["transactions"][0]
  ) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="w-full flex flex-col gap-4 p-8">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="self-end bg-blue-600 hover:bg-blue-700">
            Add New Transaction
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add A New Transaction</DialogTitle>
          </DialogHeader>
          <AddTransactionForm
            closeDialog={closeAddDialog}
            products={products}
            onSuccess={handleAddTransaction}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <UpdateTransactionForm
              closeDialog={closeEditDialog}
              transaction={selectedTransaction}
              products={products}
              onSuccess={handleUpdateTransaction}
            />
          )}
        </DialogContent>
      </Dialog>
      <DataTable
        columns={columns}
        data={transactions}
        onEditTransaction={handleEditTransaction}
      />
    </div>
  );
}

export function ClientAddTransactionForm({
  products,
}: {
  products: ClientTransactionsPageProps["products"];
}) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const router = useRouter();

  const closeAddDialog = () => setIsAddDialogOpen(false);

  const handleAddTransaction = (
    newTransaction: ClientTransactionsPageProps["transactions"][0]
  ) => {
    console.log(newTransaction);

    closeAddDialog();
    router.refresh();
  };

  return (
    <div className="w-full flex flex-col gap-4 ">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="self-end bg-blue-600 hover:bg-blue-700">
            Add New Transaction
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add A New Transaction</DialogTitle>
          </DialogHeader>
          <AddTransactionForm
            closeDialog={closeAddDialog}
            products={products}
            onSuccess={handleAddTransaction}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
