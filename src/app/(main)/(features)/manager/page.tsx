 
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ManagerDashboard from "./ManagerDashboard";

type ProfileWithSubscription = {
  userId: string;
  name: string | null;
  phoneNumber: string | null;
  subscriptionId: string | null;
  created_at: string | null;
  updatedAt: string | null;
  endAt: string | null;
  daysLeft: number;
};

export default async function ManagerPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return <div className="p-6 text-red-600">Unauthorized</div>;
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("userId", user.id)
    .single();

  if (profile?.role !== "admin") {
    return <div className="p-6 text-red-600">Admin access required</div>;
  }

  // Fetch profiles and subscriptions
  const { data: profiles } = await supabase
    .from("profiles")
    .select("userId, name, phoneNumber, subscriptionId").in("role", ['user', 'admin'])

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("subscriptionId, created_at, updatedAt, endAt");

  // Combine data
  const profilesWithSubscriptions: ProfileWithSubscription[] = (profiles || []).map((p) => {
    const sub = subscriptions?.find((s) => s.subscriptionId === p.subscriptionId);
    const endAt = sub?.endAt ? new Date(sub.endAt) : null;
    const today = new Date();
    const daysLeft = endAt
      ? Math.max(0, Math.floor((endAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      userId: p.userId,
      name: p.name,
      phoneNumber: p.phoneNumber,
      subscriptionId: p.subscriptionId,
      created_at: sub?.created_at,
      updatedAt: sub?.updatedAt,
      endAt: sub?.endAt,
      daysLeft,
    };
  });

  // Debug: Log profiles
  console.log("Profiles with subscriptions:", profilesWithSubscriptions);

  return (
    <div className="p-6  mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <ManagerDashboard profiles={profilesWithSubscriptions} />
    </div>
  );
}