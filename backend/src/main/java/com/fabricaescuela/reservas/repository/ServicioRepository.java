package com.fabricaescuela.reservas.repository;

import com.fabricaescuela.reservas.domain.Servicio;
import com.fabricaescuela.reservas.domain.EstadoServicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServicioRepository extends JpaRepository<Servicio, Long> {

    List<Servicio> findByProveedorIdOrderByFechaCreacionDesc(Long proveedorId);

    List<Servicio> findByEstadoOrderByNombreAsc(EstadoServicio estado);
}
