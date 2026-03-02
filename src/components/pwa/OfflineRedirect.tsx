/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const APP_SHELL_PAGES = ["/", "/dashboard", "/invoices", '/deactivated'];
export default function OfflineRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleOffline() {
      // Avoid infinite loop: don't redirect if already on /offline
       if (
  !navigator.onLine &&
  !APP_SHELL_PAGES.includes(pathname)
) {
  router.replace("/offline");
}

    }

    function handleOnline() {
      // Optional: automatically go back to previous page
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Initial check
    handleOffline();

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [pathname, router]);

  return null;
}
