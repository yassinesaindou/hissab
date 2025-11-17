"use client";

import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { logoutAction } from "../actions";
import { createSupabaseClient } from "@/lib/supabase/client";
import { User } from "lucide-react";

export default function Navbar() {
  const [subscriptionDays, setSubscriptionDays] = useState<number | null>(null);
  useEffect(() => {
    async function fetchSubscriptionDays() {
      const {
        data: { user },
      } = await createSupabaseClient().auth.getUser();

      console.log("User:", user);
      const { data: subscriptionData, error } = await createSupabaseClient()
        .from("subscriptions")
        .select("endAt")
        .eq("userId", user?.id)
        .single();

      if (error) {
        console.error("Error fetching subscription data:", error);
        return;
      }
      if (subscriptionData && subscriptionData.endAt) {
        const endAt = new Date(subscriptionData.endAt);
        const today = new Date();
        const diffTime = endAt.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log("Subscription days left:", diffDays);
        setSubscriptionDays(diffDays);
      } else {
        console.log("No subscription data found or endAt is null.");
      }
    }
    fetchSubscriptionDays();
  });

  return (
    <nav className="shadow px-4 py-3 w-full">
      {/* Hamburger only on mobile */}
      <div className="w-full bg-white  flex items-center justify-between gap-4">
        <div>
          {subscriptionDays && (
            <span
              className={`text-sm px-4 py-1 ${
                subscriptionDays <= 7
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              } hidden md:inline font-normal rounded-full text `}>
              Votre abonnement expire dans {subscriptionDays} jours
            </span>
          )}
        </div>
        <span className="hidden md:inline-block">
          <UserMenu />
        </span>
      </div>
      <div>
        {subscriptionDays && (
          <div
            className={`text-sm px-4 py-1 ${
              subscriptionDays <= 7
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            } md:hidden  font-normal rounded-full max-w-fit text mx-auto`}>
            Il reste {subscriptionDays} jours avant l&apos;expiration de votre
            abonnement.
          </div>
        )}
      </div>
    </nav>
  );
}

function UserMenu() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check initial session
    async function getInitialSession() {
      const {
        data: { session },
        error,
      } = await createSupabaseClient().auth.getSession();
      console.log("Initial session:", session, "Error:", error);
      setUserEmail(session?.user?.email || null);
    }
    getInitialSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = createSupabaseClient().auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, "Session:", session);
      setUserEmail(session?.user?.email || null);
    });

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
          <Link
            prefetch={false}
            href="/settings"
            className="flex items-center gap-2">
            Modifier le compte
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Button
            onClick={logoutAction}
            className="flex items-center gap-2 w-full text-red-500"
            variant={"outline"}>
            Se déconnecter
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
