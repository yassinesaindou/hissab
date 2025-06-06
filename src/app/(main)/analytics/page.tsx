/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PeriodSelector from "@/components/PeriodSelector";
import AnalyticsCard from "@/components/AnalyticsCard";
import AnalyticsGraph from "@/components/AnalyticsGraph";
import { getAnalyticsData, getGraphData } from "@/app/actions";
import { ChartArea, DollarSign, Package } from "lucide-react";
import { Suspense } from "react";
import { SyncLoader } from "react-spinners";

export default async function AnalyticsPage({
  searchParams,
}:any) {
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

  if (!analyticsData) {
    console.error("Error fetching analytics data:", analyticsMessage);
    // Provide fallback data to avoid type errors
    const fallbackAnalyticsData = {
      sales: { total: 0 },
      expenses: { total: 0 },
      credits: { total: 0 },
      revenue: { total: 0 },
      products: { total: 0 },
    };

    return (
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-screen">
            <SyncLoader
              color="#2563eb"
              loading={true}
              size={15}
              aria-label="Loading Spinner"
              data-testid="loader"
              className="mx-auto"
            />
          </div>
        }>
        <div className="min-h-screen p-6 bg-gray-50 text-gray-700">
          <h1 className="text-2xl font-semibold mb-6">Analytiques</h1>
          <PeriodSelector
            period={period}
            customStart={customStart}
            customEnd={customEnd}
          />
          <div className="flex flex-wrap justify-start gap-4 my-6 w-full">
            <AnalyticsCard
              title="Ventes"
              value={fallbackAnalyticsData.sales.total}
              icon={ChartArea}
              color="green"
              unit="Fcs"
            />
            <AnalyticsCard
              title="Dépenses"
              value={fallbackAnalyticsData.expenses.total}
              icon={DollarSign}
              color="red"
              unit="Fcs"
            />
            <AnalyticsCard
              title="Revenus"
              value={fallbackAnalyticsData.revenue.total}
              icon={ChartArea}
              color="blue"
              unit="Fcs"
            />
            <AnalyticsCard
              title="Crédits"
              value={fallbackAnalyticsData.credits.total}
              icon={DollarSign}
              color="yellow"
              unit="Fcs"
            />
            <AnalyticsCard
              title="Articles Enregistrés"
              value={fallbackAnalyticsData.products.total}
              icon={Package}
              color="purple"
              unit=""
              isProducts={true}
            />
          </div>
          <AnalyticsGraph data={[]} />
        </div>
      </Suspense>
    );
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
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <SyncLoader
            color="#2563eb"
            loading={true}
            size={15}
            aria-label="Loading Spinner"
            data-testid="loader"
            className="mx-auto"
          />
        </div>
      }>
      <div className="min-h-screen p-6 bg-gray-50 text-gray-700">
        <h1 className="text-2xl font-semibold mb-6">Analytiques</h1>
        <PeriodSelector
          period={period}
          customStart={customStart}
          customEnd={customEnd}
        />
        <div className="flex flex-wrap justify-start gap-4 my-6 w-full">
          <AnalyticsCard
            title="Ventes"
            value={safeAnalyticsData.sales.total}
            icon={ChartArea}
            color="green"
            unit="Fcs"
          />
          <AnalyticsCard
            title="Dépenses"
            value={safeAnalyticsData.expenses.total}
            icon={DollarSign}
            color="red"
            unit="Fcs"
          />
          <AnalyticsCard
            title="Revenus"
            value={safeAnalyticsData.revenue.total}
            icon={ChartArea}
            color="blue"
            unit="Fcs"
          />
          <AnalyticsCard
            title="Crédits"
            value={safeAnalyticsData.credits.total}
            icon={DollarSign}
            color="yellow"
            unit="Fcs"
          />
          <AnalyticsCard
            title="Articles Enregistrés"
            value={safeAnalyticsData.products.total}
            icon={Package}
            color="purple"
            unit=""
            isProducts={true}
          />
        </div>
        <AnalyticsGraph data={graphData || []} />
      </div>
    </Suspense>
  );
}
