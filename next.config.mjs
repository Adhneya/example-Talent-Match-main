// Release flags (slide 9) are build-time. Mirrors src/lib/flags.ts — keep the two in sync.
const flagMatches = process.env.NEXT_PUBLIC_FLAG_MATCHES === '1';
const flagNotifications = flagMatches && process.env.NEXT_PUBLIC_FLAG_NOTIFICATIONS === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // E2E tests build into their own folder so they never clash with a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Flagged routes are physically absent from builds where their flag is off:
  // `page.phase1.tsx` (matches) and `page.phase2.tsx` (notifications) only count
  // as pages when their extension is listed. Off → a genuine 404, and none of
  // the unreleased UI ships in the bundle.
  pageExtensions: [
    'tsx',
    'ts',
    'jsx',
    'js',
    ...(flagMatches ? ['phase1.tsx'] : []),
    ...(flagNotifications ? ['phase2.tsx'] : []),
  ],
};

export default nextConfig;
