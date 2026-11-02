'use client'

import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr'
import type { Database } from './types'
import { supabaseEnv } from './env'

export function createBrowserClient() {
  const { url, anonKey } = supabaseEnv()
  return createSsrBrowserClient<Database>(url, anonKey)
}
