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
}
