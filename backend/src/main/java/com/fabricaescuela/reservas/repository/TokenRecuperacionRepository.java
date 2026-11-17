package com.fabricaescuela.reservas.repository;

import com.fabricaescuela.reservas.domain.TokenRecuperacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TokenRecuperacionRepository extends JpaRepository<TokenRecuperacion, Long> {

    Optional<TokenRecuperacion> findByToken(String token);

    /**
     * Anula todos los enlaces vigentes de un usuario: al pedir uno nuevo los anteriores dejan
     * de servir, y al restablecer la contraseña no queda ningún otro enlace utilizable.
     */
    @Modifying(flushAutomatically = true)
    @Query("update TokenRecuperacion t set t.usado = true "
            + "where t.usuario.id = :usuarioId and t.usado = false")
    int invalidarVigentesDe(@Param("usuarioId") Long usuarioId);

    /** Usado en pruebas: el token más reciente emitido para ese correo. */
    Optional<TokenRecuperacion> findFirstByUsuario_CorreoOrderByIdDesc(String correo);
}

