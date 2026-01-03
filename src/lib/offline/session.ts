/* eslint-disable @typescript-eslint/no-unused-vars */
// lib/offline/session.ts
import { getDB } from "../indexeddb";
import type { UserProfile, StoreInfo } from "../indexeddb";

export async function saveUserProfile(profile: Omit<UserProfile, "key">) {
  const db = await getDB();
  await db.put("userProfile", { key: "current", ...profile });
}

export async function saveStoreInfo(store: Omit<StoreInfo, "key">) {
  const db = await getDB();
  await db.put("storeInfo", { key: "current", ...store });
}

export async function getUserProfile(): Promise<Omit<
  UserProfile,
  "key"
> | null> {
  const db = await getDB();
  const result = await db.get("userProfile", "current");
  if (!result) return null;
  const { key, ...profile } = result;
  return profile;
}

export async function getStoreInfo(): Promise<Omit<StoreInfo, "key"> | null> {
  const db = await getDB();
  const result = await db.get("storeInfo", "current");
  if (!result) return null;
  const { key, ...store } = result;
  return store;
}

export async function clearSession() {
  const db = await getDB();
  await db.clear("userProfile");
  await db.clear("storeInfo");
}

export async function clearAllLocalData() {
  const db = await getDB();
  await db.clear("userProfile");
  await db.clear("storeInfo");
  await db.clear("products");
  await db.clear("transactions");
  console.log("All local data cleared on logout");
}
