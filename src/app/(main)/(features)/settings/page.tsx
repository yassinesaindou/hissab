// app/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import SettingsForm from '@/components/SettingsForm';
import { Settings, Store, Loader2 } from 'lucide-react';

type Profile = {
  name: string;
  phoneNumber: string;
  storeId: string | null;
};

type Store = {
  storeName: string;
  storeAddress: string;
  storePhoneNumber: string;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({ name: '', phoneNumber: '', storeId: null });
  const [store, setStore] = useState<Store>({ storeName: '', storeAddress: '', storePhoneNumber: '' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login');
    });
  }, [supabase, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/settings/data');
        if (!res.ok) {
          if (res.status === 401) router.replace('/login');
          return;
        }
        const data = await res.json();
        setProfile(data.profile);
        setStore(data.store);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <Settings className="h-9 w-9 text-blue-600" />
            Paramètres
          </h1>
          <p className="text-gray-600 mt-2">Gérez vos informations personnelles et votre boutique</p>
        </div>

        {/* Settings Form */}
        <div className="bg-white/80 backdrop-blur-lg border border-white/30 rounded-3xl shadow-xl p-6 md:p-8">
          <SettingsForm profile={profile} store={store} />
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-white py-4 px-6 shadow-lg">
          <p className="text-center font-medium text-sm md:text-base">
            Effectuez votre paiement à <strong>4107958</strong> via <strong>Mvola</strong>
          </p>
        </div>
      </div>
    </div>
  );
}