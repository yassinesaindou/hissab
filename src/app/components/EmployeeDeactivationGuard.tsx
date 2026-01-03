// components/EmployeeDeactivationGuard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/lib/offline/session";

export default function EmployeeDeactivationGuard() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const profile = await getUserProfile();
      if (profile?.role === 'employee' && !profile.isActive) {
        router.replace("/deactivated");
      }
    }
    check();
  }, [router]);

  return null;
}