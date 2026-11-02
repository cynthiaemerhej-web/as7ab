'use client'

export default function AutoSubmitSelect({ name, defaultValue, options, className }: { name: string; defaultValue: string; options: { value: string; label: string }[]; className?: string }) {
  return (
    <select name={name} defaultValue={defaultValue} onChange={(e) => e.currentTarget.form?.requestSubmit()} className={className} aria-label={name}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
