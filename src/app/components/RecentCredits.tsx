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

interface Credit {
  id: number;
  name: string;
  phone: string;
  amount: number;
}

interface RecentCreditsProps {
  credits: Credit[];
}

export default function RecentCredits({ credits }: RecentCreditsProps) {
  return (
    <div className="p-4 border h-fit text-gray-600 rounded-2xl shadow-lg flex-1 mb-10">
      <h2 className="text-xl font-semibold text-gray-700">Recents Crédits</h2>

      <Table className="mt-6">
        <TableCaption>Une liste de vos crédits récents</TableCaption>
        <TableHeader className="text-gray-600">
          <TableRow>
            <TableHead className="w-[100px]">Sr No</TableHead>
            <TableHead>Nom du client</TableHead>
            <TableHead>No de tel</TableHead>
            <TableHead className="text-right">Montant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credits.length > 0 ? (
            credits.map((credit) => (
              <TableRow key={credit.id}>
                <TableCell className="font-medium">{credit.id}</TableCell>
                <TableCell>{credit.name}</TableCell>
                <TableCell>{credit.phone}</TableCell>
                <TableCell className="font-medium text-gray-700 text-right">
                  ${credit.amount}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                Aucun crédit récent trouvé.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}