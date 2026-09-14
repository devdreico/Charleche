# Charleche 🍼

App web de una sola pantalla para registrar las tomas de comida de **Charlotte**
(nació el **26 de julio de 2026**) y estar al día con su edad y su próxima toma.

## Funciones

- **Edad en vivo**: años, meses y días avanzan solos día tras día.
- **Registro de tomas**: cuándo comió (hora, tipo, cantidad, nota).
- **Cadencia**: intervalo promedio entre tomas.
- **Predicción**: cuándo debe comer la siguiente; avisa si ya se le pasó la hora.
- **Persistente**: guarda en Supabase cuando está configurado, o en el navegador (localStorage) como respaldo automático.

## Cómo correrlo

```bash
npm install
npm run dev        # desarrollo
npm run build      # build estático en /dist para subir a cualquier hosting
```

## Hacerlo persistente (Supabase)

1. Crea un proyecto gratis en https://supabase.com
2. Ejecuta el contenido de `supabase.sql` en el Editor SQL.
3. Copia `.env.example` a `.env` y pega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Listo. Si no pones esas claves, la app funciona igual guardando en el navegador.

> Nota de seguridad: la tabla `feedings` usa RLS con acceso de solo lectura/escritura anónimo (como editor) pensado para uso familiar. Para un uso más restrictivo, activa la autenticación de Supabase y ajusta las policies.