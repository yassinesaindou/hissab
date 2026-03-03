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
import { clearAllLocalData, getUserProfile } from "@/lib/offline/session";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function SideBarExample({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [planName, setPlanName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathName = usePathname();
  const router = useRouter();

  // Check if user is admin and get plan info
  useEffect(() => {
    async function checkAdminAndPlan() {
      setIsLoading(true);

      if (navigator.onLine) {
        // === ONLINE: Get from Supabase ===
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

          // Get subscription plan
          const { data: subscriptionData } = await supabase
            .from("subscriptions")
            .select("planId, plans(name)")
            .eq("userId", user.id)
            .single();

          if (subscriptionData?.plans) {
            const plans = subscriptionData.plans as unknown as any;
            const plan = Array.isArray(plans)
              ? plans[0]?.name ?? null
              : plans?.name ?? null;
            setPlanName(plan);
          }
        }
      } else {
        // === OFFLINE: Get from cache ===
        const profile = await getUserProfile();
        if (profile) {
          setIsAdmin(profile.role === "admin" || profile.role === "user");
          setPlanName(profile.planName ?? null);
        }
      }

      setIsLoading(false);
    }

    checkAdminAndPlan();
  }, [isOnline]);

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
  const getNavItems = (): NavItem[] => {
    const isStarterPlan = planName === "starter" || planName === "Starter";
    const isPro = planName === "pro" || planName === "Pro";
    const isEntreprise =
      planName === "entreprise" || planName === "Entreprise";
    const isPaidPlan = isPro || isEntreprise;

    // === OFFLINE PWA ===
    if (!isOnline && isPWA) {
      // Starter: Only dashboard
      if (isStarterPlan) {
        return [
          { label: "Acceuil", href: "/dashboard", icon: LayoutDashboard },
        ];
      }

      // Pro & Entreprise: Dashboard + Invoices
      const offlineItems: NavItem[] = [
        { label: "Acceuil", href: "/dashboard", icon: LayoutDashboard },
        { label: "Factures", href: "/invoices", icon: FileText },
      ];

      return offlineItems;
    }

    // === ONLINE (PWA or Web) ===
    // Starter: Everything except Invoices
    if (isStarterPlan) {
      const starterItems: NavItem[] = [
        { label: "Acceuil", href: "/dashboard", icon: LayoutDashboard },
        { label: "Analytiques", href: "/analytics", icon: ChartBar },
        { label: "Transactions", href: "/transactions", icon: Banknote },
        { label: "Articles", href: "/products", icon: Package },
      ];

      if (isAdmin) {
        starterItems.push(
          { label: "Crédits", href: "/credits", icon: UserRoundMinus },
          { label: "Employés", href: "/employees", icon: Users },
          { label: "Archives", href: "/archives", icon: FolderArchive }
        );
      }

      starterItems.push({ label: "Paramètres", href: "/settings", icon: Settings });

      return starterItems;
    }

    // Pro & Entreprise: Everything including Invoices
    if (isPaidPlan) {
      const paidItems: NavItem[] = [
        { label: "Acceuil", href: "/dashboard", icon: LayoutDashboard },
        { label: "Analytiques", href: "/analytics", icon: ChartBar },
        { label: "Transactions", href: "/transactions", icon: Banknote },
        { label: "Articles", href: "/products", icon: Package },
        { label: "Factures", href: "/invoices", icon: FileText },
      ];

      if (isAdmin) {
        paidItems.push(
          { label: "Crédits", href: "/credits", icon: UserRoundMinus },
          { label: "Employés", href: "/employees", icon: Users },
          { label: "Archives", href: "/archives", icon: FolderArchive }
        );
      }

      paidItems.push({ label: "Paramètres", href: "/settings", icon: Settings });

      return paidItems;
    }

    // Fallback: Default navigation (shouldn't reach here)
    return [
      { label: "Acceuil", href: "/dashboard", icon: LayoutDashboard },
    ];
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
              <Badge
                variant="destructive"
                className="text-xs font-semibold px-2 py-0.5 flex items-center gap-1"
              >
                <WifiOff size={12} />
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Chargement...</div>
          </div>
        ) : (
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
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg"
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        size={20}
                        className={`
                        transition-transform duration-200 group-hover:scale-110
                        ${pathName === href ? "stroke-[2.5]" : "stroke-[2]"}
                      `}
                      />
                      <span
                        className={`font-medium ${
                          pathName === href ? "font-semibold" : ""
                        }`}
                      >
                        {label}
                      </span>
                    </span>
                    <ChevronRight
                      size={18}
                      className={`
                      transition-transform duration-200
                      ${
                        pathName === href
                          ? "translate-x-1"
                          : "group-hover:translate-x-1"
                      }
                    `}
                    />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
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
          className="w-full"
        >
          <Button
            type="submit"
            className="w-full justify-start gap-2 bg-red-600 hover:bg-red-700 text-white transition-all duration-200 group"
          >
            <LogOut
              size={18}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
            <span className="font-medium">Se déconnecter</span>
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}