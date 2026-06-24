// lib/types/index.ts
export interface Profile {
  userId: string;
  name: string | null;
  storeId: string | null;
  role: string;
}

export interface Product {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
  category?: string | null;
  productCode?: string;   // EAN-13 barcode — needed for scan-to-search
}

export interface Transaction {
  transactionId: string;
  created_at: string;
  userId: string;
  // productId does NOT exist on the Supabase `transactions` table — kept
  // here only as optional for any legacy code paths that might still read
  // it from old already-fetched objects. Never write it on insert/update.
  productId?: string | null;
  productName: string | null;
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  type: "sale" | "credit" | "expense";
  storeId: string;
  description?: string | null;
}

export interface TransactionWithUser extends Transaction {
  userName: string;
}