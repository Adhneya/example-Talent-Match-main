import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests against production builds.
 *
 * Two production servers, each built into its own folder so they never clash
 * with a running `next dev` (see distDir in next.config.mjs and e2e/serve.mjs):
 *   app   — :3100, flags off (what ships in Phase 0)
 *   flags — :3101, Phase 1 + 2 flags on
 *
 * Uses the locally installed Microsoft Edge (channel: 'msedge'), so no
 * browser download is needed. Run: npm run test:e2e
 */
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    channel: 'msedge',
    // Keeps swipe/fade timing deterministic and the background tree static.
    // The gesture test opts back into motion.
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'app',
      testIgnore: /flags\//,
      use: { baseURL: 'http://localhost:3100' },
    },
    {
      name: 'flags',
      testMatch: /flags\/.*\.spec\.ts/,
      use: { baseURL: 'http://localhost:3101' },
    },
  ],
  // One script builds both targets in series, then serves :3101 and :3100 (see e2e/serve.mjs).
  webServer: {
    command: 'node e2e/serve.mjs',
    url: 'http://localhost:3100',
    timeout: 480_000,
    reuseExistingServer: !CI,
  },
});
