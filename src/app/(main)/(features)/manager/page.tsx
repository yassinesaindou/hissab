// app/manager/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import ManagerDashboard from './ManagerDashboard';
import { ProfileWithSubscription } from '@/lib/types';
import { Loader2 } from 'lucide-react';
// ← IMPORT

export default function ManagerPage() {
  const [profiles, setProfiles] = useState<ProfileWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      }
    });
  }, [supabase, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/manager/data');
        if (!res.ok) {
          const json = await res.json();
          if (res.status === 401) {
            router.replace('/login');
          } else if (res.status === 403) {
            setError('Accès administrateur requis');
          } else {
            setError(json.error || 'Erreur serveur');
          }
          return;
        }

        const data = await res.json();
        setProfiles(data.profiles || []);
      } catch (err) {
        console.error('Failed to load manager data:', err);
        setError('Erreur de chargement');
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


  if (error) {
    return (
      <div className="p-6 mx-auto max-w-4xl">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <ManagerDashboard profiles={profiles} />
    </div>
  );
}