import { Megaphone } from 'lucide-react'

export default function Announcement({ text, enabled }: { text: string; enabled: boolean }) {
  if (!enabled || !text.trim()) return null
  return (
    <div role="status" className="bg-accent text-white">
      <p className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2 text-sm">
        <Megaphone className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{text}</span>
      </p>
    </div>
  )
}
