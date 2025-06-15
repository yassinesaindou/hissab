"use client";

import { Menu, User } from "lucide-react";
 
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
import {  supabaseClient } from "@/lib/supabase/client";

 

export default function Navbar({
  toggleSidebar,
}: {
  toggleSidebar: () => void;
}) {
  
   
  

  
  const [subscriptionDays, setSubscriptionDays] = useState<number | null>(null);
  useEffect(() => {
    async function fetchSubscriptionDays() { 
      const {data :{user}} = await supabaseClient.auth.getUser();
      
      console.log("User:", user);
      const {data: subscriptionData, error} = await supabaseClient
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

    } fetchSubscriptionDays();
  })

  return (
    <nav className="shadow px-4 py-3">
      {/* Hamburger only on mobile */}
      <div className="w-full bg-white  flex items-center     justify-between gap-4">
        <div>
          <button onClick={toggleSidebar} className="md:hidden text-green-800">
            <Menu size={24} />
          </button>
         {subscriptionDays && <span className={`text-sm px-4 py-1 ${subscriptionDays <= 7 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} hidden md:inline font-normal rounded-full text `}>
        Il reste {subscriptionDays} jours avant l&apos;expiration de votre abonnement.
        
        </span>}
        </div>
        <UserMenu />
      </div>
      <div>
        {subscriptionDays && <div className={`text-sm px-4 py-1 ${subscriptionDays <= 7 ? "bg-red-100" : "bg-green-100"} md:hidden  font-normal rounded-full max-w-fit text text-white/95 mx-auto`}>
        Il reste {subscriptionDays} jours avant l&apos;expiration de votre abonnement.
        
        </div>}
      </div>
    </nav>
  );
}



function UserMenu() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check initial session
    async function getInitialSession() {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      console.log("Initial session:", session, "Error:", error);
      setUserEmail(session?.user?.email || null);
    }
    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
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
          <Link href="/settings" className="flex items-center gap-2">
            Modifier le compte
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem >
          <Button onClick={logoutAction} className="flex items-center gap-2 w-full text-red-500" variant={"outline"}>
             Se déconnecter
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


