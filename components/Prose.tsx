/** Renders admin-edited plain text as paragraphs (split on blank lines). */
export default function Prose({ text, className = '' }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  return (
    <div className={`space-y-4 leading-relaxed text-ink/90 ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  )
}
