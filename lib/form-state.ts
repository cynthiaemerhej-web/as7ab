import type { ZodError } from 'zod'

export type FormState = {
  ok?: true
  listingId?: string
  slug?: string
  error?: string
  message?: string
  fieldErrors?: Record<string, string>
}

/** First issue per top-level field, keyed by field name. */
export function zodToFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}
