// next.config.js
import withSerwist from '@serwist/next';

export default withSerwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})({
  reactStrictMode: true,
  env: {
    // Generated once per build, stable for the lifetime of that deployment —
    // unlike Date.now() inside sw.ts, this is fixed at BUILD time, not at
    // service-worker-execution time in the visitor's browser.
    SW_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "Feature-Policy", value: "camera *" }],
      },
    ];
  },
});