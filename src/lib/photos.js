import { del, get, keys, set } from 'idb-keyval'

const PREFIX = 'bodoque_photo_'
const MAIN_KEY = 'bodoque_photo_main'
const INDEX_KEY = 'bodoque_photo_index'

async function readIndex() {
  try {
    const idx = (await get(INDEX_KEY)) || []
    return Array.isArray(idx) ? idx : []
  } catch {
    return []
  }
}

async function writeIndex(idx) {
  await set(INDEX_KEY, idx)
}

export async function compressImage(file, max = 1280, quality = 0.85) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  const type = canvas.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg'
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality))
  if (!blob) throw new Error('No se pudo comprimir la imagen')
  return blob
}

export async function savePhoto({ file, month = null, caption = '', main = false }) {
  const blob = file instanceof Blob ? file : await compressImage(file)
  const stored = blob.type === 'image/webp' || blob.size < 400_000 ? blob : await compressImage(blob)
  const id = `${PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const record = { id, month, caption, createdAt: new Date().toISOString(), blob: stored }
  await set(id, record)
  if (main) await set(MAIN_KEY, id)
  const idx = await readIndex()
  idx.unshift(id)
  await writeIndex(idx)
  return record
}

export async function setMainPhoto(id) {
  await set(MAIN_KEY, id)
}

export async function getMainPhotoId() {
  try {
    return (await get(MAIN_KEY)) || null
  } catch {
    return null
  }
}

export async function listPhotos() {
  const idx = await readIndex()
  const all = await Promise.all(
    idx.map(async (id) => {
      try {
        return (await get(id)) || null
      } catch {
        return null
      }
    }),
  )
  return all.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getPhoto(id) {
  if (!id) return null
  try {
    return (await get(id)) || null
  } catch {
    return null
  }
}

export async function deletePhoto(id) {
  await del(id)
  const idx = (await readIndex()).filter((x) => x !== id)
  await writeIndex(idx)
  const mainId = await getMainPhotoId()
  if (mainId === id) await del(MAIN_KEY)
}

export async function photoCount() {
  try {
    return (await keys()).filter((k) => String(k).startsWith(PREFIX)).length
  } catch {
    return 0
  }
}

export const toObjectURL = (record) => (record?.blob ? URL.createObjectURL(record.blob) : null)
