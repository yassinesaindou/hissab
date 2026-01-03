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
}

export interface Transaction {
  transactionId: string;
  created_at: string;
  userId: string;
  productId: string | null;
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