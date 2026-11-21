package com.fabricaescuela.reservas.repository;

import com.fabricaescuela.reservas.domain.EstadoServicio;
import com.fabricaescuela.reservas.domain.ServicioRecurso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ServicioRecursoRepository extends JpaRepository<ServicioRecurso, Long> {

    boolean existsByServicioIdAndRecursoId(Long servicioId, Long recursoId);

    Optional<ServicioRecurso> findByServicioIdAndRecursoId(Long servicioId, Long recursoId);

    /** Ids de los recursos que usa un servicio. */
    @Query("select sr.recurso.id from ServicioRecurso sr where sr.servicio.id = :servicioId order by sr.recurso.id")
    List<Long> idsDeRecursosDelServicio(@Param("servicioId") Long servicioId);

    /** Vínculos de un servicio, con el recurso ya cargado. */
    @Query("select sr from ServicioRecurso sr join fetch sr.recurso where sr.servicio.id = :servicioId "
            + "order by sr.recurso.nombre")
    List<ServicioRecurso> delServicio(@Param("servicioId") Long servicioId);

    /** Vínculos vigentes (servicio no eliminado) de los recursos de un proveedor. */
    @Query("select sr from ServicioRecurso sr join fetch sr.servicio s "
            + "where sr.recurso.proveedor.id = :proveedorId and s.estado <> :eliminado order by s.nombre")
    List<ServicioRecurso> vigentesDelProveedor(@Param("proveedorId") Long proveedorId,
                                               @Param("eliminado") EstadoServicio eliminado);

    long countByRecursoId(Long recursoId);

    @Modifying(flushAutomatically = true)
    @Query("delete from ServicioRecurso sr where sr.servicio.id = :servicioId")
    int eliminarDelServicio(@Param("servicioId") Long servicioId);
}
