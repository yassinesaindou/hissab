/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/manager/page.tsx - UPDATED VERSION
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Building2, Key } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteSubscriptionCode } from "./actions/actions";
import { CodesTable } from "./components/CodesTable";
import { CompaniesTable } from "./components/CompaniesTable";
import { Header } from "./components/Header";
import ProcessCodeDialog from "./components/ProcessCodeDialog";
import { Stats } from "./components/Stats";

type SubscriptionCode = {
  codeId: string;
  code: string;
  storeId: string;
  createdAt: string;
  isSettled: boolean;
  store?: {
    storeId: string;
    storeName: string;
    storePhoneNumber?: string;
  };
  subscription?: {
    subscriptionId: string;
    endAt: string;
    planId: number;
  };
  plan?: {
    planId: number;
    name: string;
    price: number;
    numberOfUsers: number;
  };
  profile?: {
    userId: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
};

type Company = {
  storeId: string;
  storeName: string;
  storePhoneNumber?: string;
  storeAddress?: string;
  createdAt: string;
  subscription?: {
    subscriptionId: string;
    endAt: string;
    planId: number;
  };
  plan?: {
    planId: number;
    name: string;
    price: number;
    numberOfUsers: number;
  };
  profile?: { // This is what you're using in SubscriptionCode
    userId: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  owner?: { // Add this to match what you're creating
    userId: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role: string;
  };
};

type Plan = {
  planId: number;
  name: string;
  price: number;
  numberOfUsers: number;
  transactionsPerDay: number;
};

export default function ManagerPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  // State
  const [subscriptionCodes, setSubscriptionCodes] = useState<SubscriptionCode[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"companies" | "codes">("companies");
  
  // Dialog states
  const [selectedCode, setSelectedCode] = useState<SubscriptionCode | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalStores: 0,
    totalCodes: 0,
    pendingCodes: 0,
    settledCodes: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    loadAllData();
  }, []);

 const loadAllData = async () => {
  try {
    setLoading(true);
    setError(null);

    // Check admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("userId", user.id)
      .single();

    if (currentProfile?.role !== "admin") {
      setError("Accès administrateur requis");
      setLoading(false);
      return;
    }

    // Load all stores with their owner profiles (user/admin role)
    const { data: storesData, error: storesError } = await supabase
      .from("stores")
      .select(`
        *,
        profiles!stores_userId_fkey (
          userId,
          name,
          email,
          phoneNumber,
          role,
          isActive
        )
      `)
      .order("createdAt", { ascending: false });

    // Load subscription codes with store info
    const { data: codesData, error: codesError } = await supabase
      .from("subscription_codes")
      .select(`
        *,
        stores!subscription_codes_storeId_fkey (
          storeId,
          storeName,
          storePhoneNumber
        )
      `)
      .order("createdAt", { ascending: false });

    // Load all plans
    const { data: plansData, error: plansError } = await supabase
      .from("plans")
      .select("*")
      .order("planId", { ascending: true });

    // Load all subscriptions
    const { data: subscriptionsData, error: subsError } = await supabase
      .from("subscriptions")
      .select("*");

    // Handle errors
    if (storesError) console.error("Error loading stores:", storesError);
    if (codesError) console.error("Error loading codes:", codesError);
    if (plansError) console.error("Error loading plans:", plansError);
    if (subsError) console.error("Error loading subscriptions:", subsError);

    // Process companies data
    const enrichedCompanies: Company[] = (storesData || []).map(store => {
      // Get the owner profile (user or admin role)
      const ownerProfile = Array.isArray(store.profiles) 
        ? store.profiles.find((p: any) => p.role === "user" || p.role === "admin")
        : store.profiles;

      const subscription = (subscriptionsData || []).find(sub => sub.storeId === store.storeId);
      const plan = subscription?.planId ? 
        (plansData || []).find(p => p.planId === subscription.planId) : undefined;

      return {
        storeId: store.storeId,
        storeName: store.storeName || "Magasin sans nom",
        storePhoneNumber: store.storePhoneNumber,
        storeAddress: store.storeAddress,
        createdAt: store.createdAt,
        subscription: subscription ? {
          subscriptionId: subscription.subscriptionId,
          endAt: subscription.endAt,
          planId: subscription.planId,
        } : undefined,
        plan,
        owner: ownerProfile ? {
          userId: ownerProfile.userId,
          name: ownerProfile.name || "Propriétaire",
          email: ownerProfile.email,
          phoneNumber: ownerProfile.phoneNumber,
          role: ownerProfile.role,
        } : {
          userId: store.userId || "",
          name: "Propriétaire",
          email: "",
          role: "user"
        },
      };
    });

    // Process subscription codes data
    const enrichedCodes: SubscriptionCode[] = (codesData || []).map(code => {
      const store = code.stores;
      const subscription = (subscriptionsData || []).find(sub => sub.storeId === code.storeId);
      const plan = subscription?.planId ? 
        (plansData || []).find(p => p.planId === subscription.planId) : undefined;

      // Find the store's owner to get contact info
      const storeWithOwner = enrichedCompanies.find(c => c.storeId === code.storeId);

      return {
        codeId: code.codeId,
        code: code.code,
        storeId: code.storeId,
        createdAt: code.createdAt,
        isSettled: code.isSettled,
        store: store ? {
          storeId: store.storeId,
          storeName: store.storeName || "Magasin sans nom",
          storePhoneNumber: store.storePhoneNumber,
        } : undefined,
        subscription,
        plan,
        profile: storeWithOwner?.owner,
      };
    });

    setSubscriptionCodes(enrichedCodes);
    setCompanies(enrichedCompanies);
    setPlans(plansData || []);

    // Calculate stats
    const pendingCodes = enrichedCodes.filter(code => !code.isSettled).length;
    const settledCodes = enrichedCodes.filter(code => code.isSettled).length;
    const totalRevenue = enrichedCodes
      .filter(code => code.isSettled && code.plan)
      .reduce((sum, code) => sum + (code.plan?.price || 0), 0);

    setStats({
      totalStores: enrichedCompanies.length,
      totalCodes: enrichedCodes.length,
      pendingCodes,
      settledCodes,
      totalRevenue,
    });

  } catch (err) {
    console.error("Failed to load manager data:", err);
    setError("Erreur de chargement des données");
  } finally {
    setLoading(false);
  }
};

  const handleProcessCode = async (code: SubscriptionCode) => {
    setSelectedCode(code);
    setIsProcessDialogOpen(true);
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      const result = await deleteSubscriptionCode(codeId);
      
      if (result.success) {
        // Remove the code from the list
        setSubscriptionCodes(prev => prev.filter(code => code.codeId !== codeId));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalCodes: prev.totalCodes - 1,
          pendingCodes: prev.pendingCodes - 1,
        }));
      } else {
        console.error("Error deleting code:", result.message);
      }
    } catch (error) {
      console.error("Error deleting code:", error);
    }
  };

  const handleViewStore = (storeId: string) => {
    setActiveTab("companies");
    // You could scroll to the specific company or highlight it
  };

  const handleViewCodes = (storeId: string) => {
    setActiveTab("codes");
    // You could filter codes for this specific store
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
            <h3 className="text-lg font-semibold text-gray-900">Chargement du tableau de bord</h3>
            <p className="text-gray-600 mt-1">Récupération des données...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <Header onRefresh={loadAllData} />
        
        <Stats
          totalStores={stats.totalStores}
          totalCodes={stats.totalCodes}
          pendingCodes={stats.pendingCodes}
          settledCodes={stats.settledCodes}
          totalRevenue={stats.totalRevenue}
        />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="companies" className="gap-2">
              <Building2 className="h-4 w-4" />
              Magasins ({stats.totalStores})
            </TabsTrigger>
            <TabsTrigger value="codes" className="gap-2">
              <Key className="h-4 w-4" />
              Codes ({stats.totalCodes})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <Card>
              <CardContent className="p-6">
                <CompaniesTable
                  companies={companies}
                  onViewCodes={handleViewCodes}
                 onRenewSubscription={(company) => {
  // Handle renew subscription
  console.log("Renew subscription for company:", company);
}}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="codes">
            <Card>
              <CardContent className="p-6">
                <CodesTable
                  codes={subscriptionCodes}
                  onProcessCode={handleProcessCode}
                  onDeleteCode={handleDeleteCode}
                  onViewStore={handleViewStore}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Process Code Dialog */}
        <ProcessCodeDialog
          isOpen={isProcessDialogOpen}
          onOpenChange={setIsProcessDialogOpen}
          code={selectedCode}
          plans={plans}
          onSuccess={() => {
            setIsProcessDialogOpen(false);
            setSelectedCode(null);
            loadAllData(); // Refresh all data
          }}
        />
      </div>
    </div>
  );
}