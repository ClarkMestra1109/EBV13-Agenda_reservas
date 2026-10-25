package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.ActualizarPerfilRequest;
import com.fabricaescuela.reservas.dto.UsuarioResponse;
import com.fabricaescuela.reservas.security.UsuarioAutenticado;
import com.fabricaescuela.reservas.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** HU03: perfil del usuario autenticado (cualquier rol). */
@RestController
@RequestMapping("/api/usuarios/me")
public class UsuarioController {

    private final UsuarioService usuarios;

    public UsuarioController(UsuarioService usuarios) {
        this.usuarios = usuarios;
    }

    @GetMapping
    public UsuarioResponse miPerfil(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return usuarios.miPerfil(usuario.id());
    }

    @PutMapping
    public UsuarioResponse actualizar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                      @Valid @RequestBody ActualizarPerfilRequest req) {
        return usuarios.actualizarPerfil(usuario.id(), req);
    }
}
