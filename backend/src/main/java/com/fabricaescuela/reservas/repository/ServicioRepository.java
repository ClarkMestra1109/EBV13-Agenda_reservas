package com.fabricaescuela.reservas.repository;

import com.fabricaescuela.reservas.domain.Servicio;
import com.fabricaescuela.reservas.domain.EstadoServicio;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ServicioRepository extends JpaRepository<Servicio, Long> {

    List<Servicio> findByProveedorIdOrderByFechaCreacionDesc(Long proveedorId);

    List<Servicio> findByEstadoOrderByNombreAsc(EstadoServicio estado);

    /**
     * Bloquea la fila del servicio mientras se publican franjas, para que dos publicaciones
     * simultáneas no puedan crear horarios que se crucen entre sí.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Servicio s where s.id = :id")
    Optional<Servicio> buscarParaActualizar(@Param("id") Long id);

    /**
     * Un proveedor no puede tener dos servicios vigentes con el mismo nombre (sin distinguir
     * mayúsculas). {@code idExcluido} permite ignorar el propio servicio al editarlo.
     */
    @Query("select case when count(s) > 0 then true else false end from Servicio s "
            + "where s.proveedor.id = :proveedorId and lower(s.nombre) = lower(:nombre) "
            + "and s.estado <> :estadoExcluido and s.id <> :idExcluido")
    boolean existeNombreDuplicado(@Param("proveedorId") Long proveedorId,
                                  @Param("nombre") String nombre,
                                  @Param("estadoExcluido") EstadoServicio estadoExcluido,
                                  @Param("idExcluido") Long idExcluido);
}
