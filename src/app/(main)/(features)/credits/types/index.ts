// app/credits/types.ts

export interface Product {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
  productCode?: string;
}

export interface CreditItem {
  creditItemId: string;
  creditId: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  created_at: string;
}

export interface Credit {
  creditId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  status: "pending" | "paid";
  description: string | null;
  productId: string | null; // legacy single-product field, kept for old rows
  productName?: string | null; // legacy, resolved via join
  storeId: string;
  created_at: string;
  /** Populated by the page when loading credits — line items for this credit */
  items?: CreditItem[];
}

/** Shape used by the Add/Edit modals while a credit is being composed in the form */
export interface CreditLineItemDraft {
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}