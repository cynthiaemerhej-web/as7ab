import Link from 'next/link'
import { SITE_NAME } from '@/lib/constants'

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="15" cy="20" r="12" fill="var(--color-primary)" />
      <circle cx="25" cy="20" r="12" fill="var(--color-accent)" fillOpacity="0.9" />
      <circle cx="20" cy="20" r="4.5" fill="var(--color-surface)" />
    </svg>
  )
}

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`} aria-label={`${SITE_NAME} home`}>
      <LogoMark />
      <span className="text-2xl font-extrabold tracking-tight text-ink">{SITE_NAME}</span>
    </Link>
  )
}
