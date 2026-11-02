import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests run against a real Supabase project (there is no local
 * Supabase in CI or the dev sandbox). They are skipped entirely unless
 * E2E_SUPABASE_URL is set. See docs/SETUP.md → "Running the browser tests".
 */
const hasTarget = Boolean(process.env.E2E_SUPABASE_URL)
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer:
    hasTarget && !process.env.E2E_BASE_URL
      ? {
          command: 'npm run dev',
          url: baseURL,
          reuseExistingServer: true,
          env: {
            NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? '',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY ?? '',
            NEXT_PUBLIC_SITE_URL: baseURL,
          },
        }
      : undefined,
})
