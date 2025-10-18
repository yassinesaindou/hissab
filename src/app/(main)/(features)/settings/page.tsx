

import SettingsForm from "@/components/SettingsForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
 

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: {user },
  } = await supabase.auth.getUser();


  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phoneNumber, storeId")
    .eq("userId", user.id)
    .single();

  // Fetch store if storeId exists
  let store = null;
  if (profile?.storeId) {
    const { data } = await supabase
      .from("stores")
      .select("storeName, storeAddress, storePhoneNumber")
      .eq("storeId", profile.storeId)
      .single();
    store = data;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      <SettingsForm
        profile={profile || { name: "", phoneNumber: "", storeId: null }}
        store={store || { storeName: "", storeAddress: "", storePhoneNumber: "" }}
      />
    </div>
  );
}