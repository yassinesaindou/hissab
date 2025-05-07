import React from "react";
import { DataTable } from "./CreditTable";
import { columns, creditData } from "./CreditColumns";

export default function Page() {
  return <DataTable columns={columns} data={creditData} />
}
