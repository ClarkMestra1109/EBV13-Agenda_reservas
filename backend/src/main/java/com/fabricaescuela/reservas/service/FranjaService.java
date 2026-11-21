package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.EstadoFranja;
import com.fabricaescuela.reservas.domain.EstadoServicio;
import com.fabricaescuela.reservas.domain.Franja;
import com.fabricaescuela.reservas.domain.Servicio;
import com.fabricaescuela.reservas.dto.FranjaRecurrenteRequest;
import com.fabricaescuela.reservas.dto.FranjaRequest;
import com.fabricaescuela.reservas.dto.FranjaResponse;
import com.fabricaescuela.reservas.error.ApiException;
import com.fabricaescuela.reservas.repository.FranjaRepository;
import com.fabricaescuela.reservas.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class FranjaService {

    private static final int CUPO_POR_DEFECTO = 1;
    // Zona horaria de referencia del equipo (Fábrica Escuela, Colombia).
    private static final ZoneId ZONA = ZoneId.of("America/Bogota");
    // Reglas de negocio de la agenda.
    private static final int MESES_MAX_ANTICIPACION = 6;   // no se publica a más de 6 meses
    private static final int MESES_MAX_RECURRENCIA = 3;    // un patrón semanal cubre máximo 3 meses
    private static final Duration DURACION_MAX_FRANJA = Duration.ofHours(12);
    private static final DateTimeFormatter FORMATO_CRUCE =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZONA);

    private final FranjaRepository franjas;
    private final ServicioRepository servicios;
    private final CapacidadRecursos capacidadRecursos;

    public FranjaService(FranjaRepository franjas, ServicioRepository servicios,
                         CapacidadRecursos capacidadRecursos) {
        this.franjas = franjas;
        this.servicios = servicios;
        this.capacidadRecursos = capacidadRecursos;
    }

    /** HU10: el proveedor publica una franja futura y válida para uno de sus servicios. */
    @Transactional
    public FranjaResponse publicar(Long proveedorId, Long servicioId, FranjaRequest req) {
        Servicio servicio = servicioPropioBloqueado(proveedorId, servicioId);
        if (servicio.getEstado() != EstadoServicio.ACTIVO) {
            throw ApiException.conflicto("El servicio no está activo");
        }
        Instant inicio = req.inicio().toInstant();
        Instant fin = req.fin().toInstant();
        if (!fin.isAfter(inicio)) {
            throw ApiException.invalido("El rango de la franja no es válido: el fin debe ser posterior al inicio");
        }
        if (!inicio.isAfter(Instant.now())) {
            throw ApiException.invalido("La franja debe ser futura: no se pueden publicar horarios en el pasado");
        }
        Instant limite = LocalDate.now(ZONA).plusMonths(MESES_MAX_ANTICIPACION).plusDays(1)
                .atStartOfDay(ZONA).toInstant();
        if (!inicio.isBefore(limite)) {
            throw ApiException.invalido("Solo se pueden publicar horarios con máximo "
                    + MESES_MAX_ANTICIPACION + " meses de anticipación");
        }
        validarDuracion(servicio, inicio, fin);
        validarSinCruces(servicioId, inicio, fin);
        Franja franja = crearFranja(servicio, inicio, fin, req.cupoTotal());
        return FranjaResponse.desde(franjas.saveAndFlush(franja));
    }

    /**
     * HU12: publica varias franjas de una sola vez siguiendo un patrón semanal
     * (p. ej. todos los lunes y miércoles de 9 a 10, hasta una fecha límite).
     * Solo se crean las ocurrencias futuras; las que ya quedaron en el pasado dentro
     * del rango simplemente se omiten, no se consideran un error.
     */
    @Transactional
    public List<FranjaResponse> publicarRecurrente(Long proveedorId, Long servicioId, FranjaRecurrenteRequest req) {
        Servicio servicio = servicioPropioBloqueado(proveedorId, servicioId);
        if (servicio.getEstado() != EstadoServicio.ACTIVO) {
            throw ApiException.conflicto("El servicio no está activo");
        }
        if (!req.horaFin().isAfter(req.horaInicio())) {
            throw ApiException.invalido("El rango de horario no es válido: la hora de fin debe ser posterior a la de inicio");
        }
        LocalDate hoy = LocalDate.now(ZONA);
        if (!req.repetirHasta().isAfter(hoy)) {
            throw ApiException.invalido("La fecha límite de repetición debe ser posterior a hoy");
        }
        // Sin este tope, una fecha muy lejana generaría miles de franjas en una sola petición.
        if (req.repetirHasta().isAfter(hoy.plusMonths(MESES_MAX_RECURRENCIA))) {
            throw ApiException.invalido("La repetición puede cubrir máximo "
                    + MESES_MAX_RECURRENCIA + " meses a partir de hoy");
        }

        List<Franja> nuevas = new ArrayList<>();
        Instant ahora = Instant.now();
        for (LocalDate fecha = hoy; !fecha.isAfter(req.repetirHasta()); fecha = fecha.plusDays(1)) {
            if (!req.diasSemana().contains(fecha.getDayOfWeek())) {
                continue;
            }
            Instant inicio = fecha.atTime(req.horaInicio()).atZone(ZONA).toInstant();
            Instant fin = fecha.atTime(req.horaFin()).atZone(ZONA).toInstant();
            if (!inicio.isAfter(ahora)) {
                continue; // la ocurrencia de hoy ya pasó; no es un error, se omite.
            }
            validarDuracion(servicio, inicio, fin);
            validarSinCruces(servicioId, inicio, fin);
            nuevas.add(crearFranja(servicio, inicio, fin, req.cupoTotal()));
        }

        if (nuevas.isEmpty()) {
            throw ApiException.invalido(
                    "El patrón no genera ninguna ocurrencia futura antes de la fecha límite");
        }
        return franjas.saveAll(nuevas).stream().map(FranjaResponse::desde).toList();
    }

    /** La franja debe alcanzar para prestar el servicio y no puede ser desproporcionada. */
    private void validarDuracion(Servicio servicio, Instant inicio, Instant fin) {
        Duration duracion = Duration.between(inicio, fin);
        if (duracion.toMinutes() < servicio.getDuracionMin()) {
            throw ApiException.invalido("El horario debe durar al menos " + servicio.getDuracionMin()
                    + " minutos, que es la duración del servicio");
        }
        if (duracion.compareTo(DURACION_MAX_FRANJA) > 0) {
            throw ApiException.invalido("Un horario no puede durar más de "
                    + DURACION_MAX_FRANJA.toHours() + " horas");
        }
    }

    /** Un mismo servicio no puede tener dos horarios publicados que se crucen. */
    private void validarSinCruces(Long servicioId, Instant inicio, Instant fin) {
        List<Franja> cruces = franjas.solapadas(servicioId, EstadoFranja.PUBLICADA, inicio, fin);
        if (!cruces.isEmpty()) {
            Franja existente = cruces.get(0);
            throw ApiException.conflicto("Ya existe un horario publicado para este servicio que se cruza: "
                    + FORMATO_CRUCE.format(existente.getInicio()) + " - "
                    + DateTimeFormatter.ofPattern("HH:mm").withZone(ZONA).format(existente.getFin()));
        }
    }

    private Franja crearFranja(Servicio servicio, Instant inicio, Instant fin, Integer cupoTotal) {
        Franja franja = new Franja();
        franja.setServicio(servicio);
        franja.setInicio(inicio);
        franja.setFin(fin);
        franja.setCupoTotal(cupoTotal != null ? cupoTotal : CUPO_POR_DEFECTO);
        franja.setCuposOcupados(0);
        franja.setEstado(EstadoFranja.PUBLICADA);
        return franja;
    }

    /** Todas las franjas de un servicio propio (incluye retiradas y llenas). */
    @Transactional(readOnly = true)
    public List<FranjaResponse> listarDeServicioPropio(Long proveedorId, Long servicioId) {
        servicioPropio(proveedorId, servicioId);
        return franjas.findByServicioIdOrderByInicioAsc(servicioId).stream()
                .map(FranjaResponse::desde)
                .toList();
    }

    /** HU11: solo se retira una franja futura y sin reservas; si tiene reservas se protege. */
    @Transactional
    public FranjaResponse retirar(Long proveedorId, Long franjaId) {
        Franja franja = franjas.buscarParaActualizar(franjaId)
                .orElseThrow(() -> ApiException.noEncontrado("La franja no existe"));
        if (!franja.getServicio().getProveedor().getId().equals(proveedorId)) {
            throw ApiException.prohibido("No tiene permiso sobre esta franja");
        }
        if (franja.getEstado() == EstadoFranja.RETIRADA) {
            throw ApiException.conflicto("La franja ya fue retirada");
        }
        if (!franja.getInicio().isAfter(Instant.now())) {
            throw ApiException.conflicto("Solo se pueden retirar franjas futuras");
        }
        if (franja.getCuposOcupados() > 0) {
            throw ApiException.conflicto("La franja tiene reservas y no puede retirarse");
        }
        franja.setEstado(EstadoFranja.RETIRADA);
        return FranjaResponse.desde(franjas.saveAndFlush(franja));
    }

    /**
     * HU13: franjas que un cliente puede reservar de un servicio activo (publicadas, futuras
     * y con cupo libre). En cuanto una franja se llena o se retira, deja de aparecer aquí.
     */
    @Transactional(readOnly = true)
    public List<FranjaResponse> disponiblesDe(Long servicioId) {
        Servicio servicio = servicios.findById(servicioId)
                .orElseThrow(() -> ApiException.noEncontrado("El servicio no existe"));
        if (servicio.getEstado() != EstadoServicio.ACTIVO) {
            return List.of();
        }
        // HU09: si los recursos del servicio están llenos en un horario, ese horario no se
        // ofrece, y los cupos mostrados nunca superan lo que los recursos permiten.
        return franjas.disponibles(servicioId, EstadoFranja.PUBLICADA, Instant.now()).stream()
                .map(f -> {
                    FranjaResponse base = FranjaResponse.desde(f);
                    Integer libresRecursos = capacidadRecursos.cuposLibres(servicioId, f.getInicio(), f.getFin());
                    if (libresRecursos == null || libresRecursos >= base.cuposDisponibles()) {
                        return base;
                    }
                    return new FranjaResponse(base.id(), base.servicioId(), base.inicio(), base.fin(),
                            base.cupoTotal(), base.cuposOcupados(), libresRecursos, base.estado());
                })
                .filter(f -> f.cuposDisponibles() > 0)
                .toList();
    }

    /** Igual que {@link #servicioPropio}, pero bloqueando la fila para serializar publicaciones. */
    private Servicio servicioPropioBloqueado(Long proveedorId, Long servicioId) {
        Servicio servicio = servicios.buscarParaActualizar(servicioId)
                .orElseThrow(() -> ApiException.noEncontrado("El servicio no existe"));
        if (!servicio.getProveedor().getId().equals(proveedorId)) {
            throw ApiException.prohibido("No tiene permiso sobre este servicio");
        }
        return servicio;
    }

    private Servicio servicioPropio(Long proveedorId, Long servicioId) {
        Servicio servicio = servicios.findById(servicioId)
                .orElseThrow(() -> ApiException.noEncontrado("El servicio no existe"));
        if (!servicio.getProveedor().getId().equals(proveedorId)) {
            throw ApiException.prohibido("No tiene permiso sobre este servicio");
        }
        return servicio;
    }
}
