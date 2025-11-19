// app/(protected)/AuthProvider.tsx
"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useEffect } from "react";

export default function AuthProvider({ session }: { session: Session | null }) {
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (session) {
      // Force the session into the client once and for all
      supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  }, [session, supabase]);

  // This component renders nothing – it just fixes the session
  return null;
}