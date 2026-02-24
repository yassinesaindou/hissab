// Handle Supabase API requests - network only, fail gracefully
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (
    url.origin.includes('supabase.co') ||
    url.pathname.includes('/rest/v1/')
  ) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ error: 'Offline - API unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    );
  }
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});