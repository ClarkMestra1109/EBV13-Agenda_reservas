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

    /** HU19: reservas confirmadas cuya franja empieza dentro de la ventana de recordatorio, sin recordatorio aún. */
    @Query("select r from Reserva r where r.estado = :estado "
            + "and r.franja.inicio between :ahora and :limite "
            + "and r.id not in (select rec.reserva.id from Recordatorio rec)")
    List<Reserva> pendientesDeRecordatorio(@Param("estado") EstadoReserva estado,
                                           @Param("ahora") Instant ahora,
                                           @Param("limite") Instant limite);
}
