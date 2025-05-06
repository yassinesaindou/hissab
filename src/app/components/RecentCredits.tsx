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

export const recentCredits = [
  {
    id: 1,
    name: "Joe Harris",
    phone: "4578975",
    amount: 745,
  },
  {
    id: 2,
    name: "Bill A Joe",
    phone: "2455555",
    amount: 892,
  },
  {
    id: 3,
    name: "Joe Coleman",
    phone: "254783656",
    amount: 10458,
  },
  {
    id: 4,
    name: "Gates Bond",
    phone: "35874978",
    amount: 158,
  },
  {
    id: 5,
    name: "Anna Scott",
    phone: "54789632",
    amount: 623,
  },
  {
    id: 6,
    name: "Mark Henry",
    phone: "48956321",
    amount: 980,
  },
  {
    id: 7,
    name: "Sarah Lane",
    phone: "32145678",
    amount: 1210,
  },
];

export default function RecentCredits() {
  return (
    <div className="p-4 border h-fit text-gray-600 rounded-2xl shadow-lg flex-1 mb-10">
      <h2 className="text-xl font-semibold text-gray-700">
        Recent Credits
      </h2>

      <Table className="mt-6 ">
        <TableCaption>A list of your recent credits.</TableCaption>
        <TableHeader className="text-gray-600">
          <TableRow>
            <TableHead className="w-[100px]">Sr No</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Phone No</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentCredits.map((credit) => (
            <TableRow key={credit.id}>
              <TableCell className="font-medium">{credit.id}</TableCell>
              <TableCell>{credit.name}</TableCell>

              <TableCell>{credit.phone}</TableCell>
              <TableCell className=" font-medium text-gray-700 text-right">
                ${credit.amount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
