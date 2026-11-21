package com.fabricaescuela.reservas.repository;

import com.fabricaescuela.reservas.domain.Recurso;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RecursoRepository extends JpaRepository<Recurso, Long> {

    List<Recurso> findByProveedorIdOrderByNombreAsc(Long proveedorId);

    /** Bloquea el recurso: serializa reservas y cambios de capacidad que compiten por él. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Recurso r where r.id = :id")
    Optional<Recurso> buscarParaActualizar(@Param("id") Long id);

    /** Bloquea varios recursos en orden de id (siempre el mismo orden, para evitar interbloqueos). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Recurso r where r.id in :ids order by r.id")
    List<Recurso> bloquearEnOrden(@Param("ids") Collection<Long> ids);

    @Query("select case when count(r) > 0 then true else false end from Recurso r "
            + "where r.proveedor.id = :proveedorId and lower(r.nombre) = lower(:nombre) and r.id <> :idExcluido")
    boolean existeNombreDuplicado(@Param("proveedorId") Long proveedorId,
                                  @Param("nombre") String nombre,
                                  @Param("idExcluido") Long idExcluido);
}
