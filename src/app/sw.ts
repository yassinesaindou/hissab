// src/app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "serwist";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScopeEventMap & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

// Fixed at BUILD time via next.config.js `env`, not at SW execution time.
// process.env.SW_BUILD_ID is inlined as a literal string by the bundler —
// every visitor who downloads THIS service worker file gets the same value,
// and it only changes when you actually redeploy.
const buildId = process.env.SW_BUILD_ID!;

const serwist = new Serwist({
  precacheEntries: [
    ...self.__SW_MANIFEST,
    { url: "/dashboard", revision: buildId },
    { url: "/invoices", revision: buildId },
    { url: "/offline", revision: buildId },
    { url: "/deactivated", revision: buildId },
    { url: "/", revision: buildId },
  ],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  fallbacks: {
    entries: [
      { url: "/offline", matcher: ({ request }) => request.mode === "navigate" },
    ],
  },
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();