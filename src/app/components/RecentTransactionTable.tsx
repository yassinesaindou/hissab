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

export const transactions = [
  {
    id: 1,
    date: "2025-05-06",
    type: "Expense",
    amount: 120.0,
    description: "Office Supplies",
  },
  {
    id: 2,
    date: "2025-05-05",
    type: "Revenue",
    amount: 450.0,
    description: "Client Payment",
  },
  {
    id: 3,
    date: "2025-05-04",
    type: "Credit",
    amount: 300.0,
    description: "Loan Received",
  },
  {
    id: 4,
    date: "2025-05-03",
    type: "Expense",
    amount: 75.0,
    description: "Software Subscription",
  },
  {
    id: 5,
    date: "2025-05-03",
    type: "Expense",
    amount: 200.0,
    description: "Team Lunch",
  },
  {
    id: 6,
    date: "2025-05-02",
    type: "Revenue",
    amount: 820.0,
    description: "Website Project",
  },
  {
    id: 7,
    date: "2025-05-01",
    type: "Expense",
    amount: 60.0,
    description: "Domain Renewal",
  },
  {
    id: 8,
    date: "2025-04-30",
    type: "Credit",
    amount: 150.0,
    description: "Bank Transfer",
  },
  {
    id: 9,
    date: "2025-04-29",
    type: "Revenue",
    amount: 390.0,
    description: "Consulting Fee",
  },
  {
    id: 10,
    date: "2025-04-28",
    type: "Expense",
    amount: 100.0,
    description: "Utilities",
  },
];

export default function RecentTransactionTable() {
  return (
    <div className="p-4 border text-gray-600 rounded-2xl shadow-lg lg:mb-10">
      <h2 className="text-xl font-semibold text-gray-700">
        Recent transactions
      </h2>

      <Table className="mt-6 ">
        <TableCaption>A list of your recent transactions.</TableCaption>
        <TableHeader className="text-gray-600">
          <TableRow>
            <TableHead className="w-[100px]">Sr No</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">{transaction.id}</TableCell>
              <TableCell>{transaction.date}</TableCell>
              <TableCell>
                <div
                  className={`${
                    transaction.type == "Expense"
                      ? "text-red-600 py-1 px-2 bg-red-50 rounded-2xl"
                      : "text-green-600 bg-green-50 py-1 px-2 rounded-2xl"
                  } flex items-center justify-center max-w-[150px]`}>
                  <Dot size={28} />
                  <p> {transaction.type}</p>
                </div>
              </TableCell>
              <TableCell className="text-right">{transaction.amount}</TableCell>
              <TableCell className="pl-5">{transaction.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
