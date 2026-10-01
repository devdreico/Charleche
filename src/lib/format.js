const LOCALE = 'es-MX'

export const fmtHour = (input, withSeconds = false) => {
  const d = input instanceof Date ? input : new Date(input)
  return d.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  })
}

export const fmtDayLong = (input) => {
  const d = input instanceof Date ? input : new Date(input)
  return d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export const fmtDayShort = (input) => {
  const d = input instanceof Date ? input : new Date(input)
  return d.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })
}

export const fmtDate = (input) => {
  const d = input instanceof Date ? input : new Date(input)
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtDateCompact = (input) => {
  const d = input instanceof Date ? input : new Date(input)
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' })
}

export function fmtDuration(sec) {
  const s = Math.max(0, Math.round(sec || 0))
  if (s < 60) return `${s} s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm ? `${h} h ${String(rm).padStart(2, '0')} min` : `${h} h`
}

export function fmtDurationLong(sec) {
  const m = Math.max(0, Math.round((sec || 0) / 60))
  if (m < 60) return `${m} minutos`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm ? `${h} h ${rm} min` : `${h} horas`
}

export function fmtCountdown(ms) {
  const abs = Math.abs(ms)
  const totalSec = Math.floor(abs / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} m`
  if (m > 0) return `${m} m ${String(s).padStart(2, '0')} s`
  return `${s} s`
}

export function fmtStopwatch(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function fmtAgo(ms) {
  const abs = Math.abs(ms)
  if (abs < 60_000) return 'hace un momento'
  if (abs < 3_600_000) return `hace ${Math.round(abs / 60_000)} min`
  return `hace ${fmtCountdown(abs)}`
}

export function fmtGap(ms) {
  return fmtCountdown(ms)
}
