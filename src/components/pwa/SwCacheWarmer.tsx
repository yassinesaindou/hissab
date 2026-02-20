"use client";

import { useEffect } from "react";

/**
 * Tells the Service Worker to cache all /_next/static/ chunks
 * that are currently loaded in the page.
 *
 * This solves the "CSS disappears after 8 hours offline" bug:
 * Without this, the SW only caches chunks as they're fetched one by one.
 * After a redeployment, new chunk hashes are used — but the SW never
 * cached them because the app wasn't visited while online after the deploy.
 *
 * Place this in your root layout or _app so it runs on every page load.
 */
export function SWCacheWarmer() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const warmCache = () => {
      // Collect all /_next/static/ URLs currently loaded in this page
      const staticUrls: string[] = [];

      // Collect all <script src="/_next/static/..."> tags
      document.querySelectorAll<HTMLScriptElement>('script[src^="/_next/static/"]').forEach((el) => {
        if (el.src) staticUrls.push(el.src);
      });

      // Collect all <link rel="stylesheet" href="/_next/static/..."> tags
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href^="/_next/static/"]').forEach((el) => {
        if (el.href) staticUrls.push(el.href);
      });

      // Collect preloaded chunks
      document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][href^="/_next/static/"]').forEach((el) => {
        if (el.href) staticUrls.push(el.href);
      });

      if (staticUrls.length === 0) return;

      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: "CACHE_URLS",
            urls: staticUrls,
          });
          console.log(`[SWCacheWarmer] Sent ${staticUrls.length} URLs to SW for caching`);
        }
      });
    };

    // Run after page is fully loaded so all scripts/links are in the DOM
    if (document.readyState === "complete") {
      warmCache();
    } else {
      window.addEventListener("load", warmCache, { once: true });
    }
  }, []);

  return null;
}