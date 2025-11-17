// app/employees/page.tsx
'use client';
import { useEffect, useState } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import CreateEmployeeForm from './createEmployeeForm';
import { Loader2, PlusCircle, UserCheck, UserX } from 'lucide-react';

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
  

  useEffect(() => { /* auth guard */ }, []);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/employees/data');
      if (!res.ok) { /* redirect */ return; }
      const data = await res.json();
      setEmployees(data.employees);
      setLoading(false);
    }
    load();
  }, []);

  const toggleStatus = async () => {
    if (!selected) return;
    const formData = new FormData();
    formData.append("employeeId", selected.userId);
    formData.append("activate", (!selected.isActive).toString());

    const res = await fetch("/api/employees/toggle", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();

    if (result.success) {
      setEmployees(emps => emps.map(e =>
        e.userId === selected.userId ? { ...e, isActive: !e.isActive } : e
      ));
      setIsModalOpen(false);
    } else {
      alert(result.message);
    }
  };

   if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">Chargement...</span>
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
          <DialogContent><CreateEmployeeForm /></DialogContent>
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
            <TableRow key={emp.userId} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelected(emp); setIsModalOpen(true); }}>
              <TableCell>{emp.id}</TableCell>
              <TableCell className="font-medium">{emp.name}</TableCell>
              <TableCell>{emp.email}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {emp.isActive ? 'Actif' : 'Inactif'}
                </span>
              </TableCell>
              <TableCell>
                {emp.isActive ? <UserCheck className="h-5 w-5 text-green-600" /> : <UserX className="h-5 w-5 text-red-600" />}
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
              <p><strong>Statut:</strong> <span className={selected.isActive ? 'text-green-600' : 'text-red-600'}>{selected.isActive ? 'Actif' : 'Inactif'}</span></p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button
                  onClick={toggleStatus}
                  className={selected.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                >
                  {selected.isActive ? 'Désactiver' : 'Activer'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}