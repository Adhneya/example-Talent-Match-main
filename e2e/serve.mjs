// Builds and serves the two E2E targets for playwright.config.ts.
//
// Builds run one at a time: two concurrent `next build`s race on next/font's
// Google Fonts download and one fails. The flags server is started and awaited
// first, so when Playwright sees :3100 ready, :3101 is already up too.
import { execSync, spawn } from 'node:child_process';

const targets = [
  {
    dist: '.next-test-flags',
    port: 3101,
    env: { NEXT_PUBLIC_FLAG_MATCHES: '1', NEXT_PUBLIC_FLAG_NOTIFICATIONS: '1' },
  },
  { dist: '.next-test', port: 3100, env: {} },
];

// NEXT_PUBLIC_ANALYTICS_DEBUG exposes tracked events on window.__TM_EVENTS__ for e2e/analytics.spec.ts.
// Auth: dummy values only. AUTH_TEST_SIGNIN enables the fake "test" sign-in (never on Vercel —
// see src/auth.ts); the LinkedIn id lets e2e/auth.spec.ts check the redirect to LinkedIn.
const AUTH_ENV = {
  AUTH_SECRET: 'e2e-only-secret-not-used-anywhere-else-0123456789',
  AUTH_TRUST_HOST: 'true',
  AUTH_TEST_SIGNIN: '1',
  AUTH_LINKEDIN_ID: 'e2e-linkedin-client-id',
  AUTH_LINKEDIN_SECRET: 'e2e-linkedin-client-secret',
};
const envFor = (t) => ({
  ...process.env,
  ...AUTH_ENV,
  ...t.env,
  NEXT_DIST_DIR: t.dist,
  NEXT_PUBLIC_ANALYTICS_DEBUG: '1',
});

for (const t of targets) {
  console.log(`[serve] building ${t.dist}`);
  execSync('npx next build', { stdio: 'inherit', env: envFor(t) });
}

async function waitFor(url, ms = 60_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`[serve] ${url} did not start`);
}

const children = [];
for (const t of targets) {
  children.push(
    spawn('npx', ['next', 'start', '-p', String(t.port)], { stdio: 'inherit', shell: true, env: envFor(t) }),
  );
  await waitFor(`http://localhost:${t.port}`);
  console.log(`[serve] ${t.dist} ready on :${t.port}`);
}

const stop = () => {
  for (const c of children) c.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
