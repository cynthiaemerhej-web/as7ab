import { AtSign, Globe, Mail, MessageCircle, Phone } from 'lucide-react'
import { displayPhone, whatsappLink } from '@/lib/phone'

type Props = {
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  instagram?: string | null
  website?: string | null
}

const base = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-card px-4 font-semibold shadow-sm transition'

export default function ContactButtons({ phone, whatsapp, email, instagram, website }: Props) {
  const items: { key: string; href: string; label: string; detail?: string; className: string; external: boolean; icon: React.ReactNode }[] = []
  if (phone)
    items.push({ key: 'call', href: `tel:${phone}`, label: 'Call', detail: displayPhone(phone), className: 'bg-primary text-white hover:bg-primary-dark', external: false, icon: <Phone className="h-5 w-5" aria-hidden="true" /> })
  if (whatsapp)
    items.push({ key: 'wa', href: whatsappLink(whatsapp), label: 'WhatsApp', className: 'bg-whatsapp text-white hover:brightness-95', external: true, icon: <MessageCircle className="h-5 w-5" aria-hidden="true" /> })
  if (email)
    items.push({ key: 'email', href: `mailto:${email}`, label: 'Email', className: 'bg-accent text-white hover:bg-accent-dark', external: false, icon: <Mail className="h-5 w-5" aria-hidden="true" /> })
  if (instagram)
    items.push({ key: 'ig', href: `https://instagram.com/${instagram}`, label: 'Instagram', detail: `@${instagram}`, className: 'border border-line bg-white text-ink hover:bg-surface', external: true, icon: <AtSign className="h-5 w-5" aria-hidden="true" /> })
  if (website)
    items.push({ key: 'web', href: website, label: 'Website', className: 'border border-line bg-white text-ink hover:bg-surface', external: true, icon: <Globe className="h-5 w-5" aria-hidden="true" /> })

  if (items.length === 0) return <p className="text-sm text-muted">No contact details were added to this listing yet.</p>

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((it) => (
        <a
          key={it.key}
          href={it.href}
          className={`${base} ${it.className}`}
          {...(it.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {it.icon}
          <span>{it.label}</span>
          {it.detail && <span className="font-normal opacity-90">{it.detail}</span>}
        </a>
      ))}
    </div>
  )
}
