import Badge from './Badge'
import type { ListingStatus } from '@/lib/constants'

const map: Record<ListingStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  pending: { label: 'Pending review', variant: 'warning' },
  approved: { label: 'Live', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  hidden: { label: 'Hidden', variant: 'neutral' },
}

export default function StatusBadge({ status, needsReview = false }: { status: ListingStatus; needsReview?: boolean }) {
  const { label, variant } = map[status]
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Badge variant={variant}>{label}</Badge>
      {needsReview && status !== 'pending' && <Badge variant="warning">Edited · awaiting re-check</Badge>}
    </span>
  )
}
