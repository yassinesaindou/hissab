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
  LogOut,
  Package,
  Settings,
  UserRoundMinus,
  Users,
  Wifi,
  WifiOff,
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
import { Badge } from "@/components/ui/badge";

export default function SideBarExample({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
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

  useEffect(() => {
    // Check online/offline status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Define navigation items based on user role, PWA mode, and online status
  const getNavItems = () => {
    // If offline, show only essential offline-capable routes
    if (!isOnline) {
      return [
        { label: "Acceuil", href: "/dashboard", icon: LayoutDashboard },
        { label: "Factures", href: "/invoices", icon: FileText },
      ];
    }

    // If PWA mode and online, show simplified navigation
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
    <Sidebar collapsible="icon" {...props} className="border-r bg-white">
      {/* HEADER */}
      <SidebarHeader className="border-b">
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="flex items-center gap-2">
            <Image 
              src="/hissab.png" 
              alt="Logo" 
              width={120} 
              height={32}
              className="object-contain" 
            />
          </div>
          <div className="flex items-center gap-2">
            {isPWA && (
              <Badge className="text-xs bg-blue-600 text-white hover:bg-blue-700 font-semibold px-2 py-0.5">
                PWA
              </Badge>
            )}
            {!isOnline && (
              <Badge variant="destructive" className="text-xs font-semibold px-2 py-0.5 flex items-center gap-1">
                <WifiOff size={12} />
                Hors ligne
              </Badge>
            )}
            {isOnline && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Wifi size={12} />
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>

      {/* MAIN NAVIGATION */}
      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-1">
          {navItems.map(({ label, href, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton 
                asChild 
                tooltip={label}
                className={`
                  group relative transition-all duration-200
                  ${
                    pathName === href
                      ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <Link
                  href={href}
                  prefetch={false}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg">
                  <span className="flex items-center gap-3">
                    <Icon 
                      size={20} 
                      className={`
                        transition-transform duration-200 group-hover:scale-110
                        ${pathName === href ? "stroke-[2.5]" : "stroke-[2]"}
                      `} 
                    />
                    <span className={`font-medium ${pathName === href ? "font-semibold" : ""}`}>
                      {label}
                    </span>
                  </span>
                  <ChevronRight 
                    size={18} 
                    className={`
                      transition-transform duration-200
                      ${pathName === href ? "translate-x-1" : "group-hover:translate-x-1"}
                    `}
                  />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="border-t p-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const supabase = createSupabaseClient();
            await supabase.auth.signOut();

            // After server logout succeeds, clear all local data
            await clearAllLocalData();

            // Optional: force refresh to clean state
            window.location.href = "/login";
          }}
          className="w-full">
          <Button
            type="submit"
            className="w-full justify-start gap-2 bg-red-600 hover:bg-red-700 text-white transition-all duration-200 group">
            <LogOut size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            <span className="font-medium">Se déconnecter</span>
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}