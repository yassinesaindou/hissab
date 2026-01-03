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
  CheckCircle,
  AlertCircle,
  Clock,
  CalendarDays,
  Plus,
  Key,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { submitPaymentCode } from "./actions/action";

type Store = {
  storeId: string;
  storeName: string;
  storeAddress: string;
  storePhoneNumber: string;
};

type Employee = { 
  userId: string; 
  name: string; 
  email: string; 
  role: string 
};

type Plan = { 
  planId: number;
  name: string; 
  price: number;
  numberOfUsers: number;
  transactionsPerDay: number;
};

type Subscription = { 
  endAt: string;
  planId: number;
  subscriptionId: string;
};

type SubscriptionCode = {
  codeId: string;
  code: string;
  createdAt: string;
  isSettled: boolean;
};

export default function SettingsPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan>({ 
    planId: 0, 
    name: "Gratuit", 
    price: 0, 
    numberOfUsers: 1, 
    transactionsPerDay: 10 
  });
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionCodes, setSubscriptionCodes] = useState<SubscriptionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCode, setPaymentCode] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [submittingCode, setSubmittingCode] = useState(false);
  const [codeResult, setCodeResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const [collapsed, setCollapsed] = useState({
    company: false,
    users: false,
    billing: false,
    subscriptionCodes: false,
  });

  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("storeId, role")
          .eq("userId", user.id)
          .single();

        if (profileError) {
          console.error("Failed to fetch profile:", profileError);
          setLoading(false);
          return;
        }

        if (!profile?.storeId) {
          setLoading(false);
          return;
        }

        // Load all data in parallel
        const [
          storeRes,
          employeesRes,
          subscriptionRes,
          plansRes,
          codesRes
        ] = await Promise.all([
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
            .select("*")
            .eq("storeId", profile.storeId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from("plans")
            .select("*")
            .order("planId", { ascending: true }),
          supabase
            .from("subscription_codes")
            .select("*")
            .eq("storeId", profile.storeId)
            .order("createdAt", { ascending: false })
        ]);

        // Set store data
        if (storeRes.data) {
          setStore(storeRes.data);
        }

        // Set employees data
        if (employeesRes.data) {
          setEmployees(employeesRes.data);
        }

        // Set subscription data
        if (subscriptionRes.data) {
          setSubscription(subscriptionRes.data);
          
          // Find current plan
          if (plansRes.data) {
            const currentPlanData = plansRes.data.find(
              (plan: Plan) => plan.planId === subscriptionRes.data.planId
            );
            if (currentPlanData) {
              setCurrentPlan(currentPlanData);
            }
          }
        }

        // Set plans data
        if (plansRes.data) {
          setPlans(plansRes.data);
        }

        // Set subscription codes
        if (codesRes.data) {
          setSubscriptionCodes(codesRes.data);
        }

      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase, router]);

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

  const handleSubmitPaymentCode = async () => {
    if (!paymentCode.trim() || !selectedPlan) {
      setCodeResult({ 
        success: false, 
        error: "Veuillez sélectionner un plan et entrer un code" 
      });
      return;
    }

    setSubmittingCode(true);
    setCodeResult(null);

    try {
      const formData = new FormData();
      formData.append("code", paymentCode);
      formData.append("planId", selectedPlan.toString());

      const result = await submitPaymentCode(formData);
      
      setCodeResult(result);

      if (result.success) {
        // Clear form and close modal after delay
        setTimeout(() => {
          setPaymentCode("");
          setSelectedPlan(null);
          setShowPaymentModal(false);
          setCodeResult(null);
          
          // Reload the page to update subscription info
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setCodeResult({ 
        success: false, 
        error: "Une erreur s'est produite lors de la soumission" 
      });
      console.error("Payment code submission error:", error);
    } finally {
      setSubmittingCode(false);
    }
  };

  // Calculate subscription status
  const getSubscriptionStatus = () => {
    if (!subscription?.endAt) {
      return { status: "inactive", label: "Inactif", color: "bg-gray-100 text-gray-700" };
    }

    const endDate = new Date(subscription.endAt);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { 
        status: "expired", 
        label: "Expiré", 
        color: "bg-red-100 text-red-700",
        daysRemaining: 0
      };
    } else if (daysRemaining <= 7) {
      return { 
        status: "expiring", 
        label: "Expire bientôt", 
        color: "bg-amber-100 text-amber-700",
        daysRemaining
      };
    } else {
      return { 
        status: "active", 
        label: "Actif", 
        color: "bg-emerald-100 text-emerald-700",
        daysRemaining
      };
    }
  };

  const subscriptionStatus = getSubscriptionStatus();

 if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Chargement des paramètres</h3>
            <p className="text-gray-600 mt-1">Récupération des données...</p>
          </div>
        </div>
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

        {/* COMPANY INFO */}
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
                    value={store.storeName || ""}
                    onChange={(e) =>
                      setStore({ ...store, storeName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={store.storePhoneNumber || ""}
                    onChange={(e) =>
                      setStore({ ...store, storePhoneNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adresse complète</Label>
                <Textarea
                  value={store.storeAddress || ""}
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
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{emp.name || "Sans nom"}</p>
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

        {/* SUBSCRIPTION & BILLING */}
        <Card>
          <CardHeader
            className="cursor-pointer flex flex-row items-center justify-between"
            onClick={() =>
              setCollapsed({ ...collapsed, billing: !collapsed.billing })
            }>
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-emerald-600" />
              <CardTitle>Abonnement & Facturation</CardTitle>
            </div>
            {collapsed.billing ? <ChevronDown /> : <ChevronUp />}
          </CardHeader>

          {!collapsed.billing && (
            <CardContent className="space-y-6 pt-6">
              <Tabs defaultValue="current" className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="current">Abonnement actuel</TabsTrigger>
                  <TabsTrigger value="plans">Plans disponibles</TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="space-y-6">
                  {/* Current Subscription Card */}
                  <div className={`p-6 rounded-xl border ${subscriptionStatus.color.replace('bg-', 'bg-')} border-opacity-20`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold">
                          {currentPlan.name}
                        </h3>
                        <Badge className={`mt-2 ${subscriptionStatus.color}`}>
                          {subscriptionStatus.label}
                        </Badge>
                      </div>
                      {subscriptionStatus.status === "active" ? (
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                      ) : subscriptionStatus.status === "expiring" ? (
                        <AlertCircle className="w-10 h-10 text-amber-600" />
                      ) : (
                        <Clock className="w-10 h-10 text-red-600" />
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Prix mensuel</span>
                        <span className="text-2xl font-bold">
                          {currentPlan.price.toLocaleString()} KMF
                        </span>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Utilisateurs</p>
                          <p className="font-medium">{currentPlan.numberOfUsers}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Transactions/jour</p>
                          <p className="font-medium">{currentPlan.transactionsPerDay}</p>
                        </div>
                      </div>

                      {subscription && subscription.endAt && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  Expiration
                                </span>
                              </div>
                              <span className="font-medium">
                                {format(new Date(subscription.endAt), "dd MMMM yyyy", { locale: fr })}
                              </span>
                            </div>
                            
                            {subscriptionStatus.daysRemaining !== undefined && subscriptionStatus.daysRemaining > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Jours restants
                                </span>
                                <span className={`font-bold ${
                                  subscriptionStatus.status === "expiring" 
                                    ? "text-amber-600" 
                                    : "text-emerald-600"
                                }`}>
                                  {subscriptionStatus.daysRemaining} jour{subscriptionStatus.daysRemaining > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-6">
                      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                        <DialogTrigger asChild>
                          <Button className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Renouveler l&apos;abonnement
                          </Button>
                        </DialogTrigger>
                        <PaymentCodeModal 
                          plans={plans}
                          selectedPlan={selectedPlan}
                          setSelectedPlan={setSelectedPlan}
                          paymentCode={paymentCode}
                          setPaymentCode={setPaymentCode}
                          submittingCode={submittingCode}
                          codeResult={codeResult}
                          onSubmit={handleSubmitPaymentCode}
                          onCancel={() => {
                            setShowPaymentModal(false);
                            setPaymentCode("");
                            setSelectedPlan(null);
                            setCodeResult(null);
                          }}
                        />
                      </Dialog>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="plans" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((plan) => (
                      <div
                        key={plan.planId}
                        className={`p-6 rounded-xl border ${
                          plan.planId === currentPlan.planId
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-lg font-bold">{plan.name}</h4>
                            <p className="text-3xl font-bold mt-2">
                              {plan.price.toLocaleString()} KMF
                              <span className="text-sm font-normal text-gray-600">/mois</span>
                            </p>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Utilisateurs</span>
                              <span className="font-medium">{plan.numberOfUsers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Transactions/jour</span>
                              <span className="font-medium">{plan.transactionsPerDay}</span>
                            </div>
                          </div>

                          {plan.planId !== currentPlan.planId && (
                            <Button
                              className="w-full mt-4"
                              variant={plan.planId === currentPlan.planId ? "outline" : "default"}
                              onClick={() => {
                                setSelectedPlan(plan.planId);
                                setShowPaymentModal(true);
                              }}
                            >
                              Choisir ce plan
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          )}
        </Card>

        {/* SUBSCRIPTION CODES HISTORY */}
        <Card>
          <CardHeader
            className="cursor-pointer flex flex-row items-center justify-between"
            onClick={() =>
              setCollapsed({ ...collapsed, subscriptionCodes: !collapsed.subscriptionCodes })
            }>
            <div className="flex items-center gap-3">
              <Key className="w-6 h-6 text-indigo-600" />
              <CardTitle>Historique des codes de paiement</CardTitle>
            </div>
            {collapsed.subscriptionCodes ? <ChevronDown /> : <ChevronUp />}
          </CardHeader>

          {!collapsed.subscriptionCodes && (
            <CardContent className="space-y-4 pt-4">
              {subscriptionCodes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun code de paiement soumis</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subscriptionCodes.map((code) => (
                    <div
                      key={code.codeId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold bg-white px-2 py-1 rounded border">
                            {code.code}
                          </code>
                          <Badge className={
                            code.isSettled 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-amber-100 text-amber-700"
                          }>
                            {code.isSettled ? "Traité" : "En attente"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Soumis le {format(new Date(code.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </main>
  );
}

// Payment Code Modal Component
function PaymentCodeModal({
  plans,
  selectedPlan,
  setSelectedPlan,
  paymentCode,
  setPaymentCode,
  submittingCode,
  codeResult,
  onSubmit,
  onCancel
}: {
  plans: Plan[];
  selectedPlan: number | null;
  setSelectedPlan: (planId: number | null) => void;
  paymentCode: string;
  setPaymentCode: (code: string) => void;
  submittingCode: boolean;
  codeResult: { success?: boolean; message?: string; error?: string } | null;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
  <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
  <DialogHeader>
    <DialogTitle>Soumettre un code de paiement</DialogTitle>
  </DialogHeader>

  <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
    {/* Payment Instructions */}
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="font-bold text-blue-800 mb-2">Instructions de paiement :</h4>
      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
        <li>Envoyez le montant du plan sélectionné via Mvola ou Orange Money</li>
        <li>Notez le code de transaction reçu par SMS</li>
        <li>Entrez le code ci-dessous pour valider votre paiement</li>
        <li>Votre abonnement sera activé après vérification manuelle</li>
      </ol>
    </div>

    {/* Plan Selection */}
    <div className="space-y-3">
      <Label>Sélectionnez un plan *</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {plans.map((plan) => (
          <div
            key={plan.planId}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedPlan === plan.planId
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedPlan(plan.planId)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-bold">{plan.name}</h5>
                <p className="text-2xl font-bold mt-1">
                  {plan.price.toLocaleString()} KMF
                </p>
              </div>
              {selectedPlan === plan.planId && (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {plan.numberOfUsers} utilisateurs • {plan.transactionsPerDay} trans./jour
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Payment Code Input */}
    <div className="space-y-3">
      <Label htmlFor="paymentCode">Code de transaction *</Label>
      <Input
        id="paymentCode"
        value={paymentCode}
        onChange={(e) => setPaymentCode(e.target.value.toUpperCase())}
        placeholder="Ex: ABC123XYZ789"
        disabled={submittingCode}
        className="uppercase font-mono text-lg"
      />
      <p className="text-sm text-gray-500">
        Entrez le code exact reçu après le paiement (lettres majuscules et chiffres)
      </p>
    </div>

    {/* Result Message */}
    {codeResult && (
      <div
        className={`p-4 rounded-lg ${
          codeResult.success
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}
      >
        <div className="flex items-start gap-3">
          {codeResult.success ? (
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">{codeResult.success ? "Succès !" : "Erreur"}</p>
            <p className="text-sm mt-1">{codeResult.message || codeResult.error}</p>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* Action Buttons - Fixed at bottom */}
  <div className="flex gap-3 justify-end pt-4 border-t mt-4">
    <Button
      variant="outline"
      onClick={onCancel}
      disabled={submittingCode}
    >
      Annuler
    </Button>
    <Button
      onClick={onSubmit}
      disabled={submittingCode || !paymentCode.trim() || !selectedPlan}
    >
      {submittingCode ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Traitement en cours...
        </>
      ) : (
        "Soumettre le code"
      )}
    </Button>
  </div>
</DialogContent>
  );
}