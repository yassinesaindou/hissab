"use client";
import {
  Banknote,
  ChartBar,
  FileText,
  Home,
  Package,
  Settings,
  UserRoundMinus,
  X,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation"; // Import usePathname to get the current route
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";

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
  const pathname = usePathname(); // Get the current pathname
  const isActive = pathname === href; // Check if the current link is active

  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-3 py-2 px-4 rounded ${textColor} ${
          isActive ? "bg-blue-800" : "hover:bg-blue-800"
        }`} // Apply bg-blue-900 if active, otherwise apply on hover
      >
        {icon}
        {label}
      </Link>
    </li>
  );
};

export default function Sidebar({
  isOpen,
  closeSidebar,
}: {
  isOpen: boolean;
  closeSidebar: () => void;
}) {
  const router = useRouter();
  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
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
        {/* Logo */}
        <div className="flex items-center justify-between text-3xl font-bold text-center py-5 px-4 border-b border-blue-600">
          <h1>Hissab</h1>
          {/* Close button for mobile */}
          <button onClick={closeSidebar} className="md:hidden text-white">
            <X size={24} />
          </button>
        </div>

        {/* Flexbox layout for top & bottom nav */}
        <div className="flex flex-col justify-between h-[calc(100%-80px)]">
          <ul className="list-none px-2 pt-4 space-y-1">
            <NavItem
              icon={<Home size={20} />}
              label="Dashboard"
              href="/"
              onClick={closeSidebar}
            />
            <NavItem
              icon={<ChartBar size={20} />}
              label="Analytics"
              href="/analytics"
              onClick={closeSidebar}
            />
            <NavItem
              icon={<Banknote size={20} />}
              label="Transactions"
              href="/transactions"
              onClick={closeSidebar}
            />
            <NavItem
              icon={<UserRoundMinus size={20} />}
              label="Credits"
              href="/credits"
              onClick={closeSidebar}
            />
            <NavItem
              icon={<Package size={20} />}
              label="Products"
              href="/products"
              onClick={closeSidebar}
            />

            <NavItem
              icon={<FileText size={20} />}
              label="Invoices"
              href="/invoices"
              onClick={closeSidebar}
            />
          </ul>

          <div className="list-none px-2 py-4 border-t border-blue-600 space-y-1">
            <NavItem
              icon={<Settings size={20} />}
              label="Settings"
              href="/settings"
              onClick={closeSidebar}
            />
            <Button
              className="w-full text-gray-200 cursor-pointer bg-red-700"
              onClick={
                () => {
                  router.push("/login");
                } // Redirect to login page after sign out
              }>
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
