import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CameraIcon, LockIcon, PlusIcon, SparkIcon } from './Icons'
import { ageParts, monthTimeline } from '../lib/store'
import { fmtDate } from '../lib/format'

const item = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 240, damping: 26 } },
}

function PhotoCell({ photo, onClick }) {
  const src = useMemo(() => URL.createObjectURL(photo.blob), [photo])
  useEffect(() => () => URL.revokeObjectURL(src), [src])
  return (
    <button className="photo-cell" onClick={onClick} aria-label="Ver foto">
      <img src={src} alt={photo.caption || 'Foto de Bodoque'} />
    </button>
  )
}

export default function BodoqueScreen({ settings, now, photos, onAddPhoto, onOpenPhoto }) {
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null)
  const age = ageParts(now, settings)
  const months = monthTimeline(settings, now, 18)

  const pick = (month) => {
    setPending(month == null ? { main: true } : { month })
    setTimeout(() => fileRef.current?.click(), 60)
  }

  const onChange = (e) => {
    const file = e.target.files?.[0]
    if (file && pending) onAddPhoto(pending.main ? null : pending.month, file, Boolean(pending.main))
    e.target.value = ''
    setPending(null)
  }

  const done = months.filter((m) => m.unlocked && m.status !== 'current').length

  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div className="section-head">
        <h3>🌸 Línea de tiempo</h3>
        <span>
          {done} de {months.length} meses
        </span>
      </div>

      <motion.section variants={item} className="tip-hero glass">
        <span className="pill rose">
          <SparkIcon size={14} /> Mes {age.monthsTotal + 1} en curso
        </span>
        <h2>{settings.babyName} crece</h2>
        <p>
          Cada mes guarda sus propias fotos. Los meses que faltan se desbloquean solitos a medida
          que la edad de Bodoque avanza ✨
        </p>
      </motion.section>

      <div className="timeline">
        {months.map((m) => {
          const pics = photos.filter((p) => p.month === m.month)
          return (
            <motion.div key={m.month} variants={item} className={`tl-item ${m.current ? 'current' : m.unlocked ? 'past' : 'future'}`}>
              <span className="tl-dot">{m.unlocked ? '✓' : m.month}</span>

              <div className="tl-card glass">
                <div className="day-head" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h4>
                      Mes {m.month} · {m.label}
                    </h4>
                    <p>
                      {fmtDate(m.date)}
                      {m.current ? ' · ¡en curso!' : m.unlocked ? ` · ${pics.length} ${pics.length === 1 ? 'foto' : 'fotos'}` : ` · faltan ${m.daysLeft} días`}
                    </p>
                  </div>
                  {m.unlocked && <span className={`pill ${m.current ? 'rose' : 'mint'}`}>{m.current ? '💗' : 'logrado'}</span>}
                </div>

                {m.unlocked ? (
                  <div className="photo-grid">
                    {pics.map((p) => (
                      <PhotoCell key={p.id} photo={p} onClick={() => onOpenPhoto(p)} />
                    ))}
                    {pics.length < 6 && (
                      <button className="photo-cell add" onClick={() => pick(m.month)} aria-label={`Agregar foto al mes ${m.month}`}>
                        <PlusIcon size={22} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="photo-grid">
                    <div className="photo-cell locked" title="Mes que falta">
                      <LockIcon size={20} />
                    </div>
                    <div className="photo-cell locked" style={{ opacity: 0.55 }}>
                      <LockIcon size={20} />
                    </div>
                    <div className="photo-cell locked" style={{ opacity: 0.3 }}>
                      <LockIcon size={20} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <motion.button variants={item} className="btn btn-soft" onClick={() => pick(null)} style={{ borderRadius: 22 }}>
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          <CameraIcon size={19} /> Foto para el perfil de Bodoque
        </span>
      </motion.button>

      <p className="disclaimer">
        Las fotos se guardan cifradas en este dispositivo (IndexedDB) · nunca salen de aquí
      </p>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onChange} />
    </motion.div>
  )
}
