import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import HoyScreen from './components/HoyScreen'
import HistoryScreen from './components/HistoryScreen'
import BodoqueScreen from './components/BodoqueScreen'
import AdviceScreen from './components/AdviceScreen'
import TomaSheet from './components/TomaSheet'
import SettingsSheet from './components/SettingsSheet'
import HeartBurst from './components/HeartBurst'
import { CalendarIcon, FlowerIcon, HomeIcon, SparkIcon, XIcon } from './components/Icons'
import {
  addToma,
  loadSettings,
  loadTomas,
  nextFeedingInfo,
  removeToma,
  saveSettings,
} from './lib/store'
import { deletePhoto, listPhotos, savePhoto } from './lib/photos'
import {
  disablePush,
  enablePush,
  hasActiveSubscription,
  permissionState,
  schedulePush,
  serverHealthy,
  testPush,
} from './lib/notify'
import { fmtDuration } from './lib/format'

const TABS = [
  { id: 'hoy', label: 'Hoy', Icon: HomeIcon },
  { id: 'historial', label: 'Historial', Icon: CalendarIcon },
  { id: 'consejos', label: 'Consejos', Icon: SparkIcon },
  { id: 'bodoque', label: 'Bodoque', Icon: FlowerIcon },
]

export default function App() {
  const [tab, setTab] = useState('hoy')
  const [now, setNow] = useState(() => new Date())
  const [settings, setSettings] = useState(() => loadSettings())
  const [tomas, setTomas] = useState(() => loadTomas())
  const [photos, setPhotos] = useState([])
  const [tomaOpen, setTomaOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [hearts, setHearts] = useState(0)
  const [lightbox, setLightbox] = useState(null)
  const [deferredInstall, setDeferredInstall] = useState(null)
  const [push, setPush] = useState({ loading: false, active: false, granted: false, serverUp: null })

  const info = useMemo(() => nextFeedingInfo(tomas, settings, now), [tomas, settings, now])
  const toastTimer = useRef(null)
  const notifiedRef = useRef(null)

  /* ------------------------------- boot ------------------------------- */

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    listPhotos().then(setPhotos).catch(() => setPhotos([]))
  }, [])

  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    const granted = permissionState() === 'granted'
    setPush((p) => ({
      ...p,
      granted,
      active: granted && hasActiveSubscription(),
    }))
    serverHealthy().then((ok) => setPush((p) => ({ ...p, serverUp: ok })))

    const onInstall = (e) => {
      e.preventDefault()
      setDeferredInstall(e)
    }
    window.addEventListener('beforeinstallprompt', onInstall)
    return () => window.removeEventListener('beforeinstallprompt', onInstall)
  }, [])

  /* ---------------------------- push program --------------------------- */

  const syncPush = useCallback(
    (nextInfo) => {
      if (!hasActiveSubscription()) return
      const at = (nextInfo || info).nextAt
      if (at) schedulePush(new Date(at).toISOString())
    },
    [info],
  )

  useEffect(() => {
    if (push.active) syncPush(info)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [push.active, info.nextAt?.getTime?.()])

  useEffect(() => {
    if (!info.due || notifiedRef.current === info.nextAt.getTime()) return
    notifiedRef.current = info.nextAt.getTime()
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`🍼 ¡Toca la toma de ${settings.babyName}!`, {
          body: `Ya pasaron ${settings.intervalHours} h desde la última toma.`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'toma-due',
        })
      } catch {
        /* Safari requiere servicio; lo muestra la app */
      }
    }
    showToast(`¡Es hora de la toma de ${settings.babyName}! 🍼`)
    setHearts((h) => h + 1)
  }, [info.due, info.nextAt, settings.babyName, settings.intervalHours])

  /* ------------------------------- acciones ---------------------------- */

  const showToast = useCallback((msg, undo) => {
    clearTimeout(toastTimer.current)
    setToast({ msg, undo, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), undo ? 5200 : 2800)
  }, [])

  const handleRegister = useCallback(
    (row) => {
      const added = addToma(row)
      const next = nextFeedingInfo(loadTomas(), loadSettings(), new Date())
      setTomas(loadTomas())
      setHearts((h) => h + 1)
      syncPush(next)
      showToast(`Toma de ${fmtDuration(added.durationSec)} guardada 💗`, () => {
        removeToma(added.id)
        setTomas(loadTomas())
        syncPush(nextFeedingInfo(loadTomas(), loadSettings(), new Date()))
        showToast('Toma eliminada')
      })
    },
    [showToast, syncPush],
  )

  const handleDelete = useCallback(
    (id) => {
      removeToma(id)
      setTomas(loadTomas())
      syncPush(nextFeedingInfo(loadTomas(), loadSettings(), new Date()))
      showToast('Toma borrada')
    },
    [showToast, syncPush],
  )

  const handleSettings = useCallback((patch) => {
    setSettings(saveSettings(patch))
  }, [])

  const refreshPhotos = useCallback(async () => {
    setPhotos(await listPhotos())
  }, [])

  const handleAddPhoto = useCallback(
    async (month, file, main) => {
      try {
        const rec = await savePhoto({ file, month, caption: month ? `Mes ${month}` : '' })
        if (main) handleSettings({ mainPhotoId: rec.id })
        await refreshPhotos()
        showToast(main ? 'Foto de perfil actualizada 📸' : `Foto del mes ${month} guardada 📸`)
      } catch (e) {
        showToast(`No se pudo guardar: ${e.message}`)
      }
    },
    [handleSettings, refreshPhotos, showToast],
  )

  const handleOpenPhoto = useCallback((photo) => {
    setLightbox({ photo, url: URL.createObjectURL(photo.blob) })
  }, [])

  const closeLightbox = useCallback(() => {
    setLightbox((p) => {
      if (p) URL.revokeObjectURL(p.url)
      return null
    })
  }, [])

  const removePhoto = useCallback(async () => {
    if (!lightbox?.photo) return
    await deletePhoto(lightbox.photo.id)
    closeLightbox()
    await refreshPhotos()
    showToast('Foto eliminada')
  }, [lightbox, closeLightbox, refreshPhotos, showToast])

  /* ----------------------------- notificaciones ------------------------ */

  const enableNotifications = useCallback(async () => {
    setPush((p) => ({ ...p, loading: true }))
    try {
      await enablePush(new Date(info.nextAt).toISOString())
      setPush((p) => ({ ...p, loading: false, active: true, granted: true, serverUp: true }))
      showToast('Recordatorios activados 🔔')
    } catch (e) {
      setPush((p) => ({ ...p, loading: false }))
      showToast(e.message || 'No se pudieron activar')
    }
  }, [info.nextAt, showToast])

  const disableNotifications = useCallback(async () => {
    await disablePush()
    setPush((p) => ({ ...p, active: false }))
    showToast('Recordatorios apagados')
  }, [showToast])

  const testNotification = useCallback(async () => {
    try {
      await testPush()
      showToast('Recordatorio de prueba enviado 🔔')
    } catch (e) {
      showToast(e.message || 'No se pudo enviar')
    }
  }, [showToast])

  const installApp = useCallback(async () => {
    if (deferredInstall) {
      deferredInstall.prompt()
      await deferredInstall.userChoice
      setDeferredInstall(null)
      return
    }
    showToast('En iPhone: Compartir → Añadir a pantalla de inicio 📱')
  }, [deferredInstall, showToast])

  /* -------------------------------- render ----------------------------- */

  const changeTab = (id) => {
    setTab(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <div className="bg" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <div className={`screen${tab === 'historial' || tab === 'bodoque' ? ' screen-wide' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {tab === 'hoy' && (
              <HoyScreen
                settings={settings}
                tomas={tomas}
                now={now}
                photos={photos}
                info={info}
                onStartToma={() => setTomaOpen(true)}
                onPickPhoto={(file) => handleAddPhoto(null, file, true)}
                onDeleteToma={handleDelete}
                onHearts={() => setHearts((h) => h + 1)}
                onOpenSettings={() => setSettingsOpen(true)}
                push={{ ...push, needsSetup: push.serverUp === true && !push.active }}
                onEnablePush={enableNotifications}
              />
            )}

            {tab === 'historial' && <HistoryScreen tomas={tomas} now={now} onDelete={handleDelete} />}

            {tab === 'consejos' && <AdviceScreen settings={settings} now={now} info={info} />}

            {tab === 'bodoque' && (
              <BodoqueScreen
                settings={settings}
                now={now}
                photos={photos}
                onAddPhoto={handleAddPhoto}
                onOpenPhoto={handleOpenPhoto}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="tabbar" aria-label="Navegación principal">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => changeTab(id)}>
            {tab === id && (
              <motion.span layoutId="tabBg" className="tab-bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
            )}
            <Icon size={21} />
            {label}
          </button>
        ))}
      </nav>

      <TomaSheet open={tomaOpen} onClose={() => setTomaOpen(false)} onRegister={handleRegister} settings={settings} />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={handleSettings}
        push={push}
        onEnablePush={enableNotifications}
        onDisablePush={disableNotifications}
        onTestPush={testNotification}
        onInstall={installApp}
        canInstall={Boolean(deferredInstall) || /iphone|ipad|ipod/i.test(navigator.userAgent)}
        onSaved={showToast}
      />

      <HeartBurst trigger={hearts} />

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          >
            <span style={{ flex: 1 }}>{toast.msg}</span>
            {toast.undo && (
              <button
                onClick={() => {
                  toast.undo()
                  setToast(null)
                }}
              >
                Deshacer
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <button className="close" aria-label="Cerrar">
              <XIcon size={20} />
            </button>
            <motion.img
              src={lightbox.url}
              alt={lightbox.photo.caption || 'Foto de Bodoque'}
              initial={{ scale: 0.86, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="cap" onClick={(e) => e.stopPropagation()}>
              {lightbox.photo.caption || 'Bodoque 💗'}
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="chip" onClick={removePhoto}>
                  Eliminar foto
                </button>
                <button className="chip" onClick={closeLightbox}>
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
