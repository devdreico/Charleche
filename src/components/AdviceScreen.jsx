import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Sheet from './Sheet'
import {
  CheckIcon,
  ChevronRight,
  NoteIcon,
  PhoneIcon,
  ScheduleIcon,
  SyringeIcon,
} from './Icons'
import {
  DEFAULT_CONTACTS,
  VACCINE_SCHEDULE,
  ageParts,
  loadContacts,
  loadNotes,
  loadVaccines,
  saveContacts,
  saveNotes,
  saveVaccines,
} from '../lib/store'
import { fmtDayShort, fmtHour } from '../lib/format'

const item = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 250, damping: 26 } },
}

const TIPS = [
  {
    id: 'alim',
    emoji: '🍼',
    cls: 'a',
    title: 'Alimentación',
    preview: 'Señales de hambre y saciedad, ritmo de 3 h y cómo saber si alcanza.',
    heading: 'Alimentación a los 2 meses',
    body: [
      '📶 Señales de hambre: se lleva las manos a la boca, hace chasquidos, se inquieta. El llanto es la última señal: intenta ofrecer antes.',
      '✋ Señales de saciedad: suelta el pecho, se aleja, cierra los ojos o se queda dormida. No la forces a terminar.',
      '⏰ Cada 3 horas está perfecto para su edad; de día y de noche va haciendo pausas más largas poco a poco.',
      '💧 Si toma biberón, calcula aprox. 150–180 ml por kilo al día repartidos en tomas; tu pediatra afina la cantidad.',
      '⚖️ Crece según su curva: 6–8 pañales mojados y ganancia de peso constante suelen ser buena señal.',
      '🩺 Consulta si toma mucho menos, vomita con fuerza, tiene la boca seca o moja menos de 6 pañales al día.',
    ],
  },
  {
    id: 'sueno',
    emoji: '😴',
    cls: 'b',
    title: 'Sueño seguro',
    preview: 'Duerme boca arriba, en cuna firme, sin cojines ni cobijas sueltas.',
    heading: 'Sueño seguro y rutina',
    body: [
      '🌙 Siempre boca arriba para dormir: es la posición más segura para prevenir riesgos.',
      '🛏️ Cuna firme, sábana ajustada, sin almohadas, cojines, peluches ni protectores alrededor.',
      '🧺 El cochecito y el roncón no son para dormir en casa; si se queda dormida ahí, cámbiala de lugar.',
      '🌡️ Evita que pase calor: ropa ligera, sin gorro dentro de casa, habitación ventilada.',
      '🤱 A los 2 meses ya empieza a distinguir noche y día: deja luz natural de día y ambiente tranquilo en la noche.',
      '✨ Rutinita de 4 pasos: pañalito → pijamita → mimos y canción → cuna. Repítela y su cuerpo la va a reconocer.',
    ],
  },
  {
    id: 'vac',
    emoji: '💉',
    cls: 'c',
    title: 'Vacunas',
    preview: 'Calendario a los 2, 4 y 6 meses con palomitas y recordatorio.',
    heading: 'Vacunas al mes actual',
    body: [
      '📍 En México el esquema incluye BCG y Hepatitis B al nacer; a los 2 meses llega la primera pentavalente, polio y rotavirus (más neumococo).',
      '✅ Marca cada vacuna en tu calendario para llevar el control al día.',
      '📄 Lleva la cartilla a cada consulta y pide que sellen cada dosis.',
      '🩺 Antes de vacunar, comenta con tu pediatra si Bodoque está resfriada o con fiebre.',
      '⚠️ Esta app es una guía de apoyo: la fuente oficial es siempre tu centro de salud y tu pediatra.',
    ],
  },
]

export default function AdviceScreen({ settings, now, info }) {
  const [openId, setOpenId] = useState(null)
  const [vaccines, setVaccines] = useState(() => loadVaccines())
  const [contacts, setContacts] = useState(() => loadContacts())
  const [notes, setNotes] = useState(() => loadNotes())
  const [noteDraft, setNoteDraft] = useState('')
  const age = ageParts(now, settings)

  const tip = TIPS.find((t) => t.id === openId)
  const schedule = useMemo(() => {
    const out = []
    let t = info.nextAt ? new Date(info.nextAt) : new Date()
    for (let i = 0; i < 10; i += 1) {
      out.push(new Date(t))
      t = new Date(t.getTime() + (settings.intervalHours || 3) * 3_600_000)
    }
    return out
  }, [info.nextAt, settings.intervalHours])

  const toggleVaccine = (id) => {
    const next = { ...vaccines, [id]: !vaccines[id] }
    setVaccines(next)
    saveVaccines(next)
  }

  const saveContact = (id, value) => {
    const next = contacts.map((c) => (c.id === id ? { ...c, value } : c))
    setContacts(next)
    saveContacts(next)
  }

  const addNote = () => {
    const text = noteDraft.trim()
    if (!text) return
    const next = [{ id: String(Date.now()), text, createdAt: new Date().toISOString() }, ...notes]
    setNotes(next)
    saveNotes(next)
    setNoteDraft('')
  }

  const removeNote = (id) => {
    const next = notes.filter((n) => n.id !== id)
    setNotes(next)
    saveNotes(next)
  }

  const vaccinesDue = VACCINE_SCHEDULE.filter((v) => v.months <= age.monthsTotal && !vaccines[v.id]).length

  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <motion.section variants={item} className="tip-hero glass">
        <span className="pill lilac">para Tatty 💗</span>
        <h2>Consejos para cuidarla</h2>
        <p>Guía rápida y herramientas digitales para acompañar a {settings.babyName} día a día.</p>
      </motion.section>

      {TIPS.map((t) => (
        <motion.button key={t.id} variants={item} className="tip-card glass" onClick={() => setOpenId(t.id)}>
          <span className={`tip-emoji ${t.cls}`}>{t.emoji}</span>
          <span style={{ flex: 1 }}>
            <h4>{t.title}</h4>
            <p>{t.preview}</p>
          </span>
          <span className="go">
            <ChevronRight size={20} />
          </span>
        </motion.button>
      ))}

      <div className="section-head">
        <h3>🧰 Herramientas</h3>
        <span>{settings.babyName}</span>
      </div>

      <motion.div variants={item} className="tools-grid">
        <button className="tool glass" onClick={() => setOpenId('horario')}>
          <span className="t-icon">
            <ScheduleIcon size={20} />
          </span>
          <b>Horario de tomas</b>
          <small>Las próximas {settings.intervalHours} h del día</small>
        </button>

        <button className="tool glass" onClick={() => setOpenId('vacunas')}>
          <span className="t-icon">
            <SyringeIcon size={20} />
          </span>
          <b>Calendario de vacunas</b>
          <small>{vaccinesDue ? `${vaccinesDue} pendiente${vaccinesDue > 1 ? 's' : ''}` : 'Todo al día ✓'}</small>
        </button>

        <button className="tool glass" onClick={() => setOpenId('contactos')}>
          <span className="t-icon">
            <PhoneIcon size={20} />
          </span>
          <b>Contactos de apoyo</b>
          <small>Pediatra y urgencias a un toque</small>
        </button>

        <button className="tool glass" onClick={() => setOpenId('notas')}>
          <span className="t-icon">
            <NoteIcon size={20} />
          </span>
          <b>Notas de Bodoque</b>
          <small>{notes.length ? `${notes.length} guardadas` : 'Primeros recuerdos'}</small>
        </button>
      </motion.div>

      <p className="disclaimer">
        Contenido informativo de apoyo · no sustituye la opinión de tu pediatra ni del centro de salud
      </p>

      {/* ------------------------------ tips ------------------------------ */}
      <Sheet open={Boolean(tip)} onClose={() => setOpenId(null)}>
        {tip && (
          <>
            <span className={`tip-emoji ${tip.cls}`}>{tip.emoji}</span>
            <h2 style={{ marginTop: 10 }}>{tip.heading}</h2>
            <p className="lead">Consejos claros para los días de {settings.babyName}.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {tip.body.map((line) => (
                <div className="row" key={line} style={{ alignItems: 'flex-start' }}>
                  <span className="row-dot" style={{ marginTop: 6 }} />
                  <span className="row-main" style={{ fontSize: 13.5, lineHeight: 1.6, fontWeight: 700 }}>
                    {line}
                  </span>
                </div>
              ))}
            </div>
            <div className="actions">
              <button className="btn btn-primary" onClick={() => setOpenId(null)}>
                ¡Me surgió! 💗
              </button>
            </div>
          </>
        )}
      </Sheet>

      {/* ----------------------------- horario ---------------------------- */}
      <Sheet open={openId === 'horario'} onClose={() => setOpenId(null)}>
        <h2>🗓 Horario de tomas</h2>
        <p className="lead">
          Calculado con tu cadencia de {settings.intervalHours} h desde la próxima toma.
        </p>
        <ul className="list">
          {schedule.map((d, i) => (
            <li className="row" key={d.toISOString()}>
              <span className="row-dot" style={{ opacity: i === 0 ? 1 : 0.45 }} />
              <span className="row-time">{fmtHour(d)}</span>
              <span className="row-main">
                <b>{fmtDayShort(d)}</b>
                <small>{i === 0 ? 'próxima toma' : `+${i * settings.intervalHours} h`}</small>
              </span>
              {i === 0 && <span className="pill rose">ahora</span>}
            </li>
          ))}
        </ul>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setOpenId(null)}>
            Entendido
          </button>
        </div>
      </Sheet>

      {/* ----------------------------- vacunas ---------------------------- */}
      <Sheet open={openId === 'vacunas'} onClose={() => setOpenId(null)}>
        <h2>💉 Vacunas</h2>
        <p className="lead">
          Mes actual: <strong>{age.monthsTotal} meses</strong> · marca cada dosis cuando le pongan
          una.
        </p>
        <div>
          {VACCINE_SCHEDULE.map((v) => {
            const done = Boolean(vaccines[v.id])
            const reached = v.months <= age.monthsTotal
            return (
              <button
                key={v.id}
                className={`check-row${done ? ' done' : ''}`}
                onClick={() => toggleVaccine(v.id)}
                style={{ opacity: reached ? 1 : 0.6 }}
              >
                <span className="check-box">{done && <CheckIcon size={16} strokeWidth={3} />}</span>
                <span style={{ flex: 1 }}>
                  <b>{v.label}</b>
                  <small>
                    {v.when} {reached ? (done ? '· aplicada ✓' : '· pendiente') : '· aún falta'}
                  </small>
                </span>
              </button>
            )
          })}
        </div>
        <p className="disclaimer">Confirmada siempre con la cartilla y tu pediatra</p>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setOpenId(null)}>
            Listo
          </button>
        </div>
      </Sheet>

      {/* ---------------------------- contactos --------------------------- */}
      <Sheet open={openId === 'contactos'} onClose={() => setOpenId(null)}>
        <h2>📞 Contactos de apoyo</h2>
        <p className="lead">Guardados solo en este teléfono para cuando los necesites.</p>
        {(contacts.length ? contacts : DEFAULT_CONTACTS).map((c) => (
          <label className="field" key={c.id}>
            <span>{c.label}</span>
            <input
              className="input"
              inputMode="tel"
              value={c.value}
              placeholder={c.id === 'urgencias' ? 'Hospital / Urgencias' : 'Nombre y teléfono'}
              onChange={(e) => saveContact(c.id, e.target.value)}
            />
          </label>
        ))}
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setOpenId(null)}>
            Guardar
          </button>
        </div>
      </Sheet>

      {/* ------------------------------ notas ----------------------------- */}
      <Sheet open={openId === 'notas'} onClose={() => setOpenId(null)}>
        <h2>📝 Notas de Bodoque</h2>
        <p className="lead">Momentos, hitos y cositas que no quieras olvidar.</p>
        <textarea
          className="input"
          value={noteDraft}
          maxLength={240}
          placeholder="Hoy sonrió mucho cuando…"
          onChange={(e) => setNoteDraft(e.target.value)}
        />
        <div className="actions">
          <button className="btn btn-ghost" onClick={() => setNoteDraft('')}>
            Limpiar
          </button>
          <button className="btn btn-primary" onClick={addNote} disabled={!noteDraft.trim()}>
            Guardar nota
          </button>
        </div>
        <ul className="list" style={{ marginTop: 16 }}>
          {notes.map((n) => (
            <li className="row" key={n.id}>
              <span className="row-dot" />
              <span className="row-main">
                <b style={{ fontWeight: 700, fontSize: 13.5 }}>{n.text}</b>
                <small>{fmtDayShort(n.createdAt)}</small>
              </span>
              <button className="row-del" onClick={() => removeNote(n.id)} aria-label="Borrar nota">
                ✕
              </button>
            </li>
          ))}
        </ul>
        {notes.length === 0 && (
          <div className="empty">
            <span className="big">💭</span>
            Todavía no hay notas.
          </div>
        )}
      </Sheet>
    </motion.div>
  )
}
