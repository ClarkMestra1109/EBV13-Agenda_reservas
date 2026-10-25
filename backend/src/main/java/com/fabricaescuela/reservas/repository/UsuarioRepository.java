package com.fabricaescuela.reservas.repository;

import com.fabricaescuela.reservas.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    boolean existsByCorreo(String correo);

    boolean existsByCorreoAndIdNot(String correo, Long id);

    Optional<Usuario> findByCorreo(String correo);
}
