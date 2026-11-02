import Link from 'next/link'
import { LogoMark } from './Logo'
import { SITE_NAME } from '@/lib/constants'

export default function Footer({ contactEmail, tagline }: { contactEmail: string; tagline: string }) {
  return (
    <footer className="mt-12 border-t border-line bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark className="h-6 w-6" />
            <span className="font-extrabold">{SITE_NAME}</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-muted">{tagline}</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm">
          <Link href="/search" className="hover:text-accent-dark">Browse listings</Link>
          <Link href="/dashboard/listings/new" className="hover:text-accent-dark">Post a listing</Link>
          <Link href="/advertise" className="hover:text-accent-dark">Advertise</Link>
          <Link href="/about" className="hover:text-accent-dark">About</Link>
          <Link href="/terms" className="hover:text-accent-dark">Terms</Link>
          <a href={`mailto:${contactEmail}`} className="hover:text-accent-dark">Contact us</a>
        </nav>
        <p className="text-sm text-muted sm:text-right">
          Free for everyone in Lebanon.
          <br />© {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  )
}
