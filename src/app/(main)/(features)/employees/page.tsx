/* eslint-disable @typescript-eslint/no-explicit-any */
// app/employees/page.tsx
"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, UserCheck, UserX, Users, Search } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState(false);

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

  // === LOAD EMPLOYEES (isActive from employees table) ===
  useEffect(() => {
    async function loadEmployees() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("storeId")
          .eq("userId", user.id)
          .single();
        console.log("User profile:", profile);

        if (!profile?.storeId) {
          setLoading(false);
          return;
        }

       
 
// 1. Get employees for this store
const { data: employeesRaw } = await supabase
  .from("employees")
  .select("employeeId, isActive")
  .eq("storeId", profile.storeId);

if (!employeesRaw?.length) {
  setLoading(false);
  return;
}

// 2. Get profiles for those employee IDs
const employeeIds = employeesRaw.map((e) => e.employeeId);

const { data: profilesRaw } = await supabase
  .from("profiles")
  .select("userId, name, email, phoneNumber, created_at")
  .in("userId", employeeIds);

// 3. Merge
const formatted = employeesRaw.map((emp, i) => {
  const prof = profilesRaw?.find((p) => p.userId === emp.employeeId);
  return {
    id: i + 1,
    userId: emp.employeeId,
    name: prof?.name || "Inconnu",
    email: prof?.email || "",
    phone: prof?.phoneNumber || "N/A",
    created_at: prof?.created_at
      ? new Date(prof.created_at).toLocaleDateString("fr-FR")
      : "N/A",
    isActive: emp.isActive ?? true,
  };
});

setEmployees(formatted);

        setEmployees(formatted);
      } catch (err) {
        console.error("Failed to load employees:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, [supabase]);

  // === TOGGLE STATUS (updates employees table) ===
  const toggleStatus = async () => {
    if (!selected) return;
    setToggling(true);

    const newStatus = !selected.isActive;

    try {
      const { error } = await supabase
        .from("employees")
        .update({ isActive: newStatus })
        .eq("employeeId", selected.userId);

      if (error) throw error;

      setEmployees((prev) =>
        prev.map((e) =>
          e.userId === selected.userId ? { ...e, isActive: newStatus } : e
        )
      );

      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Échec de la mise à jour du statut");
    } finally {
      setToggling(false);
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = employees.filter((e) => e.isActive).length;
  const inactiveCount = employees.length - activeCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Chargement des employés
            </h3>
            <p className="text-gray-500 mt-1 text-sm">
              Récupération des données...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employés</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez les membres de votre équipe
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un employé
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CreateEmployeeForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{employees.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Actifs</p>
            <p className="text-xl font-bold text-gray-900">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
            <UserX className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Inactifs</p>
            <p className="text-xl font-bold text-gray-900">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* Search + Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">
                N°
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Nom
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Email
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                Téléphone
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                Ajouté le
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Statut
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-gray-400 text-sm"
                >
                  {search
                    ? "Aucun résultat pour cette recherche."
                    : "Aucun employé trouvé."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((emp) => (
                <TableRow
                  key={emp.userId}
                  className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                  onClick={() => {
                    setSelected(emp);
                    setIsModalOpen(true);
                  }}
                >
                  <TableCell className="text-gray-400 text-sm font-mono">
                    {emp.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {emp.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {emp.email}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm hidden md:table-cell">
                    {emp.phone}
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm hidden md:table-cell">
                    {emp.created_at}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        emp.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          emp.isActive ? "bg-green-500" : "bg-red-400"
                        }`}
                      />
                      {emp.isActive ? "Actif" : "Inactif"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {emp.isActive ? (
                      <UserCheck className="h-4 w-4 text-green-500 ml-auto" />
                    ) : (
                      <UserX className="h-4 w-4 text-red-400 ml-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Toggle Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Gérer l&apos;employé
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              {/* Avatar + info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selected.name}</p>
                  <p className="text-sm text-gray-500">{selected.email}</p>
                  <p className="text-sm text-gray-400">{selected.phone}</p>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-gray-600">Statut actuel</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    selected.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      selected.isActive ? "bg-green-500" : "bg-red-400"
                    }`}
                  />
                  {selected.isActive ? "Actif" : "Inactif"}
                </span>
              </div>

              <p className="text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                {selected.isActive
                  ? "Désactiver cet employé l'empêchera d'accéder à l'application."
                  : "Réactiver cet employé lui redonnera accès à l'application."}
              </p>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={toggling}
                >
                  Annuler
                </Button>
                <Button
                  onClick={toggleStatus}
                  disabled={toggling}
                  className={
                    selected.isActive
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }
                >
                  {toggling
                    ? "Mise à jour..."
                    : selected.isActive
                    ? "Désactiver"
                    : "Activer"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}