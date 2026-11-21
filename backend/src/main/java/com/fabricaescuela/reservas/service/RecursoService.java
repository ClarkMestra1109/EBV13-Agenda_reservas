package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.EstadoFranja;
import com.fabricaescuela.reservas.domain.EstadoReserva;
import com.fabricaescuela.reservas.domain.EstadoServicio;
import com.fabricaescuela.reservas.domain.Franja;
import com.fabricaescuela.reservas.domain.Recurso;
import com.fabricaescuela.reservas.domain.Reserva;
import com.fabricaescuela.reservas.domain.Servicio;
import com.fabricaescuela.reservas.domain.ServicioRecurso;
import com.fabricaescuela.reservas.domain.Usuario;
import com.fabricaescuela.reservas.dto.DisponibilidadRecursoResponse;
import com.fabricaescuela.reservas.dto.RecursoRequest;
import com.fabricaescuela.reservas.dto.RecursoResponse;
import com.fabricaescuela.reservas.error.ApiException;
import com.fabricaescuela.reservas.repository.FranjaRepository;
import com.fabricaescuela.reservas.repository.RecursoRepository;
import com.fabricaescuela.reservas.repository.ReservaRepository;
import com.fabricaescuela.reservas.repository.ServicioRecursoRepository;
import com.fabricaescuela.reservas.repository.ServicioRepository;
import com.fabricaescuela.reservas.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** HU07 (registrar), HU08 (asociar) y HU09 (capacidad) de recursos. */
@Service
public class RecursoService {

    private static final ZoneId ZONA = ZoneId.of("America/Bogota");
    /** Hasta dónde se miran las reservas futuras para calcular la ocupación de un recurso. */
    private static final Instant SIN_LIMITE = Instant.parse("9999-12-31T00:00:00Z");

    private final RecursoRepository recursos;
    private final ServicioRecursoRepository vinculos;
    private final ServicioRepository servicios;
    private final UsuarioRepository usuarios;
    private final ReservaRepository reservas;
    private final FranjaRepository franjas;
    private final CapacidadRecursos capacidad;

    public RecursoService(RecursoRepository recursos, ServicioRecursoRepository vinculos,
                          ServicioRepository servicios, UsuarioRepository usuarios,
                          ReservaRepository reservas, FranjaRepository franjas,
                          CapacidadRecursos capacidad) {
        this.recursos = recursos;
        this.vinculos = vinculos;
        this.servicios = servicios;
        this.usuarios = usuarios;
        this.reservas = reservas;
        this.franjas = franjas;
        this.capacidad = capacidad;
    }

    // ------------------------------------------------------------------ HU07 / HU09

    @Transactional
    public RecursoResponse crear(Long proveedorId, RecursoRequest req) {
        Usuario proveedor = usuarios.findById(proveedorId)
                .orElseThrow(() -> ApiException.noAutenticado("Debe iniciar sesión para realizar esta operación"));
        validarNombreUnico(proveedorId, req.nombre(), -1L);
        Recurso recurso = new Recurso();
        recurso.setProveedor(proveedor);
        aplicar(recurso, req);
        recursos.saveAndFlush(recurso);
        return respuesta(recurso, List.of());
    }

    @Transactional(readOnly = true)
    public List<RecursoResponse> listarPropios(Long proveedorId) {
        Map<Long, List<RecursoResponse.ServicioAsociado>> asociados = new HashMap<>();
        for (ServicioRecurso v : vinculos.vigentesDelProveedor(proveedorId, EstadoServicio.ELIMINADO)) {
            asociados.computeIfAbsent(v.getRecurso().getId(), k -> new ArrayList<>())
                    .add(asociado(v.getServicio()));
        }
        return recursos.findByProveedorIdOrderByNombreAsc(proveedorId).stream()
                .map(r -> respuesta(r, asociados.getOrDefault(r.getId(), List.of())))
                .toList();
    }

    /**
     * Actualiza datos y capacidad. Aumentar la capacidad libera cupos de inmediato; reducirla
     * solo se permite si las reservas futuras ya tomadas caben en la nueva capacidad.
     */
    @Transactional
    public RecursoResponse actualizar(Long proveedorId, Long recursoId, RecursoRequest req) {
        Recurso recurso = recursoPropioBloqueado(proveedorId, recursoId);
        validarNombreUnico(proveedorId, req.nombre(), recursoId);
        if (req.capacidad() < recurso.getCapacidad()) {
            int ocupacion = capacidad.ocupacionMaxima(recursoId, Instant.now(), SIN_LIMITE, null);
            if (req.capacidad() < ocupacion) {
                throw ApiException.conflicto("No puede reducir la capacidad a " + req.capacidad()
                        + ": hay horarios futuros con " + ocupacion
                        + " reservas confirmadas al mismo tiempo que usan este recurso");
            }
        }
        aplicar(recurso, req);
        recursos.saveAndFlush(recurso);
        return respuestaCompleta(recurso);
    }

    /** Se elimina solo si ningún servicio lo usa, para no dejar servicios sin un recurso que necesitan. */
    @Transactional
    public void eliminar(Long proveedorId, Long recursoId) {
        Recurso recurso = recursoPropioBloqueado(proveedorId, recursoId);
        long enUso = vinculos.countByRecursoId(recursoId);
        if (enUso > 0) {
            throw ApiException.conflicto("El recurso está asociado a " + enUso
                    + " servicio(s). Quite esas asociaciones antes de eliminarlo");
        }
        recursos.delete(recurso);
    }

    /** HU09: ocupación del recurso en cada horario publicado de un día. */
    @Transactional(readOnly = true)
    public DisponibilidadRecursoResponse disponibilidad(Long proveedorId, Long recursoId, LocalDate fecha) {
        Recurso recurso = recursoPropio(proveedorId, recursoId);
        LocalDate dia = fecha == null ? LocalDate.now(ZONA) : fecha;
        Instant desde = dia.atStartOfDay(ZONA).toInstant();
        Instant hasta = dia.plusDays(1).atStartOfDay(ZONA).toInstant();

        List<Reserva> delDia = reservas.queUsanRecursoEnRango(recursoId, EstadoReserva.CONFIRMADA, desde, hasta, -1L);
        List<DisponibilidadRecursoResponse.Horario> horarios = new ArrayList<>();
        for (Franja f : franjas.deRecursoEnRango(recursoId, EstadoFranja.PUBLICADA, desde, hasta)) {
            List<Instant[]> cruzadas = new ArrayList<>();
            for (Reserva r : delDia) {
                if (r.getFranja().getInicio().isBefore(f.getFin()) && r.getFranja().getFin().isAfter(f.getInicio())) {
                    cruzadas.add(new Instant[]{r.getFranja().getInicio(), r.getFranja().getFin()});
                }
            }
            int simultaneas = CapacidadRecursos.maximoSimultaneo(cruzadas, f.getInicio(), f.getFin());
            horarios.add(new DisponibilidadRecursoResponse.Horario(
                    f.getId(), f.getServicio().getId(), f.getServicio().getNombre(),
                    f.getInicio(), f.getFin(), simultaneas,
                    Math.max(0, recurso.getCapacidad() - simultaneas)));
        }
        return new DisponibilidadRecursoResponse(recurso.getId(), recurso.getNombre(),
                recurso.getCapacidad(), dia, horarios);
    }

    // ------------------------------------------------------------------ HU08

    @Transactional(readOnly = true)
    public List<RecursoResponse> recursosDeServicio(Long proveedorId, Long servicioId) {
        servicioPropio(proveedorId, servicioId);
        return vinculos.delServicio(servicioId).stream()
                .map(v -> respuestaCompleta(v.getRecurso()))
                .toList();
    }

    /**
     * Asocia un recurso propio a un servicio propio. Si el servicio ya tiene reservas futuras
     * que, sumadas a las del recurso, superarían su capacidad, el vínculo no se crea.
     */
    @Transactional
    public RecursoResponse asociar(Long proveedorId, Long servicioId, Long recursoId) {
        Servicio servicio = servicioPropio(proveedorId, servicioId);
        if (servicio.getEstado() == EstadoServicio.ELIMINADO) {
            throw ApiException.conflicto("No se pueden asociar recursos a un servicio eliminado");
        }
        Recurso recurso = recursoPropioBloqueado(proveedorId, recursoId);
        if (vinculos.existsByServicioIdAndRecursoId(servicioId, recursoId)) {
            throw ApiException.conflicto("El recurso \"" + recurso.getNombre() + "\" ya está asociado a este servicio");
        }
        vinculos.saveAndFlush(new ServicioRecurso(servicio, recurso));

        int ocupacion = capacidad.ocupacionMaxima(recursoId, Instant.now(), SIN_LIMITE, null);
        if (ocupacion > recurso.getCapacidad()) {
            // La transacción se revierte: el vínculo no queda guardado.
            throw ApiException.conflicto("No se puede asociar: con las reservas futuras de este servicio el recurso \""
                    + recurso.getNombre() + "\" tendría " + ocupacion
                    + " reservas al mismo tiempo y su capacidad es " + recurso.getCapacidad());
        }
        return respuestaCompleta(recurso);
    }

    @Transactional
    public void desasociar(Long proveedorId, Long servicioId, Long recursoId) {
        servicioPropio(proveedorId, servicioId);
        recursoPropio(proveedorId, recursoId);
        ServicioRecurso vinculo = vinculos.findByServicioIdAndRecursoId(servicioId, recursoId)
                .orElseThrow(() -> ApiException.noEncontrado("El recurso no está asociado a este servicio"));
        vinculos.delete(vinculo);
    }

    // ------------------------------------------------------------------ apoyo

    private void aplicar(Recurso recurso, RecursoRequest req) {
        recurso.setNombre(req.nombre().trim());
        recurso.setTipo(req.tipo());
        String descripcion = req.descripcion() == null ? null : req.descripcion().trim();
        recurso.setDescripcion(descripcion == null || descripcion.isEmpty() ? null : descripcion);
        recurso.setCapacidad(req.capacidad());
    }

    private void validarNombreUnico(Long proveedorId, String nombre, Long idExcluido) {
        if (recursos.existeNombreDuplicado(proveedorId, nombre.trim(), idExcluido)) {
            throw ApiException.conflicto("Ya tiene un recurso con ese nombre");
        }
    }

    private Recurso recursoPropio(Long proveedorId, Long recursoId) {
        Recurso recurso = recursos.findById(recursoId)
                .orElseThrow(() -> ApiException.noEncontrado("El recurso no existe"));
        if (!recurso.getProveedor().getId().equals(proveedorId)) {
            throw ApiException.prohibido("No tiene permiso sobre este recurso");
        }
        return recurso;
    }

    private Recurso recursoPropioBloqueado(Long proveedorId, Long recursoId) {
        Recurso recurso = recursos.buscarParaActualizar(recursoId)
                .orElseThrow(() -> ApiException.noEncontrado("El recurso no existe"));
        if (!recurso.getProveedor().getId().equals(proveedorId)) {
            throw ApiException.prohibido("No tiene permiso sobre este recurso");
        }
        return recurso;
    }

    private Servicio servicioPropio(Long proveedorId, Long servicioId) {
        Servicio servicio = servicios.findById(servicioId)
                .orElseThrow(() -> ApiException.noEncontrado("El servicio no existe"));
        if (!servicio.getProveedor().getId().equals(proveedorId)) {
            throw ApiException.prohibido("No tiene permiso sobre este servicio");
        }
        return servicio;
    }

    private RecursoResponse respuestaCompleta(Recurso recurso) {
        List<RecursoResponse.ServicioAsociado> asociados = new ArrayList<>();
        for (ServicioRecurso v : vinculos.vigentesDelProveedor(recurso.getProveedor().getId(), EstadoServicio.ELIMINADO)) {
            if (v.getRecurso().getId().equals(recurso.getId())) {
                asociados.add(asociado(v.getServicio()));
            }
        }
        return respuesta(recurso, asociados);
    }

    private RecursoResponse respuesta(Recurso recurso, List<RecursoResponse.ServicioAsociado> asociados) {
        int proximas = 0;
        int pico = 0;
        if (recurso.getId() != null) {
            List<Reserva> futuras = reservas.queUsanRecursoEnRango(recurso.getId(), EstadoReserva.CONFIRMADA,
                    Instant.now(), SIN_LIMITE, -1L);
            List<Instant[]> intervalos = new ArrayList<>(futuras.size());
            for (Reserva r : futuras) {
                intervalos.add(new Instant[]{r.getFranja().getInicio(), r.getFranja().getFin()});
            }
            proximas = futuras.size();
            pico = CapacidadRecursos.maximoSimultaneo(intervalos, Instant.now(), SIN_LIMITE);
        }
        return new RecursoResponse(recurso.getId(), recurso.getNombre(), recurso.getTipo().name(),
                recurso.getDescripcion(), recurso.getCapacidad(), asociados, proximas, pico,
                Math.max(0, recurso.getCapacidad() - pico));
    }

    private RecursoResponse.ServicioAsociado asociado(Servicio s) {
        return new RecursoResponse.ServicioAsociado(s.getId(), s.getNombre(), s.getEstado().name());
    }
}
