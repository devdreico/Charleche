const SUB_KEY = 'bodoque_push_sub_v1'

export const API_BASE = import.meta.env.VITE_API_BASE || ''

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function permissionState() {
  if (!pushSupported()) return 'unsupported'
  return Notification.permission
}

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + '').replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64 + padding)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

async function api(path, body, method = 'POST') {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(body || {}),
  })
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
  return res.json().catch(() => ({}))
}

export async function serverHealthy() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' })
    if (!res.ok) return false
    const data = await res.json().catch(() => ({}))
    return Boolean(data?.ok)
  } catch {
    return false
  }
}

export async function getVapidPublicKey() {
  const res = await fetch(`${API_BASE}/api/push/vapid`, { cache: 'no-store' })
  if (!res.ok) throw new Error('No se pudo obtener la clave del servidor')
  const data = await res.json()
  return data.publicKey
}

export async function enablePush(fireAtISO) {
  if (!pushSupported()) throw new Error('Este navegador no soporta notificaciones')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permiso de notificaciones denegado')

  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const publicKey = await getVapidPublicKey()
  let sub = await reg.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()
  sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
  const json = sub.toJSON()
  localStorage.setItem(SUB_KEY, JSON.stringify(json))
  await api('/api/push/subscribe', { subscription: json, fireAt: fireAtISO })
  return json
}

export async function schedulePush(fireAtISO) {
  const raw = localStorage.getItem(SUB_KEY)
  if (!raw || !fireAtISO) return false
  try {
    const subscription = JSON.parse(raw)
    await api('/api/push/schedule', { subscription, fireAt: fireAtISO })
    return true
  } catch (e) {
    console.warn('No se pudo programar el recordatorio:', e.message)
    return false
  }
}

export async function cancelPush() {
  const raw = localStorage.getItem(SUB_KEY)
  if (!raw) return false
  try {
    await api('/api/push/cancel', { subscription: JSON.parse(raw) })
    return true
  } catch {
    return false
  }
}

export async function testPush() {
  const raw = localStorage.getItem(SUB_KEY)
  if (!raw) throw new Error('Aún no hay notificaciones activas')
  return api('/api/push/test', { subscription: JSON.parse(raw) })
}

export async function disablePush() {
  const raw = localStorage.getItem(SUB_KEY)
  if (raw) {
    try {
      await cancelPush()
    } catch {
      /* ignore */
    }
  }
  localStorage.removeItem(SUB_KEY)
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager?.getSubscription()
  if (sub) await sub.unsubscribe()
}

export function hasActiveSubscription() {
  return Boolean(localStorage.getItem(SUB_KEY))
}
