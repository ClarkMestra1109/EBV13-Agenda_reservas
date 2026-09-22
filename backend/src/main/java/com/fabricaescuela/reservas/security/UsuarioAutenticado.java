package com.fabricaescuela.reservas.security;

import com.fabricaescuela.reservas.domain.Rol;

/** Datos del usuario que llegan en el token y se exponen como principal. */
public record UsuarioAutenticado(Long id, String correo, Rol rol) {
}
