export type Credit = {
  creditId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  status: string;
  description: string | null;
  productId: string | null;
  created_at: string;
  productName?: string | null;
};

export type Product = {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
};