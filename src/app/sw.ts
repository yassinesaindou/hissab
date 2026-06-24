import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "serwist";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScopeEventMap & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

const buildId = Date.now().toString();

const serwist = new Serwist({
  precacheEntries: [
    ...self.__SW_MANIFEST, // all chunks precached automatically
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
      {
        url: "/offline",
        matcher: ({ request }) => request.mode === "navigate",
      },
    ],
  },
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
