import { Search } from 'lucide-react'

type Props = { defaultValue?: string; size?: 'md' | 'lg'; autoFocus?: boolean; id?: string }

export default function SearchBar({ defaultValue = '', size = 'md', autoFocus = false, id = 'q' }: Props) {
  const h = size === 'lg' ? 'min-h-14 text-lg' : 'min-h-11 text-base'
  return (
    <form action="/search" role="search" className="flex w-full items-stretch gap-2">
      <label htmlFor={id} className="sr-only">
        Search listings
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder="Search for cakes, tutors, plumbers, balloons…"
        className={`${h} w-full rounded-card border border-line bg-white px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30`}
      />
      <button type="submit" className={`${h} inline-flex items-center gap-2 rounded-card bg-primary px-4 font-semibold text-white hover:bg-primary-dark`}>
        <Search className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  )
}
