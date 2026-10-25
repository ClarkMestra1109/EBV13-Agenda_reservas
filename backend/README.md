# Plataforma de reservas de servicios (Caso 14) — Backend

Spring Boot 3.5 · Java 17 · PostgreSQL · JWT.

**Sprint 1:** HU01 (crear cuenta), HU02 (iniciar sesión), HU05 (crear servicio), HU06 (actualizar
servicio), HU10 (publicar disponibilidad), HU11 (retirar disponibilidad), HU14 (confirmar reserva),
HU15 (cancelar reserva) y HU17 (consultar agenda).

**Sprint 2:** HU03 (actualizar perfil), HU04 (recuperar acceso), HU06 ampliada (eliminar servicio),
HU12 (repetir horarios), HU13 (consultar disponibilidad), HU16 (reprogramar reserva), HU18 (filtrar
agenda) y HU19 (recibir recordatorio). HU03 y HU04 son las HU de seguridad del incremento de este
sprint: HU03 protege el propio perfil (solo se edita el del usuario autenticado) y HU04 cubre el
restablecimiento seguro de contraseña con un token de un solo uso y expiración.

## Ejecutar en local

Requisitos: JDK 17+, Maven 3.9+ y un PostgreSQL con una base de datos vacía llamada `reservas`.

```bash
export DB_URL=jdbc:postgresql://localhost:5432/reservas
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_SECRET="un-secreto-largo-de-al-menos-32-caracteres"
mvn spring-boot:run
```

Pruebas (usan H2 en memoria, no necesitan PostgreSQL): `mvn test`

## Variables de entorno (Render u otro hosting)

| Variable | Para qué sirve |
|---|---|
| `DB_URL` | URL JDBC, p. ej. `jdbc:postgresql://HOST:5432/postgres?sslmode=require` |
| `DB_USER`, `DB_PASSWORD` | Credenciales de la base de datos |
| `JWT_SECRET` | Clave para firmar tokens (mínimo 32 caracteres) |
| `CORS_ORIGINS` | URL del frontend, separadas por coma |
| `PORT` | Lo define Render; por defecto 8080 |
| `FRONTEND_URL` | URL base del frontend, para armar el enlace de recuperación de contraseña (HU04). Por defecto `http://localhost:5173` |
| `RECORDATORIOS_VENTANA_HORAS` | Con cuánta anticipación se genera el recordatorio (HU19). Por defecto 24 |
| `RECORDATORIOS_INTERVALO_MS` | Cada cuánto se revisan reservas pendientes de recordatorio (HU19). Por defecto 300000 (5 min) |

### Envío de correos (HU04 y HU19)

Este sprint no tiene un proveedor SMTP configurado. El envío de correos está detrás de la interfaz
`EmailService`; la implementación actual (`LogEmailService`) solo registra el correo en el log del
servidor en vez de enviarlo de verdad. Para producción basta con escribir otra implementación (por
ejemplo con `JavaMailSender` y credenciales SMTP en variables de entorno) y que Spring la use en vez
de la actual — el resto del código (`AuthService`, `RecordatorioService`) no cambia.

Despliegue: el `Dockerfile` construye el JAR con Maven y lo ejecuta con JRE 17.

## Endpoints

| Método | Ruta | Acceso | HU |
|---|---|---|---|
| POST | `/api/auth/register` | público | HU01 |
| POST | `/api/auth/login` | público | HU02 |
| POST | `/api/servicios` | PROVEEDOR | HU05 |
| GET | `/api/servicios/mis-servicios` | PROVEEDOR | HU05 |
| PUT | `/api/servicios/{id}` | PROVEEDOR dueño | HU06 |
| POST | `/api/servicios/{id}/franjas` | PROVEEDOR dueño | HU10 |
| GET | `/api/servicios/{id}/franjas` | PROVEEDOR dueño | HU10 |
| DELETE | `/api/franjas/{id}` | PROVEEDOR dueño | HU11 |
| GET | `/api/catalogo/servicios` | cualquier usuario autenticado | apoyo a HU14 |
| GET | `/api/catalogo/servicios/{id}/franjas` | cualquier usuario autenticado | apoyo a HU14 |
| POST | `/api/reservas` | CLIENTE | HU14 |
| PUT | `/api/reservas/{id}/cancelar` | CLIENTE dueño | HU15 |
| PUT | `/api/reservas/{id}/reprogramar` | CLIENTE dueño | HU16 |
| GET | `/api/agenda` | cualquier usuario autenticado (según rol) | HU17 |
| GET | `/api/agenda?fecha=YYYY-MM-DD&servicioId=` | cualquier usuario autenticado (según rol) | HU18 |
| GET | `/api/usuarios/me` | cualquier usuario autenticado | HU03 |
| PUT | `/api/usuarios/me` | cualquier usuario autenticado | HU03 |
| POST | `/api/auth/recuperar` | público | HU04 |
| POST | `/api/auth/restablecer` | público | HU04 |
| DELETE | `/api/servicios/{id}` | PROVEEDOR dueño | HU06 |
| POST | `/api/servicios/{id}/franjas/recurrentes` | PROVEEDOR dueño | HU12 |

Las fechas de las franjas van en ISO-8601 con zona, por ejemplo `2026-10-05T09:00:00-05:00`.
`fecha` en el filtro de agenda (HU18) y `repetirHasta` en los horarios recurrentes (HU12) van en
formato `YYYY-MM-DD`; `horaInicio`/`horaFin` de HU12 van en `HH:mm` (hora local, zona
`America/Bogota`, igual que el resto del negocio de este backend).

```bash
curl -X POST localhost:8080/api/auth/register -H 'Content-Type: application/json' \
  -d '{"nombre":"Ana","correo":"ana@ejemplo.com","contrasena":"Clave1234","rol":"PROVEEDOR"}'

curl -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' \
  -d '{"correo":"ana@ejemplo.com","contrasena":"Clave1234"}'      # devuelve el token

curl -X POST localhost:8080/api/servicios -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre":"Corte","descripcion":"Corte clásico","duracionMin":30,"precio":25000}'
```

## Formato de errores

- Validación (400): `{"mensaje":"Hay campos por completar o corregir","errores":{"correo":"..."}}`
- Sin sesión (401): `{"mensaje":"Debe iniciar sesión para realizar esta operación"}`
- Sin permiso (403), no encontrado (404), correo repetido (409): `{"mensaje":"..."}`

## Reglas definidas para este sprint (ajustar con el equipo)

- Contraseña: mínimo 8 caracteres, con letras y números.
- Servicio: nombre y descripción obligatorios; duración entera de 5 a 480 minutos; precio mayor que 0 con
  máximo 2 decimales. Un servicio nuevo queda `ACTIVO`.
- Franja (HU10): debe ser futura, con fin posterior al inicio, sobre un servicio propio y activo.
  Cupo entre 1 y 100 (1 por defecto).
- Retirar franja (HU11): solo si es futura y no tiene reservas; se marca `RETIRADA` (no se borra).
- Confirmar reserva (HU14): la franja debe estar publicada, ser futura y tener cupo. La fila de la franja se
  bloquea durante la transacción (`SELECT ... FOR UPDATE`), así que si varias personas piden el último
  cupo solo una se confirma y las demás reciben 409. Un cliente no puede reservar dos veces la misma franja.
- Cancelar reserva (HU15): solo el cliente dueño, solo reservas futuras y confirmadas; libera el cupo.
  No se aplica anticipación mínima porque los criterios de AYD1 no la piden.
- Agenda (HU17): el cliente ve sus reservas confirmadas y vigentes; el proveedor, las de sus servicios.
- Cada confirmación, cancelación o reprogramación deja un registro en `historial_estado_reserva`.
- Perfil (HU03): el usuario autenticado consulta y edita su propio nombre, correo y teléfono (el
  teléfono es opcional, igual que en el registro). El correo no puede repetirse con otra cuenta. No
  incluye cambio de contraseña (eso es HU04) ni es posible editar el perfil de otro usuario.
- Recuperar acceso (HU04): el token es un UUID de un solo uso, vence a los 30 minutos y queda marcado
  como usado tras restablecer la contraseña. Si el correo no está registrado, se informa explícitamente
  (así lo pide el criterio de aceptación de esta HU, a diferencia de HU02 donde por seguridad no se
  distingue el motivo del rechazo).
- Eliminar servicio (HU06): baja lógica (`estado=ELIMINADO`); un servicio eliminado ya no se puede
  editar ni aparece en el catálogo, pero sigue visible para el proveedor en "mis servicios". Se
  bloquea si el servicio tiene reservas confirmadas vigentes.
- Repetir horarios (HU12): patrón semanal (horas + días de la semana + fecha límite) sobre un
  servicio propio y activo. Solo se crean las ocurrencias futuras dentro del rango; las que ya
  pasaron se omiten sin error. Si el patrón no genera ninguna ocurrencia futura, se rechaza.
- Consultar disponibilidad (HU13): ya cubierta por el catálogo de franjas de HU14 (publicadas,
  futuras y con cupo); no fue necesario un endpoint nuevo.
- Reprogramar reserva (HU16): mueve una reserva futura propia a otra franja con cupo del mismo
  servicio. Libera el cupo anterior y ocupa el nuevo en la misma transacción; las dos franjas se
  bloquean en orden ascendente de id para evitar interbloqueos entre reprogramaciones concurrentes.
  Si algo falla, la reserva original no se modifica.
- Filtrar agenda (HU18): mismos datos de HU17, con filtros opcionales `fecha` (día exacto, zona
  `America/Bogota`) y `servicioId`. Sin coincidencias, la lista viene vacía.
- Recibir recordatorio (HU19): tarea programada (`RecordatorioService`, cada 5 minutos por defecto)
  que revisa las reservas confirmadas que empiezan dentro de las próximas 24 horas (configurable) y
  sin recordatorio aún, y genera uno por reserva. Un fallo de envío se guarda en el propio
  recordatorio (`enviado=false`, `error=...`); la reserva nunca cambia de estado por esto.

## Pruebas de aceptación

- `ReservasApiTests`: HU01, HU02, HU05 y HU06.
- `ReservasFlujoTests`: HU10, HU11, HU14, HU15 y HU17, incluida una prueba con 5 solicitudes simultáneas
  por el último cupo (debe confirmarse exactamente una).
- `ReservasSprint2Tests`: HU03, HU04, HU06 (eliminar), HU12, HU16 y HU18.
- `ReservasRecordatorioTests`: HU19, invocando `RecordatorioService` directamente (no es un endpoint
  REST, se dispara solo con `@Scheduled`).

Cada prueba corresponde a un criterio Given/When/Then. El "cancelar la operación" de HU03 y HU06 es
solo de frontend (no se envía nada al backend), por eso no tiene prueba aquí.

## Limitación de este entorno

No tuve acceso a Maven Central desde este sandbox para correr `mvn test` yo mismo (solo verifiqué que
el código no tiene errores de sintaxis). Antes de dar el Sprint 2 por cerrado, corran `mvn test`
en su máquina y confirmen que las 5 clases de prueba pasan.

## Pendiente

Migraciones con Flyway (ahora Hibernate usa `ddl-auto=update`); reportes de ocupación; entidad
`recurso` si el equipo la incorpora; un proveedor SMTP real para HU04/HU19 en producción.
