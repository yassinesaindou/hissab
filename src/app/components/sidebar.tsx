import {
  Banknote,
  ChartBar,
  FileText,
  Home,
  LogOut,
  Package,
  Settings,
  UserRoundMinus,
  X,
} from "lucide-react";
import Link from "next/link";
import React from "react";

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
}) => (
  <li>
    <Link
      href={href}
      onClick={onClick} // Close sidebar on mobile when a link is clicked
      className={`flex items-center gap-3 py-2 px-4 hover:bg-green-400 rounded ${textColor}`}>
      {icon}
      {label}
    </Link>
  </li>
);

export default function Sidebar({
  isOpen,
  closeSidebar,
}: {
  isOpen: boolean;
  closeSidebar: () => void;
}) {
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
        className={`fixed md:relative z-50 h-full w-64 bg-green-800 text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}>
        {/* Logo */}
        <div className="flex items-center justify-between text-3xl font-bold text-center py-5 px-4 border-b border-green-700">
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
              icon={<ChartBar size={20} />}
              label="Analytics"
              href="/analytics"
              onClick={closeSidebar}
            />
            <NavItem
              icon={<FileText size={20} />}
              label="Invoices"
              href="/invoices"
              onClick={closeSidebar}
            />
          </ul>

          <div className="list-none px-2 py-4 border-t border-green-700 space-y-1">
            <NavItem
              icon={<Settings size={20} />}
              label="Settings"
              href="/settings"
              onClick={closeSidebar}
            />
            <NavItem
              icon={<LogOut size={20} />}
              label="Logout"
              href="/logout"
              textColor="text-red-200"
              onClick={closeSidebar}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
