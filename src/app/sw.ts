import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry } from 'serwist';
import { Serwist } from 'serwist';

declare const self: ServiceWorkerGlobalScopeEventMap & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

const serwist = new Serwist({
  precacheEntries: [
    ...self.__SW_MANIFEST, // all chunks precached automatically
    { url: '/dashboard', revision: '2' },
    { url: '/invoices', revision: '2' },
    { url: '/offline', revision: '2' },
    {url : '/deactivated', revision:'2'}
  ],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  fallbacks: {
    entries: [{ url: '/offline', matcher: ({ request }) => request.mode === 'navigate' }],
  },
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();