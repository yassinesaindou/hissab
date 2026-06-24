// types.ts
export type ProfileWithSubscription = {
  userId: string;
  name: string | null;
  phoneNumber: string | null;
  subscriptionId: string | null;
  endAt: string | null;
  daysLeft: number;
  planId: number | null;
  planName: "starter" | "pro" | "entreprise" | null;
  maxUsers: number;
};

export type Transaction = {
  transactionId: string;
  created_at: string;
  userId: string;
  // Legacy field — no productId column on the transactions table itself.
  // Kept optional for backward compatibility with old fetched objects only.
  productId?: string | null;
  productName: string | null;
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  type: "sale" | "credit" | "expense";
};

export type Product = {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
  productCode?: string;   // EAN-13 barcode — needed for scan-to-search
};