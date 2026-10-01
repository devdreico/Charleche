import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Sheet from './Sheet'
import { fmtHour, fmtStopwatch } from '../lib/format'

const CHIPS = [5, 10, 15, 20, 25]
const WINDOW_MS = 30 * 60_000

export default function TomaSheet({ open, onClose, onRegister, settings }) {
  const [elapsed, setElapsed] = useState(0)
  const [picked, setPicked] = useState(null)
  const [note, setNote] = useState('')
  const startRef = useRef(Date.now())
  const registeredRef = useRef(false)

  useEffect(() => {
    if (!open) return undefined
    startRef.current = Date.now()
    registeredRef.current = false
    setElapsed(0)
    setPicked(null)
    setNote('')
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 250)
    return () => clearInterval(t)
  }, [open])

  const durSec = Math.max(1, Math.round((picked ? picked * 60_000 : elapsed) / 1000))
  const progress = Math.min(1, (picked ? picked * 60_000 : elapsed) / WINDOW_MS)

  const register = () => {
    if (registeredRef.current) return
    registeredRef.current = true
    const endedAt = Date.now()
    onRegister({
      startedAt: new Date(endedAt - durSec * 1000).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      durationSec: durSec,
      note: note.trim(),
    })
    onClose()
  }

  const pickChip = (min) => {
    setPicked(min)
    startRef.current = Date.now() - min * 60_000
    setElapsed(min * 60_000)
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="toma-title">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <h2 id="toma-title">¿Cuánto tiempo estuvo?</h2>
        <p className="lead">
          {picked ? `Toma de ${picked} minutos lista para registrar.` : 'Cronómetro corriendo… para cuando Bodoque termine.'}
        </p>

        <div className="watch">
          <div className="watch-time">{fmtStopwatch(picked ? picked * 60_000 : elapsed)}</div>
          <div className="watch-label">{picked ? 'tiempo elegido' : 'toma en curso'}</div>

          <div className="progress" style={{ marginTop: 18 }}>
            <i style={{ width: `${progress * 100}%` }} />
          </div>

          <div className="chip-row">
            {CHIPS.map((m) => (
              <button key={m} className={`chip${picked === m ? ' on' : ''}`} onClick={() => pickChip(m)}>
                {m} min
              </button>
            ))}
            <button
              className={`chip${picked === null && elapsed === 0 ? ' on' : ''}`}
              onClick={() => {
                setPicked(null)
                startRef.current = Date.now()
                setElapsed(0)
              }}
            >
              ⏱ Cronómetro
            </button>
          </div>
        </div>

        <label className="field" style={{ marginTop: 14 }}>
          <span>Nota (opcional)</span>
          <input
            className="input"
            value={note}
            maxLength={80}
            placeholder="ej. pecho izquierdo, se durmió…"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <p className="disclaimer">
          Se registrará a las {fmtHour(new Date())} · la próxima toma será en {settings?.intervalHours || 3} h
        </p>

        <div className="actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={register}>
            Listo 💗 Registrar
          </button>
        </div>
      </motion.div>
    </Sheet>
  )
}
