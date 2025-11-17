// app/api/manager/data/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('userId', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [profilesRes, subscriptionsRes, plansRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('userId, name, phoneNumber, subscriptionId')
        .in('role', ['user', 'admin']),

      supabase
        .from('subscriptions')
        .select('subscriptionId, endAt, planId'),

      supabase
        .from('plans')
        .select('planId, name, numberOfUsers'), // ← correct column
    ]);

    const today = new Date();

    // Map planId → plan data
    const planMap = Object.fromEntries(
      (plansRes.data || []).map(p => [p.planId, p])
    );

    const profilesWithSubscriptions = (profilesRes.data || []).map((p) => {
      const sub = subscriptionsRes.data?.find(s => s.subscriptionId === p.subscriptionId);
      const plan = sub?.planId ? planMap[sub.planId] : null;

      const endAt = sub?.endAt ? new Date(sub.endAt) : null;
      const daysLeft = endAt
        ? Math.max(0, Math.floor((endAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        userId: p.userId,
        name: p.name,
        phoneNumber: p.phoneNumber,
        subscriptionId: p.subscriptionId,
        endAt: sub?.endAt || null,
        daysLeft,
        planId: sub?.planId || null,
        planName: plan?.name || null,
        maxUsers: plan?.numberOfUsers || 0, // ← correct field
      };
    });

    return NextResponse.json({ profiles: profilesWithSubscriptions });
  } catch (error) {
    console.error('Manager API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}