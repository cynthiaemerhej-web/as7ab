'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { MAX_PHOTOS } from '@/lib/constants'
import { requireMember } from '@/lib/auth'
import { LISTING_PHOTOS_BUCKET } from '@/lib/data/photos'
import { updateProfile } from '@/lib/data/profiles'
import { zodToFieldErrors, type FormState } from '@/lib/form-state'
import { isOwnedPhotoPath } from '@/lib/photos/prepare'
import { listingInputSchema, profileInputSchema } from '@/lib/schemas'
import { makeListingSlug } from '@/lib/slug'
import { createClient } from '@/lib/supabase/server'

function formToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {}
  formData.forEach((v, k) => {
    if (typeof v === 'string') obj[k] = v
  })
  if (obj.whatsappSame === 'on') obj.whatsapp = obj.phone ?? ''
  return obj
}

const LIMIT_MESSAGE = 'You already have 10 listings. Hide or delete one to add another.'

export async function createListing(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireMember('/dashboard/listings/new')
  const parsed = listingInputSchema.safeParse(formToObject(formData))
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error), error: 'Please fix the highlighted fields.' }
  const sb = await createClient()
  const id = crypto.randomUUID()
  const slug = makeListingSlug(parsed.data.title, id)
  const { error } = await sb.from('listings').insert({
    id,
    owner_id: profile.id,
    slug,
    title: parsed.data.title,
    description: parsed.data.description,
    category_id: parsed.data.categoryId,
    type: parsed.data.type,
    area: parsed.data.area,
    phone: parsed.data.phone ?? null,
    whatsapp: parsed.data.whatsapp ?? null,
    email: parsed.data.email ?? null,
    instagram: parsed.data.instagram ?? null,
    website: parsed.data.website ?? null,
  })
  if (error) {
    if (error.message.includes('LISTING_LIMIT')) return { error: LIMIT_MESSAGE }
    return { error: 'We could not save your listing. Please try again.' }
  }
  revalidatePath('/dashboard')
  return { ok: true, listingId: id, slug }
}

export async function updateListing(listingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireMember(`/dashboard/listings/${listingId}/edit`)
  const parsed = listingInputSchema.safeParse(formToObject(formData))
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error), error: 'Please fix the highlighted fields.' }
  const sb = await createClient()
  const { data, error } = await sb
    .from('listings')
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      category_id: parsed.data.categoryId,
      type: parsed.data.type,
      area: parsed.data.area,
      phone: parsed.data.phone ?? null,
      whatsapp: parsed.data.whatsapp ?? null,
      email: parsed.data.email ?? null,
      instagram: parsed.data.instagram ?? null,
      website: parsed.data.website ?? null,
    })
    .eq('id', listingId)
    .eq('owner_id', profile.id)
    .select('slug, status')
    .maybeSingle()
  if (error || !data) return { error: 'We could not save your changes. Please try again.' }
  revalidatePath('/dashboard')
  revalidatePath(`/l/${data.slug}`)
  const message =
    data.status === 'approved' || data.status === 'hidden'
      ? 'Saved. Your listing stays visible while an admin re-checks the edit.'
      : data.status === 'rejected'
        ? 'Saved. Press Resubmit on your listings page when you are ready for another review.'
        : 'Saved. An admin will review it soon.'
  return { ok: true, listingId, slug: data.slug, message }
}

export type PhotoItem = { id: string; url: string }
export type PhotosState = { ok?: true; error?: string; photos?: PhotoItem[] }

export async function attachPhotos(listingId: string, paths: string[]): Promise<PhotosState> {
  const profile = await requireMember(`/dashboard/listings/${listingId}/edit`)
  if (paths.some((p) => !isOwnedPhotoPath(p, profile.id, listingId))) return { error: 'Invalid photo path' }
  const sb = await createClient()
  const { data: existing, error: countError } = await sb.from('listing_photos').select('id').eq('listing_id', listingId)
  if (countError) return { error: 'Could not read photos' }
  if ((existing?.length ?? 0) + paths.length > MAX_PHOTOS) return { error: `A listing can have at most ${MAX_PHOTOS} photos` }
  const start = existing?.length ?? 0
  const { error } = await sb
    .from('listing_photos')
    .insert(paths.map((storage_path, i) => ({ listing_id: listingId, storage_path, sort_order: start + i })))
  if (error) return { error: error.message.includes('PHOTO_LIMIT') ? `A listing can have at most ${MAX_PHOTOS} photos` : 'Could not save photos' }
  revalidatePath('/dashboard')
  return listPhotos(sb, listingId)
}

export async function removePhoto(listingId: string, photoId: string): Promise<PhotosState> {
  await requireMember(`/dashboard/listings/${listingId}/edit`)
  const sb = await createClient()
  const { data: photo } = await sb.from('listing_photos').select('id, storage_path').eq('id', photoId).eq('listing_id', listingId).maybeSingle()
  if (!photo) return { error: 'Photo not found' }
  await sb.storage.from(LISTING_PHOTOS_BUCKET).remove([photo.storage_path])
  const { error } = await sb.from('listing_photos').delete().eq('id', photo.id)
  if (error) return { error: 'Could not remove photo' }
  revalidatePath('/dashboard')
  return listPhotos(sb, listingId)
}

async function listPhotos(sb: Awaited<ReturnType<typeof createClient>>, listingId: string): Promise<PhotosState> {
  const { data } = await sb.from('listing_photos').select('id, storage_path, sort_order').eq('listing_id', listingId).order('sort_order')
  const photos = (data ?? []).map((p) => ({ id: p.id, url: sb.storage.from(LISTING_PHOTOS_BUCKET).getPublicUrl(p.storage_path).data.publicUrl }))
  return { ok: true, photos }
}

export async function changeListingStatus(formData: FormData): Promise<void> {
  const profile = await requireMember('/dashboard')
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!['hidden', 'approved', 'pending'].includes(status)) return
  const sb = await createClient()
  await sb.from('listings').update({ status: status as 'hidden' | 'approved' | 'pending' }).eq('id', id).eq('owner_id', profile.id)
  revalidatePath('/dashboard')
}

export async function deleteListing(formData: FormData): Promise<void> {
  const profile = await requireMember('/dashboard')
  const id = String(formData.get('id') ?? '')
  const sb = await createClient()
  const folder = `${profile.id}/${id}`
  const { data: files } = await sb.storage.from(LISTING_PHOTOS_BUCKET).list(folder)
  if (files && files.length > 0) await sb.storage.from(LISTING_PHOTOS_BUCKET).remove(files.map((f) => `${folder}/${f.name}`))
  await sb.from('listings').delete().eq('id', id).eq('owner_id', profile.id)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireMember('/dashboard/profile')
  const parsed = profileInputSchema.safeParse(formToObject(formData))
  if (!parsed.success) return { fieldErrors: zodToFieldErrors(parsed.error), error: 'Please fix the highlighted fields.' }
  const sb = await createClient()
  try {
    await updateProfile(sb, profile.id, parsed.data)
  } catch {
    return { error: 'We could not save your profile. Please try again.' }
  }
  revalidatePath('/dashboard')
  return { ok: true, message: 'Profile saved.' }
}
