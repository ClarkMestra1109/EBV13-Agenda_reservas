package com.fabricaescuela.reservas.repository;

import com.fabricaescuela.reservas.domain.HistorialEstadoReserva;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistorialEstadoReservaRepository extends JpaRepository<HistorialEstadoReserva, Long> {
}
