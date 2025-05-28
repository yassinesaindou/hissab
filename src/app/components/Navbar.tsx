"use client";

import { Menu, User } from "lucide-react";
import { usePathname } from "next/navigation";
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
  let path = usePathname();
  path = path.replace("/", "");

  return (
    <nav className="w-full bg-white shadow px-4 py-3 flex items-center justify-between gap-4">
      {/* Hamburger only on mobile */}
      <div>
        <button onClick={toggleSidebar} className="md:hidden text-green-800">
          <Menu size={24} />
        </button>
        <span className="text-lg font-semibold">
          {!path ? "DASHBOARD" : path.toUpperCase()}
        </span>
      </div>

      <UserMenu />
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
        <DropdownMenuLabel>{userEmail || "My Account"}</DropdownMenuLabel>
        <DropdownMenuItem>
          <Link href="/settings" className="flex items-center gap-2">
            Update My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem >
          <Button onClick={logoutAction} className="flex items-center gap-2 w-full text-red-500" variant={"outline"}>
            Logout
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


