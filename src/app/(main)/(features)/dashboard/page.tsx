import React from "react";
import Dashboard from "../../../components/Card";
import Graph from "../../../components/Graph";
import RecentTransactionTable from "../../../components/RecentTransactionTable";
import RecentCredits from "../../../components/RecentCredits";
import SubNavbar from "../../../components/SubNavbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getRecentTransactions,
  getRecentCredits,
  getDashboardData,
  getYearlyOverview,
} from "@/app/actions";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Get the user

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("userId", session?.user?.id)
    .single();

  console.log(error);
  console.log("data", data?.role);

  // Fetch recent transactions
  const {
    success: transactionsSuccess,
    transactions,
    message: transactionsMessage,
  } = await getRecentTransactions();
  if (!transactionsSuccess) {
    console.error("Error fetching transactions:", transactionsMessage);
  }

  // Fetch recent credits
  const {
    success: creditsSuccess,
    credits,
    message: creditsMessage,
  } = await getRecentCredits();
  if (!creditsSuccess) {
    console.error("Error fetching credits:", creditsMessage);
  }

  // Fetch dashboard data
  const {
    success: dashboardSuccess,
    data: dashboardData,
    message: dashboardMessage,
  } = await getDashboardData();
  if (!dashboardSuccess) {
    console.error("Error fetching dashboard data:", dashboardMessage);
  }

  // Fetch yearly overview
  const {
    success: yearlySuccess,
    data: yearlyData,
    message: yearlyMessage,
  } = await getYearlyOverview();
  if (!yearlySuccess) {
    console.error("Error fetching yearly data:", yearlyMessage);
  }

  return (
    <div className="h-screen p-4 text-gray-700 font-normal text-lg">
      <SubNavbar />
      {
        <Dashboard
          sales={dashboardData?.sales || { total: 0, data: [] }}
          expenses={dashboardData?.expenses || { total: 0, data: [] }}
          credits={dashboardData?.credits || { total: 0, data: [] }}
          revenue={dashboardData?.revenue || { total: 0, data: [] }}
        />
      }
      <Graph data={yearlyData || []} />
      <div className="flex gap-4 mt-10 flex-col lg:flex-row">
        <RecentTransactionTable transactions={transactions || []} />
        <RecentCredits credits={credits || []} />
      </div>
    </div>
  );
}
