import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PeriodSelector from "@/components/PeriodSelector";
import AnalyticsCard from "@/components/AnalyticsCard";
import AnalyticsGraph from "@/components/AnalyticsGraph";
import { getAnalyticsData, getGraphData } from "@/app/actions";
import { ChartArea, DollarSign, Package } from "lucide-react";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { period?: string; start?: string; end?: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const period = searchParams.period || "last_30_days";
  const customStart = searchParams.start;
  const customEnd = searchParams.end;

  // Fetch analytics data for cards
  const {
    success: analyticsSuccess,
    data: analyticsData,
    message: analyticsMessage,
  } = await getAnalyticsData(period, customStart, customEnd);
  if (!analyticsSuccess) {
    console.error("Error fetching analytics data:", analyticsMessage);
  }

  // Fetch graph data
  const {
    success: graphSuccess,
    data: graphData,
    message: graphMessage,
  } = await getGraphData(period, customStart, customEnd);
  if (!graphSuccess) {
    console.error("Error fetching graph data:", graphMessage);
  }

  

  // Validate data for serialization
  const safeAnalyticsData = {
    sales: { total: Number(analyticsData.sales?.total || 0) },
    expenses: { total: Number(analyticsData.expenses?.total || 0) },
    credits: { total: Number(analyticsData.credits?.total || 0) },
    revenue: { total: Number(analyticsData.revenue?.total || 0) },
    products: { total: Number(analyticsData.products?.total || 0) },
  };

 

  return (
    <div className="min-h-screen p-6 bg-gray-50 text-gray-700">
      <h1 className="text-2xl  font-semibold mb-6">Analytics</h1>
      <PeriodSelector period={period} customStart={customStart} customEnd={customEnd} />
      <div className="flex flex-wrap justify-start   gap-4 my-6 w-full">
        <AnalyticsCard
          title="Sales"
          value={safeAnalyticsData.sales.total}
          icon={ChartArea}
          color="green"
          unit="$"
        />
        <AnalyticsCard
          title="Expenses"
          value={safeAnalyticsData.expenses.total}
          icon={DollarSign}
          color="red"
          unit="$"
        />
        <AnalyticsCard
          title="Revenue"
          value={safeAnalyticsData.revenue.total}
          icon={ChartArea}
          color="blue"
          unit="$"
        />
        <AnalyticsCard
          title="Credits"
          value={safeAnalyticsData.credits.total}
          icon={DollarSign}
          color="yellow"
          unit="$"
        />
        <AnalyticsCard
          title="Registered Products"
          value={safeAnalyticsData.products.total}
          icon={Package}
          color="purple"
          unit=""
          isProducts={true}
        />
      </div>
      <AnalyticsGraph data={graphData || []} />
    </div>
  );
}