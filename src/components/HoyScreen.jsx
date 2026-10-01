import { useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import CountdownRing from './CountdownRing'
import { GearIcon, PencilIcon, TrashIcon, BellIcon } from './Icons'
import { ageParts, birthDate, tomasOfDay } from '../lib/store'
import { fmtCountdown, fmtDayLong, fmtDuration, fmtAgo, fmtHour } from '../lib/format'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 26 } },
}

function HeroPhoto({ settings, photos, now, age, onPickPhoto, onHearts }) {
  const fileRef = useRef(null)
  const main = photos.find((p) => p.id === settings.mainPhotoId)
  const src = useMemo(() => (main ? URL.createObjectURL(main.blob) : '/charlotte-small.webp'), [main])

  return (
    <motion.section variants={item} className="hero glass">
      <div className="hero-photo-wrap">
        <img
          className="hero-photo"
          src={src}
          alt={`Foto de ${settings.babyName}`}
          onClick={onHearts}
        />
        <button className="hero-edit" aria-label="Cambiar foto" onClick={() => fileRef.current?.click()}>
          <PencilIcon size={19} />
        </button>
      </div>

      <h1 className="hero-name">{settings.babyName}</h1>
      <p className="hero-full">{settings.fullName}</p>

      <div className="age-row">
        <div className="age-chip">
          <strong>{age.monthsTotal}</strong>
          <span>{age.monthsTotal === 1 ? 'mes' : 'meses'}</span>
        </div>
        <div className="age-chip">
          <strong>{age.days}</strong>
          <span>días</span>
        </div>
        <div className="age-chip">
          <strong>{age.weeks}</strong>
          <span>semanas</span>
        </div>
      </div>

      <p className="hero-date">
        {fmtDayLong(now)} · Mes {age.monthsTotal + 1} en curso · {age.inMonth} de {age.monthLength} días
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPickPhoto(file)
          e.target.value = ''
        }}
      />
    </motion.section>
  )
}

function NextCard({ info, settings, now, onStart, push, onEnablePush }) {
  const { last, nextAt, remainingMs, due, overdueMs, intervalMs } = info
  const progress = due ? 1 : info.first ? 0.16 : Math.max(0.04, Math.min(1, 1 - remainingMs / intervalMs))
  const overdue = due && overdueMs > 5 * 60_000

  const from = due ? '#ff9e7e' : '#7ed0b0'
  const to = due ? '#f2568b' : '#f2568b'

  return (
    <motion.section variants={item} className="next-card glass card">
      <div className="next-head">
        <h3>⏰ Próxima toma</h3>
        <span className={`pill ${due ? 'rose' : 'mint'}`}>
          {due ? (overdue ? '¡ya toca!' : 'es hora') : `hoy ${fmtHour(nextAt)}`}
        </span>
      </div>

      <div className="next-grid">
        <CountdownRing progress={progress} due={due} from={from} to={to}>
          <strong>{due ? '¡YA!' : fmtCountdown(remainingMs)}</strong>
          <span>{due ? (overdue ? `+${fmtCountdown(overdueMs)}` : 'hora de toma') : info.first ? 'esperando' : 'faltan'}</span>
        </CountdownRing>

        <div className="toma-zone">
          <button className={`toma-btn${due ? ' is-due' : ''}`} onClick={onStart} aria-label="Iniciar toma">
            TOMA
          </button>
          <span className="toma-hint">
            {last ? `última ${fmtHour(last.startedAt)}` : '¡primera toma del día!'}
          </span>
        </div>
      </div>

      <p className="next-status">
        {last ? (
          <>
            Última toma <strong>{fmtAgo(now - new Date(last.startedAt))}</strong>
            {last.durationSec ? ` · duró ${fmtDuration(last.durationSec)}` : ''} · cada{' '}
            <strong>{settings.intervalHours} h</strong>
          </>
        ) : (
          <>Todavía no hay tomas hoy · cadencia de <strong>{settings.intervalHours} h</strong></>
        )}
        <br />
        Próxima toma a las <strong>{fmtHour(nextAt)}</strong>
        {last?.note ? <> · {last.note}</> : null}
      </p>

      {push.needsSetup && (
        <div className="banner" style={{ marginTop: 14 }}>
          <BellIcon size={20} />
          <span style={{ flex: 1 }}>
            {push.granted
              ? 'Notificaciones listas: actívalas para el recordatorio.'
              : 'Activa el recordatorio y te aviso cuando toque la toma.'}
          </span>
          <button onClick={onEnablePush} disabled={push.loading}>
            {push.loading ? '…' : 'Activar'}
          </button>
        </div>
      )}
    </motion.section>
  )
}

function TodayPanel({ tomas, now, settings, onDelete }) {
  const today = tomasOfDay(tomas, now)
  const perDay = Math.round(24 / (settings.intervalHours || 3))
  const totalSec = today.reduce((s, t) => s + (t.durationSec || 0), 0)
  const avg = today.length ? totalSec / today.length : 0
  const pct = Math.min(1, today.length / perDay)

  return (
    <motion.section variants={item} className="card glass">
      <div className="card-title">
        <span>🍼 Tomas de hoy</span>
        <span className="pill rose">
          {today.length}/{perDay}
        </span>
      </div>

      <div className="progress">
        <i style={{ width: `${pct * 100}%` }} />
      </div>

      <div className="stat-row">
        <div className="stat">
          <strong>{fmtDuration(totalSec)}</strong>
          <span>tiempo total</span>
        </div>
        <div className="stat">
          <strong>{avg ? fmtDuration(avg) : '—'}</strong>
          <span>promedio</span>
        </div>
        <div className="stat">
          <strong>{Math.max(0, perDay - today.length)}</strong>
          <span>faltan hoy</span>
        </div>
      </div>

      <ul className="list" style={{ marginTop: 14 }}>
        <AnimatePresence initial={false}>
          {[...today].reverse().map((t) => (
            <motion.li
              key={t.id}
              className="row"
              layout
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              <span className="row-dot" />
              <span className="row-time">{fmtHour(t.startedAt)}</span>
              <span className="row-main">
                <b>{fmtDuration(t.durationSec)}</b>
                <small>
                  hasta {fmtHour(t.endedAt)}
                  {t.note ? ` · ${t.note}` : ''}
                </small>
              </span>
              <button className="row-del" aria-label="Borrar toma" onClick={() => onDelete(t.id)}>
                <TrashIcon size={17} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {today.length === 0 && (
        <div className="empty">
          <span className="big">🌙</span>
          Aún no hay tomas hoy.
          <br />
          Pulsa <b>TOMA</b> cuando empiece la primera.
        </div>
      )}
    </motion.section>
  )
}

export default function HoyScreen({
  settings,
  tomas,
  now,
  photos,
  info,
  onStartToma,
  onPickPhoto,
  onDeleteToma,
  onHearts,
  onOpenSettings,
  push,
  onEnablePush,
}) {
  const age = ageParts(now, settings)
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header className="brand">
        <div className="brand-mark">
          <span className="brand-dot">🍼</span>
          <div>
            <div className="brand-name">BODOQUE</div>
            <div className="brand-sub">de {settings.momName}, con amor</div>
          </div>
        </div>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="Ajustes">
          <GearIcon size={20} />
        </button>
      </header>

      <HeroPhoto settings={settings} photos={photos} now={now} age={age} onPickPhoto={onPickPhoto} onHearts={onHearts} />
      <NextCard info={info} settings={settings} now={now} onStart={onStartToma} push={push} onEnablePush={onEnablePush} />
      <TodayPanel tomas={tomas} now={now} settings={settings} onDelete={onDeleteToma} />
      <p className="disclaimer">Bodoque nació el {birthDate(settings).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} · todo se guarda solo en este dispositivo</p>
    </motion.div>
  )
}
