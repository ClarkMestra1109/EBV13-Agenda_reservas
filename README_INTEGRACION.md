# AgendaPro integrado — Frontend + Backend (revisado)

Este paquete es la integración que hizo el equipo, con el backend actualizado a su última
versión (HU01-HU17) y algunas correcciones al frontend antes de la demo. Ver el detalle abajo.

## Estructura

- `backend/`: Spring Boot 3.5 + Java 17 + PostgreSQL + JWT (versión canónica: incluye HU10,
  HU11, HU14, HU15, HU17, y el campo `estado` para activar/desactivar servicios en HU06).
- `frontend/`: React + TypeScript + Vite.

## 1. Backend

Requisitos: JDK 17, Maven 3.9+, PostgreSQL.

Crea una BD vacía llamada `reservas`, exporta `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`
(mínimo 32 caracteres) y `CORS_ORIGINS` (por defecto ya incluye `http://localhost:3000` y
`http://localhost:5173`). Corre `mvn spring-boot:run` desde `backend/`. Ver `backend/README.md`
para el detalle completo, incluido cómo correr `mvn test`.

## 2. Frontend

Desde `frontend/`: `npm install`, copia `.env.example` a `.env` (ajusta `VITE_API_URL` si hace
falta — nota que aquí la convención es incluir el sufijo `/api`, a diferencia de otras versiones
de este frontend), y `npm run dev`. Queda en `http://localhost:3000`.

## 3. Qué se corrigió sobre la integración original

El trabajo de integración (mapeo de tipos, sesión, llamadas a la API, cálculo del calendario
semanal a partir de datos reales) estaba bien hecho. Se corrigieron estos puntos antes de dejarlo
listo para la demo:

- **Faltaba `src/vite-env.d.ts`.** Sin él, `import.meta.env.VITE_API_URL` no compila con
  TypeScript. Es probablemente la causa de que la compilación no se pudiera verificar antes.
- **Los saludos y la identidad de la cuenta estaban fijos en "Laura Morales" / "Carlos Mendoza"**
  en el panel del proveedor, el panel del cliente, el encabezado y la barra lateral, sin
  conexión con la cuenta real que inició sesión. Ahora usan el nombre y correo de la sesión.
- **Las pestañas de selección de rol en el login** decían "Laura (Proveedor)" / "Carlos
  (Cliente)"; ahora dicen "Proveedor" / "Cliente".
- **El backend copiado era una versión intermedia**, anterior a que se agregara el campo
  `estado` en la actualización de servicios. Por eso el frontend deshabilitaba el botón de
  activar/desactivar servicio con un aviso. Con el backend actualizado, ese botón ya llama al
  endpoint real.
- Se quitó `src/data/mockData.ts`, que no se usaba en ningún lado.

Se verificó que el frontend compila (`tsc --noEmit`) y genera el build de producción
(`vite build`) sin errores.

## 4. Diferencias que siguen ahí (no son errores, son alcance del sprint)

- El backend no guarda categoría, modalidad, ubicación, calificación ni foto de los servicios;
  esos campos se muestran con valores genéricos o imágenes de relleno.
- No hay reservas "pendientes": HU14 confirma la reserva de inmediato, así que las pestañas o
  contadores de "pendientes" siempre estarán en cero. No es un error, es cómo quedó definido HU14.
- Algunas tarjetas promocionales (p. ej. la foto de "Sede Central" en el panel del proveedor) son
  contenido decorativo fijo, no datos reales — el backend no tiene ese concepto todavía.
- No hay recuperación de contraseña (HU04) ni edición de perfil (HU03): no estaban en el alcance
  de este sprint.
