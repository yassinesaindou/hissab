// app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import {
  Building2,
  Users,
  CreditCard,
  Settings,
  Save,
  ChevronDown,
  ChevronUp,
  Crown,
  UserCheck,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Store = {
  storeId: string;
  storeName: string;
  storeAddress: string;
  storePhoneNumber: string;
};
type Employee = { userId: string; name: string; email: string; role: string };
type Plan = { name: string; price: number };
type Subscription = { endAt: string };

export default function SettingsPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [plan, setPlan] = useState<Plan>({ name: "Gratuit", price: 0 });
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [collapsed, setCollapsed] = useState({
    company: false,
    users: false,
    billing: false,
  });

  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("storeId")
        .eq("userId", user.id)
        .single();

      const { data:sub } = await supabase.from('subscriptions').select('*').eq('storeId', profile?.storeId).single();
      

      console.log('SUBSCRIPTION DATA',sub);
      
      
      if (!profile?.storeId) {
        setLoading(false);
        return;
      }

      const [storeRes, employeesRes, subRes, planRes] = await Promise.all([
        supabase
          .from("stores")
          .select("*")
          .eq("storeId", profile.storeId)
          .single(),
        supabase
          .from("profiles")
          .select("userId, name, email, role")
          .eq("storeId", profile.storeId),
        supabase
          .from("subscriptions")
          .select("endAt")
          .eq("storeId", profile.storeId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        
        supabase
          .from("subscriptions")
          .select("planId")
          .eq("storeId", profile.storeId)
          .single()
          .then(async (res) => {
            if (res.data?.planId) {
              const { data } = await supabase
                .from("plans")
                .select("name, price")
                .eq("planId", res.data.planId)
                .single();
              return data || { name: "Inconnu", price: 0 };
            }
            return { name: "Gratuit", price: 0 };
          }),
      ]);

      setStore(storeRes.data);
      setEmployees(employeesRes.data || []);
      setSubscription(subRes.data || null);
      setPlan(planRes);

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  console.log('PLan and details',plan);

  const saveStore = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        storeName: store.storeName,
        storeAddress: store.storeAddress,
        storePhoneNumber: store.storePhoneNumber,
      })
      .eq("storeId", store.storeId);

    setSaving(false);
    if (error) {
      alert("Erreur lors de la sauvegarde : " + error.message);
    } else {
      alert("Modifications enregistrées avec succès !");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="ml-4 text-lg font-medium">
          Chargement des paramètres...
        </span>
      </div>
    );
  }

  return (
    <main className="p-6 lg:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        </div>

        {/* COMPANY INFO — FULLY EDITABLE */}
        <Card>
          <CardHeader
            className="cursor-pointer flex flex-row items-center justify-between"
            onClick={() =>
              setCollapsed({ ...collapsed, company: !collapsed.company })
            }>
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle>Informations de la boutique</CardTitle>
                <CardDescription>Nom, adresse et téléphone</CardDescription>
              </div>
            </div>
            {collapsed.company ? <ChevronDown /> : <ChevronUp />}
          </CardHeader>

          {!collapsed.company && store && (
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Nom de la boutique</Label>
                  <Input
                    value={store.storeName}
                    onChange={(e) =>
                      setStore({ ...store, storeName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={store.storePhoneNumber}
                    onChange={(e) =>
                      setStore({ ...store, storePhoneNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adresse complète</Label>
                <Textarea
                  value={store.storeAddress}
                  onChange={(e) =>
                    setStore({ ...store, storeAddress: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={saveStore} disabled={saving}>
                  {saving ? (
                    "Enregistrement..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* USERS */}
        <Card>
          <CardHeader
            className="cursor-pointer flex flex-row items-center justify-between"
            onClick={() =>
              setCollapsed({ ...collapsed, users: !collapsed.users })
            }>
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-600" />
              <CardTitle>Utilisateurs ({employees.length})</CardTitle>
            </div>
            {collapsed.users ? <ChevronDown /> : <ChevronUp />}
          </CardHeader>

          {!collapsed.users && (
            <CardContent className="space-y-4 pt-4">
              {employees.map((emp) => (
                <div
                  key={emp.userId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {emp.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {emp.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      emp.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }>
                    {emp.role === "admin" ? (
                      <Crown className="w-4 h-4 mr-1" />
                    ) : (
                      <UserCheck className="w-4 h-4 mr-1" />
                    )}
                    {emp.role === "admin" ? "Admin" : "Employé"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* SUBSCRIPTION — REAL PLAN FROM DATABASE */}
        <Card>
          <CardHeader
            className="cursor-pointer flex flex-row items-center justify-between"
            onClick={() =>
              setCollapsed({ ...collapsed, billing: !collapsed.billing })
            }>
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-emerald-600" />
              <CardTitle>Abonnement actuel</CardTitle>
            </div>
            {collapsed.billing ? <ChevronDown /> : <ChevronUp />}
          </CardHeader>

          {!collapsed.billing && (
            <CardContent className="pt-6">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-8 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-emerald-800">
                      {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
                    </h3>
                    <p className="text-4xl font-bold text-emerald-700 mt-3">
                      {plan.price.toLocaleString()} KMF
                      <span className="text-lg font-normal text-emerald-600">
                        {" "}
                        / mois
                      </span>
                    </p>
                    {subscription && (
                      <p className="text-sm text-emerald-700 mt-3">
                        Valable jusqu&apos;au{" "}
                        <strong>
                          {format(
                            new Date(subscription.endAt),
                            "dd MMMM yyyy",
                            { locale: fr }
                          )}
                        </strong>
                      </p>
                    )}
                  </div>
                  <Badge className="text-xl px-6 py-3 bg-emerald-600 text-white">
                    ACTIF
                  </Badge>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-center text-amber-800 font-medium">
                  Paiement via Mvola au numéro{" "}
                  <strong className="text-xl">4107958</strong>
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </main>
  );
}
