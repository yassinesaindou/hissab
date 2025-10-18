import { getEmployeesByStore } from "@/app/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import CreateEmployeeForm from "./createEmployeeForm";

import clsx from "clsx"; // for conditional classNames

// Helper to pick a color based on first letter
function getAvatarColor(letter: string) {
  const colors = [
    "bg-red-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
  ];
  const index = letter.charCodeAt(0) % colors.length;
  return colors[index];
}

export default async function EmployeesPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, storeId")
    .eq("userId", user.id)
    .single();

  
  console.log("This is the profile's role",profile?.role)
  if (profile?.role !== "user" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { success, message, employees } = await getEmployeesByStore();

  if (!success) {
    return (
      <div className="p-4">
        <p className="text-red-500">{message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employés</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
              Ajouter un employé
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créer un compte employé</DialogTitle>
            </DialogHeader>
            <CreateEmployeeForm />
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Avatar</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Date de création</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Aucun employé trouvé.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => {
                const firstLetter = employee.name
                  ? employee.name.charAt(0).toUpperCase()
                  : "?";
                const colorClass = getAvatarColor(firstLetter);
                return (
                  <TableRow key={employee.userId}>
                    <TableCell>{employee.id}</TableCell>
                    <TableCell>
                      <div
                        className={clsx(
                          "w-8 h-8 flex items-center justify-center rounded-full text-white font-bold",
                          colorClass
                        )}>
                        {firstLetter}
                      </div>
                    </TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>{employee.created_at}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
