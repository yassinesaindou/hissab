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
import { AlertCircle, Calendar, RefreshCw, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

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
    <nav className="border-b bg-white px-4 py-3 w-full">
      <div className="w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Subscription Badge */}
          {subscriptionDays !== null && (
            <Badge
              variant={subscriptionDays <= 7 ? "destructive" : "default"}
              className={`flex items-center gap-1.5 text-xs font-medium ${
                subscriptionDays <= 7
                  ? "bg-red-100 text-red-700 hover:bg-red-100"
                  : "bg-green-100 text-green-700 hover:bg-green-100"
              }`}
            >
              <Calendar size={14} />
              <span className="hidden sm:inline">{subscriptionDays}j restants</span>
              <span className="sm:hidden">{subscriptionDays}j</span>
            </Badge>
          )}

          {/* Sync Button */}
          {pendingCount > 0 && (
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Synchro...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span className="
                  hidden sm:inline">Synchroniser</span>
                  <span className="
                  md:hidden sm:inline">Sync</span>
                  <Badge className="bg-orange-600 text-white hover:bg-orange-600 h-5 min-w-5 flex items-center justify-center px-1.5">
                    {pendingCount}
                  </Badge>
                </>
              )}
            </Button>
          )}
        </div>

        <UserMenu userEmail={userEmail} />
      </div>
    </nav>
  );
}



function UserMenu({ userEmail }: { userEmail: string | null }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10 bg-blue-100 flex items-center justify-center">
            <User size={20} className="text-blue-600" />
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Mon compte</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail || "Utilisateur"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link prefetch={false} href="/settings" className="cursor-pointer">
            Paramètres du compte
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 cursor-pointer"
          onClick={() => {
            const supabase = createSupabaseClient();
            supabase.auth.signOut();
          }}
        >
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}