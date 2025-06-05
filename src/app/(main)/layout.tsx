"use client";
import { useState } from "react";
import Navbar from "../components/Navbar";

import SidebarComponent from "../components/SideBar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarComponent
        isOpen={isSidebarOpen}
        closeSidebar={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col w-full overflow-auto">
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}
