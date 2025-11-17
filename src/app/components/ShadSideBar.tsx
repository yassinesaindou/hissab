"use client";

import React, { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

import {
  Banknote,
  ChartBar,
  ChevronRight,
  FileText,
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
import { usePathname } from "next/navigation";

export default function SideBarExample({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [isAdmin, setIsAdmin] = useState(false);
  const pathName = usePathname();

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

  const navItems = [
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
    { label: "Paramètres", href: "/settings", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon" {...props} className="bg-blue-500">
      {/* HEADER */}
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Image src="/hissab.png" alt="Logo" width={150} height={40} />
        </div>
      </SidebarHeader>

      {/* MAIN NAVIGATION */}
      <SidebarContent>
        <SidebarMenu className="px-1 rounded-md">
          {navItems.map(({ label, href, icon: Icon }) => (
            <SidebarMenuItem
  key={href}
  className={`${pathName === href ? "bg-gray-300 text-blue-600 font-medium rounded-md" : ""} hover:bg-gray-300`}
>
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
        <form action={logoutAction} className="w-full">
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
