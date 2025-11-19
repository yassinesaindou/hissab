// app/(protected)/layout.tsx  (or wherever your your MainLayout is)
import SideBarExample from "@/app/components/ShadSideBar";
import AuthProvider from "./AuthProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Navbar from "@/app/components/Navbar";
import { Separator } from "@/components/ui/separator";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const user = session.user;

  const { data: employee } = await supabase
    .from("employees")
    .select("isActive")
    .eq("employeeId", user.id)
    .single();

  if (employee && !employee.isActive) {
    redirect("/deactivated");
  }

  return (
    <SidebarProvider>
      {/* THIS LINE FIXES EVERYTHING */}
      <AuthProvider session={session} />

      <div className="flex w-screen h-screen overflow-hidden">
        <SideBarExample />

        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex h-16 items-center border-b px-4 shrink-0">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Navbar />
          </header>

          <main className="flex-1 overflow-auto p-4">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}