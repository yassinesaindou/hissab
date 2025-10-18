"use client";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";

import SidebarComponent from "../../components/SideBar";
import { supabaseClient } from "@/lib/supabase/client";
import { SyncLoader } from "react-spinners";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      const session = await supabaseClient.auth.getSession();
      if (!session.data.session) {
        window.location.href = "/login";
        console.log("No active session, redirecting to login.");
      } else {
        setIsLoading(false);
      }
    }
    fetchSession();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <SyncLoader
          color="#2563eb"
          loading={true}
          size={15}
          aria-label="Loading Spinner"
          data-testid="loader"
          className="mx-auto "
        />
      </div>
    );
  }

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
