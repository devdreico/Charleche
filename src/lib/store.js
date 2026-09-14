import { isSupabaseConfigured, supabase } from './supabase'

const LS_KEY = 'charleche_feedings_v1'

export const BIRTH_DATE = new Date('2026-07-26T00:00:00')

export const MEAL_KINDS = [
  { id: 'leche', label: '🥛 Leche', unit: 'ml' },
  { id: 'papilla', label: '🥣 Papilla/Puré', unit: 'g' },
  { id: 'agua', label: '💧 Agua', unit: 'ml' },
  { id: 'otro', label: '🍽 Otro', unit: 'ml' },
]

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocal(feedings) {
  localStorage.setItem(LS_KEY, JSON.stringify(feedings))
}

export async function fetchFeedings() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('feedings')
      .select('*')
      .order('fed_at', { ascending: true })
    if (!error) return data
    console.warn('Supabase fallback a localStorage:', error.message)
  }
  return loadLocal()
}

export async function addFeeding({ fed_at, amount, kind, note }) {
  const row = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    fed_at,
    amount,
    kind,
    note: note || '',
  }
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('feedings').insert(row)
    if (error) {
      console.warn('Supabase insert fallback a localStorage:', error.message)
    } else {
      return row
    }
  }
  const all = [...loadLocal(), row]
  saveLocal(all)
  return row
}

export async function removeFeeding(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('feedings').delete().eq('id', id)
    if (!error) return
    console.warn('Supabase delete fallback a localStorage:', error.message)
  }
  const all = loadLocal().filter((f) => f.id !== id)
  saveLocal(all)
}

export function meanInterval(feedings) {
  const sorted = [...feedings]
    .filter((f) => f.fed_at)
    .sort((a, b) => new Date(a.fed_at) - new Date(b.fed_at))
  const gaps = []
  for (let i = 1; i < sorted.length; i++) {
    const gap =
      (new Date(sorted[i].fed_at) - new Date(sorted[i - 1].fed_at)) / 3_600_000
    if (gap >= 1 && gap <= 16) gaps.push(gap)
  }
  if (!gaps.length) return null
  gaps.sort((a, b) => a - b)
  const mid = Math.floor(gaps.length / 2)
  const median = gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2
  const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length
  return { median, avg, count: gaps.length }
}

export function nextFeeding(feedings) {
  const cadence = meanInterval(feedings)
  const last = feedings
    .filter((f) => f.fed_at)
    .sort((a, b) => new Date(b.fed_at) - new Date(a.fed_at))[0]
  if (!last) return null
  return {
    last,
    cadence,
    predictedAt:
      cadence ? new Date(new Date(last.fed_at).getTime() + cadence.median * 3_600_000) : null,
  }
}

export function ageParts(date = new Date()) {
  const birth = BIRTH_DATE
  let years = date.getFullYear() - birth.getFullYear()
  let months = date.getMonth() - birth.getMonth()
  let days = date.getDate() - birth.getDate()
  if (days < 0) {
    months -= 1
    const prevMonth = new Date(date.getFullYear(), date.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  const totalDays = Math.floor((date - birth) / 86_400_000)
  const totalHours = Math.floor((date - birth) / 3_600_000)
  return { years, months, days, totalDays, totalHours }
}