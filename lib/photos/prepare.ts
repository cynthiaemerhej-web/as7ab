import { MAX_PHOTO_BYTES, PHOTO_MIME_TYPES } from '@/lib/constants'

export function validatePhotoFile(file: { type: string; size: number }): string | null {
  if (!(PHOTO_MIME_TYPES as readonly string[]).includes(file.type)) return 'Use a JPG, PNG or WebP image'
  if (file.size > MAX_PHOTO_BYTES) return 'Each photo must be under 5 MB'
  return null
}

export function photoStoragePath(userId: string, listingId: string): string {
  return `${userId}/${listingId}/${crypto.randomUUID()}.jpg`
}

export function isOwnedPhotoPath(path: string, userId: string, listingId: string): boolean {
  const parts = path.split('/')
  if (parts.length !== 3) return false
  const [u, l, file] = parts
  return u === userId && l === listingId && /^[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(file) && !file.includes("..")
}

/** Browser only: resize to max 1600px and re-encode as JPEG to keep storage small. */
export async function prepareImage(file: File): Promise<File> {
  const { default: compress } = await import('browser-image-compression')
  const out = await compress(file, { maxWidthOrHeight: 1600, maxSizeMB: 1, fileType: 'image/jpeg', useWebWorker: true })
  return new File([out], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}
