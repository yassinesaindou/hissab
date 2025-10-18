// components/Sidebar.tsx
"use client";
import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/lib/supabase/client";
import {
  Banknote,
  ChartBar,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  UserRoundMinus,
  Users,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const NavItem = ({
  icon,
  label,
  href,
  textColor = "text-white",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  textColor?: string;
  onClick?: () => void;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li>
      <Link
        prefetch={false}
        href={href}
        onClick={onClick}
        className={`flex items-center gap-3 py-2 px-4 rounded ${textColor} ${
          isActive ? "bg-blue-800" : "hover:bg-blue-800"
        }`}>
        {icon}
        {label}
      </Link>
    </li>
  );
};

export default function SidebarComponent({
  isOpen,
  closeSidebar,
}: {
  isOpen: boolean;
  closeSidebar: () => void;
  }) {
  
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = supabaseClient;
      const { data: { user } } = await supabase.auth.getUser();
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
  
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed md:relative z-50 h-full w-64 bg-blue-700 text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}>
        <div className="flex items-center justify-between text-3xl font-bold text-center py-5 px-4 border-b border-blue-600">
          <Image src={"/hissabw.png"} alt="Logo" width={170} height={'45'} />
          <button onClick={closeSidebar} className="md:hidden text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col justify-between h-[calc(100%-80px)]">
          <ul className="list-none px-2 pt-4 space-y-1">
            <NavItem
              icon={<LayoutDashboard size={20} />}
              label="Acceuil"
              href="/dashboard"
              onClick={closeSidebar}
            />
            <NavItem
              icon={<ChartBar size={20} />}
              label="Analytiques"
              href="/analytics"
              onClick={closeSidebar}
            />
            <NavItem
              icon={<Banknote size={20} />}
              label="Transactions"
              href="/transactions"
              onClick={closeSidebar}
            />
           {isAdmin && <NavItem
              icon={<UserRoundMinus size={20} />}
              label="Crédits"
              href="/credits"
              onClick={closeSidebar}
            />}
            <NavItem
              icon={<Package size={20} />}
              label="Articles"
              href="/products"
              onClick={closeSidebar}
            />
            <NavItem
              icon={<FileText size={20} />}
              label="Factures"
              href="/invoices"
              onClick={closeSidebar}
            />
           {isAdmin && <NavItem
              icon={<Users size={20} />}
              label="Employés"
              href="/employees"
              onClick={closeSidebar}
            />}
          </ul>

          <div className="list-none px-2 py-4 border-t border-blue-600 space-y-1">
            <NavItem
              icon={<Settings size={20} />}
              label="Paramètres"
              href="/settings"
              onClick={closeSidebar}
            />
            <form action={logoutAction}>
              <Button
                type="submit"
                className="w-full text-gray-200 cursor-pointer bg-red-700">
                Se déconnecter
              </Button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
