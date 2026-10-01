import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sheet from './Sheet'
import { ChevronDown, LockIcon, TrashIcon } from './Icons'
import { dayStats, groupByDay, tomasOfDay } from '../lib/store'
import { fmtDayLong, fmtDuration, fmtHour } from '../lib/format'

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 26 } },
}

function MiniBars({ items }) {
  const buckets = useMemo(() => {
    const arr = Array.from({ length: 12 }, () => 0)
    items.forEach((t) => {
      const h = new Date(t.startedAt).getHours()
      arr[Math.min(11, Math.floor(h / 2))] += Math.max(1, (t.durationSec || 60) / 60)
    })
    const max = Math.max(...arr, 1)
    return arr.map((v) => ({ h: v > 0 ? Math.max(0.24, v / max) : 0.14, o: v > 0 ? 1 : 0.28 }))
  }, [items])

  return (
    <div className="mini-bars" aria-hidden="true">
      {buckets.map((b, i) => (
        <i key={i} style={{ height: `${b.h * 100}%`, opacity: b.o }} />
      ))}
    </div>
  )
}

function DayCard({ day, onDelete }) {
  const [open, setOpen] = useState(false)
  const todayKey = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  return (
    <motion.section variants={item} className={`day-card glass${open ? ' open' : ''}`}>
      <button className="day-head" onClick={() => setOpen((v) => !v)}>
        <div>
          <h4>
            {day.key === todayKey ? 'Hoy · ' : ''}
            {fmtDayLong(day.date)}
          </h4>
          <p>
            {day.items.length} {day.items.length === 1 ? 'toma' : 'tomas'} · {fmtDuration(day.totalSec)} de alimentación
          </p>
        </div>
        <div className="day-badge">
          <b>{day.items.length}</b>
          <span className={`chev${open ? ' open' : ''}`}>
            <ChevronDown size={18} />
          </span>
        </div>
      </button>

      <MiniBars items={day.items} />

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="day-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {day.items.map((t) => (
              <div className="row" key={t.id}>
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
              </div>
            ))}
            {day.key === todayKey && <p className="disclaimer">Este día sigue en curso 💪</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

export default function HistoryScreen({ tomas, now, onDelete }) {
  const [soon, setSoon] = useState(false)
  const days = useMemo(() => groupByDay(tomas), [tomas])
  const stats = useMemo(() => dayStats(tomas), [tomas])
  const todayCount = tomasOfDay(tomas, now).length

  return (
    <motion.div variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="section-head">
        <h3>📅 Historial</h3>
        <span>
          {stats.total} {stats.total === 1 ? 'toma registrada' : 'tomas registradas'}
        </span>
      </div>

      <motion.div variants={item} className="stat-row" style={{ marginTop: 0 }}>
        <div className="stat">
          <strong>{stats.avg ? stats.avg.toFixed(1) : '—'}</strong>
          <span>por día</span>
        </div>
        <div className="stat">
          <strong>{stats.streak}</strong>
          <span>{stats.streak === 1 ? 'día seguido' : 'días seguidos'}</span>
        </div>
        <div className="stat">
          <strong>{todayCount}</strong>
          <span>hoy</span>
        </div>
      </motion.div>

      <motion.button variants={item} className="soon-card glass" onClick={() => setSoon(true)}>
        <span className="pill lilac soon-tag">Próximamente</span>
        <span className="lock">
          <LockIcon size={20} />
        </span>
        <h4>🥣 Alimentación complementaria</h4>
        <p>
          Purés, papillas y primeros sabores. Este apartado se abre solito cuando Bodoque esté
          listita (aprox. a los 6 meses).
        </p>
      </motion.button>

      <div className="section-head">
        <h3>Días anteriores</h3>
        <span>
          {days.length} {days.length === 1 ? 'día' : 'días'}
        </span>
      </div>

      {days.length === 0 && (
        <div className="empty glass card">
          <span className="big">🗓️</span>
          Todavía no hay historial.
          <br />
          Cada toma que registres aparecerá aquí por día.
        </div>
      )}

      {days.map((d) => (
        <DayCard key={d.key} day={d} onDelete={onDelete} />
      ))}

      <p className="disclaimer">Toca un día para ver todas sus tomas</p>

      <Sheet open={soon} onClose={() => setSoon(false)}>
        <h2>🥣 Alimentación complementaria</h2>
        <p className="lead">Está en preparación con mucho cariño para Bodoque.</p>
        <div className="row" style={{ marginBottom: 10 }}>
          <span className="row-dot" />
          <span className="row-main">
            <b>Se activa alrededor de los 6 meses</b>
            <small>La OMS y tu pediatra recomiendan iniciar entre los 5 y los 6 meses, cuando la bebé sostenga la cabeza y se interese por la comida.</small>
          </span>
        </div>
        <div className="row" style={{ marginBottom: 10 }}>
          <span className="row-dot" />
          <span className="row-main">
            <b>Luego podrás registrar papillas</b>
            <small>Tipo, cantidad en gramos, sabores nuevos y reacciones, junto con el historial de leche.</small>
          </span>
        </div>
        <div className="row">
          <span className="row-dot" />
          <span className="row-main">
            <b>Todo queda en un solo lugar</b>
            <small>Mismo panel de hoy, mismo historial por días y recordatorios.</small>
          </span>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setSoon(false)}>
            ¡Ya quiero que llegue! 💗
          </button>
        </div>
      </Sheet>
    </motion.div>
  )
}
