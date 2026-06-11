// GET POSTED AI — Supabase Storage integration
import { supabaseAdmin } from './supabase'

const BUCKETS = ['logos', 'business-photos', 'generated-content', 'avatars'] as const

// ─── Initialize buckets (call once on app start) ──────────────────────────
export async function initStorageBuckets(): Promise<void> {
  for (const bucket of BUCKETS) {
    try {
      const { data: exists } = await supabaseAdmin.storage.getBucket(bucket)
      if (!exists) {
        await supabaseAdmin.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB
        })
        console.log(`Created bucket: ${bucket}`)
      }
    } catch {
      // Bucket might not exist, try creating
      try {
        await supabaseAdmin.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 50 * 1024 * 1024,
        })
        console.log(`Created bucket: ${bucket}`)
      } catch { /* already exists or error */ }
    }
  }
}

// ─── Get user folder path ─────────────────────────────────────────────────
function getUserPath(): string {
  // Use a consistent ID based on localStorage or 'demo' for now
  return localStorage.getItem('gp_user_id') || 'demo-user'
}

// ─── Upload logo ───────────────────────────────────────────────────────────
export async function uploadLogo(file: File): Promise<string | null> {
  try {
    const userId = getUserPath()
    const ext = file.name.split('.').pop() || 'png'
    const path = `${userId}/logo.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('logos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data: urlData } = supabaseAdmin.storage.from('logos').getPublicUrl(path)
    return urlData.publicUrl
  } catch (err) {
    console.error('Logo upload error:', err)
    // Fallback: return base64
    return fileToBase64(file)
  }
}

// ─── Upload business photo ─────────────────────────────────────────────────
export async function uploadBusinessPhoto(file: File): Promise<string | null> {
  try {
    const userId = getUserPath()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('business-photos')
      .upload(path, file, { upsert: false, contentType: file.type })

    if (uploadError) throw uploadError

    const { data: urlData } = supabaseAdmin.storage.from('business-photos').getPublicUrl(path)
    return urlData.publicUrl
  } catch (err) {
    console.error('Photo upload error:', err)
    return fileToBase64(file)
  }
}

// ─── List business photos ──────────────────────────────────────────────────
export async function listBusinessPhotos(): Promise<string[]> {
  try {
    const userId = getUserPath()
    const { data, error } = await supabaseAdmin.storage
      .from('business-photos')
      .list(userId)

    if (error) throw error
    if (!data) return []

    return data
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => {
        const { data: urlData } = supabaseAdmin.storage.from('business-photos').getPublicUrl(`${userId}/${f.name}`)
        return urlData.publicUrl
      })
  } catch {
    // Fallback: try localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('gp_business_photos') || '[]')
      return saved as string[]
    } catch { return [] }
  }
}

// ─── Delete business photo ─────────────────────────────────────────────────
export async function deleteBusinessPhoto(url: string): Promise<boolean> {
  try {
    const userId = getUserPath()
    const filename = url.split('/').pop()
    if (!filename) return false

    await supabaseAdmin.storage
      .from('business-photos')
      .remove([`${userId}/${filename}`])

    // Also remove from localStorage fallback
    const saved = JSON.parse(localStorage.getItem('gp_business_photos') || '[]')
    const updated = (saved as string[]).filter((u: string) => u !== url)
    localStorage.setItem('gp_business_photos', JSON.stringify(updated))
    return true
  } catch { return false }
}

// ─── Upload generated content ──────────────────────────────────────────────
export async function uploadGeneratedContent(
  file: File,
  type: 'video' | 'image' | 'audio'
): Promise<string | null> {
  try {
    const userId = getUserPath()
    const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : type === 'image' ? 'jpg' : 'mp3')
    const path = `${userId}/${type}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('generated-content')
      .upload(path, file, { upsert: false, contentType: file.type })

    if (uploadError) throw uploadError

    const { data: urlData } = supabaseAdmin.storage.from('generated-content').getPublicUrl(path)
    return urlData.publicUrl
  } catch (err) {
    console.error('Content upload error:', err)
    return null
  }
}

// ─── List generated content ────────────────────────────────────────────────
export async function listGeneratedContent(): Promise<{url: string; type: string; created: string}[]> {
  try {
    const userId = getUserPath()
    const { data, error } = await supabaseAdmin.storage
      .from('generated-content')
      .list(userId)

    if (error) throw error
    if (!data) return []

    const results: {url: string; type: string; created: string}[] = []

    for (const folder of data.filter(d => d.id)) {
      const { data: files } = await supabaseAdmin.storage
        .from('generated-content')
        .list(`${userId}/${folder.name}`)

      if (files) {
        for (const f of files) {
          if (f.name === '.emptyFolderPlaceholder') continue
          const type = folder.name // video/image/audio
          const { data: urlData } = supabaseAdmin.storage
            .from('generated-content')
            .getPublicUrl(`${userId}/${type}/${f.name}`)
          results.push({ url: urlData.publicUrl, type, created: f.created_at || new Date().toISOString() })
        }
      }
    }

    return results
  } catch {
    return []
  }
}

// ─── Helper: file to base64 ────────────────────────────────────────────────
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

// ─── Helper: compress image ────────────────────────────────────────────────
export function compressImage(file: File, maxWidth: number = 1200): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let w = img.width
      let h = img.height
      if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth }
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }))
        } else resolve(file)
      }, 'image/jpeg', 0.8)
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}
