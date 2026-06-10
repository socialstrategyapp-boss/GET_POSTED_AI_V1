/**
 * Supabase Storage Integration Module
 * GET POSTED AI — File uploads, bucket management, per-user storage
 *
 * Buckets:
 *   - avatars          → user profile photos
 *   - business-photos  → business photos per user
 *   - generated-content→ AI-generated videos, images, audio
 *   - logos            → business logos
 *
 * Storage Rules (configure in Supabase dashboard):
 *   - Users can only read/write their own folder: (auth.uid() = (storage.foldername(name))[1])
 *   - Public read for generated content (optional — controlled via getPublicUrl)
 *   - Auth required for all uploads
 */

import { supabase } from './supabase'

// ── Constants ────────────────────────────────────────────────────────────────

const BUCKETS = [
  { name: 'avatars', isPublic: false },
  { name: 'business-photos', isPublic: false },
  { name: 'generated-content', isPublic: false },
  { name: 'logos', isPublic: false },
] as const

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm']
const MAX_FILE_SIZE_MB = 50

// ── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedContentItem {
  url: string
  type: string
  created: string
  name: string
  path: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export type ContentType = 'video' | 'image' | 'audio'

// ── 1. Bucket Initialization ─────────────────────────────────────────────────

/**
 * Create all required storage buckets if they don't already exist.
 * Call this once during app initialization (e.g., in App.tsx useEffect).
 */
export async function initStorageBuckets(): Promise<void> {
  const { data: existingBuckets, error: listError } =
    await supabase.storage.listBuckets()

  if (listError) {
    console.error('[Storage] Failed to list buckets:', listError.message)
    throw new Error(`Storage init failed: ${listError.message}`)
  }

  const existingNames = new Set(existingBuckets?.map((b) => b.name) ?? [])

  for (const bucket of BUCKETS) {
    if (existingNames.has(bucket.name)) {
      console.log(`[Storage] Bucket "${bucket.name}" already exists`)
      continue
    }

    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.isPublic,
      fileSizeLimit: MAX_FILE_SIZE_MB * 1024 * 1024, // 50 MB
      allowedMimeTypes: [
        ...ALLOWED_IMAGE_TYPES,
        ...ALLOWED_VIDEO_TYPES,
        ...ALLOWED_AUDIO_TYPES,
      ],
    })

    if (error) {
      console.error(`[Storage] Failed to create bucket "${bucket.name}":`, error.message)
      // Don't throw — bucket may already exist due to race condition
      continue
    }

    console.log(`[Storage] Created bucket "${bucket.name}"`)
  }

  console.log('[Storage] Bucket initialization complete')
}

// ── 2. Upload Functions ──────────────────────────────────────────────────────

/**
 * Validate a file before upload (type + size).
 */
function validateFile(
  file: File,
  allowedTypes?: string[],
  maxSizeMB: number = MAX_FILE_SIZE_MB
): string | null {
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${maxSizeMB}MB`
  }
  return null
}

/**
 * Extract file extension from filename or MIME type.
 */
function getExtension(file: File): string {
  const nameExt = file.name.split('.').pop()?.toLowerCase()
  if (nameExt && nameExt.length > 0 && nameExt.length <= 6) return nameExt

  // Fallback from MIME type
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
  }
  return mimeMap[file.type] || 'bin'
}

/**
 * Get the public URL for a file in a bucket.
 * Assumes the bucket is configured for public access or RLS allows it.
 */
function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Upload a business logo.
 * Path: logos/{userId}/logo.{ext}
 */
export async function uploadLogo(userId: string, file: File): Promise<string | null> {
  const error = validateFile(file, ALLOWED_IMAGE_TYPES, 5)
  if (error) {
    console.error('[Storage] Logo validation failed:', error)
    return null
  }

  const ext = getExtension(file)
  const path = `${userId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type,
    })

  if (uploadError) {
    console.error('[Storage] Logo upload failed:', uploadError.message)
    return null
  }

  console.log('[Storage] Logo uploaded:', path)
  return getPublicUrl('logos', path)
}

/**
 * Upload a business photo.
 * Path: business-photos/{userId}/{timestamp}-{filename}
 */
export async function uploadBusinessPhoto(
  userId: string,
  file: File
): Promise<string | null> {
  const error = validateFile(file, ALLOWED_IMAGE_TYPES, 10)
  if (error) {
    console.error('[Storage] Business photo validation failed:', error)
    return null
  }

  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase()
  const path = `${userId}/${timestamp}-${sanitizedName}`

  const { error: uploadError } = await supabase.storage
    .from('business-photos')
    .upload(path, file, {
      upsert: false,
      cacheControl: '3600',
      contentType: file.type,
    })

  if (uploadError) {
    console.error('[Storage] Business photo upload failed:', uploadError.message)
    return null
  }

  console.log('[Storage] Business photo uploaded:', path)
  return getPublicUrl('business-photos', path)
}

/**
 * Upload AI-generated content (video, image, or audio).
 * Path: generated-content/{userId}/{type}/{timestamp}-{filename}
 */
export async function uploadGeneratedContent(
  userId: string,
  file: File,
  type: ContentType
): Promise<string | null> {
  const typeMap: Record<ContentType, string[]> = {
    video: ALLOWED_VIDEO_TYPES,
    image: ALLOWED_IMAGE_TYPES,
    audio: ALLOWED_AUDIO_TYPES,
  }

  const allowed = typeMap[type]
  const error = validateFile(file, allowed, MAX_FILE_SIZE_MB)
  if (error) {
    console.error('[Storage] Generated content validation failed:', error)
    return null
  }

  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase()
  const path = `${userId}/${type}/${timestamp}-${sanitizedName}`

  const { error: uploadError } = await supabase.storage
    .from('generated-content')
    .upload(path, file, {
      upsert: false,
      cacheControl: '3600',
      contentType: file.type,
    })

  if (uploadError) {
    console.error('[Storage] Generated content upload failed:', uploadError.message)
    return null
  }

  console.log(`[Storage] Generated ${type} uploaded:`, path)
  return getPublicUrl('generated-content', path)
}

/**
 * Upload a user avatar.
 * Path: avatars/{userId}/avatar.{ext}
 */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const error = validateFile(file, ALLOWED_IMAGE_TYPES, 5)
  if (error) {
    console.error('[Storage] Avatar validation failed:', error)
    return null
  }

  // Compress avatar before upload for consistent sizing
  const compressed = await compressImage(file, 512)

  const ext = getExtension(compressed)
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, compressed, {
      upsert: true,
      cacheControl: '3600',
      contentType: compressed.type || file.type,
    })

  if (uploadError) {
    console.error('[Storage] Avatar upload failed:', uploadError.message)
    return null
  }

  console.log('[Storage] Avatar uploaded:', path)
  return getPublicUrl('avatars', path)
}

// ── 3. List Functions ────────────────────────────────────────────────────────

/**
 * List all business photos for a user.
 * Returns array of public URLs.
 */
export async function listBusinessPhotos(userId: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from('business-photos')
    .list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (error) {
    console.error('[Storage] Failed to list business photos:', error.message)
    return []
  }

  if (!data || data.length === 0) return []

  return data
    .filter((item) => !item.name.startsWith('.') && item.id) // Skip empty placeholder folders
    .map((item) => getPublicUrl('business-photos', `${userId}/${item.name}`))
}

/**
 * List all generated content for a user with metadata.
 * Returns array of objects with url, type, created timestamp, name, and path.
 */
export async function listGeneratedContent(
  userId: string
): Promise<GeneratedContentItem[]> {
  const { data, error } = await supabase.storage
    .from('generated-content')
    .list(userId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (error) {
    console.error('[Storage] Failed to list generated content:', error.message)
    return []
  }

  if (!data || data.length === 0) return []

  // Recursively list sub-folders (video, image, audio)
  const results: GeneratedContentItem[] = []

  for (const folder of data) {
    if (!folder.name || folder.name.startsWith('.')) continue

    // folder.name should be one of: video, image, audio
    const type = folder.name as ContentType

    const { data: files, error: listError } = await supabase.storage
      .from('generated-content')
      .list(`${userId}/${type}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (listError) {
      console.error(`[Storage] Failed to list ${type} content:`, listError.message)
      continue
    }

    if (!files) continue

    for (const file of files) {
      if (!file.name || file.name.startsWith('.')) continue

      const path = `${userId}/${type}/${file.name}`
      const created = file.created_at
        ? new Date(file.created_at).toISOString()
        : new Date().toISOString()

      results.push({
        url: getPublicUrl('generated-content', path),
        type,
        created,
        name: file.name,
        path,
      })
    }
  }

  // Sort by created date descending
  return results.sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  )
}

// ── 4. Delete Function ───────────────────────────────────────────────────────

/**
 * Delete a file from a storage bucket.
 * @param bucket — bucket name (avatars, business-photos, generated-content, logos)
 * @param path — full path within the bucket (e.g., "user-id-123/filename.jpg")
 * @returns true if deleted successfully
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    console.error(`[Storage] Failed to delete from "${bucket}":`, error.message)
    return false
  }

  console.log(`[Storage] Deleted "${path}" from "${bucket}"`)
  return true
}

/**
 * Delete multiple files from a storage bucket in one call.
 * @param bucket — bucket name
 * @param paths — array of full paths within the bucket
 * @returns true if all deleted successfully
 */
export async function deleteFiles(bucket: string, paths: string[]): Promise<boolean> {
  if (paths.length === 0) return true

  const { error } = await supabase.storage.from(bucket).remove(paths)

  if (error) {
    console.error(`[Storage] Failed to delete batch from "${bucket}":`, error.message)
    return false
  }

  console.log(`[Storage] Deleted ${paths.length} files from "${bucket}"`)
  return true
}

// ── 5. Helper Functions ──────────────────────────────────────────────────────

/**
 * Convert a File to a base64 data URL for preview before upload.
 * @param file — the file to convert
 * @returns base64 data URL (e.g., "data:image/png;base64,...")
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('FileReader did not return a string'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Compress an image to a maximum width while maintaining aspect ratio.
 * Produces a JPEG by default for smaller file sizes.
 * @param file — the image file to compress
 * @param maxWidth — maximum width in pixels (default 1024)
 * @param quality — JPEG quality 0-1 (default 0.85)
 * @returns a new compressed File
 */
export function compressImage(
  file: File,
  maxWidth: number = 1024,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    // If not an image, return original
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    // SVGs don't need compression
    if (file.type === 'image/svg+xml') {
      resolve(file)
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // If image is already smaller than maxWidth, return original
      if (img.width <= maxWidth && file.size < 2 * 1024 * 1024) {
        resolve(file)
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get 2D canvas context'))
        return
      }

      // Calculate new dimensions maintaining aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1)
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)

      // Use better quality scaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob returned null'))
            return
          }

          const compressedFile = new File([blob], file.name, {
            type: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            lastModified: Date.now(),
          })

          console.log(
            `[Storage] Compressed ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`
          )

          resolve(compressedFile)
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      // If image fails to load, return original file
      console.warn('[Storage] Image compression failed, returning original')
      resolve(file)
    }

    img.src = objectUrl
  })
}

/**
 * Generate a thumbnail/preview for a video file.
 * Returns a base64 PNG data URL of the first frame.
 */
export function generateVideoThumbnail(file: File, maxWidth: number = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)

    video.muted = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'

    video.onloadeddata = () => {
      video.currentTime = 0.1 // Seek slightly past start for a meaningful frame
    }

    video.onseeked = () => {
      URL.revokeObjectURL(objectUrl)

      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxWidth / video.videoWidth, 1)
      canvas.width = Math.round(video.videoWidth * ratio)
      canvas.height = Math.round(video.videoHeight * ratio)

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get 2D canvas context'))
        return
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const thumbnail = canvas.toDataURL('image/png')
      resolve(thumbnail)
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load video for thumbnail generation'))
    }

    video.src = objectUrl
    video.load()
  })
}

// ── Utility / Convenience Exports ────────────────────────────────────────────

/**
 * Check if a bucket exists.
 */
export async function bucketExists(name: string): Promise<boolean> {
  const { data, error } = await supabase.storage.listBuckets()
  if (error) {
    console.error('[Storage] Failed to list buckets:', error.message)
    return false
  }
  return data?.some((b) => b.name === name) ?? false
}

/**
 * Get all buckets and their info.
 */
export async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets()
  if (error) {
    console.error('[Storage] Failed to list buckets:', error.message)
    return []
  }
  return (
    data?.map((b) => ({
      name: b.name,
      id: b.id,
      public: b.public,
      createdAt: b.created_at,
    })) ?? []
  )
}

/**
 * Build a signed URL for private bucket access (expires in N seconds).
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)

  if (error) {
    console.error('[Storage] Failed to create signed URL:', error.message)
    return null
  }

  return data.signedUrl
}

/**
 * Empty a user's folder in a bucket (delete all their files).
 * Use with caution!
 */
export async function emptyUserFolder(bucket: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(userId, { limit: 1000 })

  if (error) {
    console.error(`[Storage] Failed to list folder "${userId}":`, error.message)
    return false
  }

  if (!data || data.length === 0) return true

  const paths = data
    .filter((item) => !item.name.startsWith('.'))
    .map((item) => `${userId}/${item.name}`)

  return deleteFiles(bucket, paths)
}
