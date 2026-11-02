import type { Metadata } from 'next'
import Link from 'next/link'
import AdForm from '@/components/admin/AdForm'
import AutoSubmitSelect from '@/components/admin/AutoSubmitSelect'
import Badge from '@/components/Badge'
import ConfirmSubmit from '@/components/ConfirmSubmit'
import { AD_SLOT_INFO, adSlotName } from '@/lib/ad-slots'
import { adStatus, todayIso } from '@/lib/ads/status'
import { getAdRequests, getAds } from '@/lib/data/admin'
import { AD_BANNERS_BUCKET, photoUrlFor } from '@/lib/data/photos'
import { displayPhone } from '@/lib/phone'
import { createClient } from '@/lib/supabase/server'
import { deleteAd, setAdRequestStatus, toggleAd } from '../actions'

export const metadata: Metadata = { title: 'Ads' }

const small = 'inline-flex min-h-9 items-center rounded-lg border border-line bg-white px-3 text-sm font-medium hover:bg-surface'
const statusVariant = { live: 'success', scheduled: 'accent', ended: 'neutral', paused: 'warning' } as const

export default async function AdsPage(props: PageProps<'/admin/ads'>) {
  const sp = await props.searchParams
  const editId = typeof sp.edit === 'string' ? sp.edit : null
  const sb = await createClient()
  const [ads, requests] = await Promise.all([getAds(sb), getAdRequests(sb)])
  const urlFor = photoUrlFor(sb, AD_BANNERS_BUCKET)
  const editing = editId ? ads.find((a) => a.id === editId) ?? null : null
  const today = todayIso()

  return (
    <div className="space-y-10">
      <section className="rounded-card bg-card p-5 shadow-card ring-1 ring-line/60">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{editing ? `Edit ad: ${editing.advertiser_name}` : 'New ad'}</h2>
          {editing && <Link href="/admin/ads" className="text-sm text-muted hover:underline">Cancel edit</Link>}
        </div>
        <div className="mt-4">
          <AdForm key={editing?.id ?? 'new'} ad={editing} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">All ads <span className="text-muted">({ads.length})</span></h2>
        {AD_SLOT_INFO.map((slot) => {
          const rows = ads.filter((a) => a.slot === slot.slot)
          return (
            <div key={slot.slot} className="mt-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{slot.name} <span className="font-normal normal-case">· {slot.size}</span></h3>
              {rows.length === 0 ? (
                <p className="mt-1 text-sm text-muted">No ads in this slot. Visitors see the “Advertise here” placeholder.</p>
              ) : (
                <ul className="mt-2 divide-y divide-line rounded-card bg-card shadow-card ring-1 ring-line/60">
                  {rows.map((a) => {
                    const st = adStatus(a, today)
                    return (
                      <li key={a.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={urlFor(a.image_path)} alt="" className="h-14 w-28 shrink-0 rounded-lg object-cover ring-1 ring-line" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{a.advertiser_name}</span>
                            <Badge variant={statusVariant[st]}>{st}</Badge>
                          </div>
                          <p className="text-xs text-muted">
                            {a.starts_at} → {a.ends_at} · {a.impressions} views · {a.clicks} clicks ·{' '}
                            <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="hover:underline">link</a>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/admin/ads?edit=${a.id}`} className={small}>Edit</Link>
                          <form action={toggleAd}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="isActive" value={a.is_active ? 'false' : 'true'} />
                            <button className={small}>{a.is_active ? 'Pause' : 'Resume'}</button>
                          </form>
                          <form action={deleteAd}>
                            <input type="hidden" name="id" value={a.id} />
                            <ConfirmSubmit message={`Delete the ad from ${a.advertiser_name}?`} className={`${small} text-rose-700`}>Delete</ConfirmSubmit>
                          </form>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </section>

      <section>
        <h2 className="text-lg font-bold">Ad requests <span className="text-muted">({requests.filter((r) => r.status === 'new').length} new)</span></h2>
        <p className="text-sm text-muted">Sent from the Advertise page. Contact them, agree a price, then create the ad above.</p>
        {requests.length === 0 ? (
          <p className="mt-2 rounded-card bg-card p-6 text-center text-sm text-muted ring-1 ring-line/60">No requests yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-card bg-card shadow-card ring-1 ring-line/60">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {r.name}
                    {r.business && <span className="font-normal text-muted"> · {r.business}</span>}
                  </p>
                  <p className="text-sm">
                    <a href={`mailto:${r.email}`} className="text-accent-dark hover:underline">{r.email}</a>
                    {r.phone && <> · <a href={`tel:${r.phone}`} className="text-accent-dark hover:underline">{displayPhone(r.phone)}</a></>}
                    {' '}· wants <span className="font-medium">{adSlotName(r.slot)}</span> · {new Date(r.created_at).toLocaleDateString('en-GB')}
                  </p>
                  {r.message && <p className="mt-1 whitespace-pre-line text-sm text-ink/80">{r.message}</p>}
                </div>
                <form action={setAdRequestStatus}>
                  <input type="hidden" name="id" value={r.id} />
                  <AutoSubmitSelect
                    name="status"
                    defaultValue={r.status}
                    options={[{ value: 'new', label: 'New' }, { value: 'contacted', label: 'Contacted' }, { value: 'closed', label: 'Closed' }]}
                    className="min-h-9 rounded-lg border border-line bg-white px-2 text-sm"
                  />
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
