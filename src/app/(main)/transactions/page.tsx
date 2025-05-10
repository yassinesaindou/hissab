import React from "react";
import { TransactionsTable } from "./TransactionsTable";
import { transactions, transactionsColumns } from "./transactionColumns";

export default function Page() {
  return (
    <TransactionsTable columns={transactionsColumns} data={transactions} />
  );
}
