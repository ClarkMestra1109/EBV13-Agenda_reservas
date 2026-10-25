package com.fabricaescuela.reservas.repository;

import com.fabricaescuela.reservas.domain.TokenRecuperacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenRecuperacionRepository extends JpaRepository<TokenRecuperacion, Long> {

    Optional<TokenRecuperacion> findByToken(String token);

    /** Usado en pruebas: el token más reciente emitido para ese correo. */
    Optional<TokenRecuperacion> findFirstByUsuario_CorreoOrderByIdDesc(String correo);
}

