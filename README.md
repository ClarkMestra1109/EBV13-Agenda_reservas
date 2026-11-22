# AgendaPro — Plataforma de reservas de servicios

Proyecto **Fábrica Escuela · Caso 14 · Análisis y Diseño 2**. Un proveedor publica sus servicios, sus horarios y los recursos que necesita para atender; sus clientes reservan, reprograman o cancelan, y reciben correos de recuperación y recordatorio. El proveedor mide el uso de su agenda con reportes exportables.

| | Enlace |
| --- | --- |
| Aplicación | https://ebv-13-agenda-reservas-if8x.vercel.app |
| API | https://ebv13-agenda-reservas.onrender.com/api |
| Estado del servidor | https://ebv13-agenda-reservas.onrender.com/api/salud |

## Arquitectura y tecnologías

```
Navegador ──► Frontend (Vercel)  ──HTTPS + JWT──►  Backend (Render, Docker)  ──►  PostgreSQL (Neon)
              React 19 + TypeScript                Spring Boot 3.5 · Java 17         
              Vite 6 + Tailwind CSS 4              Spring Security + JWT           Brevo (correos)
```

- **Frontend** (`frontend/`): React 19, TypeScript, Vite y Tailwind CSS. Se despliega en Vercel en cada push a `main`.
- **Backend** (`backend/`): Spring Boot 3.5 con Java 17, Spring Data JPA (Hibernate), Spring Security con JWT y Bean Validation. Se despliega en Render con el `Dockerfile` en cada push a `main`.
- **Base de datos**: PostgreSQL en Neon. Hibernate crea y actualiza las tablas (`ddl-auto=update`).
- **Correos**: API HTTP de Brevo. Render gratuito bloquea los puertos SMTP, por eso se usa HTTPS.
- **Monitor**: cron-job.org llama a `/api/salud` cada 10 minutos para que el plan gratuito de Render no apague el servidor.

## Historias de usuario por sprint

| Sprint | Historias |
| --- | --- |
| 1 | HU01 Crear cuenta · HU02 Iniciar sesión · HU05 Crear servicio · HU06 Actualizar servicio · HU10 Publicar disponibilidad · HU11 Retirar disponibilidad · HU14 Confirmar reserva · HU15 Cancelar reserva · HU17 Consultar agenda |
| 2 | HU03 Actualizar perfil · HU04 Recuperar acceso · HU06 Eliminar servicio · HU12 Repetir horarios · HU13 Consultar disponibilidad · HU16 Reprogramar reserva · HU18 Filtrar agenda · HU19 Recibir recordatorio |
| 3 | HU07 Registrar recurso · HU08 Asociar recurso · HU09 Definir capacidad · HU20 Contar reservas · HU21 Medir ocupación · HU22 Filtrar reportes · HU23 Exportar reporte · Correo real para HU04 y HU19 |

En el Sprint 3 también se atendió la retroalimentación del Sprint 2:

- **Validaciones:** fechas y horas pasadas, límites de anticipación, precios con decimales, teléfono y nombre.
- **Reglas de negocio:** horarios cruzados, reservas a la misma hora, servicio inactivo y nombres repetidos.
- **Seguridad:** límite de intentos de inicio de sesión, enlaces de recuperación de un solo uso y errores sin detalles internos.
- **Interfaz:** se quitaron las opciones sin funcionar y los datos de ejemplo.

## Reglas de negocio principales

- **Horarios:** solo a futuro, con máximo 6 meses de anticipación. La repetición semanal cubre máximo 3 meses. Un horario dura al menos lo que dura el servicio y como máximo 12 horas. Un mismo servicio no puede tener horarios cruzados.
- **Reservas:** un cliente no puede tener dos reservas a la misma hora. No se reserva en servicios inactivos o eliminados.
- **Recursos (HU07–HU09):** la capacidad de un recurso es cuántas reservas atiende al mismo tiempo, sumando todos los servicios que lo usan.
  - Si el recurso está lleno, se rechaza la reserva y el horario deja de ofrecerse en el catálogo.
  - Cancelar libera el cupo y aumentar la capacidad abre cupos de inmediato.
  - No se puede reducir la capacidad por debajo de las reservas ya tomadas.
- **Reportes (HU20–HU23):** cuentan solo las reservas del proveedor, según la fecha de la cita, con ambas fechas incluidas. La ocupación es cupos reservados sobre cupos publicados. El periodo máximo es un año.
- **Seguridad:**
  - Contraseñas de 8 a 72 caracteres con letras y números.
  - 5 intentos fallidos de inicio de sesión bloquean 15 minutos.
  - El enlace de recuperación vence en 30 minutos y solo el más reciente es válido.

## Ejecutar en local

Requisitos: JDK 17, Maven 3.9+, Node 20+ y un PostgreSQL con una base vacía llamada `reservas`.

**Backend**

```bash
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/reservas
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_SECRET="un-secreto-largo-de-al-menos-32-caracteres"
mvn spring-boot:run          # http://localhost:8080
```

**Frontend**

```bash
cd frontend
cp .env.example .env.local   # VITE_API_URL=http://localhost:8080/api
npm install
npm run dev                  # http://localhost:3000
```

En local los correos solo se escriben en el log del backend. Busca `[EMAIL SIMULADO]` para ver el enlace de recuperación.

## Pruebas

```bash
cd backend
mvn test
```

Las pruebas usan una base H2 en memoria, así que no necesitan PostgreSQL. Cubren los criterios de aceptación de cada sprint:

| Archivo | Qué cubre |
| --- | --- |
| `ReservasApiTests`, `ReservasFlujoTests` | Sprint 1 |
| `ReservasSprint2Tests`, `ReservasRecordatorioTests` | Sprint 2 |
| `ReservasReglasTests` | Validaciones, reglas de negocio y seguridad |
| `ReservasSprint3Tests` | Recursos e informes |
| `ReservasPerfilServiciosTests` | Perfil comercial, cambio de contraseña y fotos de servicios |

## Variables de entorno

Los valores reales nunca van en el repositorio; se configuran en Render y en Vercel.

**Backend (Render)**

| Variable | Obligatoria | Para qué sirve |
| --- | --- | --- |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Sí | Conexión a PostgreSQL (Neon) |
| `JWT_SECRET` | Sí | Firma de los tokens de sesión; mínimo 32 caracteres |
| `CORS_ORIGINS` | Sí | URL del frontend, separadas por coma |
| `FRONTEND_URL` | Sí | URL del frontend, para el enlace de recuperación (HU04) |
| `EMAIL_PROVEEDOR` | No | `log` (por defecto, simulado) o `brevo` (envío real) |
| `BREVO_API_KEY` | Con `brevo` | Clave API de Brevo (empieza por `xkeysib-`) |
| `EMAIL_REMITENTE` | Con `brevo` | Remitente verificado en Brevo |
| `EMAIL_REMITENTE_NOMBRE` | No | Nombre del remitente; por defecto `AgendaPro` |
| `RECORDATORIOS_VENTANA_HORAS` | No | Anticipación del recordatorio (HU19); por defecto 24 |
| `RECORDATORIOS_INTERVALO_MS` | No | Cada cuánto se buscan recordatorios; por defecto 300000 (5 min) |

**Frontend (Vercel)**

| Variable | Para qué sirve |
| --- | --- |
| `VITE_API_URL` | URL del backend terminada en `/api` |

## Despliegue

Un push a `main` despliega solo: Vercel construye el frontend (directorio raíz `frontend`, preset Vite) y Render construye el backend con `backend/Dockerfile`. Antes de subir cambios del backend, corre `mvn test`.

El detalle de los endpoints está en [`backend/README.md`](backend/README.md).

## Equipo

Fábrica Escuela — Caso 14. Backend, despliegue e integración: Clark Mestra. Frontend: Isa.
