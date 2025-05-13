"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";

export default function Navbar({
  toggleSidebar,
}: {
  toggleSidebar: () => void;
}) {
  let path = usePathname();
  path = path.replace("/", "");

  return (
    <nav className="w-full bg-white shadow px-4 py-3 flex items-center gap-4">
      {/* Hamburger only on mobile */}
      <button onClick={toggleSidebar} className="md:hidden text-green-800">
        <Menu size={24} />
      </button>
      <span className="text-lg font-semibold">
        {!path ? "DASHBOARD" : path.toUpperCase()}
      </span>
    </nav>
  );
}
