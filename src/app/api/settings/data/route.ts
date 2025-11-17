// app/api/settings/data/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, phoneNumber, storeId')
      .eq('userId', user.id)
      .single();

    let store = null;
    if (profile?.storeId) {
      const { data } = await supabase
        .from('stores')
        .select('storeName, storeAddress, storePhoneNumber')
        .eq('storeId', profile.storeId)
        .single();
      store = data;
    }

    return NextResponse.json({
      profile: profile || { name: '', phoneNumber: '', storeId: null },
      store: store || { storeName: '', storeAddress: '', storePhoneNumber: '' },
    });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}