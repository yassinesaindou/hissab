/* eslint-disable @typescript-eslint/no-explicit-any */
// app/employees/page.tsx
"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, UserCheck, UserX } from "lucide-react";
import CreateEmployeeForm from "./createEmployeeForm";

type Employee = {
  id: number;
  userId: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  isActive: boolean;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();
  const supabase = createSupabaseClient();

  // === AUTH + ADMIN CHECK ===
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      supabase
        .from("profiles")
        .select("role")
        .eq("userId", user.id)
        .single()
        .then(({ data }) => {
          if (!data || !["user", "admin"].includes(data.role)) {
            router.replace("/dashboard");
          }
        });
    });
  }, [supabase, router]);

  // === LOAD EMPLOYEES ===
  useEffect(() => {
    async function loadEmployees() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("storeId")
          .eq("userId", user.id)
          .single();

        if (!profile?.storeId) {
          setLoading(false);
          return;
        }

        const { data: employeesData } = await supabase
          .from("profiles")
          .select("userId, name, email, phoneNumber, created_at, isActive")
          .eq("storeId", profile.storeId)
          .eq("role", "employee")
          .order("created_at", { ascending: false });

        const formatted = (employeesData || []).map((emp, i) => ({
          id: i + 1,
          userId: emp.userId,
          name: emp.name || "Inconnu",
          email: emp.email || "",
          phone: emp.phoneNumber || "N/A",
          created_at: new Date(emp.created_at).toLocaleDateString("fr-FR"),
          isActive: emp.isActive ?? true,
        }));

        setEmployees(formatted);
      } catch (err) {
        console.error("Failed to load employees:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, [supabase]);

  // === TOGGLE STATUS (client-side + direct Supabase update) ===
  const toggleStatus = async () => {
    if (!selected) return;

    const newStatus = !selected.isActive;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ isActive: newStatus })
        .eq("userId", selected.userId);

      if (error) throw error;

      setEmployees(prev =>
        prev.map(e =>
          e.userId === selected.userId ? { ...e, isActive: newStatus } : e
        )
      );

      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Échec de la mise à jour du statut");
    }
  };

 if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Chargement des employés</h3>
            <p className="text-gray-600 mt-1">Récupération des données...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Employés</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <PlusCircle className="mr-2 h-5 w-5" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CreateEmployeeForm />
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N°</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => (
            <TableRow
              key={emp.userId}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => {
                setSelected(emp);
                setIsModalOpen(true);
              }}
            >
              <TableCell>{emp.id}</TableCell>
              <TableCell className="font-medium">{emp.name}</TableCell>
              <TableCell>{emp.email}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    emp.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {emp.isActive ? "Actif" : "Inactif"}
                </span>
              </TableCell>
              <TableCell>
                {emp.isActive ? (
                  <UserCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <UserX className="h-5 w-5 text-red-600" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Toggle Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer l&apos;employé</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p><strong>Nom:</strong> {selected.name}</p>
              <p><strong>Email:</strong> {selected.email}</p>
              <p>
                <strong>Statut:</strong>{" "}
                <span className={selected.isActive ? "text-green-600" : "text-red-600"}>
                  {selected.isActive ? "Actif" : "Inactif"}
                </span>
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={toggleStatus}
                  className={selected.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {selected.isActive ? "Désactiver" : "Activer"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}