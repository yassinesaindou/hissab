import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dot } from "lucide-react";

interface Transaction {
  id: number;
  date: string;
  type: "Sale" | "Expense";
  amount: number;
  description: string;
}

interface RecentTransactionTableProps {
  transactions: Transaction[];
}

export default function RecentTransactionTable({ transactions }: RecentTransactionTableProps) {
  return (
    <div className="p-4 border text-gray-600 rounded-2xl shadow-lg lg:mb-10">
      <h2 className="text-xl font-semibold text-gray-700">Transactions récentes</h2>

      <Table className="mt-6">
        <TableCaption>Une liste de vos transactions récentes.</TableCaption>
        <TableHeader className="text-gray-600">
          <TableRow>
            <TableHead className="w-[100px]">No</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.id}</TableCell>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>
                  <div
                    className={`${
                      transaction.type === "Expense"
                        ? "text-red-600 py-1 px-2 bg-red-50 rounded-2xl"
                        : "text-green-600 bg-green-50 py-1 px-2 rounded-2xl"
                    } flex items-center justify-center max-w-[150px]`}
                  >
                    <Dot size={28} />
                    <p>{transaction.type}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">${transaction.amount.toFixed(2)}</TableCell>
                <TableCell className="pl-5 text-right">{transaction.description}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Aucune transaction récente trouvée
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}