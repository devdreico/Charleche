import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BIRTH_DATE,
  MEAL_KINDS,
  addFeeding,
  ageParts,
  fetchFeedings,
  nextFeeding,
  removeFeeding,
} from './lib/store'
import { isSupabaseConfigured } from './lib/supabase'

const fmtTime = (iso) =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

function AgeCard() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  const a = ageParts(now)
  return (
    <section className="card age-card">
      <img src="/charlotte.jpg" alt="Charlotte" />
      <div>
        <h2>Charlotte</h2>
        <p className="birth">Nació el 26 de julio de 2026</p>
        <div className="age">
          <strong>{a.years}</strong>
          <span>años</span>
          <strong>{a.months}</strong>
          <span>meses</span>
          <strong>{a.days}</strong>
          <span>días</span>
        </div>
        <p className="sub">
          <em>{now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</em>
        </p>
        <div className="totals">
          <span>{a.totalDays.toLocaleString()} días totales</span>
          <span>{a.totalHours.toLocaleString()} horas</span>
          <span>~{Math.round(a.totalDays / 7)} {a.totalDays >= 14 ? 'semanas' : 'semana'}</span>
        </div>
      </div>
    </section>
  )
}

function formatGap(ms) {
  const mins = Math.round(ms / 60_000)
  if (mins < 0) return `hace ${Math.round(-mins / 60)} h ${(-mins % 60)} min`
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)} h ${Math.round(mins % 60)} min`
}

function PredictionCard({ feedings }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  const info = useMemo(() => nextFeeding(feedings), [feedings])
  if (!info) {
    return (
      <section className="card predict">
        <h3>⏰ Próxima toma</h3>
        <p>Registra una toma para poder predecir la siguiente.</p>
      </section>
    )
  }
  const kind = MEAL_KINDS.find((k) => k.id === info.last.kind)
  const status = info.predictedAt
    ? info.predictedAt <= now
      ? 'over'
      : 'wait'
    : 'none'
  return (
    <section className="card predict">
      <h3>⏰ Próxima toma</h3>
      <p className="last">
        Última toma: <strong>{fmtTime(info.last.fed_at)}</strong> · {kind?.label} · {info.last.amount}
        {kind?.unit}
      </p>
      {info.predictedAt && (
        <>
          <div className={`countdown ${status}`}>
            {status === 'over' ? (
              <>
                <span className="label">ESTÁ TOCANDO COMER</span>
                <strong className="big">{formatGap(now - info.predictedAt)}</strong>
                <span className="sub">de retraso</span>
              </>
            ) : (
              <>
                <span className="label">Comer en ≈</span>
                <strong className="big">{formatGap(info.predictedAt - now)}</strong>
              </>
            )}
            <p className="sub">
              Predicción ≈ {new Date(info.predictedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {info.cadence && (
            <p className="cadence">
              Cadencia: cada <strong>{formatGap(info.cadence.median * 3_600_000)}</strong> en promedio
              (madiana de {info.cadence.count} intervalos)
            </p>
          )}
        </>
      )}
    </section>
  )
}

const nowLocalInput = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function FeedingForm({ onAdd }) {
  const [fed_at, setFedAt] = useState(nowLocalInput)
  const [amount, setAmount] = useState('')
  const [kind, setKind] = useState('leche')
  const [note, setNote] = useState('')

  const quick = (k) => {
    const row = { fed_at: new Date().toISOString(), amount: 0, kind: k, note: 'ahora' }
    onAdd(row)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!fed_at) return
    onAdd({ fed_at: new Date(fed_at).toISOString(), amount: Number(amount) || 0, kind, note })
    setAmount('')
    setNote('')
  }

  return (
    <section className="card form">
      <h3>🍼 Registrar toma</h3>
      <div className="quickbit">
        <button title="Marca 'ahora' la toma" onClick={() => quick('leche')}>🥛 + Ahora</button>
      </div>
      <form onSubmit={submit}>
        <label>
          Cuándo
          <input type="datetime-local" value={fed_at} onChange={(e) => setFedAt(e.target.value)} />
        </label>
        <label>
          Tipo
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {MEAL_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cantidad ({MEAL_KINDS.find((k) => k.id === kind)?.unit})
          <input type="number" min="0" placeholder="ej. 120" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className="full">
          Nota
          <input type="text" placeholder="opcional" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit">Guardar toma</button>
      </form>
    </section>
  )
}

function History({ feedings, onDelete }) {
  const rows = useMemo(
    () => [...feedings].sort((a, b) => new Date(b.fed_at) - new Date(a.fed_at)),
    [feedings],
  )
  return (
    <section className="card history">
      <h3>📋 Historial ({rows.length} tomas)</h3>
      {rows.length === 0 ? (
        <p>Sin registros todavía.</p>
      ) : (
        <ul>
          {rows.map((f) => {
            const kind = MEAL_KINDS.find((k) => k.id === f.kind)
            return (
              <li key={f.id}>
                <span className="when">{fmtTime(f.fed_at)}</span>
                <span className="what">
                  {kind?.label} {f.amount ? `· ${f.amount}${kind?.unit}` : ''}
                  {f.note && f.note !== 'ahora' ? ` · ${f.note}` : ''}
                </span>
                <button className="del" onClick={() => onDelete(f.id)} title="Eliminar">✕</button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default function App() {
  const [feedings, setFeedings] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [storage, setStorage] = useState('')

  useEffect(() => {
    fetchFeedings().then((data) => {
      setFeedings(data || [])
      setLoaded(true)
      setStorage(isSupabaseConfigured ? 'supabase' : 'local')
    })
  }, [])

  const handleAdd = useCallback(async (row) => {
    const added = await addFeeding(row)
    setFeedings((f) => [...f, added])
  }, [])

  const handleDelete = useCallback(async (id) => {
    await removeFeeding(id)
    setFeedings((f) => f.filter((x) => x.id !== id))
  }, [])

  return (
    <main className="wrap">
      <header>
        <span className="badge">{loaded ? (storage === 'supabase' ? '☁️ sincronizado' : '📱 guardado local') : '…'}</span>
      </header>
      <AgeCard />
      <PredictionCard feedings={feedings} />
      <div className="grid">
        <FeedingForm onAdd={handleAdd} />
        <History feedings={feedings} onDelete={handleDelete} />
      </div>
      {isSupabaseConfigured && (
        <footer>
          <small>Datos en Supabase · {BIRTH_DATE.toLocaleDateString('es-MX')}</small>
        </footer>
      )}
    </main>
  )
}