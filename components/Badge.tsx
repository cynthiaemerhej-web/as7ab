import type { ReactNode } from 'react'

type Variant = 'primary' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger'

const styles: Record<Variant, string> = {
  primary: 'bg-primary/10 text-primary-dark',
  accent: 'bg-accent/10 text-accent-dark',
  neutral: 'bg-ink/5 text-muted',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-800',
}

export default function Badge({ children, variant = 'neutral', className = '' }: { children: ReactNode; variant?: Variant; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}
