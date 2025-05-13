import React from "react";
import { ProductsTable } from "./ProductsTable";
import { productColumns, products } from "./ProductsColumns.tsx";
import { getMyProducts } from "@/lib/products";

export default async function Page() {
  // I ant to getMyProducts here

  const data = await getMyProducts();
  console.log("Data from getMyProducts:", data); // Debug log
  return <ProductsTable columns={productColumns} data={products} />;
}
