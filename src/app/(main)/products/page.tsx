import React from "react";
import { ProductsTable } from "./ProductsTable";
import { productColumns, products } from "./ProductsColumns.tsx";

export default function Page() {
  return <ProductsTable columns={productColumns} data={products}/>;
}
