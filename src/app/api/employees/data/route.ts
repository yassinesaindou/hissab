// app/api/employees/data/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getEmployeesByStore } from '@/app/actions';
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
      .select('role, storeId')
      .eq('userId', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.role !== 'user' && profile.role !== 'admin') {
      return NextResponse.json({ redirect: '/dashboard' });
    }

    const result = await getEmployeesByStore();

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({ employees: result.employees || [] });
  } catch (error) {
    console.error('Employees API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}