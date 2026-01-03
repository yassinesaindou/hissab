"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("✅ SW registered with scope:", registration.scope);
      })
      .catch((err) => {
        console.error("❌ SW registration failed:", err);
      });
  }, []);

  return null;
}
