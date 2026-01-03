// lib/offline/products.ts
import { getDB, LocalProduct } from "@/lib/indexeddb";

// Save or update a single product
export async function saveProduct(product: LocalProduct) {
  const db = await getDB();
  await db.put("products", product);
}

// Save many products (e.g., after syncing from server)
export async function saveProducts(products: LocalProduct[]) {
  const db = await getDB();
  const tx = db.transaction("products", "readwrite");
  for (const product of products) {
    await tx.store.put(product);
  }
  await tx.done;
}

// Get all products for current store
export async function getAllProducts(storeId: string): Promise<LocalProduct[]> {
  const db = await getDB();
  return await db.getAllFromIndex("products", "storeId", storeId);
}

// Get one product by ID
export async function getProductById(
  productId: string
): Promise<LocalProduct | undefined> {
  const db = await getDB();
  return await db.get("products", productId);
}

// Update stock locally (used when making offline sale)
export async function updateProductStock(productId: string, newStock: number) {
  const db = await getDB();
  const product = await db.get("products", productId);
  if (product) {
    product.stock = newStock;
    await db.put("products", product);
  }
}

// Clear all products (useful on logout or full resync)
export async function clearProducts() {
  const db = await getDB();
  await db.clear("products");
}
