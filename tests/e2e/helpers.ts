import { test as base, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

export const E2E = {
  url: process.env.E2E_SUPABASE_URL,
  anonKey: process.env.E2E_SUPABASE_ANON_KEY,
  serviceKey: process.env.E2E_SUPABASE_SERVICE_ROLE_KEY,
  memberEmail: process.env.E2E_MEMBER_EMAIL,
  adminEmail: process.env.E2E_ADMIN_EMAIL,
}

export const test = base
test.skip(!E2E.url, 'Set E2E_SUPABASE_URL (and friends) to run browser tests against a Supabase project')

/**
 * Signs the page in as `email` without sending a real email: the service-role
 * key (test-only, never shipped in the app) mints a magic link and we open
 * our own callback with its token_hash.
 */
export async function signInAs(page: Page, email: string) {
  if (!E2E.url || !E2E.serviceKey) throw new Error('E2E_SUPABASE_SERVICE_ROLE_KEY is required for signed-in tests')
  const admin = createClient(E2E.url, E2E.serviceKey, { auth: { persistSession: false } })
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error || !data.properties?.hashed_token) throw error ?? new Error('No token from generateLink')
  await page.goto(`/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=%2Fdashboard`)
  await page.waitForURL('**/dashboard')
}
