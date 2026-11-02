'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { AD_BANNERS_BUCKET, LISTING_PHOTOS_BUCKET } from '@/lib/data/photos'
import { SETTINGS_KEYS } from '@/lib/data/settings'
import { zodToFieldErrors, type FormState } from '@/lib/form-state'
import { adInputSchema, categoryInputSchema, settingsSchema } from '@/lib/schemas'
import { slugify } from '@/lib/slug'
import { createClient } from '@/lib/supabase/server'

function obj(formData: FormData): Record<string, string> {
  const o: Record<string, string> = {}
  formData.forEach((v, k) => {
    if (typeof v === 'string') o[k] = v
  })
  return o
}

function revalidateAll() {
  revalidatePath('/', 'layout')
}

// ------------------------------------------------------------ moderation

export async function approveListing(formData: FormData): Promise<void> {
  await requireAdmin()
  const sb = await createClient()
  await sb.from('listings').update({ status: 'approved', needs_review: false, rejection_reason: null }).eq('id', String(formData.get('id')))
  revalidateAll()
}

export async function rejectListing(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const reason = String(formData.get('reason') ?? '').trim()
  if (reason.length < 3 || reason.length > 300) return { error: 'Give a short reason (3–300 characters) so the member knows what to fix.' }
  const sb = await createClient()
  const { error } = await sb.from('listings').update({ status: 'rejected', rejection_reason: reason, needs_review: false }).eq('id', String(formData.get('id')))
  if (error) return { error: 'Could not reject this listing.' }
  revalidateAll()
  return { ok: true }
}

export async function hideListing(formData: FormData): Promise<void> {
  await requireAdmin()
  const sb = await createClient()
  await sb.from('listings').update({ status: 'hidden', needs_review: false }).eq('id', String(formData.get('id')))
  revalidateAll()
}

export async function clearReviewFlag(formData: FormData): Promise<void> {
  await requireAdmin()
  const sb = await createClient()
  await sb.from('listings').update({ needs_review: false }).eq('id', String(formData.get('id')))
  revalidateAll()
}

export async function deleteListingAsAdmin(formData: FormData): Promise<void> {
  await requireAdmin()
  const sb = await createClient()
  const id = String(formData.get('id'))
  const { data: photos } = await sb.from('listing_photos').select('storage_path').eq('listing_id', id)
  if (photos && photos.length > 0) await sb.storage.from(LISTING_PHOTOS_BUCKET).remove(photos.map((p) => p.storage_path))
  await sb.from('listings').delete().eq('id', id)
  revalidateAll()
}

// ------------------------------------------------------------------- ads

const imagePathSchema = z.string().regex(/^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|gif)$/i, 'Upload a banner image')

export async function saveAd(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const o = obj(formData)
  const parsed = adInputSchema.safeParse({ ...o, isActive: o.isActive ?? 'false' })
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error), error: 'Please fix the highlighted fields.' }
  const id = o.id || null
  const imagePath = o.imagePath || null
  if (!id && !imagePath) return { fieldErrors: { imagePath: 'Upload a banner image' }, error: 'A banner image is required.' }
  if (imagePath && !imagePathSchema.safeParse(imagePath).success) return { error: 'Invalid banner image.' }
  const sb = await createClient()
  const values = {
    advertiser_name: parsed.data.advertiserName,
    link_url: parsed.data.linkUrl,
    slot: parsed.data.slot,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
    is_active: parsed.data.isActive,
    ...(imagePath ? { image_path: imagePath } : {}),
  }
  const { error } = id
    ? await sb.from('ads').update(values).eq('id', id)
    : await sb.from('ads').insert({ ...values, image_path: imagePath as string, created_by: admin.id })
  if (error) return { error: 'Could not save the ad.' }
  revalidateAll()
  return { ok: true, message: id ? 'Ad updated.' : 'Ad created.' }
}

export async function toggleAd(formData: FormData): Promise<void> {
  await requireAdmin()
  const sb = await createClient()
  await sb.from('ads').update({ is_active: formData.get('isActive') === 'true' }).eq('id', String(formData.get('id')))
  revalidateAll()
}

export async function deleteAd(formData: FormData): Promise<void> {
  await requireAdmin()
  const sb = await createClient()
  const id = String(formData.get('id'))
  const { data } = await sb.from('ads').select('image_path').eq('id', id).maybeSingle()
  if (data?.image_path) await sb.storage.from(AD_BANNERS_BUCKET).remove([data.image_path])
  await sb.from('ads').delete().eq('id', id)
  revalidateAll()
}

export async function setAdRequestStatus(formData: FormData): Promise<void> {
  await requireAdmin()
  const status = String(formData.get('status'))
  if (!['new', 'contacted', 'closed'].includes(status)) return
  const sb = await createClient()
  await sb.from('ad_requests').update({ status: status as 'new' | 'contacted' | 'closed' }).eq('id', String(formData.get('id')))
  revalidatePath('/admin/ads')
}

// ------------------------------------------------------------ categories

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const o = obj(formData)
  const parsed = categoryInputSchema.safeParse(o)
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error), error: 'Please fix the highlighted fields.' }
  const sb = await createClient()
  const id = o.id ? Number(o.id) : null
  const values = { name: parsed.data.name, icon: parsed.data.icon, sort_order: parsed.data.sortOrder }
  const { error } = id
    ? await sb.from('categories').update(values).eq('id', id)
    : await sb.from('categories').insert({ ...values, slug: slugify(parsed.data.name) || `category-${Date.now()}` })
  if (error) return { error: error.message.includes('unique') ? 'A category with that name already exists.' : 'Could not save the category.' }
  revalidateAll()
  return { ok: true, message: 'Category saved.' }
}

export async function toggleCategory(formData: FormData): Promise<void> {
  await requireAdmin()
  const sb = await createClient()
  await sb.from('categories').update({ is_active: formData.get('isActive') === 'true' }).eq('id', Number(formData.get('id')))
  revalidateAll()
}

// ---------------------------------------------------------------- admins

export async function promoteAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const email = z.email().safeParse(String(formData.get('email') ?? '').trim())
  if (!email.success) return { error: 'Enter a valid email address.' }
  const sb = await createClient()
  const { data, error } = await sb.rpc('set_admin_by_email', { target_email: email.data, make_admin: true })
  if (error) return { error: 'Could not update admins.' }
  if (!data) return { error: 'No member with that email. They need to sign in to As7ab once first.' }
  revalidatePath('/admin/admins')
  return { ok: true, message: `${email.data} is now an admin.` }
}

export async function demoteAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const email = String(formData.get('email') ?? '').trim()
  const sb = await createClient()
  const { error } = await sb.rpc('set_admin_by_email', { target_email: email, make_admin: false })
  if (error) return { error: error.message.includes('SELF_DEMOTE') ? "You can't remove your own admin access." : 'Could not update admins.' }
  revalidatePath('/admin/admins')
  return { ok: true, message: `${email} is no longer an admin.` }
}

// -------------------------------------------------------------- settings

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const o = obj(formData)
  const parsed = settingsSchema.safeParse({ ...o, announcement_enabled: o.announcement_enabled ?? 'false' })
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error), error: 'Please fix the highlighted fields.' }
  const sb = await createClient()
  const rows = SETTINGS_KEYS.map((key) => ({ key, value: String(parsed.data[key]) }))
  const { error } = await sb.from('site_settings').upsert(rows, { onConflict: 'key' })
  if (error) return { error: 'Could not save settings.' }
  revalidateAll()
  return { ok: true, message: 'Settings saved. Changes are live.' }
}
