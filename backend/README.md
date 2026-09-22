# Plataforma de reservas de servicios (Caso 14) — Backend Sprint 1

Spring Boot 3.5 · Java 17 · PostgreSQL · JWT. Cubre HU01 (crear cuenta), HU02 (iniciar sesión),
HU05 (crear servicio), HU06 (actualizar servicio), HU10 (publicar disponibilidad), HU11 (retirar
disponibilidad), HU14 (confirmar reserva), HU15 (cancelar reserva) y HU17 (consultar agenda).

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
| GET | `/api/agenda` | cualquier usuario autenticado (según rol) | HU17 |

Las fechas de las franjas van en ISO-8601 con zona, por ejemplo `2026-10-05T09:00:00-05:00`.

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
- Cada confirmación o cancelación deja un registro en `historial_estado_reserva`.

## Pruebas de aceptación

- `ReservasApiTests`: HU01, HU02, HU05 y HU06.
- `ReservasFlujoTests`: HU10, HU11, HU14, HU15 y HU17, incluida una prueba con 5 solicitudes simultáneas
  por el último cupo (debe confirmarse exactamente una).

Cada prueba corresponde a un criterio Given/When/Then. El "cancelar la operación" de HU06 es solo de
frontend, por eso no tiene prueba aquí.

## Pendiente

Migraciones con Flyway (ahora Hibernate usa `ddl-auto=update`); HU03 y HU04; reportes de ocupación;
entidad `recurso` si el equipo la incorpora.
