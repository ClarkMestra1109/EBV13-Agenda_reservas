package com.fabricaescuela.reservas.repository;

import com.fabricaescuela.reservas.domain.Recordatorio;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecordatorioRepository extends JpaRepository<Recordatorio, Long> {

    boolean existsByReservaId(Long reservaId);
}
