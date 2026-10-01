const TOMAS_KEY = 'bodoque_tomas_v1'
const SETTINGS_KEY = 'bodoque_settings_v1'
const VACCINES_KEY = 'bodoque_vacunas_v1'
const NOTES_KEY = 'bodoque_notas_v1'
const CONTACTS_KEY = 'bodoque_contactos_v1'

export const DEFAULT_SETTINGS = {
  babyName: 'Bodoque',
  fullName: 'Anahi Charlotte Ortiz Llorente',
  momName: 'Tatty',
  birthDate: '2026-07-26',
  intervalHours: 3,
  firstToma: '07:00',
}

export const INTERVAL_OPTIONS = [2, 2.5, 3, 3.5, 4]

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('No se pudo guardar:', key, e)
  }
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`)

/* ---------------------------------- settings --------------------------------- */

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) }
}

export function saveSettings(patch) {
  const next = { ...loadSettings(), ...(patch || {}) }
  write(SETTINGS_KEY, next)
  return next
}

export function birthDate(settings = loadSettings()) {
  const d = new Date(`${settings.birthDate}T00:00:00`)
  return Number.isNaN(d.getTime()) ? new Date(DEFAULT_SETTINGS.birthDate + 'T00:00:00') : d
}

/* ----------------------------------- tomas ---------------------------------- */

export function loadTomas() {
  const rows = read(TOMAS_KEY, [])
  if (!Array.isArray(rows)) return []
  return rows.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
}

export function saveTomas(rows) {
  write(TOMAS_KEY, rows)
}

export function addToma({ startedAt, endedAt, durationSec, kind = 'leche', note = '' }) {
  const row = {
    id: uid(),
    startedAt: startedAt || new Date().toISOString(),
    endedAt: endedAt || new Date().toISOString(),
    durationSec: Math.max(1, Math.round(durationSec || 0)),
    kind,
    note,
  }
  const all = [...loadTomas(), row]
  saveTomas(all)
  return row
}

export function removeToma(id) {
  saveTomas(loadTomas().filter((t) => t.id !== id))
}

export function updateToma(id, patch) {
  const all = loadTomas().map((t) => (t.id === id ? { ...t, ...patch } : t))
  saveTomas(all)
  return all.find((t) => t.id === id)
}

/* ------------------------------------ days ---------------------------------- */

export const dayKey = (input) => {
  const d = input instanceof Date ? input : new Date(input)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const startOfDay = (input) => {
  const d = input instanceof Date ? new Date(input) : new Date(input)
  d.setHours(0, 0, 0, 0)
  return d
}

export function tomasOfDay(tomas, date = new Date()) {
  const key = dayKey(date)
  return tomas
    .filter((t) => dayKey(t.startedAt) === key)
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))
}

export function groupByDay(tomas) {
  const map = new Map()
  for (const t of [...tomas].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))) {
    const key = dayKey(t.startedAt)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(t)
  }
  return [...map.entries()].map(([key, items]) => ({
    key,
    date: startOfDay(`${key}T00:00:00`),
    items: items.sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt)),
    totalSec: items.reduce((s, t) => s + (t.durationSec || 0), 0),
  }))
}

export function dayStats(tomas) {
  const days = groupByDay(tomas)
  const counts = days.map((d) => d.items.length)
  const avg = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0
  let streak = 0
  if (days.length) {
    const cursor = startOfDay(new Date())
    const keys = new Set(days.map((d) => dayKey(d.date)))
    if (!keys.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
    while (keys.has(dayKey(cursor))) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
  }
  return { days: days.length, total: tomas.length, avg, streak }
}

/* ---------------------------------- cadence --------------------------------- */

export function nextFeedingInfo(tomas = loadTomas(), settings = loadSettings(), now = new Date()) {
  const intervalMs = Math.round((settings.intervalHours || 3) * 3_600_000)
  const sorted = [...tomas].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
  const last = sorted[0] || null
  if (!last) {
    const base = new Date(now)
    const [h, m] = String(settings.firstToma || '07:00').split(':').map(Number)
    const anchor = new Date(now)
    anchor.setHours(h || 0, m || 0, 0, 0)
    if (anchor <= now) anchor.setTime(anchor.getTime() + intervalMs)
    return { last: null, nextAt: anchor, remainingMs: anchor - now, due: false, overdueMs: 0, intervalMs, first: true }
  }
  const nextAt = new Date(new Date(last.startedAt).getTime() + intervalMs)
  const remainingMs = nextAt - now
  return {
    last,
    nextAt,
    remainingMs,
    due: remainingMs <= 0,
    overdueMs: remainingMs <= 0 ? -remainingMs : 0,
    intervalMs,
    first: false,
  }
}

export function todaysPlan(settings = loadSettings(), now = new Date()) {
  const perDay = Math.round(24 / (settings.intervalHours || 3))
  const done = tomasOfDay(loadTomas(), now).length
  return { perDay, done, pct: Math.min(1, done / perDay) }
}

/* ------------------------------------ age ----------------------------------- */

export function ageParts(date = new Date(), settings = loadSettings()) {
  const birth = birthDate(settings)
  const now = date instanceof Date ? date : new Date(date)
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  let days = now.getDate() - birth.getDate()
  if (days < 0) {
    months -= 1
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  const totalMs = now - birth
  const totalDays = Math.floor(totalMs / 86_400_000)
  const totalHours = Math.floor(totalMs / 3_600_000)
  const monthsTotal = Math.max(0, months + years * 12)
  const monthStart = new Date(birth.getFullYear(), birth.getMonth() + monthsTotal, birth.getDate())
  const monthEnd = new Date(birth.getFullYear(), birth.getMonth() + monthsTotal + 1, birth.getDate())
  const inMonth = Math.max(0, Math.floor((now - monthStart) / 86_400_000))
  const monthLength = Math.max(1, Math.round((monthEnd - monthStart) / 86_400_000))
  return {
    years,
    months,
    days,
    totalDays,
    totalHours,
    weeks: Math.floor(totalDays / 7),
    monthsTotal,
    inMonth,
    monthLength,
    monthPct: Math.min(1, inMonth / monthLength),
    birth,
  }
}

export const MONTH_LABELS = [
  'Primer mes', 'Segundo mes', 'Tercer mes', 'Cuarto mes', 'Quinto mes', 'Sexto mes',
  'Séptimo mes', 'Octavo mes', 'Noveno mes', 'Décimo mes', 'Undécimo mes', 'Primer añito',
  '13 meses', '14 meses', '15 meses', '16 meses', '17 meses', '18 meses',
  '19 meses', '20 meses', '21 meses', '22 meses', '23 meses', '¡Segundo añito!',
]

export function monthTimeline(settings = loadSettings(), now = new Date(), span = 24) {
  const a = ageParts(now, settings)
  const list = []
  for (let i = 1; i <= span; i++) {
    const date = new Date(a.birth.getFullYear(), a.birth.getMonth() + i, a.birth.getDate(), 12, 0, 0)
    const daysLeft = Math.ceil((date - now) / 86_400_000)
    const status = daysLeft > 0 ? (i <= a.monthsTotal ? 'past' : 'future') : 'done'
    const current = i === a.monthsTotal + 1 && daysLeft <= 0
    list.push({
      month: i,
      label: MONTH_LABELS[i - 1] || `Mes ${i}`,
      date,
      daysLeft,
      unlocked: daysLeft <= 0,
      current,
      status: current ? 'current' : status,
    })
  }
  return list
}

/* --------------------------------- vaccine ---------------------------------- */

export const VACCINE_SCHEDULE = [
  { id: 'bcg', label: 'BCG + Hepatitis B', when: 'Al nacer', months: 0 },
  { id: 'penta1', label: 'Pentavalente 1.ª dosis + Polio 1.ª + Rotavirus 1.ª', when: '2 meses', months: 2 },
  { id: 'neumo1', label: 'Neumococo 1.ª dosis', when: '2 meses', months: 2 },
  { id: 'penta2', label: 'Pentavalente 2.ª dosis + Polio 2.ª + Rotavirus 2.ª', when: '4 meses', months: 4 },
  { id: 'neumo2', label: 'Neumococo 2.ª dosis', when: '4 meses', months: 4 },
  { id: 'penta3', label: 'Pentavalente 3.ª dosis + Polio 3.ª + Rotavirus 3.ª', when: '6 meses', months: 6 },
  { id: 'inflA', label: 'Influenza 1.ª dosis', when: '6 meses', months: 6 },
  { id: 'inflB', label: 'Influenza 2.ª dosis', when: '7 meses', months: 7 },
  { id: 'sarampion', label: 'SRP (Sarampión, Rubéola, Parotiditis)', when: '12 meses', months: 12 },
]

export function loadVaccines() {
  return read(VACCINES_KEY, {})
}

export function saveVaccines(map) {
  write(VACCINES_KEY, map)
}

export function loadNotes() {
  return read(NOTES_KEY, [])
}

export function saveNotes(rows) {
  write(NOTES_KEY, rows)
}

export const DEFAULT_CONTACTS = [
  { id: 'pediatra', label: 'Pediatra', value: '' },
  { id: 'urgencias', label: 'Urgencias / Hospital', value: '' },
  { id: 'familia', label: 'Familiar de apoyo', value: '' },
]

export function loadContacts() {
  return read(CONTACTS_KEY, DEFAULT_CONTACTS)
}

export function saveContacts(rows) {
  write(CONTACTS_KEY, rows)
}

export function exportAll() {
  return {
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    tomas: loadTomas(),
    vaccines: loadVaccines(),
    notes: loadNotes(),
    contacts: loadContacts(),
  }
}

export function clearAll() {
  ;[TOMAS_KEY, SETTINGS_KEY, VACCINES_KEY, NOTES_KEY, CONTACTS_KEY].forEach((k) => localStorage.removeItem(k))
}
