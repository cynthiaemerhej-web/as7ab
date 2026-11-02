import {
  Baby, Briefcase, Camera, Car, Gift, GraduationCap, Laptop, PartyPopper, Shapes, Shirt, Sparkles, Utensils, Wrench,
  type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  'party-popper': PartyPopper,
  utensils: Utensils,
  'graduation-cap': GraduationCap,
  sparkles: Sparkles,
  wrench: Wrench,
  baby: Baby,
  shirt: Shirt,
  gift: Gift,
  laptop: Laptop,
  car: Car,
  briefcase: Briefcase,
  camera: Camera,
  shapes: Shapes,
}

export const CATEGORY_ICON_NAMES = Object.keys(icons)

export default function CategoryIcon({ name, className = 'h-6 w-6' }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Shapes
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />
}
