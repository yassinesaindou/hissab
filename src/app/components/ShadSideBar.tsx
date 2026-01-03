/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

import {
  Banknote,
  ChartBar,
  ChevronRight,
  FileText,
  FolderArchive,
  LayoutDashboard,
  Package,
  Settings,
  UserRoundMinus,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";

import { createSupabaseClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { clearAllLocalData } from "@/lib/offline/session";

export default function SideBarExample({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const pathName = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("userId", user.id)
          .single();

        setIsAdmin(data?.role === "admin" || data?.role === "user");
      }
    }

    checkAdmin();
  }, []);

  useEffect(() => {
    // Check if app is running as PWA (standalone)
    const checkPWA = () => {
      if (typeof window === "undefined") return;
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      setIsPWA(isStandalone || (window as any).navigator.standalone);
    };

    if (typeof window !== "undefined") {
      checkPWA();

      // Listen for display mode changes
      const mediaQuery = window.matchMedia("(display-mode: standalone)");
      mediaQuery.addEventListener("change", checkPWA);

      return () => {
        mediaQuery.removeEventListener("change", checkPWA);
      };
    }
  }, []);

  // Define navigation items based on user role and PWA mode
  const getNavItems = () => {
    // If PWA mode, show simplified navigation
    if (isPWA) {
      const pwaItems = [
        { label: "Acceuil", href: "/dashboard", icon: LayoutDashboard },
        { label: "Transactions", href: "/transactions", icon: Banknote },
        { label: "Articles", href: "/products", icon: Package },
        { label: "Factures", href: "/invoices", icon: FileText },
      ];

      // Add admin-only items if admin in PWA mode
      if (isAdmin) {
        pwaItems.splice(2, 0, {
          label: "Crédits",
          href: "/credits",
          icon: UserRoundMinus,
        });
      }

      return pwaItems;
    }

    // Regular web app - full navigation based on role
    const baseItems = [
      { label: "Acceuil", href: "/dashboard", icon: LayoutDashboard },
      { label: "Analytiques", href: "/analytics", icon: ChartBar },
      { label: "Transactions", href: "/transactions", icon: Banknote },
      ...(isAdmin
        ? [{ label: "Crédits", href: "/credits", icon: UserRoundMinus }]
        : []),
      { label: "Articles", href: "/products", icon: Package },
      { label: "Factures", href: "/invoices", icon: FileText },
      ...(isAdmin
        ? [{ label: "Employés", href: "/employees", icon: Users }]
        : []),
      ...(isAdmin
        ? [{ label: "Archives", href: "/archives", icon: FolderArchive }]
        : []),
      { label: "Paramètres", href: "/settings", icon: Settings },
    ];

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <Sidebar collapsible="icon" {...props} className="bg-blue-500">
      {/* HEADER */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Image src="/hissab.png" alt="Logo" width={150} height={40} />
          {isPWA && (
            <span className="text-xs bg-white text-blue-600 px-2 py-0.5 rounded-full">
              PWA
            </span>
          )}
        </div>
      </SidebarHeader>

      {/* MAIN NAVIGATION */}
      <SidebarContent>
        <SidebarMenu className="px-1 rounded-md">
          {navItems.map(({ label, href, icon: Icon }) => (
            <SidebarMenuItem
              key={href}
              className={`${
                pathName === href
                  ? "bg-gray-300 text-blue-600 font-medium rounded-md"
                  : ""
              } hover:bg-gray-300`}>
              <SidebarMenuButton asChild tooltip={label}>
                <Link
                  href={href}
                  prefetch={false}
                  className="flex items-center justify-between gap-3 px-6 py-5 ">
                  <span className="flex gap-3 ">
                    <Icon size={18} className="font-light" />
                    <span>{label}</span>
                  </span>
                  <ChevronRight />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter>
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const supabase = createSupabaseClient();
            await supabase.auth.signOut();

            // After server logout succeeds, clear all local data
            await clearAllLocalData(); // ← This clears IndexedDB

            // Optional: force refresh to clean state
            window.location.href = "/login";
          }}
          className="w-full">
          <Button
            type="submit"
            className="w-full justify-start bg-red-700 hover:bg-red-800 text-white">
            Se déconnecter
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
