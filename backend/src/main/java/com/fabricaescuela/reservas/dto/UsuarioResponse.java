package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.Rol;
import com.fabricaescuela.reservas.domain.Usuario;

public record UsuarioResponse(Long id, String nombre, String correo, String telefono, Rol rol) {

    public static UsuarioResponse desde(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getCorreo(), u.getTelefono(), u.getRol());
    }
}
