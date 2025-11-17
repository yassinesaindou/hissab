// app/api/analytics/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getAnalyticsData, getGraphData } from '@/app/actions';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'last_30_days';
    const customStart = searchParams.get('start') || undefined;
    const customEnd = searchParams.get('end') || undefined;

    const [analyticsRes, graphRes] = await Promise.all([
      getAnalyticsData(period, customStart, customEnd),
      getGraphData(period, customStart, customEnd),
    ]);

    return Response.json({
      analytics: analyticsRes,
      graph: graphRes,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}