// app/(protected)/layout.tsx  (or wherever your your MainLayout is)
import SideBarExample from "@/app/components/ShadSideBar";
import AuthProvider from "./AuthProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Navbar from "@/app/components/Navbar";
import { Separator } from "@/components/ui/separator";
import EmployeeDeactivationGuard from "@/app/components/EmployeeDeactivationGuard";
import SyncBadge from "@/app/components/SyncBadge";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();

  let session = null;
  let employee = null;

  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;

    if (session) {
      const { data: emp } = await supabase
        .from("employees")
        .select("isActive")
        .eq("employeeId", session.user.id)
        .single();

      employee = emp;
    }
  } catch (err) {
    // Offline or network error → session = null, employee = null
    console.log("Offline or session error — allowing access for offline mode", err);
  }
  
  if (session === null) {
    // Do NOT redirect — could be offline
    // Let client-side code handle it
  } else if (employee && !employee.isActive) {
     
    redirect("/deactivated");
  }
  return (
    <SidebarProvider>
      <EmployeeDeactivationGuard />
      <SyncBadge />
      {/* THIS LINE FIXES EVERYTHING */}
      <AuthProvider session={null} />

      <div className="flex w-screen h-screen overflow-hidden">
        <SideBarExample />

        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex h-16 items-center border-b px-4 shrink-0">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Navbar />
          </header>

          <main className="flex-1 overflow-auto  ">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
