'use client';

import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { DataTable } from "./TransactionTable";
import AddTransactionForm from "@/components/AddTransactionForm";
import UpdateTransactionForm from "@/components/UpdateTransactionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; // Assuming you have an Input component from Shadcn/UI
import { Label } from "@/components/ui/label"; // Assuming you have a Label component
import { useRouter } from "next/navigation";
import { transactionColumns } from "./TransactionColumns";
import { DownloadCloud, PlusCircle } from "lucide-react";

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
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    ClientTransactionsPageProps["transactions"][0] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const closeAddDialog = () => setIsAddDialogOpen(false);
  const closeEditDialog = () => setIsEditDialogOpen(false);
  const closeDownloadDialog = () => setIsDownloadDialogOpen(false);

  const handleDownloadExcelFile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    // Validate dates
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner une période valide');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/download-transactions?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message);
        return;
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const fileName = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'transactions.xlsx';
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      closeDownloadDialog();
    } catch (err) {
      setError('Une erreur s\'est produite lors du téléchargement');
      console.error('Download error:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="flex justify-end gap-4">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="inline mr-2" size={16} />
              Ajouter une transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une transaction</DialogTitle>
            </DialogHeader>
            <AddTransactionForm
              closeDialog={closeAddDialog}
              products={products}
              onSuccess={handleAddTransaction}
            />
          </DialogContent>
        </Dialog>
        <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white border border-blue-600 hover:bg-blue-700 text-blue-600 hover:text-white">
              
              <DownloadCloud className="inline mr-2" size={16} />
              Télécharger les transactions
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sélectionner la période</DialogTitle>
            </DialogHeader>
            <form ref={formRef} onSubmit={handleDownloadExcelFile} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <DownloadCloud className="inline mr-2" size={16} />
                {isLoading ? 'Téléchargement...' : 'Télécharger'}
              </Button>
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la transaction</DialogTitle>
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
        columns={transactionColumns}
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
    <div className="w-full flex flex-col gap-4">
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="self-end bg-blue-600 hover:bg-blue-700">
            Ajouter une transaction
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une transaction</DialogTitle>
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