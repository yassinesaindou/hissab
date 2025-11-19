// app/manager/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import ManagerDashboard from "./ManagerDashboard";
import { Loader2 } from "lucide-react";

// EXACT SAME TYPE AS IN ManagerDashboard.tsx — NO MORE CONFLICT
type ProfileWithSubscription = {
  userId: string;
  name: string | null;
  phoneNumber: string | null;
  subscriptionId: string | null;
  endAt: string | null;
  daysLeft: number;
  planId: number | null;           // ← NOW number, not string
  planName: "starter" | "pro" | "entreprise" | null;
  maxUsers: number;
};

export default function ManagerPage() {
  const [profiles, setProfiles] = useState<ProfileWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    async function loadManagerData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("userId", user.id)
          .single();

        if (currentProfile?.role !== "admin") {
          setError("Accès administrateur requis");
          setLoading(false);
          return;
        }

        const [
          { data: profilesData },
          { data: subscriptionsData },
          { data: plansData },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("userId, name, phoneNumber, subscriptionId")
            .in("role", ["user", "admin"]),

          supabase.from("subscriptions").select("subscriptionId, endAt, planId"),

          supabase.from("plans").select("planId, name, numberOfUsers"),
        ]);

        const today = new Date();

        const planMap = new Map<number, { name: string; numberOfUsers: number }>();
        (plansData || []).forEach(p => {
          planMap.set(p.planId, { name: p.name, numberOfUsers: p.numberOfUsers });
        });

        const enriched: ProfileWithSubscription[] = (profilesData || []).map(p => {
          const sub = (subscriptionsData || []).find(s => s.subscriptionId === p.subscriptionId);
          const plan = sub?.planId ? planMap.get(sub.planId) : null;

          const endAt = sub?.endAt ? new Date(sub.endAt) : null;
          const daysLeft = endAt
            ? Math.max(0, Math.floor((endAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

          return {
            userId: p.userId,
            name: p.name || null,
            phoneNumber: p.phoneNumber || null,
            subscriptionId: p.subscriptionId,
            endAt: sub?.endAt || null,
            daysLeft,
            planId: sub?.planId ?? null,                    // ← number | null
            planName: (plan?.name.toLowerCase().includes("starter") ? "starter" :
                       plan?.name.toLowerCase().includes("pro") ? "pro" :
                       plan?.name.toLowerCase().includes("entreprise") ? "entreprise" : null),
            maxUsers: plan?.numberOfUsers || 0,
          };
        });

        setProfiles(enriched);
      } catch (err) {
        console.error("Failed to load manager data:", err);
        setError("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }

    loadManagerData();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-4 text-lg font-medium">Chargement du tableau de bord admin...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 mx-auto max-w-4xl">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center font-semibold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
        Tableau de bord administrateur
      </h1>
      <ManagerDashboard profiles={profiles} />
    </div>
  );
}