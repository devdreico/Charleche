import 'dotenv/config'
import express from 'express'
import webpush from 'web-push'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(__dirname, 'data')
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json')
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 8787)
const LATE_GRACE_MS = 45 * 60_000

fs.mkdirSync(DATA_DIR, { recursive: true })

/* ------------------------------- utilidades ------------------------------- */

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}
const writeJson = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
  } catch (e) {
    console.warn('No se pudo escribir', file, e.message)
  }
}

let subs = readJson(SUBS_FILE, [])
if (!Array.isArray(subs)) subs = []
const saveSubs = () => writeJson(SUBS_FILE, subs)

function ensureVapid() {
  const envPub = process.env.VAPID_PUBLIC_KEY
  const envPriv = process.env.VAPID_PRIVATE_KEY
  if (envPub && envPriv) {
    return { publicKey: envPub, privateKey: envPriv, source: 'env' }
  }
  const stored = readJson(VAPID_FILE, null)
  if (stored?.publicKey && stored?.privateKey) return { ...stored, source: 'file' }
  const keys = webpush.generateVAPIDKeys()
  writeJson(VAPID_FILE, keys)
  console.log('· Claves VAPID generadas en server/data/vapid.json')
  return { ...keys, source: 'generated' }
}

const vapid = ensureVapid()

webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:tatty@bodoque.app', vapid.publicKey, vapid.privateKey)

const keyOf = (subscription) => subscription?.endpoint || ''

/* --------------------------------- push ----------------------------------- */

async function send(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return { ok: true }
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      subs = subs.filter((s) => s.endpoint !== keyOf(subscription))
      saveSubs()
      console.log('· Suscripción caducada, eliminada')
      return { ok: false, removed: true }
    }
    console.warn('· No se pudo enviar push:', err.message)
    return { ok: false, error: err.message }
  }
}

function upsert(subscription, fireAt, payload) {
  const endpoint = keyOf(subscription)
  if (!endpoint) return null
  const existing = subs.find((s) => s.endpoint === endpoint)
  const row = existing || { endpoint, createdAt: new Date().toISOString() }
  row.subscription = subscription
  row.fireAt = fireAt || null
  row.payload = payload || row.payload || null
  row.updatedAt = new Date().toISOString()
  if (!existing) subs.push(row)
  saveSubs()
  return row
}

function tick() {
  const now = Date.now()
  for (const row of subs) {
    if (!row.fireAt) continue
    const due = new Date(row.fireAt).getTime()
    if (Number.isNaN(due) || due > now) continue
    if (row.lastSentAt && new Date(row.lastSentAt).getTime() >= due) continue
    if (now - due > LATE_GRACE_MS) {
      row.lastSentAt = row.fireAt
      saveSubs()
      continue
    }
    const settings = row.payload?.settings || {}
    const name = settings.babyName || 'Bodoque'
    const hours = settings.intervalHours || 3
    const payload = {
      title: `🍼 ¡Es hora de la toma de ${name}!`,
      body: `Pasaron ${hours} h desde la última toma. ¡Apretón de manos, ${settings.momName || 'Tatty'}!`,
      url: '/',
      tag: 'toma-due',
      ...(row.payload || {}),
    }
    row.lastSentAt = row.fireAt
    saveSubs()
    send(row.subscription, payload).then((r) => {
      if (r.ok) console.log(`· Recordatorio enviado (${new Date(due).toLocaleTimeString('es-MX')})`)
    })
  }
}

/* -------------------------------- servidor -------------------------------- */

const app = express()
app.use(express.json({ limit: '1mb' }))

if (process.env.ALLOW_ORIGIN) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN)
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    return next()
  })
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, vapid: Boolean(vapid.publicKey), subscriptions: subs.length, pending: subs.filter((s) => s.fireAt).length })
})

app.get('/api/push/vapid', (req, res) => {
  res.json({ publicKey: vapid.publicKey })
})

app.post('/api/push/subscribe', async (req, res) => {
  const { subscription, fireAt, payload } = req.body || {}
  if (!subscription?.endpoint) return res.status(400).json({ error: 'subscription requerida' })
  upsert(subscription, fireAt, payload)
  const now = Date.now()
  const due = fireAt ? new Date(fireAt).getTime() : Infinity
  if (due <= now && now - due < LATE_GRACE_MS) {
    await send(subscription, payload || { title: '🍼 ¡Toca la toma!', body: 'Es hora de alimentar a Bodoque.', url: '/' })
  }
  console.log('· Suscripción guardada')
  res.json({ ok: true })
})

app.post('/api/push/schedule', (req, res) => {
  const { subscription, fireAt, payload } = req.body || {}
  if (!subscription?.endpoint) return res.status(400).json({ error: 'subscription requerida' })
  const row = upsert(subscription, fireAt, payload)
  if (row && row.lastSentAt && fireAt && new Date(row.lastSentAt).getTime() >= new Date(fireAt).getTime()) {
    row.lastSentAt = null
    saveSubs()
  }
  res.json({ ok: true, fireAt: fireAt || null })
})

app.post('/api/push/cancel', (req, res) => {
  const { subscription } = req.body || {}
  const endpoint = keyOf(subscription)
  if (endpoint) {
    subs = subs.map((s) => (s.endpoint === endpoint ? { ...s, fireAt: null } : s))
    saveSubs()
  }
  res.json({ ok: true })
})

app.post('/api/push/test', async (req, res) => {
  const { subscription, payload } = req.body || {}
  if (!subscription?.endpoint) return res.status(400).json({ error: 'subscription requerida' })
  upsert(subscription, null, payload)
  const result = await send(subscription, payload || {
    title: '💗 Bodoque · prueba',
    body: '¡Así se verá el recordatorio de la próxima toma!',
    url: '/',
    tag: 'test',
  })
  res.status(result.ok ? 200 : 502).json(result)
})

/* --------------------------------- estático ------------------------------- */

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1h', index: 'index.html' }))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
    return res.sendFile(path.join(DIST, 'index.html'))
  })
} else {
  app.get('/', (req, res) => res.send('Bodoque API · falta npm run build'))
}

app.listen(PORT, () => {
  console.log(`🍼 Bodoque escuchando en http://localhost:${PORT}`)
  console.log(`   VAPID: ${vapid.source} · suscripciones: ${subs.length}`)
  tick()
  setInterval(tick, 10_000)
})
