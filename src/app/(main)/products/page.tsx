import React from "react";
import { ProductsTable } from "./ProductsTable";
import { productColumns, products } from "./ProductsColumns.tsx";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Page() {
  // I ant to getMyProducts here
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("User from getMyProducts:", user); // Debug log
  // Debug log
  return <ProductsTable columns={productColumns} data={products} />;
}
