package com.fabricaescuela.reservas.repository;

import com.fabricaescuela.reservas.domain.EstadoReserva;
import com.fabricaescuela.reservas.domain.Reserva;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    boolean existsByClienteIdAndFranjaIdAndEstado(Long clienteId, Long franjaId, EstadoReserva estado);

    /** Bloquea la fila de la reserva para que una doble cancelación no libere el cupo dos veces. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Reserva r where r.id = :id")
    Optional<Reserva> buscarParaActualizar(@Param("id") Long id);

    @Query("select r from Reserva r where r.cliente.id = :clienteId and r.estado = :estado "
            + "and r.franja.fin > :ahora order by r.franja.inicio")
    List<Reserva> agendaDeCliente(@Param("clienteId") Long clienteId,
                                  @Param("estado") EstadoReserva estado,
                                  @Param("ahora") Instant ahora);

    @Query("select r from Reserva r where r.franja.servicio.proveedor.id = :proveedorId "
            + "and r.estado = :estado and r.franja.fin > :ahora order by r.franja.inicio")
    List<Reserva> agendaDeProveedor(@Param("proveedorId") Long proveedorId,
                                    @Param("estado") EstadoReserva estado,
                                    @Param("ahora") Instant ahora);

    /** HU18: agenda del cliente con filtros opcionales por fecha exacta y/o servicio. */
    @Query("select r from Reserva r where r.cliente.id = :clienteId and r.estado = :estado "
            + "and r.franja.fin > :ahora "
            + "and (:servicioId is null or r.franja.servicio.id = :servicioId) "
            + "and (:inicioDia is null or (r.franja.inicio >= :inicioDia and r.franja.inicio < :finDia)) "
            + "order by r.franja.inicio")
    List<Reserva> agendaDeClienteFiltrada(@Param("clienteId") Long clienteId,
                                          @Param("estado") EstadoReserva estado,
                                          @Param("ahora") Instant ahora,
                                          @Param("servicioId") Long servicioId,
                                          @Param("inicioDia") Instant inicioDia,
                                          @Param("finDia") Instant finDia);

    /** HU18: agenda del proveedor con filtros opcionales por fecha exacta y/o servicio. */
    @Query("select r from Reserva r where r.franja.servicio.proveedor.id = :proveedorId "
            + "and r.estado = :estado and r.franja.fin > :ahora "
            + "and (:servicioId is null or r.franja.servicio.id = :servicioId) "
            + "and (:inicioDia is null or (r.franja.inicio >= :inicioDia and r.franja.inicio < :finDia)) "
            + "order by r.franja.inicio")
    List<Reserva> agendaDeProveedorFiltrada(@Param("proveedorId") Long proveedorId,
                                            @Param("estado") EstadoReserva estado,
                                            @Param("ahora") Instant ahora,
                                            @Param("servicioId") Long servicioId,
                                            @Param("inicioDia") Instant inicioDia,
                                            @Param("finDia") Instant finDia);

    /** HU06: protege de eliminar un servicio que todavía tiene reservas confirmadas vigentes. */
    @Query("select case when count(r) > 0 then true else false end from Reserva r "
            + "where r.franja.servicio.id = :servicioId and r.estado = :estado and r.franja.fin > :ahora")
    boolean existeReservaVigentePorServicio(@Param("servicioId") Long servicioId,
                                            @Param("estado") EstadoReserva estado,
                                            @Param("ahora") Instant ahora);

    /**
     * Indica si el cliente ya tiene otra reserva confirmada cuyo horario se cruza con el rango
     * [desde, hasta). {@code reservaExcluida} permite ignorar la propia reserva al reprogramar
     * (se envía -1 cuando no aplica).
     */
    @Query("select case when count(r) > 0 then true else false end from Reserva r "
            + "where r.cliente.id = :clienteId and r.estado = :estado "
            + "and r.franja.inicio < :hasta and r.franja.fin > :desde and r.id <> :reservaExcluida")
    boolean existeCruceDeHorario(@Param("clienteId") Long clienteId,
                                 @Param("estado") EstadoReserva estado,
                                 @Param("desde") Instant desde,
                                 @Param("hasta") Instant hasta,
                                 @Param("reservaExcluida") Long reservaExcluida);

    /**
     * HU09: reservas en el estado indicado cuyo horario se cruza con [desde, hasta) y que
     * pertenecen a cualquier servicio que use el recurso. {@code reservaExcluida} permite
     * ignorar la reserva que se está reprogramando (-1 cuando no aplica).
     */
    @Query("select r from Reserva r join fetch r.franja f where r.estado = :estado "
            + "and f.inicio < :hasta and f.fin > :desde and r.id <> :reservaExcluida "
            + "and f.servicio.id in (select sr.servicio.id from ServicioRecurso sr where sr.recurso.id = :recursoId)")
    List<Reserva> queUsanRecursoEnRango(@Param("recursoId") Long recursoId,
                                        @Param("estado") EstadoReserva estado,
                                        @Param("desde") Instant desde,
                                        @Param("hasta") Instant hasta,
                                        @Param("reservaExcluida") Long reservaExcluida);

    /**
     * HU20-HU23: reservas (en cualquier estado) de los servicios del proveedor cuya cita
     * empieza dentro de [desde, hasta), con filtro opcional por servicio.
     */
    @Query("select r from Reserva r join fetch r.franja f join fetch f.servicio s join fetch r.cliente "
            + "where s.proveedor.id = :proveedorId and f.inicio >= :desde and f.inicio < :hasta "
            + "and (:servicioId is null or s.id = :servicioId) order by f.inicio, r.id")
    List<Reserva> delProveedorEnPeriodo(@Param("proveedorId") Long proveedorId,
                                        @Param("desde") Instant desde,
                                        @Param("hasta") Instant hasta,
                                        @Param("servicioId") Long servicioId);

    /** HU19: reservas confirmadas cuya franja empieza dentro de la ventana de recordatorio, sin recordatorio aún. */
    @Query("select r from Reserva r where r.estado = :estado "
            + "and r.franja.inicio between :ahora and :limite "
            + "and r.id not in (select rec.reserva.id from Recordatorio rec)")
    List<Reserva> pendientesDeRecordatorio(@Param("estado") EstadoReserva estado,
                                           @Param("ahora") Instant ahora,
                                           @Param("limite") Instant limite);
}
