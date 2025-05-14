// components/SubNavbar.tsx
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions";

export default async function SubNavbar() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("userId", user.id)
    .single();

  const userName = profile?.name || "User";

  return (
    <div className="w-full pb-3 border-b space-x-2 flex flex-col md:flex-row justify-between">
      <div className="min-w-fit">
        <h2>Welcome Back, {userName}</h2>
      </div>
      <div className="flex justify-end w-full mt-3 md:mt-0 space-x-2">
        <Button
          className="bg-blue-700 hover:text-gray-50 hover:bg-blue-800 text-gray-50"
          variant={"outline"}
        >
          New Sale
        </Button>
        <Button
          className="bg-red-700 hover:text-gray-50 hover:bg-red-800 text-gray-50"
          variant={"outline"}
        >
          New Expense
        </Button>
        <Button
          className="bg-gray-900 hover:text-gray-50 hover:bg-gray-950 text-gray-50"
          variant={"outline"}
        >
          Import Data
        </Button>
        <form action={logoutAction}>
          <Button
            type="submit"
            className="bg-gray-700 hover:text-gray-50 hover:bg-gray-800 text-gray-50 cursor-pointer"
            variant={"outline"}
            data-testid="logout-button" // For debugging
          >
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}