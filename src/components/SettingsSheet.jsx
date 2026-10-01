import { useState } from 'react'
import Sheet from './Sheet'
import { BellIcon, DownloadIcon, TrashIcon } from './Icons'
import { INTERVAL_OPTIONS, clearAll, exportAll } from '../lib/store'

export default function SettingsSheet({
  open,
  onClose,
  settings,
  onChange,
  push,
  onEnablePush,
  onDisablePush,
  onTestPush,
  onInstall,
  canInstall,
  onSaved,
}) {
  const [confirm, setConfirm] = useState(false)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bodoque-respaldo-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    onSaved?.('Respaldo descargado 💾')
  }

  const wipe = () => {
    if (!confirm) {
      setConfirm(true)
      return
    }
    clearAll()
    window.location.reload()
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="settings-title">
      <h2 id="settings-title">⚙️ Ajustes</h2>
      <p className="lead">Personaliza la app de {settings.babyName}.</p>

      <label className="field">
        <span>Apodo de la bebé</span>
        <input className="input" value={settings.babyName} maxLength={20} onChange={(e) => onChange({ babyName: e.target.value })} />
      </label>

      <label className="field">
        <span>Nombre completo</span>
        <input className="input" value={settings.fullName} maxLength={60} onChange={(e) => onChange({ fullName: e.target.value })} />
      </label>

      <label className="field">
        <span>Nombre de mamá</span>
        <input className="input" value={settings.momName} maxLength={24} onChange={(e) => onChange({ momName: e.target.value })} />
      </label>

      <label className="field">
        <span>Fecha de nacimiento</span>
        <input className="input" type="date" value={settings.birthDate} onChange={(e) => onChange({ birthDate: e.target.value })} />
      </label>

      <div className="field">
        <span>Cadencia de tomas</span>
        <div className="segmented">
          {INTERVAL_OPTIONS.map((h) => (
            <button key={h} className={settings.intervalHours === h ? 'on' : ''} onClick={() => onChange({ intervalHours: h })}>
              {h} h
            </button>
          ))}
        </div>
      </div>

      <div className="card-title" style={{ marginTop: 18 }}>
        <span>🔔 Recordatorios</span>
        <span className={`pill ${push.active ? 'mint' : 'amber'}`}>
          {push.active ? 'activos' : push.granted ? 'sin activar' : 'apagados'}
        </span>
      </div>

      <div className="setting-row">
        <div>
          <div className="lbl">Aviso de próxima toma</div>
          <div className="desc">
            {push.serverUp === false
              ? 'El servidor de avisos no está disponible ahora.'
              : push.active
                ? 'Te avisaremos cuando llegue la hora.'
                : 'Actívalo y te avisamos cada ' + settings.intervalHours + ' h.'}
          </div>
        </div>
        <button
          className={`switch${push.active ? ' on' : ''}`}
          role="switch"
          aria-checked={push.active}
          aria-label="Activar recordatorios"
          onClick={() => (push.active ? onDisablePush() : onEnablePush())}
          disabled={push.loading}
        >
          <i />
        </button>
      </div>

      <div className="setting-row">
        <div>
          <div className="lbl">Probar notificación</div>
          <div className="desc">Manda un recordatorio de prueba ahora mismo.</div>
        </div>
        <button className="chip" onClick={onTestPush} disabled={!push.active}>
          Probar
        </button>
      </div>

      <div className="setting-row">
        <div>
          <div className="lbl">Instalar app</div>
          <div className="desc">
            En iPhone: Compartir → <strong>Añadir a pantalla de inicio</strong>. Así llegan las
            notificaciones y abre sin internet.
          </div>
        </div>
        <button className="chip" onClick={onInstall} disabled={!canInstall}>
          Instalar
        </button>
      </div>

      <div className="card-title" style={{ marginTop: 18 }}>
        <span>💾 Datos</span>
        <span className="pill">solo local</span>
      </div>

      <div className="actions" style={{ marginTop: 6 }}>
        <button className="btn btn-ghost" onClick={exportData}>
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <DownloadIcon size={18} /> Exportar
          </span>
        </button>
        <button className="btn btn-danger" onClick={wipe}>
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <TrashIcon size={18} /> {confirm ? '¿Segura? Toca otra vez' : 'Borrar todo'}
          </span>
        </button>
      </div>

      <div className="setting-row" style={{ marginTop: 14 }}>
        <div>
          <div className="lbl">
            <BellIcon size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Bodoque · de {settings.momName}
          </div>
          <div className="desc">Versión 2.0 · hecho con mucho amor para {settings.fullName}</div>
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-primary" onClick={onClose}>
          Listo
        </button>
      </div>
    </Sheet>
  )
}
