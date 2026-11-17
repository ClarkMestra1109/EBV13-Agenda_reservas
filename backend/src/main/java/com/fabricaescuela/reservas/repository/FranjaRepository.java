package com.fabricaescuela.reservas.repository;

import com.fabricaescuela.reservas.domain.EstadoFranja;
import com.fabricaescuela.reservas.domain.Franja;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface FranjaRepository extends JpaRepository<Franja, Long> {

    /**
     * Lee la franja bloqueando su fila (SELECT ... FOR UPDATE) hasta que termine la transacción.
     * Así, dos solicitudes por el último cupo se procesan una después de la otra.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Franja f where f.id = :id")
    Optional<Franja> buscarParaActualizar(@Param("id") Long id);

    List<Franja> findByServicioIdOrderByInicioAsc(Long servicioId);

    /** Franjas que se pueden reservar: publicadas, futuras y con cupo libre. */
    @Query("select f from Franja f where f.servicio.id = :servicioId and f.estado = :estado "
            + "and f.inicio > :ahora and f.cuposOcupados < f.cupoTotal order by f.inicio")
    List<Franja> disponibles(@Param("servicioId") Long servicioId,
                             @Param("estado") EstadoFranja estado,
                             @Param("ahora") Instant ahora);

    /**
     * Franjas vigentes de un servicio que se cruzan con el rango [desde, hasta). Dos rangos
     * se cruzan cuando cada uno empieza antes de que termine el otro.
     */
    @Query("select f from Franja f where f.servicio.id = :servicioId and f.estado = :estado "
            + "and f.inicio < :hasta and f.fin > :desde order by f.inicio")
    List<Franja> solapadas(@Param("servicioId") Long servicioId,
                           @Param("estado") EstadoFranja estado,
                           @Param("desde") Instant desde,
                           @Param("hasta") Instant hasta);

    /** Al eliminar un servicio, sus franjas futuras dejan de ofrecerse. */
    @Modifying(flushAutomatically = true)
    @Query("update Franja f set f.estado = :nuevo where f.servicio.id = :servicioId "
            + "and f.estado = :actual and f.inicio > :ahora")
    int retirarFuturasDeServicio(@Param("servicioId") Long servicioId,
                                 @Param("actual") EstadoFranja actual,
                                 @Param("nuevo") EstadoFranja nuevo,
                                 @Param("ahora") Instant ahora);
}
