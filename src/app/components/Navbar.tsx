'use client'
/* eslint-disable react/no-unescaped-entities */
// app/components/Navbar.tsx — add this inside the header div, next to subscription message

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { performFullSync } from "@/lib/offline/fullSync";
import { getStoreInfo, getUserProfile } from "@/lib/offline/session";
import { getPendingTransactions } from "@/lib/offline/transactions";
import { createSupabaseClient } from "@/lib/supabase/client";
import { AlertCircle, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [subscriptionDays, setSubscriptionDays] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (navigator.onLine) {
        // === ONLINE ===
        const supabase = createSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);

        if (user) {
          const { data: subscriptionData } = await supabase
            .from("subscriptions")
            .select("endAt")
            .eq("userId", user.id)
            .single();

          if (subscriptionData?.endAt) {
            const endAt = new Date(subscriptionData.endAt);
            const today = new Date();
            const diffDays = Math.ceil((endAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            setSubscriptionDays(diffDays);
          }
        }
      } else {
        // === OFFLINE ===
        const profile = await getUserProfile();
        setUserEmail(profile?.email || null);
        setSubscriptionDays(profile?.subscriptionDaysLeft || null);
      }

      // Count pending transactions
      const store = await getStoreInfo();
      if (store?.storeId) {
        const pending = await getPendingTransactions(store.storeId);
        setPendingCount(pending.length);
      }
    }

    loadData();
    const interval = setInterval(loadData, 15000); // update every 15s
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (!navigator.onLine) {
      alert("Pas de connexion internet");
      return;
    }

    setIsSyncing(true);
    const result = await performFullSync();
    setIsSyncing(false);

    if (result.success) {
      alert("Synchronisation réussie !");
    } else {
      alert("Échec de la synchronisation");
    }
  };

  return (
    <nav className="shadow px-4 py-3 w-full">
      <div className="w-full bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {subscriptionDays !== null && (
            <span
              className={`text-sm px-4 py-1 ${
                subscriptionDays <= 7
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              } hidden md:inline font-normal rounded-full`}
            >
              Abonnement expire dans {subscriptionDays} jours
            </span>
          )}

          {/* Sync Button */}
          {pendingCount > 0 && (
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isSyncing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  Synchroniser ({pendingCount})
                </>
              )}
            </Button>
          )}
        </div>

        <span className="hidden md:inline-block">
          <UserMenu userEmail={userEmail} />
        </span>
      </div>

      {/* Mobile subscription message */}
      <div className="mt-2">
        {subscriptionDays !== null && (
          <div
            className={`text-sm px-4 py-1 ${
              subscriptionDays <= 7
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            } md:hidden font-normal rounded-full max-w-fit mx-auto`}
          >
            Il reste {subscriptionDays} jours avant l'expiration
          </div>
        )}
      </div>
    </nav>
  );
}



function UserMenu({ userEmail }: { userEmail: string | null }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <User size={24} className="text-green-800" />
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{userEmail || "Mon compte"}</DropdownMenuLabel>
        <DropdownMenuItem>
          <Link prefetch={false} href="/settings" className="flex items-center gap-2">
            Modifier le compte
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Button
            onClick={() => {
              const supabase = createSupabaseClient();
              supabase.auth.signOut();
            }}
            className="flex items-center gap-2 w-full text-red-500"
            variant="outline"
          >
            Se déconnecter
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}