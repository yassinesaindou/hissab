import SideBarExample from "@/app/components/ShadSideBar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/app/components/Navbar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const user = session.user;

  // Check if user is an employee and get activation status
  const { data: employee, } = await supabase
    .from("employees")
    .select("isActive")
    .eq("employeeId", user.id)
    .single();

  // If employee exists and is deactivated → redirect
  if (employee && !employee.isActive) {
    redirect("/deactivated");
  }

  return (
    <SidebarProvider>
      <div className="flex w-screen h-screen overflow-hidden">
        {/* Sidebar */}
        <SideBarExample />

        {/* Right section */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="flex h-16 items-center border-b px-4 shrink-0">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Navbar />
          </header>

          {/* Main Content - Takes remaining height */}
          <main className="flex-1 overflow-auto p-4">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}