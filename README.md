# Bodoque 💗 · de Tatty, con amor

App para cuidar a **Anahi Charlotte Ortiz Llorente · «Bodoque»** (2 meses 💕): un solo botón
**TOMA**, panel con las tomas del día, historial por días, línea de tiempo de meses con fotos,
consejos con herramientas digitales y recordatorios push cada 3 horas.

Todo se guarda **100 % en local** (localStorage + IndexedDB): las fotos y los registros nunca
salen del dispositivo.

---

## ✨ Qué incluye

| Pantalla | Contenido |
|---|---|
| **Hoy** | Foto grande de Bodoque, edad en vivo (meses / días / semanas), anillo con la cuenta regresiva a la próxima toma, botón **TOMA** con halo, panel con las tomas del día y avance `3/8` |
| **Historial** | Resumen (promedio por día, racha, hoy), tarjeta **🥣 Alimentación complementaria · Próximamente** y cada día anterior desplegable con todas sus tomas |
| **Consejos** | Los 3 puntos: **Alimentación**, **Sueño seguro**, **Vacunas** + herramientas: horario de tomas, calendario de vacunas con palomitas, contactos de apoyo y notas |
| **Bodoque** | Línea de tiempo Mes 1 → Mes 18: los meses cumplidos se desbloquean solos según la edad y cada uno guarda sus fotos |
| **Ajustes** | Apodo, nombre completo, fecha de nacimiento, cadencia (2–4 h), recordatorios, instalar app, exportar y borrar datos |

**Flujo de TOMA** → al tocar el botón se abre un panel con **cronómetro en vivo** (o chips de
5/10/15/20/25 min) que pregunta *«¿cuánto tiempo estuvo?»*; al confirmar se registra la toma,
revienta en corazones, aparece un toast con **Deshacer** y se reprograma el recordatorio.

---

## 🖥 Cómo correrlo

```bash
npm install

# Terminal 1 · app (Vite)
npm run dev

# Terminal 2 · API de recordatorios (Express)
npm run dev:api
```

La app queda en `http://localhost:5173` y Vite manda `/api` al server en el puerto `8787`.

### Producción (un solo server)

```bash
npm run build     # genera /dist (iconos, foto optimizada y PWA incluidos)
npm start         # Express sirve /dist + la API de notificaciones en :8787
```

> Iconos y versiones ligeras de la foto se regeneran con `npm run icons`.

---

## 🔔 Recordatorios reales (Web Push)

1. Genera las claves VAPID: `npm run vapid` y pégalas en `.env`
   (si las dejas vacías, el server las crea y las guarda en `server/data/vapid.json`).
2. Copia `.env.example` → `.env` y ajusta `PORT` / `VAPID_SUBJECT`.
3. Arranca con `npm run build && npm start`.
4. En la app: **Ajustes → Aviso de próxima toma** (o la tarjeta «Activar» de la pantalla Hoy).

Así funciona: el teléfono le dice al server *«avísame a las 14:30»* (la última toma + cadencia),
el server dispara la notificación a esa hora y el cliente reprograma cada vez que se registra una
toma o se abre la app. Los datos siguen solo en el teléfono.

**Importante en iPhone/iOS:** las notificaciones push solo llegan si la app está **instalada en la
pantalla de inicio** (Safari → Compartir → *Añadir a pantalla de inicio*). La opción **Instalar
app** dentro de Ajustes explica el paso.

---

## 🛠 Stack y estructura

- **React 18 + Vite**, animaciones con **framer-motion**, tipografía **Montserrat** (empaquetada con
  `@fontsource`, funciona offline), diseño glassmorphism iOS.
- **IndexedDB** (`idb-keyval`) para fotos comprimidas a 1280 px · **localStorage** para tomas,
  ajustes, vacunas, notas y contactos.
- **Service worker** (`public/sw.js`) para avisos push y modo offline + `manifest.webmanifest`.

```
src/
  App.jsx                pestañas, toasts, luz de fotos, permisos de push
  components/            Hoy · Historial · Bodoque · Consejos · TomaSheet · Ajustes …
  lib/store.js           tomas, ajustes, edad, línea de meses, vacunas, notas
  lib/photos.js          IndexedDB + compresión de imágenes
  lib/notify.js          suscripción push y programación con el server
public/                  sw.js, manifest, iconos, foto optimizada
server/index.js          Express: API push + sirve /dist
scripts/make-icons.mjs   iconos PWA y fotos ligeras
```

---

## 📝 Notas

- Contenido de consejos y calendario de vacunas: guía de apoyo en español (México), **no sustituye
  a la pediatra ni al centro de salud**.
- Para respaldar todo: **Ajustes → Exportar** descarga un JSON con tomas, ajustes, vacunas y notas.
